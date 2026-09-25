import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as c from '../scripts/core.ts';
import { processHealth } from '../scripts/host-diagnostics.ts';
import { fixtureClaim, clearCut } from './execution-fixture.ts';

const task=(id:string,resources=[id]):c.TaskInput=>({
 id,title:id,goal:'Correct observable behavior',phase:'one',deps:[],resources,criteria:['correct result'],kind:'code',
 checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)'],role:'guard'}],
 noProbe:'Test fixture; reopen accounting is asserted by the test, not by an executable probe',
});

async function delivered(t:any){
 const dir=await mkdtemp(join(tmpdir(),'amaleh-amend-contract-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'app.txt'),'original');
 const store=await c.start(dir,{shape:clearCut,id:'amend',host:{kind:'codex',model:'gpt-6-astra'},intent:'Count only defect reopens',criteria:['a contract change is not a defect']});
 await c.plan(store,{tasks:[task('a')],integrationChecks:[]});
 await fixtureClaim(store,'a',{workspace:dir,model:'deepseek/flash'});
 await c.result(store,'a',{changed:'app.txt'});
 await c.check(store,'a','test');
 const s=await store.load();
 await c.review(store,'a',{coverage:c.reviewObligations(s,c.taskOf(s,'a')).map(o=>({id:o.id,status:'covered' as const,evidence:'Synthetic protocol fixture only'})),model:'z-ai/glm-flash',findings:[],fingerprint:await c.fingerprint(dir),report:'Synthetic fixture review; not a model judgment'});
 await c.accept(store,'a');
 return store;
}
const reopened=async(store:c.Store)=>{const health=await processHealth(store);assert.ok(health.available);return health.metrics.reopenedChunks;};

test('an amend that only changes the contract is not counted as a defect reopen',async t=>{
 const store=await delivered(t);
 await c.amend(store,{id:'a',reason:'The scope rules changed; the delivered work had no defect',task:task('a',['app.txt'])});
 assert.equal(await reopened(store),0);
 assert.equal(c.taskOf(await store.load(),'a').status,'ready','the amended contract still sends the task back for work');
});

test('an invalidate that reports a defect is still counted',async t=>{
 const store=await delivered(t);
 await c.invalidate(store,{id:'a',reason:'The delivered output is wrong',noProbe:'Visual defect with no executable measure in this fixture'});
 assert.equal(await reopened(store),1);
});

test('in a run saved before kind existed, an amend is recognised by its contract-amended event',async t=>{
 const store=await delivered(t);
 await c.amend(store,{id:'a',reason:'The scope rules changed; the delivered work had no defect',task:task('a',['app.txt'])});
 await c.invalidate(store,{id:'a',reason:'The delivered output is wrong',noProbe:'Visual defect with no executable measure in this fixture'});
 const names=(await readdir(store.root)).filter(n=>/^revision-\d{9}\.json$/.test(n)).sort();
 const latest=join(store.root,names.at(-1)!);
 const state=JSON.parse(await readFile(latest,'utf8'));
 for(const e of state.events)if(e.type==='invalidated')delete e.detail.kind;
 await writeFile(latest,JSON.stringify(state,null,2));
 assert.equal(await reopened(store),1,'only the invalidate is a defect reopen');
 assert.equal(c.taskOf(await store.load(),'a').status,'ready','the reopened task still goes back for work');
});
