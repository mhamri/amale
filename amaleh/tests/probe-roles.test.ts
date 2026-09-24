import {fixtureClaim,clearCut} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as c from '../scripts/core.ts';

async function fixture(t:any){
 const dir=await mkdtemp(join(tmpdir(),'amaleh-probe-roles-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'app.txt'),'original');
 const store=await c.start(dir,{shape:clearCut,id:'probe-test',host:{kind:'codex',model:'gpt-6-astra'},intent:'Test probe and guard roles',criteria:['Probe and guard checks work correctly']});
 return {dir,store};
}
import { join } from 'node:path';

const probeCheck:c.Check={id:'probe',command:process.execPath,args:['-e','process.exit(1)'],role:'probe'};
const guardCheck:c.Check={id:'guard',command:process.execPath,args:['-e','process.exit(0)'],role:'guard'};

test('plan refuses a task check without role',async t=>{
 const {store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)']}] as any};
 await assert.rejects(()=>c.plan(store,{tasks:[task],integrationChecks:[]}),/requires role/);
});

test('plan refuses a code task with no probe and no noProbe',async t=>{
 const {store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)'],role:'guard' as const}]};
 await assert.rejects(()=>c.plan(store,{tasks:[task],integrationChecks:[]}),/needs at least one probe/);
});

test('plan accepts a code task with at least one probe',async t=>{
 const {store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 assert.equal(c.taskOf(await store.load(),'a').checks[0].role,'probe');
});

test('plan accepts a code task with noProbe and no probe checks',async t=>{
 const {store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[],noProbe:'No executable can detect this visual defect'};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 assert.equal(c.taskOf(await store.load(),'a').noProbe,'No executable can detect this visual defect');
});

test('plan accepts a research task with no probes',async t=>{
 const {store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Research',phase:'one',deps:[],resources:['a'],criteria:['findings'],kind:'research' as const,
  checks:[]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
});

test('delegate refuses when a probe passes on the unchanged checkout',async t=>{
 const {dir,store}=await fixture(t);
 const passingProbe:c.Check={id:'passing',command:process.execPath,args:['-e','process.exit(0)'],role:'probe'};
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[passingProbe]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await store.transaction(s=>{c.taskOf(s,'a').workspace=dir;});
 const {delegate}=await import('../scripts/delegate.ts');
 const fakeWorker=(async()=>{throw new Error('should not be called');}) as any;
 const fakeReviewer=(async()=>{throw new Error('should not be called');}) as any;
 const fakeFetcher=(async()=>{throw new Error('should not be called');}) as any;
 const out=await delegate(store,'a',{workspace:dir},{runWorker:fakeWorker,runReviewer:fakeReviewer,fetcher:fakeFetcher});
 assert.equal(out.outcome,'refused');
 assert.match(String(out.reason),/passing/);
 assert.match(String(out.reason),/already passes/);
});

test('delegate allows when a probe fails on the unchanged checkout',async t=>{
 const {dir,store}=await fixture(t);
 const failingProbe:c.Check={id:'failing',command:process.execPath,args:['-e','process.exit(1)'],role:'probe'};
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[failingProbe]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await store.transaction(s=>{c.taskOf(s,'a').workspace=dir;});
 const {delegate}=await import('../scripts/delegate.ts');
 const fakeWorker=(async()=>{throw new Error('probe check passed');}) as any;
 const fakeReviewer=(async()=>{throw new Error('should not be called');}) as any;
 const fakeFetcher=(async()=>{throw new Error('should not be called');}) as any;
 const out=await delegate(store,'a',{workspace:dir},{runWorker:fakeWorker,runReviewer:fakeReviewer,fetcher:fakeFetcher});
 assert.notEqual(out.outcome,'refused');
});

test('invalidate refuses a probe that passes on the current checkout',async t=>{
 const {dir,store}=await fixture(t);
 const passingProbe:c.Check={id:'passing',command:process.execPath,args:['-e','process.exit(0)'],role:'probe'};
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 await c.result(store,'a',{});
 await assert.rejects(()=>c.invalidate(store,{id:'a',reason:'test',check:passingProbe}),/already passes/);
});

test('invalidate allows a probe that fails on the current checkout',async t=>{
 const {dir,store}=await fixture(t);
 const failingProbe:c.Check={id:'failing',command:process.execPath,args:['-e','process.exit(1)'],role:'probe'};
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 await c.result(store,'a',{});
 await c.invalidate(store,{id:'a',reason:'test',check:failingProbe});
 assert.equal(c.taskOf(await store.load(),'a').status,'ready');
 assert.ok(c.taskOf(await store.load(),'a').checks.some(c=>c.id==='failing'));
});

test('invalidate accepts a passing guard check without running the probe pre-check',async t=>{
 const {dir,store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 await c.result(store,'a',{});
 await c.invalidate(store,{id:'a',reason:'test',check:guardCheck});
 const reopened=c.taskOf(await store.load(),'a');
 assert.equal(reopened.status,'ready');
 assert.ok(reopened.checks.some(c=>c.id==='guard'&&c.role==='guard'));
});

test('invalidate refuses a check with an invalid role before recording anything',async t=>{
 const {dir,store}=await fixture(t);
 const bogus={id:'bogus',command:process.execPath,args:['-e','process.exit(1)'],role:'bogus'} as any;
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 await c.result(store,'a',{});
 await assert.rejects(()=>c.invalidate(store,{id:'a',reason:'test',check:bogus}),/requires role/);
 const s=await store.load();
 assert.notEqual(c.taskOf(s,'a').status,'ready');
 assert.ok(!c.taskOf(s,'a').checks.some(c=>c.id==='bogus'));
});

test('addReviewCheck refuses a check without role',async t=>{
 const {dir,store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 await c.result(store,'a',{});
 await c.check(store,'a','test');
 await c.review(store,'a',{model:'z-ai/glm-flash',fingerprint:await c.fingerprint(dir),findings:[],report:'review',coverage:await (async()=>{const s=await store.load();return c.reviewObligations(s,c.taskOf(s,'a')).map(o=>({id:o.id,status:'covered' as const,evidence:'synthetic'}));})()});
 assert.equal(c.taskOf(await store.load(),'a').status,'review');
 const badCheck={id:'bad',command:process.execPath,args:['-e','process.exit(0)']} as any;
 await assert.rejects(()=>c.addReviewCheck(store,'a',badCheck),/requires role/);
});

test('amend propagates noProbe to the task',async t=>{
 const {store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await c.amend(store,{id:'a',reason:'Updated',task:{...task,noProbe:'No longer needs a probe'}});
 assert.equal(c.taskOf(await store.load(),'a').noProbe,'No longer needs a probe');
});

test('existing checks without role are rejected by validateTasks',async t=>{
 const {store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)']}] as any};
 await assert.rejects(()=>c.plan(store,{tasks:[task],integrationChecks:[]}),/requires role/);
});

test('invalidate runs a reopen probe in the task workspace, not the run root',async t=>{
 const {dir,store}=await fixture(t);
 const taskWorkspace=await mkdtemp(join(tmpdir(),'amaleh-probe-ws-'));
 t.after(()=>rm(taskWorkspace,{recursive:true,force:true}));
 await writeFile(join(taskWorkspace,'app.txt'),'original');
 await writeFile(join(taskWorkspace,'only-in-task-workspace.txt'),'marker');
 const passingProbe:c.Check={id:'passing',command:process.execPath,args:['-e',"process.exit(require('fs').existsSync('only-in-task-workspace.txt')?0:1)"],role:'probe'};
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'test',command:process.execPath,args:['-e','process.exit(1)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await store.transaction(s=>{c.taskOf(s,'a').workspace=taskWorkspace;});
 await fixtureClaim(store,'a',{workspace:taskWorkspace,model:'deepseek/flash'});
 await c.result(store,'a',{});
 await assert.rejects(()=>c.invalidate(store,{id:'a',reason:'test',check:passingProbe}),/already passes/);
});

test('a feedback reopen with a passing probe is not refused by delegate',async t=>{
 const {dir,store}=await fixture(t);
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[{id:'passing',command:process.execPath,args:['-e','process.exit(0)'],role:'probe' as const}]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 await c.result(store,'a',{done:true});
 await c.feedback(store,{text:'the result needs new scope'});
 await c.shape(store,{understanding:'New scope for the delivered result',clearCut:'The user named the exact change',affects:['a']});
 await c.invalidate(store,{id:'a',reason:'Deliver the shaped feedback',feedback:true});
 const reopened=c.taskOf(await store.load(),'a');
 assert.equal(reopened.status,'ready');
 assert.equal(reopened.cycles,0);
 assert.ok(reopened.output);
 const {delegate}=await import('../scripts/delegate.ts');
 const out=await delegate(store,'a',{workspace:dir},{
  runWorker:(async()=>{throw new Error('worker should launch after a feedback reopen');}) as any,
  runReviewer:(async()=>{throw new Error('should not be called');}) as any,
  fetcher:(async()=>{throw new Error('should not be called');}) as any});
 assert.notEqual(out.outcome,'refused');
});

test('delegate still refuses a passing probe before the first worker run',async t=>{
 const {dir,store}=await fixture(t);
 const passingProbe:c.Check={id:'passing',command:process.execPath,args:['-e','process.exit(0)'],role:'probe'};
 const task={id:'a',title:'a',goal:'Test',phase:'one',deps:[],resources:['a'],criteria:['works'],kind:'code' as const,
  checks:[passingProbe]};
 await c.plan(store,{tasks:[task],integrationChecks:[]});
 await store.transaction(s=>{c.taskOf(s,'a').workspace=dir;});
 const {delegate}=await import('../scripts/delegate.ts');
 const out=await delegate(store,'a',{workspace:dir},{
  runWorker:(async()=>{throw new Error('worker should not launch');}) as any,
  runReviewer:(async()=>{throw new Error('should not be called');}) as any,
  fetcher:(async()=>{throw new Error('should not be called');}) as any});
 assert.equal(out.outcome,'refused');
 assert.match(String(out.reason),/already passes/);
});

