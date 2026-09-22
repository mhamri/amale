import {fixtureClaim} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as c from '../scripts/core.ts';
import { delegate, delegateBatch } from '../scripts/delegate.ts';
import { loadModelConfig } from '../scripts/config.ts';
import { main } from '../scripts/cli.ts';
import { decideBatch } from '../scripts/adapters.ts';
import { jevAsk } from '../scripts/jev.ts';
import { processHealth } from '../scripts/host-diagnostics.ts';

const task=(id:string,deps:string[]=[])=>({id,title:id,goal:'Correct observable behavior',phase:'checkout',deps,resources:[id],criteria:['correct result'],kind:'code' as const,checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)']}]} as c.Task);
async function fixture(t:any){
 const dir=await mkdtemp(join(tmpdir(),'amale-delegate-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'app.txt'),'original');
 const oldKey=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='sk-delegate-fixture-not-real';t.after(()=>{if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;});
 const store=await c.start(dir,{id:'deleg',host:{kind:'codex',model:'gpt-6-astra'},intent:'Correct charge amount',criteria:['Correct amount charged']});
 await c.plan(store,{tasks:[task('a')],integrationChecks:[]});
 return {dir,store};
}
async function syntheticCoverage(store:c.Store,id:string){const state=await store.load();return c.reviewObligations(state,c.taskOf(state,id)).map(o=>({id:o.id,status:'covered' as const,evidence:'Synthetic protocol fixture only; not a real model review'}));}
const blocking=[{id:'wrong',lens:'Spec',location:'app.txt',scenario:'charges 11 instead of 10',evidence:'observed expected-versus-actual',consequence:'overcharge',blocking:true}];
const fakeWorker=(dir:string,counter?:{n:number})=>async (store:any,id:string,input:any)=>{if(counter)counter.n++;await fixtureClaim(store,id,{workspace:input.workspace??dir,model:'deepseek/flash'});await c.result(store,id,{changed:'app.txt'});return {artifact:c.taskOf(await store.load(),id).output};};
const fakeReviewer=(dir:string,script:any[][])=>{let call=0;return async (store:any,id:string)=>{const findings=script[Math.min(call++,script.length-1)];await c.review(store,id,{model:'z-ai/glm-flash',fingerprint:await c.fingerprint(dir),findings,report:'Synthetic fixture review',coverage:await syntheticCoverage(store,id)});return {findings};};};
const jevTargeted=(async()=>Response.json({model:'test/jev',answers:{selection:{type:'choice',choice:'targeted',confidence:.95,probabilities:{targeted:.95,rethink:.03,simplify:.02}}}})) as typeof fetch;

test('a clean chunk is accepted end to end without coordinator involvement',async t=>{
 const {dir,store}=await fixture(t);
 const out=await delegate(store,'a',{workspace:dir},{runWorker:fakeWorker(dir) as any,runReviewer:fakeReviewer(dir,[[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 assert.equal(c.taskOf(await store.load(),'a').status,'accepted');
 assert.deepEqual(out.trail.map(x=>x.stage),['worker','check','review']);
 const events=(await store.load()).events;
 assert.ok(events.some(e=>e.type==='delegate-started')&&events.some(e=>e.type==='delegate-finished'));
});
test('blocking findings trigger autonomous repair with one bounded Jev course-correction',async t=>{
 const {dir,store}=await fixture(t);const dispatches={n:0};
 const out=await delegate(store,'a',{workspace:dir},{runWorker:fakeWorker(dir,dispatches) as any,runReviewer:fakeReviewer(dir,[[...blocking],[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 assert.equal(dispatches.n,2);
 assert.equal(c.taskOf(await store.load(),'a').cycles,1);
 assert.ok(out.trail.some(x=>x.stage==='jev-strategy'&&(x.detail as any).choice==='targeted'));
});
test('exhausted repair allowance escalates to host depth instead of looping forever',async t=>{
 const {dir,store}=await fixture(t);
 await store.transaction(s=>{s.config.flashRepairCycles=0;s.config.deepRepairCycles=0;});
 const out=await delegate(store,'a',{workspace:dir},{runWorker:fakeWorker(dir) as any,runReviewer:fakeReviewer(dir,[[...blocking]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'escalated');assert.equal(out.stage,'repair-exhausted');assert.equal(out.depth,'host');
 const task=c.taskOf(await store.load(),'a');assert.equal(task.status,'repair');assert.equal(task.depth,'host');
});
test('worker failure returns a failed outcome and preserves the trail',async t=>{
 const {dir,store}=await fixture(t);
 const out=await delegate(store,'a',{workspace:dir},{runWorker:(async()=>{throw new Error('pi exploded');}) as any,runReviewer:fakeReviewer(dir,[[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'failed');assert.match(out.reason as string,/pi exploded/);
});
test('worker-side Jev helper answers and records its origin for health auditing',async t=>{
 const {store}=await fixture(t);
 const fetcher=(async(_url:any,init:any)=>{const body=JSON.parse(init.body);const criteria=body.questions.selection.criteria;return Response.json({model:'test/jev',answers:{selection:{type:'choice',choice:'safe',confidence:.9,probabilities:Object.fromEntries(Object.keys(criteria).map(k=>[k,k==='safe'?.9:.1]))}}});}) as typeof fetch;
 const answer=await jevAsk(store,{taskId:'a',question:'Which approach?',options:['safe','risky']},fetcher);
 assert.equal(answer.choice,'safe');
 assert.ok((await store.load()).events.some(e=>e.type==='worker-jev'&&(e.detail as any).taskId==='a'));
});
test('batched decisions settle independent questions in one gateway call',async t=>{
 const {store}=await fixture(t);let calls=0;
 const fetcher=(async(_url:any,init:any)=>{calls++;const body=JSON.parse(init.body);const answers=Object.fromEntries(Object.keys(body.questions).map(k=>[k,{type:'choice',choice:'x',confidence:.9,probabilities:{x:.9,y:.1}}]));return Response.json({model:'test/jev',answers});}) as typeof fetch;
 const answers=await decideBatch(store,{decisions:[{id:'b1',question:'q1',criteria:{x:'x',y:'y'},state:{}},{id:'b2',question:'q2',criteria:{x:'x',y:'y'},state:{}}]},fetcher);
 assert.equal(calls,1);assert.deepEqual(answers.map(a=>a.choice),['x','x']);
 assert.equal((await store.load()).decisions.length,2);
});
test('process health flags coordinator micromanagement and missing delegation',async t=>{
 const {store}=await fixture(t);
 await store.transaction(s=>{for(let i=0;i<3;i++)s.decisions.push({id:`d${i}`,question:'q',criteria:{a:'a',b:'b'},state:{},revision:s.revision,choice:'a',source:'test/jev',artifact:'x'.repeat(64)});c.event(s,'claimed',{id:'a',model:'deepseek/flash'});});
 const health=await processHealth(store);
 if(!health.available)throw new Error(health.reason);
 assert.match(health.warnings.join('\n'),/micro-decision/);
 assert.match(health.warnings.join('\n'),/delegate/);
 assert.match(health.warnings.join('\n'),/worker-side Jev/);
});

async function batchFixture(t:any,ids:string[],maxWorkers:number,withChecks=true){
 const dir=await mkdtemp(join(tmpdir(),'amale-batch-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const oldKey=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='sk-delegate-fixture-not-real';t.after(()=>{if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;});
 const store=await c.start(dir,{id:'batch',host:{kind:'codex',model:'gpt-6-astra'},intent:'Correct charge amount',criteria:['Correct amount charged']});
 await c.plan(store,{tasks:ids.map(id=>withChecks?task(id):({...task(id),checks:[]} as c.Task)),integrationChecks:[]});
 const spaces:Record<string,string>={};
 for(const id of ids){const workspace=join(dir,'w-'+id);await mkdir(workspace,{recursive:true});await writeFile(join(workspace,'app.txt'),'original '+id);spaces[id]=await realpath(workspace);}
 await store.transaction(s=>{s.config.maxWorkers=maxWorkers;for(const id of ids)c.taskOf(s,id).workspace=spaces[id];});
 return {dir,store,spaces};
}
function arrivalGate(width:number,timeoutMs=4000){
 let seen=0,open=()=>{};
 const opened=new Promise<void>(resolve=>{open=resolve;});
 const timer=setTimeout(open,timeoutMs);timer.unref?.();
 return async()=>{if(++seen>=width){clearTimeout(timer);open();}await opened;};
}
const batchWorker=(spaces:Record<string,string>,hooks:{delays?:Record<string,number>;fail?:string[];live?:{n:number;peak:number};gate?:()=>Promise<void>}={})=>async (store:any,id:string,input:any)=>{
 const live=hooks.live;if(live){live.n++;live.peak=Math.max(live.peak,live.n);}
 try{
  await hooks.gate?.();
  if(live)live.peak=Math.max(live.peak,live.n);
  await new Promise(r=>setTimeout(r,hooks.delays?.[id]??40));
  if(hooks.fail?.includes(id))throw new Error('pi exploded on '+id);
  await fixtureClaim(store,id,{workspace:input.workspace??spaces[id],model:'deepseek/flash'});
  await c.result(store,id,{changed:'app.txt'});
  return {artifact:c.taskOf(await store.load(),id).output};
 }finally{if(live)live.n--;}
};
const batchReviewer=(script:Record<string,any[][]>={})=>{const calls:Record<string,number>={};return async (store:any,id:string)=>{
 const list=script[id]??[[]],call=calls[id]??0;calls[id]=call+1;
 const findings=list[Math.min(call,list.length-1)],workspace=c.taskOf(await store.load(),id).workspace!;
 await c.review(store,id,{model:'z-ai/glm-flash',fingerprint:await c.fingerprint(workspace),findings,report:'Synthetic fixture review',coverage:await syntheticCoverage(store,id)});
 return {findings};
};};

test('delegate-batch drives the whole frontier and never exceeds maxWorkers at once',async t=>{
 const ids=['a','b','c','d','e','f'];
 const {store,spaces}=await batchFixture(t,ids,2);
 const live={n:0,peak:0};
 const out=await delegateBatch(store,{ids},{runWorker:batchWorker(spaces,{live,gate:arrivalGate(2)}) as any,runReviewer:batchReviewer() as any,fetcher:jevTargeted});
 assert.equal(out.delegated,6);
 assert.equal(out.concurrency,2);
 assert.ok(live.peak<=2,`peak concurrency ${live.peak} exceeded the configured maxWorkers of 2`);
 assert.equal(live.peak,2,'two workers never overlapped, so the batch ran serially');
 assert.deepEqual(out.outcomes.map(o=>o.outcome),ids.map(()=>'accepted'));
 assert.deepEqual((await store.load()).tasks.map(t=>t.status),ids.map(()=>'accepted'));
});
test('a failing id neither aborts the batch nor hides its reason',async t=>{
 const ids=['a','b','c'];
 const {store,spaces}=await batchFixture(t,ids,3);
 await store.transaction(s=>{const held=c.taskOf(s,'c');held.status='blocked';held.blocked='Held blocked by fixture';});
 const out=await delegateBatch(store,{ids},{runWorker:batchWorker(spaces,{fail:['b']}) as any,runReviewer:batchReviewer() as any,fetcher:jevTargeted});
 assert.deepEqual(out.outcomes.map(o=>o.outcome),['accepted','failed','failed']);
 assert.match((out.outcomes[1] as {reason:string}).reason,/pi exploded on b/);
 assert.equal(out.outcomes[2].task,'c');
 assert.match((out.outcomes[2] as {reason:string}).reason,/not delegable/);
 assert.equal(c.taskOf(await store.load(),'a').status,'accepted');
});
test('outcomes come back in input order regardless of completion order',async t=>{
 const ids=['a','b','c'];
 const {store,spaces}=await batchFixture(t,ids,3,false);
 const completed:string[]=[],reviewer=batchReviewer();
 const out=await delegateBatch(store,{ids},{runWorker:batchWorker(spaces,{delays:{a:300,b:160,c:20}}) as any,runReviewer:(async (s:any,id:string)=>{const r=await reviewer(s,id);completed.push(id);return r;}) as any,fetcher:jevTargeted});
 assert.deepEqual(out.outcomes.map(o=>o.task),['a','b','c']);
 assert.equal(completed[0],'c');
 assert.notDeepEqual(completed,ids);
 assert.deepEqual([...completed].sort(),[...ids].sort());
 assert.deepEqual(out.outcomes.map(o=>o.outcome),['accepted','accepted','accepted']);
});
test('delegate-batch rejects malformed and duplicated id lists before dispatching anything',async t=>{
 const {store,spaces}=await batchFixture(t,['a','b'],2);
 let dispatches=0;
 const deps={runWorker:(async(s:any,id:string,input:any)=>{dispatches++;return batchWorker(spaces)(s,id,input);}) as any,runReviewer:batchReviewer() as any,fetcher:jevTargeted};
 await assert.rejects(()=>delegateBatch(store,{ids:['a','b','a']},deps),/duplicate task ids \(a\)/);
 await assert.rejects(()=>delegateBatch(store,{ids:[]},deps),/one or more task id strings/);
 await assert.rejects(()=>delegateBatch(store,{ids:'a' as unknown as string[]},deps),/one or more task id strings/);
 await assert.rejects(()=>delegateBatch(store,{ids:['a','']},deps),/one or more task id strings/);
 assert.equal(dispatches,0);
});
test('task skills and references reach the worker on the first call and on the repair call',async t=>{
 const {dir,store}=await fixture(t);
 const seen:any[]=[],base=fakeWorker(dir);
 const spy=async (store:any,id:string,input:any)=>{seen.push(input);return base(store,id,input);};
 const out=await delegate(store,'a',{workspace:dir,skills:['superpowers:tdd'],references:['docs/business-rules/checkout.md']},{runWorker:spy as any,runReviewer:fakeReviewer(dir,[[...blocking],[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 assert.equal(seen.length,2);
 for(const input of seen){assert.deepEqual(input.skills,['superpowers:tdd']);assert.deepEqual(input.references,['docs/business-rules/checkout.md']);}
 assert.match(seen[1].brief,/^Repair this task/);
});
test('record-decision marks the settled answer as a requirement so reviewers and lineage inherit it',async t=>{
 const {dir,store}=await fixture(t);
 const workspace=await realpath(dir),inputPath=join(workspace,'decision.json');
 await writeFile(inputPath,JSON.stringify({id:'refund-window',question:'How long may a guest request a refund?',answer:'Within 24 hours of the order',source:'user',reason:'Confirmed by the user in session'}));
 await main(['record-decision',workspace,'deleg',inputPath]);
 const state=await store.load(),recorded=state.decisions.find(d=>d.id==='refund-window')!;
 assert.equal(recorded.purpose,'requirement');
 assert.equal(recorded.choice,'accepted');
 assert.equal(recorded.criteria.accepted,'Within 24 hours of the order');
 assert.ok(state.events.some(e=>e.type==='recorded-decision'&&(e.detail as any).purpose==='requirement'));
});
test('a check that writes build output does not strand the chunk as permanently stale',async t=>{
 const {dir,store}=await fixture(t);
 const buildDir=join(dir,'.output');
 const emit=`require('node:fs').mkdirSync(${JSON.stringify(buildDir)},{recursive:true});require('node:fs').writeFileSync(${JSON.stringify(join(buildDir,'index.html'))},'<!doctype html>');`;
 await store.transaction(s=>{c.taskOf(s,'a').checks=[
  {id:'types',command:process.execPath,args:['-e','process.exit(0)']},
  {id:'build',command:process.execPath,args:['-e',emit]}];});
 const out=await delegate(store,'a',{workspace:dir},{runWorker:fakeWorker(dir) as any,runReviewer:fakeReviewer(dir,[[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted',`build output must not make acceptance impossible: ${out.reason ?? ''}`);
 const task=c.taskOf(await store.load(),'a');
 const settled=await c.fingerprint(dir);
 for(const check of task.checks)assert.ok(task.receipts.some(r=>r.id===check.id&&r.code===0&&r.fingerprint===settled),`receipt for ${check.id} must match the tree the checks leave behind`);
 assert.ok(out.trail.filter(s=>s.stage==='check').length>task.checks.length,'the stale receipts must be re-taken on a later pass');
});
test('a check that never leaves the tree alone escalates instead of looping',async t=>{
 const {dir,store}=await fixture(t);
 const churn=`require('node:fs').writeFileSync(${JSON.stringify(join(dir,'churn.txt'))},String(Date.now())+Math.random());`;
 await store.transaction(s=>{c.taskOf(s,'a').checks=[{id:'build',command:process.execPath,args:['-e',churn]}];});
 const out=await delegate(store,'a',{workspace:dir},{runWorker:fakeWorker(dir) as any,runReviewer:fakeReviewer(dir,[[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'escalated');
 assert.equal(out.stage,'unstable-checks');
 assert.deepEqual(out.mutating,['build']);
 assert.match(String(out.reason),/rewrite the workspace every run/);
});
const rateLimit=()=>new Error('429: {"message":"Provider returned error","code":429,"metadata":{"raw":"z-ai/glm-5.3-flashx is temporarily rate-limited upstream."}}');
test('a rate-limited provider is routed around without spending a repair cycle',async t=>{
 const {dir,store}=await fixture(t);
 let calls=0;
 const flaky=async(s:any,id:string,input:any)=>{
  if(++calls<3){await store.transaction(x=>{const t=c.taskOf(x,id);t.status='blocked';t.blocked=rateLimit().message;c.event(x,'worker-blocked',{id,reason:t.blocked});});throw rateLimit();}
  return fakeWorker(dir)(s,id,input);
 };
 const out=await delegate(store,'a',{workspace:dir},{runWorker:flaky as any,runReviewer:fakeReviewer(dir,[[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 assert.equal(calls,3,'the worker must be retried on a fresh route, not abandoned');
 const state=await store.load(),task=c.taskOf(state,'a');
 assert.equal(task.cycles,0,'a provider outage must not consume a repair cycle');
 assert.equal(task.blocked,undefined);
 assert.equal(state.events.filter(e=>e.type==='provider-failover').length,2);
 assert.deepEqual(out.trail.filter(s=>s.stage==='provider-failover').length,2);
});
test('a failover budget that runs out reports the provider message instead of retrying forever',async t=>{
 const {dir,store}=await fixture(t);
 let calls=0;
 const dead=async(s:any,id:string)=>{calls++;await store.transaction(x=>{const t=c.taskOf(x,id);t.status='blocked';t.blocked=rateLimit().message;});throw rateLimit();};
 const out=await delegate(store,'a',{workspace:dir},{runWorker:dead as any,runReviewer:fakeReviewer(dir,[[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'failed');
 assert.match(String(out.reason),/rate-limited/);
 assert.equal(calls,(await loadModelConfig()).providerFailovers);
});
test('a genuine task failure is not mistaken for a provider outage',async t=>{
 const {dir,store}=await fixture(t);
 let calls=0;
 const broken=async(s:any,id:string)=>{calls++;throw new Error('pi resolved a different model (other/model); update the task route explicitly');};
 const out=await delegate(store,'a',{workspace:dir},{runWorker:broken as any,runReviewer:fakeReviewer(dir,[[]]) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'failed');
 assert.equal(calls,1,'only transient provider failures may be retried');
});
test('a batch sharing one workspace is refused before any worker starts',async t=>{
 const ids=['a','b','c'];const {store,spaces}=await batchFixture(t,ids,3);
 let started=0;const counting=async(...args:any[])=>{started++;return (batchWorker(spaces) as any)(...args);};
 await assert.rejects(()=>delegateBatch(store,{ids,workspace:spaces['a']},{runWorker:counting as any,runReviewer:batchReviewer() as any,fetcher:jevTargeted}),/share workspace/);
 assert.equal(started,0);
 await store.transaction(s=>{c.taskOf(s,'b').workspace=spaces['a'];});
 await assert.rejects(()=>delegateBatch(store,{ids},{runWorker:counting as any,runReviewer:batchReviewer() as any,fetcher:jevTargeted}),/a and b share workspace/);
 assert.equal(started,0);
 await store.transaction(s=>{c.taskOf(s,'c').workspace=undefined;});
 await assert.rejects(()=>delegateBatch(store,{ids:['c']},{runWorker:counting as any,runReviewer:batchReviewer() as any,fetcher:jevTargeted}),/Task c has no workspace/);
 assert.equal(started,0);
});
test('batch guidance reaches every delegated worker',async t=>{
 const ids=['a','b'];const {store,spaces}=await batchFixture(t,ids,2);
 const seen:Record<string,unknown>={};
 const recording=async(store:any,id:string,input:any)=>{seen[id]={skills:input.skills,references:input.references};return (batchWorker(spaces) as any)(store,id,input);};
 await delegateBatch(store,{ids,skills:['taste-bar'],references:['docs/contract.md']},{runWorker:recording as any,runReviewer:batchReviewer() as any,fetcher:jevTargeted});
 for(const id of ids)assert.deepEqual(seen[id],{skills:['taste-bar'],references:['docs/contract.md']});
});
