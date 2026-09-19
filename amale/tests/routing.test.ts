import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as c from '../scripts/core.ts';
import { selectModel, consumeRoute } from '../scripts/routing.ts';
import { hostDecision, worker, reviewer } from '../scripts/adapters.ts';

const card=(id:string,created:number,images=false)=>({id,created,context_length:64000,architecture:{input_modalities:images?['text','image']:['text']},supported_parameters:['tools'],pricing:{prompt:'0.000001',completion:'0.000002'},description:'Synthetic test card, not a capability benchmark'});
const cards=[card('deepseek/old-flash',1),card('deepseek/new-flash',3),card('z-ai/glm-new-flash',4),card('moonshot/kimi-specialist',5,true),card('deepseek/preview-flash',9),card('~deepseek/deepseek-flash-latest',10),card('z-ai/glm-flash-latest',11)];
async function fixture(t:any){
 const dir=await mkdtemp(join(tmpdir(),'amale-routing-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const oldKey=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='sk-routing-fixture-not-real';t.after(()=>{if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;});
 const store=await c.start(dir,{id:'route',host:{kind:'codex',model:'gpt-6-astra'},intent:'Test enforced automatic routes',criteria:['Select suitable author and independent reviewer']});
 await c.plan(store,{tasks:[{id:'a',title:'a',goal:'Fix known amount',phase:'one',deps:[],resources:['a'],criteria:['correct amount'],checks:[],kind:'code'}],integrationChecks:[]});
 return {dir,store};
}
function gateway(pick:(models:Record<string,string>)=>string,confidence=1){
 const calls:any[]=[];
 const fetcher=(async(url:any,init:any)=>{
  if(String(url).endsWith('/models'))return Response.json({data:cards});
  const body=JSON.parse(init.body);calls.push(body);const criteria=body.questions.selection.criteria;const choice=pick(body.state.routing.models);
  return Response.json({model:'test/jev',answers:{selection:{type:'choice',choice,confidence,probabilities:Object.fromEntries(Object.keys(criteria).map(k=>[k,k===choice?1:0]))}}});
 }) as typeof fetch;
 return {calls,fetcher};
}
const choose=(family:string)=>(models:Record<string,string>)=>Object.keys(models).find(k=>models[k].includes(family))!;

test('Jev can select either Flash author; latest stable per family and scope receipt are enforced',async t=>{
 for(const name of ['deepseek','glm'])await t.test(name,async st=>{
  const {dir,store}=await fixture(st),g=gateway(choose(name));const route=await selectModel(store,'a','worker',dir,{},g.fetcher);
  assert.equal(route.action,'launch');if(route.action!=='launch')throw Error('Expected launch');assert.ok(route.model.includes(name));
  assert.deepEqual(Object.values(g.calls[0].state.routing.models).sort(),['deepseek/new-flash','z-ai/glm-new-flash']);
  const cached=await selectModel(store,'a','worker',dir,{},g.fetcher);assert.deepEqual(cached,route);assert.equal(g.calls.length,1);
  await store.transaction(s=>consumeRoute(s,route));await assert.rejects(()=>store.transaction(s=>consumeRoute(s,route)),/consumed/);
 });
});
test('uncertain Jev prevents launch and uses durable host fallback without another call',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('glm'),.2);const pending=await selectModel(store,'a','worker',dir,{},g.fetcher);assert.equal(pending.action,'host-decision');
 if(pending.action!=='host-decision')throw Error('Expected uncertainty');await hostDecision(store,pending.decisionId,'model_0','Fixture: inspect supplied eligible cards');
 const route=await selectModel(store,'a','worker',dir,{},g.fetcher);assert.equal(route.action,'launch');assert.equal(g.calls.length,1);
});
test('specialized pool, modality and tool filters precede Jev; empty pools never dispatch',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('kimi'));await store.transaction(s=>{s.modelPools=[{role:'visual',models:['moonshot/kimi-specialist','deepseek/new-flash'],requiredInputs:['image'],requiresTools:true,notes:'Fixture image requirement'}];});
 const route=await selectModel(store,'a','worker',dir,{role:'visual'},g.fetcher);assert.equal(route.action,'launch');if(route.action==='launch')assert.equal(route.model,'moonshot/kimi-specialist');
 assert.equal(Object.values(g.calls[0].state.routing.models).length,1);
 const blocked=await selectModel(store,'a','worker',dir,{requiredInputs:['audio']},g.fetcher);assert.equal(blocked.action,'route-blocked');assert.equal(g.calls.length,1);
});
test('deep repair selects Kimi and host repair returns native takeover without API calls',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('kimi'));await store.transaction(s=>{s.tasks[0].depth='deep';s.tasks[0].cycles=3;});
 const deep=await selectModel(store,'a','worker',dir,{},g.fetcher);assert.equal(deep.action,'launch');if(deep.action==='launch')assert.equal(deep.model,'moonshot/kimi-specialist');
 await store.transaction(s=>{s.tasks[0].depth='host';s.tasks[0].cycles=4;});assert.deepEqual(await selectModel(store,'a','worker',dir,{},g.fetcher),{action:'host-takeover',model:'gpt-6-astra'});assert.equal(g.calls.length,1);
});
test('task changes invalidate grants while unrelated checkpoints do not',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('glm'));const route=await selectModel(store,'a','worker',dir,{},g.fetcher);if(route.action!=='launch')throw Error('Expected launch');
 await store.transaction(s=>c.event(s,'unrelated-checkpoint',{}));assert.deepEqual(await selectModel(store,'a','worker',dir,{},g.fetcher),route);
 await store.transaction(s=>{s.tasks[0].goal='Different amount contract';});await assert.rejects(()=>store.transaction(s=>consumeRoute(s,route)),/changed/);
});
test('review routing excludes author family and binds reviewed content',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('deepseek'));await c.claim(store,'a',{workspace:dir,model:'z-ai/glm-new-flash'});await c.result(store,'a',{});
 const route=await selectModel(store,'a','reviewer',dir,{},g.fetcher);assert.equal(route.action,'launch');if(route.action==='launch')assert.equal(route.model,'deepseek/new-flash');
 assert.deepEqual(Object.values(g.calls[0].state.routing.models),['deepseek/new-flash']);await writeFile(join(dir,'changed.txt'),'changed');
 await selectModel(store,'a','reviewer',dir,{},g.fetcher);assert.equal(g.calls.length,2);
});
test('worker and reviewer execute automatically selected models, with durable route consumption',async t=>{
 const {dir,store}=await fixture(t),g=gateway(models=>choose(Object.values(models).some(m=>m.includes('glm'))?'glm':'deepseek')(models));
 const old={fetch:globalThis.fetch,entry:process.env.AMALE_PI_ENTRY,node:process.env.AMALE_NODE};
 t.after(()=>{globalThis.fetch=old.fetch;for(const [key,value] of [['AMALE_PI_ENTRY',old.entry],['AMALE_NODE',old.node]])if(value===undefined)delete process.env[key!];else process.env[key!]=value;});
 const entry=join(dir,'fake-pi.ts');await writeFile(entry,`const model=process.argv[process.argv.indexOf('--model')+1];const readOnly=process.argv[process.argv.indexOf('--tools')+1]==='read,grep,find,ls';const packet=readOnly?JSON.parse(process.argv.at(-1).split('\\n').at(-1)):undefined;const text=readOnly?JSON.stringify({report:'Synthetic reviewer fixture',coverage:packet.obligations.map(o=>({id:o.id,status:'covered',evidence:'Synthetic protocol fixture only'})),findings:[]}):'Synthetic worker fixture';console.log(JSON.stringify({type:'message_end',message:{role:'assistant',model,content:[{type:'text',text}],stopReason:'stop'}}));console.log(JSON.stringify({type:'agent_end'}));`);
 process.env.AMALE_PI_ENTRY=entry;process.env.AMALE_NODE=process.execPath;globalThis.fetch=g.fetcher;
 await worker(store,'a',{workspace:dir,brief:'Synthetic fixture only'});assert.equal(c.taskOf(await store.load(),'a').author,'z-ai/glm-new-flash');
 await reviewer(store,'a',undefined,['Spec']);assert.equal(c.taskOf(await store.load(),'a').review?.family,'deepseek');assert.ok(c.taskOf(await store.load(),'a').review?.coverage?.length);
 assert.equal((await store.load()).events.filter(e=>e.type==='route-used').length,2);assert.equal(g.calls.length,2);
});
test('manual model overrides cannot bypass routing and credit errors cannot become host fallback',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('glm'));const old=globalThis.fetch;globalThis.fetch=g.fetcher;t.after(()=>{globalThis.fetch=old;});
 await assert.rejects(()=>worker(store,'a',{workspace:dir,brief:'fixture',model:'deepseek/new-flash'}),/disagrees/);assert.equal(c.taskOf(await store.load(),'a').status,'ready');
 await store.transaction(s=>{s.tasks[0].goal='Changed task';});await assert.rejects(()=>selectModel(store,'a','worker',dir,{},(async()=>new Response('{}',{status:402})) as typeof fetch),/402/);
});
test('changed requirements supersede an uncertain route instead of stranding completion',async t=>{
 const {dir,store}=await fixture(t),uncertain=gateway(choose('glm'),.2);
 const first=await selectModel(store,'a','worker',dir,{},uncertain.fetcher);assert.equal(first.action,'host-decision');
 const chosen=gateway(choose('deepseek'));await selectModel(store,'a','worker',dir,{evidence:'New measured suitability evidence'},chosen.fetcher);
 const decisions=(await store.load()).decisions;assert.equal(decisions[0].choice,'reassess');assert.equal(decisions[0].source,'runtime:route-invalidated');assert.equal(decisions.filter(d=>!d.choice).length,0);
});
test('unrelated task activity during Jev request does not discard a valid route',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('glm'));
 const fetcher=(async(url:any,init:any)=>{if(String(url).endsWith('/decisions'))await store.transaction(s=>c.event(s,'other-task-progress',{}));return g.fetcher(url,init);}) as typeof fetch;
 assert.equal((await selectModel(store,'a','worker',dir,{},fetcher)).action,'launch');
});

