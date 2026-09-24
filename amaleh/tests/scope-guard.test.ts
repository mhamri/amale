import {fixtureClaim,clearCut} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import * as c from '../scripts/core.ts';
import { delegate, inScope, scopeCheckId, scopeVerdict } from '../scripts/delegate.ts';

const git=(cwd:string,args:string[])=>execFileSync('git',args,{cwd,stdio:['ignore','pipe','pipe']}).toString();
const jevTargeted=(async()=>Response.json({model:'test/jev',answers:{selection:{type:'choice',choice:'targeted',confidence:.95,probabilities:{targeted:.95,rethink:.03,simplify:.02}}}})) as typeof fetch;

async function scopeFixture(t:any,resources:string[]){
 const root=await mkdtemp(join(tmpdir(),'amaleh-scope-'));t.after(()=>rm(root,{recursive:true,force:true}));
 git(root,['init']);git(root,['config','user.email','fixture@amaleh.test']);git(root,['config','user.name','fixture']);
 await writeFile(join(root,'README.md'),'base');
 git(root,['add','-A']);git(root,['commit','-m','base','--no-gpg-sign']);
 await mkdir(join(root,'task'));const workspace=await realpath(join(root,'task'));
 const store=await c.start(root,{shape:clearCut,id:'scope',host:{kind:'codex',model:'gpt-6-astra'},intent:'Keep worker changes inside the task resources',criteria:['Changes stay in scope']});
 await c.plan(store,{tasks:[{id:'a',title:'a',goal:'Write the source the task owns',phase:'one',deps:[],resources,criteria:['source updated'],kind:'code' as const,checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)']}]}],integrationChecks:[]});
 return {root,workspace,store};
}
async function syntheticCoverage(store:c.Store,id:string){const state=await store.load();return c.reviewObligations(state,c.taskOf(state,id)).map(o=>({id:o.id,status:'covered' as const,evidence:'Synthetic protocol fixture only; not a real model review'}));}
const worker=(workspace:string,steps:(()=>Promise<void>)[])=>{let call=0;return async(store:any,id:string,input:any)=>{
 await steps[Math.min(call++,steps.length-1)]();
 await fixtureClaim(store,id,{workspace:input.workspace??workspace,model:'deepseek/flash'});
 await c.result(store,id,{changed:'files'});
 return {artifact:c.taskOf(await store.load(),id).output};
};};
const reviewer=async(store:any,id:string)=>{await c.review(store,id,{model:'z-ai/glm-flash',fingerprint:await c.fingerprint(c.taskOf(await store.load(),id).workspace!),findings:[],report:'Synthetic fixture review',coverage:await syntheticCoverage(store,id)});return {findings:[]};};

test('a worker change outside the resource globs fails the scope check and drives a repair',async t=>{
 const resources=['src/**'];const {workspace,store}=await scopeFixture(t,resources);
 await mkdir(join(workspace,'src'),{recursive:true});
 let call=0;const briefs:string[]=[];
 const inner=async(store:any,id:string,input:any)=>{
  briefs.push(String(input.brief));
  if(++call===1)await writeFile(join(workspace,'rogue.txt'),'out of scope');
  else{await rm(join(workspace,'rogue.txt'));await writeFile(join(workspace,'src','in.ts'),'in scope');}
  await fixtureClaim(store,id,{workspace:input.workspace??workspace,model:'deepseek/flash'});
  await c.result(store,id,{changed:'files'});
  return {artifact:c.taskOf(await store.load(),id).output};
 };
 const out=await delegate(store,'a',{workspace},{runWorker:inner as any,runReviewer:reviewer as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 const state=await store.load(),task=c.taskOf(state,'a');
 assert.equal(task.cycles,1,'the scope failure must consume a repair cycle');
 const violations=state.events.filter(e=>e.type==='check'&&(e.detail as any).checkId===scopeCheckId&&(e.detail as any).code!==0);
 assert.equal(violations.length,1,'exactly one failing scope receipt is recorded');
 const artifact=JSON.parse(await store.readArtifact((violations[0]!.detail as any).artifact));
 assert.match(artifact.stdout,/rogue\.txt/,'the scope receipt output names the out-of-scope path');
 assert.equal(task.receipts.find(r=>r.id===scopeCheckId)!.code,0,'the scope check re-runs after the repair and passes once the path is reverted');
 assert.equal(out.trail.filter(x=>x.stage==='scope').length,2,'the scope check re-runs after every repair like the registered checks');
 assert.match(briefs[1],/rogue\.txt/,'the repair brief names the out-of-scope path');
});

test('a worker change fully inside the resource globs passes the scope check and reaches review unchanged',async t=>{
 const {workspace,store}=await scopeFixture(t,['src/**']);
 await mkdir(join(workspace,'src'),{recursive:true});
 let sawBrief='';
 const inner=async(store:any,id:string,input:any)=>{sawBrief=String(input.brief);await writeFile(join(workspace,'src','page.ts'),'in scope');
  await fixtureClaim(store,id,{workspace:input.workspace??workspace,model:'deepseek/flash'});
  await c.result(store,id,{changed:'files'});
  return {artifact:c.taskOf(await store.load(),id).output};};
 const out=await delegate(store,'a',{workspace},{runWorker:inner as any,runReviewer:reviewer as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 assert.deepEqual(out.trail.map(x=>x.stage),['worker','check','scope','review'],'an in-scope change reaches review unchanged');
 const task=c.taskOf(await store.load(),'a');
 assert.equal(task.cycles,0,'an in-scope change must not spend a repair cycle');
 assert.equal(task.receipts.find(r=>r.id===scopeCheckId)!.code,0);
 assert.equal(out.trail.filter(x=>x.stage==='scope').length,1);
 assert.ok(!/Out-of-scope/.test(sawBrief));
});

test('a workspace outside Git records that the scope check could not run instead of passing silently',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'amaleh-noscope-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'app.txt'),'original');
 const store=await c.start(dir,{shape:clearCut,id:'nogit',host:{kind:'codex',model:'gpt-6-astra'},intent:'Keep changes in scope without Git',criteria:['Changes stay in scope']});
 await c.plan(store,{tasks:[{id:'a',title:'a',goal:'Write the source the task owns',phase:'one',deps:[],resources:['src/**'],criteria:['source updated'],kind:'code' as const,checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)']}]}],integrationChecks:[]});
 const inner=worker(dir,[async()=>{}]);
 const out=await delegate(store,'a',{workspace:dir},{runWorker:inner as any,runReviewer:reviewer as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'accepted');
 const state=await store.load(),task=c.taskOf(state,'a');
 assert.equal(task.receipts.some(r=>r.id===scopeCheckId),false,'no scope receipt is claimed without a diff');
 const noted=state.events.filter(e=>e.type==='scope-unverified'&&(e.detail as any).id==='a');
 assert.equal(noted.length,1,'the inability to run the scope check is recorded exactly once');
 assert.match((noted[0]!.detail as {reason?:string}).reason as string,/could not run/);
 assert.equal(out.trail.filter(x=>x.stage==='scope').length,1);
});

test('untracked files are scope-checked like tracked changes, and an exact-path resource rejects sibling paths',{timeout:30000},async t=>{
 const {workspace,store}=await scopeFixture(t,['src/keep.ts']);
 const inner=async(store:any,id:string,input:any)=>{
  await mkdir(join(workspace,'src'),{recursive:true});
  await writeFile(join(workspace,'src','keep.ts'),'in scope');await writeFile(join(workspace,'src','stray.ts'),'out of scope');
  const depth=c.taskOf(await store.load(),id).depth;
  await fixtureClaim(store,id,{workspace:input.workspace??workspace,model:depth==='deep'?'moonshot/kimi':'deepseek/flash'});
  await c.result(store,id,{changed:'files'});
  return {artifact:c.taskOf(await store.load(),id).output};};
 const out=await delegate(store,'a',{workspace},{runWorker:inner as any,runReviewer:reviewer as any,fetcher:jevTargeted});
 assert.equal(out.outcome,'escalated','untracked out-of-scope files fail the scope check like tracked changes');
 const state=await store.load(),task=c.taskOf(state,'a');
 assert.ok(task.cycles>0);
 const artifact=JSON.parse(await store.readArtifact(task.receipts.find(r=>r.id===scopeCheckId)!.artifact));
 assert.match(artifact.stdout,/src\/stray\.ts/);
 assert.ok(!artifact.stdout.includes('src/keep.ts'),'in-scope paths are not listed as violations');
});

test('resource globs match paths the way the scope check applies them',()=>{
 assert.ok(inScope('src/**','src/a/b.ts'));
 assert.ok(inScope('src/**','src/in.ts'));
 assert.ok(!inScope('src/**','srcx/in.ts'));
 assert.ok(!inScope('src/**','README.md'));
 assert.ok(inScope('amaleh/scripts/adapters.ts','amaleh/scripts/adapters.ts'));
 assert.ok(!inScope('amaleh/scripts/adapters.ts','amaleh/scripts/adapters.test.ts'));
 assert.ok(inScope('docs','docs/contract.md'),'a bare resource owns its subtree like conflict() does');
 assert.ok(!inScope('docs','docsx/contract.md'));
 assert.ok(inScope('*','any/where.ts'));
 assert.ok(inScope('src/*.ts','src/one.ts'));
 assert.ok(!inScope('src/*.ts','src/nested/one.ts'));
 assert.ok(inScope('a/**/b.ts','a/x/y/b.ts'));
 assert.ok(inScope('a/**/b.ts','a/b.ts'));
});

test('scopeVerdict reports an unverifiable verdict when the diff is unavailable',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'amaleh-nodiff-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'app.txt'),'original');
 const store=await c.start(dir,{shape:clearCut,id:'nodiff',host:{kind:'codex',model:'gpt-6-astra'},intent:'Keep changes in scope without Git',criteria:['Changes stay in scope']});
 await c.plan(store,{tasks:[{id:'a',title:'a',goal:'g',phase:'one',deps:[],resources:['src/**'],criteria:['c'],kind:'code' as const,checks:[]}],integrationChecks:[]});
 await store.transaction(s=>{c.taskOf(s,'a').workspace=dir;});
 const verdict=await scopeVerdict(store,'a',await c.fingerprint(dir),store.root);
 assert.equal(verdict.ran,false);
 assert.match(verdict.reason as string,/could not run/);
});

test('a task check may not reuse the built-in scope check id',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'amaleh-scope-id-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const store=await c.start(dir,{shape:clearCut,id:'reserved',host:{kind:'codex',model:'gpt-6-astra'},intent:'Keep the built-in scope check enforceable',criteria:['The reserved check id is refused']});
 const scopeCheck={id:scopeCheckId,command:process.execPath,args:['-e','process.exit(0)']};
 const task=(checkId:string)=>({id:'a',title:'a',goal:'Deliver the task',phase:'one',deps:[],resources:['src/**'],criteria:['c'],kind:'code' as const,checks:[{id:checkId,command:process.execPath,args:['-e','process.exit(0)']}]});
 await assert.rejects(()=>c.plan(store,{tasks:[task(scopeCheckId)],integrationChecks:[]}),/reserved for the built-in scope check/,'plan refuses the reserved id and names it');
 await c.plan(store,{tasks:[task('test')],integrationChecks:[]});
 await assert.rejects(()=>c.amend(store,{id:'a',reason:'register the reserved id',task:task(scopeCheckId)}),/reserved for the built-in scope check/,'amend refuses the reserved id and names it');
 await assert.rejects(()=>c.invalidate(store,{id:'a',reason:'register the reserved id',check:scopeCheck}),/reserved for the built-in scope check/,'invalidate refuses the reserved id and names it');
 await store.transaction(s=>{c.taskOf(s,'a').status='review';});
 await assert.rejects(()=>c.addReviewCheck(store,'a',scopeCheck),/reserved for the built-in scope check/,'review-check refuses the reserved id and names it');
 assert.deepEqual(c.taskOf(await store.load(),'a').checks.map(c=>c.id),['test'],'only the reserved id is refused; other task checks register as before');
});
