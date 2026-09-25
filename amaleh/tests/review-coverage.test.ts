import {fixtureClaim,clearCut} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as c from '../scripts/core.ts';
async function fixture(t:any){const dir=await mkdtemp(join(tmpdir(),'amaleh-review-coverage-'));t.after(()=>rm(dir,{recursive:true,force:true}));const store=await c.start(dir,{shape:clearCut,id:'fixture',host:{kind:'codex',model:'fixture-host'},intent:'Review actual coverage',criteria:['Run result supported']});await c.plan(store,{tasks:[{id:'a',title:'a',goal:'a',phase:'one',deps:[],resources:['a'],criteria:['Task result supported'],checks:[],noProbe:'Synthetic coverage fixture with no executable checks',kind:'code'}],integrationChecks:[]});await fixtureClaim(store,'a',{workspace:dir,model:'fixture-author'});await c.result(store,'a',{synthetic:true});return {store,dir};}
async function coverage(store:c.Store):Promise<c.ReviewCoverage[]>{const s=await store.load();return c.reviewObligations(s,c.taskOf(s,'a')).map(o=>({id:o.id,status:'covered',evidence:'Synthetic fixture attestation; not a model-quality result'}));}
async function record(store:c.Store,dir:string,entries?:c.ReviewCoverage[]){await c.review(store,'a',{model:'fixture-reviewer',findings:[],fingerprint:await c.fingerprint(dir),report:entries?'Synthetic report with explicit obligation coverage; assertions are not proof of model quality.':'I could not inspect required evidence; coverage is incomplete.',coverage:entries});}
test('legacy incomplete prose cannot become acceptance and coverage gaps preserve repair cycles',async t=>{const {store,dir}=await fixture(t);await record(store,dir);assert.equal((await c.next(store)).action,'review-evidence-needed');await assert.rejects(()=>c.accept(store,'a'),/coverage incomplete/);const entries=await coverage(store);entries[0].status='unreviewed';entries[0].evidence='Required host probe has not run';await record(store,dir,entries);const next=await c.next(store);assert.equal(next.action,'review-evidence-needed');assert.equal((next as any).obligations.length,1);assert.equal((next as any).obligations[0].evidence,'Required host probe has not run');assert.ok((next as any).reviewArtifact);assert.equal(c.taskOf(await store.load(),'a').cycles,0);await assert.rejects(()=>c.accept(store,'a'),/coverage incomplete/);});
test('complete attested coverage permits acceptance with justified inapplicable fixed lens',async t=>{const {store,dir}=await fixture(t);const entries=await coverage(store);const parallel=entries.find(x=>x.id==='parallelism')!;parallel.status='not-applicable';parallel.evidence='Fixture has no overlapping operations, retry path or shared state';await record(store,dir,entries);assert.equal((await c.next(store)).action,'accept');await c.accept(store,'a');assert.equal(c.taskOf(await store.load(),'a').status,'accepted');});
test('coverage must include exact obligations and can never exempt this task\'s own criteria',async t=>{const {store,dir}=await fixture(t);for(const mutation of [(x:c.ReviewCoverage[])=>x.slice(1),(x:c.ReviewCoverage[])=>[x[0],...x.slice(0,-1)],(x:c.ReviewCoverage[])=>x.map((e,i)=>i?e:{...e,id:'invented'}),(x:c.ReviewCoverage[])=>x.map((e,i)=>i?e:{...e,evidence:' '}),(x:c.ReviewCoverage[])=>x.map(e=>e.id==='criterion:1'?{...e,status:'not-applicable' as const}:e)])await assert.rejects(()=>coverage(store).then(x=>record(store,dir,mutation(x))),/coverage|criteria/i);});
test('a run outcome owned by another task is not-applicable with evidence, and still accepts',async t=>{
 const {store,dir}=await fixture(t);
 const entries=(await coverage(store)).map(e=>e.id==='outcome:1'?{...e,status:'not-applicable' as const,evidence:'Owned by the pricing task; no change in this workspace can affect it either way'}:e);
 await record(store,dir,entries);
 const state=await store.load();
 assert.deepEqual(c.reviewCoverageDebt(state,c.taskOf(state,'a')),[],'an evidenced not-applicable outcome is not review debt');
 await c.accept(store,'a');
 assert.equal(c.taskOf(await store.load(),'a').status,'accepted');
});
test('a not-applicable outcome still requires evidence naming why',async t=>{
 const {store,dir}=await fixture(t);
 const entries=(await coverage(store)).map(e=>e.id==='outcome:1'?{...e,status:'not-applicable' as const,evidence:'  '}:e);
 await assert.rejects(()=>record(store,dir,entries),/nonempty evidence/i);
});
test('a finding status with no filed finding is rejected at record time so it can be corrected',async t=>{
 const {store,dir}=await fixture(t);const entries=await coverage(store);entries[0].status='finding';
 await assert.rejects(()=>record(store,dir,entries),/marks criterion:1 as finding while the findings array is empty/);
 entries[0].status='covered';await record(store,dir,entries);await c.accept(store,'a');
});
test('a finding status backed by a real finding still blocks acceptance until corrected',async t=>{
 const {store,dir}=await fixture(t);const entries=await coverage(store);entries[0].status='finding';
 const defect={id:'f1',lens:'Spec',location:'app.txt',scenario:'charges 11 instead of 10',evidence:'observed expected-versus-actual',consequence:'overcharge',blocking:false};
 await c.review(store,'a',{model:'fixture-reviewer',findings:[defect],fingerprint:await c.fingerprint(dir),report:'Synthetic report with one filed defect',coverage:entries});
 await assert.rejects(()=>c.accept(store,'a'),/coverage incomplete/);
 entries[0].status='covered';await record(store,dir,entries);await c.accept(store,'a');
});
test('review probe registration creates check work and fresh review without consuming repair cycles',async t=>{const {store,dir}=await fixture(t);await record(store,dir,await coverage(store));const probe={id:'probe',command:process.execPath,args:['-e','process.exit(0)'],role:'probe' as const};await c.addReviewCheck(store,'a',probe);let task=c.taskOf(await store.load(),'a');assert.equal(task.review,undefined);assert.equal(task.cycles,0);assert.ok(task.output);assert.equal((await c.next(store)).action,'check');await assert.rejects(()=>c.addReviewCheck(store,'a',probe),/Duplicate/);await assert.rejects(()=>c.addReviewCheck(store,'a',{...probe,id:'bad/id'}),/Invalid identifier/);await assert.rejects(()=>c.addReviewCheck(store,'a',{id:'invalid-command',command:'',args:[],role:'probe' as const}),/Commands/);await c.check(store,'a','probe');assert.equal((await c.next(store)).action,'review');await record(store,dir,await coverage(store));await c.accept(store,'a');await assert.rejects(()=>c.addReviewCheck(store,'a',{...probe,id:'later'}),/idle task/);});