test('worker dispatch preflight avoids all gateway calls for dependency, capacity and resource blocks',async t=>{
 for(const mode of ['dependency','capacity','workspace','resource'])await t.test(mode,async st=>{
  const {dir,store}=await fixture(st);await store.transaction(s=>{
   const other={...s.tasks[0],id:'other',deps:[],resources:['other']};s.tasks.push(other);
   if(mode==='dependency')s.tasks[0].deps=['other'];
   else{other.status='running';other.workspace=mode==='workspace'?dir:dir+'-different';other.owner={pid:process.pid,host:'fixture',operation:'fixture'};if(mode==='capacity')s.config.maxWorkers=1;if(mode==='resource')other.resources=['a'];}
  });
  let requests=0;const fetcher=(async()=>{requests++;throw Error('Preflight must not call gateway');}) as typeof fetch;
  const blocked=await selectModel(store,'a','worker',dir,{},fetcher);assert.equal(blocked.action,'dispatch-blocked');assert.equal(requests,0);
  assert.equal((await store.load()).decisions.length,0);
 });
});

test('synthetic reviewer process owns capacity until completion and prevents duplicate routing',async t=>{
 const {dir,store}=await fixture(t),g=gateway(choose('deepseek'));await c.claim(store,'a',{workspace:dir,model:'z-ai/glm-new-flash'});await c.result(store,'a',{});
 const old={fetch:globalThis.fetch,entry:process.env.AMALE_PI_ENTRY,node:process.env.AMALE_NODE};
 t.after(()=>{globalThis.fetch=old.fetch;for(const [key,value] of [['AMALE_PI_ENTRY',old.entry],['AMALE_NODE',old.node]])if(value===undefined)delete process.env[key!];else process.env[key!]=value;});
 const entry=join(dir,'synthetic-review-pi.ts');await writeFile(entry,`const model=process.argv[process.argv.indexOf('--model')+1];setTimeout(()=>{console.log(JSON.stringify({type:'message_end',message:{role:'assistant',model,content:[{type:'text',text:JSON.stringify({report:'Synthetic reviewer fixture, not a model judgment',findings:[]})}],stopReason:'stop'}}));console.log(JSON.stringify({type:'agent_end'}));},600);`);
 process.env.AMALE_PI_ENTRY=entry;process.env.AMALE_NODE=process.execPath;globalThis.fetch=g.fetcher;
 const pending=reviewer(store,'a',undefined,['Spec']);let activity;
 for(let i=0;i<100;i++){activity=c.taskOf(await store.load(),'a').activity;if(activity&&activity.owner.pid!==process.pid)break;await new Promise(r=>setTimeout(r,10));}
 assert.equal(activity?.kind,'review');assert.equal(activity?.owner.coordinatorPid,process.pid);assert.notEqual(activity?.owner.pid,process.pid);
 const before=g.calls.length;const duplicate=await reviewer(store,'a',undefined,['Spec']);assert.ok('action' in duplicate);assert.equal(duplicate.action,'dispatch-blocked');assert.equal(g.calls.length,before);
 await pending;assert.equal(c.taskOf(await store.load(),'a').activity,undefined);
});
