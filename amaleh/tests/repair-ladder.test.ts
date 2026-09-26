import {fixtureClaim,clearCut} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as c from '../scripts/core.ts';
import { delegate } from '../scripts/delegate.ts';
import { processHealth } from '../scripts/host-diagnostics.ts';

const host='gpt-6-astra';
const probe={id:'test',command:process.execPath,args:['-e',"try{const c=require('fs').readFileSync(require('path').join(process.cwd(),'app.txt'),'utf8');process.exit(c.includes('original')?1:0)}catch{process.exit(1)}"],role:'probe' as const};
const blocking=[{id:'wrong',lens:'Spec',location:'app.txt',scenario:'charges 11 instead of 10',evidence:'observed expected-versus-actual',consequence:'overcharge',blocking:true}];
const jevTargeted=(async()=>Response.json({model:'test/jev',answers:{selection:{type:'choice',choice:'targeted',confidence:.95,probabilities:{targeted:.95,rethink:.03,simplify:.02}}}})) as typeof fetch;

async function fixture(t:any){
 const dir=await mkdtemp(join(tmpdir(),'amaleh-ladder-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'app.txt'),'original');
 const store=await c.start(dir,{shape:clearCut,id:'ladder',host:{kind:'codex',model:host},intent:'Correct charge amount',criteria:['Correct amount charged']});
 await c.plan(store,{tasks:[{id:'a',title:'a',goal:'Correct observable behavior',phase:'checkout',deps:[],resources:['app.txt'],criteria:['correct result'],kind:'code',checks:[probe]}],integrationChecks:[]});
 return {dir,store};
}
async function syntheticCoverage(store:c.Store,id:string){const state=await store.load();return c.reviewObligations(state,c.taskOf(state,id)).map(o=>({id:o.id,status:'covered' as const,evidence:'Synthetic protocol fixture only; not a real model review'}));}
const flashWorker=(dir:string)=>async(store:any,id:string)=>{await fixtureClaim(store,id,{workspace:dir,model:'deepseek/flash'});writeFileSync(join(dir,'app.txt'),'corrected');await c.result(store,id,{changed:'app.txt'});return {artifact:c.taskOf(await store.load(),id).output};};
const rejectingReviewer=(dir:string,calls:{n:number})=>async(store:any,id:string)=>{calls.n++;await c.review(store,id,{model:'z-ai/glm-flash',fingerprint:await c.fingerprint(dir),findings:blocking,report:'Synthetic fixture review',coverage:await syntheticCoverage(store,id)});return {findings:blocking};};
const noWorker=async()=>{throw new Error('host work must not launch a routed worker');};

async function escalatedToHost(t:any){
 const {dir,store}=await fixture(t);
 await store.transaction(s=>{s.config.flashRepairCycles=0;s.config.deepRepairCycles=0;});
 const reviews={n:0};
 const out=await delegate(store,'a',{workspace:dir},{runWorker:flashWorker(dir) as any,runReviewer:rejectingReviewer(dir,reviews) as any,fetcher:jevTargeted});
 assert.equal(out.stage,'repair-exhausted');
 return {dir,store,reviews};
}
async function hostRepair(store:c.Store,dir:string,content:string){
 await fixtureClaim(store,'a',{workspace:dir,model:host});
 writeFileSync(join(dir,'app.txt'),content);
 await c.result(store,'a',{changed:'app.txt'});
}

test('host work that passes its checks is accepted with no model review',async t=>{
 const {dir,store,reviews}=await escalatedToHost(t);
 await hostRepair(store,dir,'host corrected');
 const out=await delegate(store,'a',{workspace:dir},{runWorker:noWorker as any,runReviewer:rejectingReviewer(dir,reviews) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 assert.equal(out.hostFinal,true);
 assert.equal(reviews.n,1,'only the Flash work before the takeover was reviewed');
 assert.ok(!out.trail.some(s=>s.stage==='review'));
 const task=c.taskOf(await store.load(),'a');
 assert.equal(task.status,'accepted');
 assert.equal(task.cycles,1);
 assert.equal(task.review,undefined,'the Flash review of the replaced work does not stay on the accepted task');
});

test('host work that fails a check goes straight back to the host without a repair cycle',async t=>{
 const {dir,store,reviews}=await escalatedToHost(t);
 await hostRepair(store,dir,'original amount kept');
 const before=(await store.load()).events.length;
 const out=await delegate(store,'a',{workspace:dir},{runWorker:noWorker as any,runReviewer:rejectingReviewer(dir,reviews) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'escalated');
 assert.equal(out.stage,'host-checks-failed');
 assert.deepEqual(out.failingChecks,['test']);
 assert.equal(reviews.n,1);
 const state=await store.load(),task=c.taskOf(state,'a');
 assert.equal(task.cycles,1);
 assert.equal(task.status,'repair');
 assert.ok(!state.events.slice(before).some(e=>e.type==='repair'));
 await hostRepair(store,dir,'host corrected');
 const again=await delegate(store,'a',{workspace:dir},{runWorker:noWorker as any,runReviewer:rejectingReviewer(dir,reviews) as any,fetcher:jevTargeted});
 assert.equal(again.outcome,'accepted','a fresh host exception covers the next host attempt');
});

test('work the user asked the host to do is final too',async t=>{
 const {dir,store}=await fixture(t);
 const {authorization}=await c.hostException(store,{id:'a',reason:'user-request',evidence:'The user asked the coordinator to write this task itself'});
 await c.claim(store,'a',{workspace:dir,model:host,hostAuthorization:authorization});
 writeFileSync(join(dir,'app.txt'),'host corrected');
 await c.result(store,'a',{changed:'app.txt'});
 const reviews={n:0};
 const out=await delegate(store,'a',{workspace:dir},{runWorker:noWorker as any,runReviewer:rejectingReviewer(dir,reviews) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 assert.equal(reviews.n,0);
});

test('next offers acceptance for checked host work, and accept takes it without a review',async t=>{
 const {dir,store}=await escalatedToHost(t);
 await hostRepair(store,dir,'host corrected');
 await c.check(store,'a','test');
 assert.equal((await c.next(store)).action,'accept');
 await c.accept(store,'a');
 assert.equal(c.taskOf(await store.load(),'a').status,'accepted');
});

test('a repair called by hand on failed host work spends no cycle either',async t=>{
 const {dir,store}=await escalatedToHost(t);
 await hostRepair(store,dir,'original amount kept');
 await c.check(store,'a','test');
 await c.repair(store,'a');
 const state=await store.load(),task=c.taskOf(state,'a');
 assert.equal(task.cycles,1);
 assert.equal(task.status,'repair');
 assert.equal(state.events.at(-1)!.type,'host-checks-failed');
});

test('a new result drops the review of the output it replaces, so an amend cannot charge that finding again',async t=>{
 const {dir,store}=await fixture(t);
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 writeFileSync(join(dir,'app.txt'),'corrected');
 await c.result(store,'a',{changed:'app.txt'});
 await c.check(store,'a','test');
 await c.review(store,'a',{model:'z-ai/glm-flash',fingerprint:await c.fingerprint(dir),findings:blocking,report:'Synthetic fixture review',coverage:await syntheticCoverage(store,'a')});
 await c.repair(store,'a');
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 writeFileSync(join(dir,'app.txt'),'corrected again');
 await c.result(store,'a',{changed:'app.txt'});
 assert.equal(c.taskOf(await store.load(),'a').review,undefined);
 const contract=c.taskOf(await store.load(),'a');
 await c.amend(store,{id:'a',reason:'The goal was stated wrongly',task:{id:'a',title:contract.title,goal:'Apply the corrected rule',phase:contract.phase,deps:contract.deps,resources:contract.resources,criteria:contract.criteria,kind:contract.kind,checks:contract.checks}});
 assert.equal(c.taskOf(await store.load(),'a').cycles,1,'only the repair spent a cycle');
});

test('a resources-only amend on output with an open blocking finding is a repair: it spends a cycle and reruns the worker',async t=>{
 const {dir,store}=await fixture(t);
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 writeFileSync(join(dir,'app.txt'),'corrected');
 await c.result(store,'a',{changed:'app.txt'});
 await c.check(store,'a','test');
 await c.review(store,'a',{model:'z-ai/glm-flash',fingerprint:await c.fingerprint(dir),findings:blocking,report:'Synthetic fixture review',coverage:await syntheticCoverage(store,'a')});
 const contract=c.taskOf(await store.load(),'a');
 await c.amend(store,{id:'a',reason:'The task also owns notes.md',task:{id:'a',title:contract.title,goal:contract.goal,phase:contract.phase,deps:contract.deps,resources:['app.txt','notes.md'],criteria:contract.criteria,kind:contract.kind,checks:contract.checks}});
 const amended=c.taskOf(await store.load(),'a');
 assert.equal(amended.status,'ready','a fresh review is not bought by widening the resources');
 assert.equal(amended.cycles,1);
});

test('delegating a task at host depth escalates as host-takeover instead of routing',async t=>{
 const {dir,store}=await escalatedToHost(t);
 const out=await delegate(store,'a',{workspace:dir},{runWorker:noWorker as any,runReviewer:rejectingReviewer(dir,{n:0}) as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'escalated');
 assert.equal(out.stage,'host-takeover');
 assert.equal(out.model,host);
});

test('health counts host takeovers in total and per task',async t=>{
 const {dir,store}=await escalatedToHost(t);
 await hostRepair(store,dir,'host corrected');
 const health=await processHealth(store);
 if(!health.available)throw new Error(health.reason);
 assert.equal(health.metrics.hostTakeovers,1);
 assert.deepEqual(health.metrics.hostTakeoversByTask,{a:1});
});
