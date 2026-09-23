import {fixtureClaim,clearCut} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as c from '../scripts/core.ts';
import {delegate} from '../scripts/delegate.ts';

const task=(id:string)=>({id,title:id,goal:`Deliver ${id}`,phase:'one',deps:[],resources:[id],criteria:[`${id} works`],checks:[],kind:'code' as const});
const options:c.ShapeOption[]=[
 {id:'headline',summary:'Short headline and one line of copy over the scene',gains:'The scene stays visible',costs:'Less room for detail'},
 {id:'split',summary:'Copy on the left, scene on the right',gains:'Both stay readable',costs:'Scene shrinks on phones'}];
async function run(t:any,shape?:c.ShapeInput){
 const dir=await mkdtemp(join(tmpdir(),'amale-shape-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const store=await c.start(dir,{id:'shape',host:{kind:'claude',model:'claude-opus-5-5'},intent:'Make the hero section compelling',criteria:['The hero reads as a hero'],shape});
 return {dir,store};
}
async function delivered(store:c.Store,dir:string,id:string){
 await c.plan(store,{tasks:[task(id)],integrationChecks:[]});
 await fixtureClaim(store,id,{workspace:dir,model:'deepseek/flash'});await c.result(store,id,{done:true});
}

test('a new run cannot plan until its request is shaped',async t=>{
 const {store}=await run(t);
 assert.equal((await c.next(store)).action,'shape');
 await assert.rejects(()=>c.plan(store,{tasks:[task('hero')],integrationChecks:[]}),/waits for the intent "Make the hero section compelling" to be shaped/);
 await c.shape(store,clearCut);
 await c.plan(store,{tasks:[task('hero')],integrationChecks:[]});
 assert.equal((await c.next(store)).action,'route-dispatch');
});

test('real options stay open until the user picks one, and the pick becomes a requirement',async t=>{
 const {store}=await run(t,{understanding:'The hero must sell Amale in one glance',gaps:['No headline copy was supplied'],pushback:['Three paragraphs bury the animation'],additions:['Show every flash model logo'],mentor:['A hero earns attention with one promise, not a feature list'],options,recommendation:'headline'});
 const asked=await c.next(store) as any;
 assert.equal(asked.action,'ask-user');
 assert.deepEqual(asked.options.map((o:any)=>o.id),['headline','split']);
 assert.equal(asked.recommendation,'headline');
 await assert.rejects(()=>c.plan(store,{tasks:[task('hero')],integrationChecks:[]}),/waits for the user/);
 await c.shape(store,{understanding:'The hero must sell Amale in one glance',options,recommendation:'headline',chosen:{option:'headline',quote:'go with the headline one'}});
 const s=await store.load(),requirement=s.decisions.find(d=>d.purpose==='requirement'&&d.choice==='headline');
 assert.equal(requirement?.source,'user');
 assert.equal(requirement?.reason,'go with the headline one');
 await c.plan(store,{tasks:[task('hero')],integrationChecks:[]});
});

test('open questions hold the run even when the request is clear-cut',async t=>{
 const {store}=await run(t,{understanding:'Recolour the chips',clearCut:'Only one palette exists',questions:['Should the docs chips change too?']});
 const asked=await c.next(store) as any;
 assert.equal(asked.action,'ask-user');
 assert.deepEqual(asked.questions,['Should the docs chips change too?']);
});

test('a shape needs real alternatives or a reason there are none',async t=>{
 const {store}=await run(t);
 await assert.rejects(()=>c.shape(store,{understanding:''}),/needs understanding/);
 await assert.rejects(()=>c.shape(store,{understanding:'x'}),/two to four options that genuinely differ, or clearCut/);
 await assert.rejects(()=>c.shape(store,{understanding:'x',options:[options[0]],recommendation:'headline'}),/two to four options/);
 await assert.rejects(()=>c.shape(store,{understanding:'x',options,recommendation:'other'}),/recommendation must name one of the option ids/);
 await assert.rejects(()=>c.shape(store,{understanding:'x',options,recommendation:'headline',clearCut:'no'}),/clearCut or options, not both/);
 await assert.rejects(()=>c.shape(store,{understanding:'x',options,recommendation:'headline',chosen:{option:'headline',quote:' '}}),/chosen needs an option id/);
 await assert.rejects(()=>c.shape(store,{understanding:'x',clearCut:'y',affects:['missing']}),/Unknown task/);
});

test('user feedback on delivered work is shaped before anything is reopened or delegated',async t=>{
 const {dir,store}=await run(t,clearCut);
 await delivered(store,dir,'hero');
 await c.feedback(store,{text:'the hero section does not look like a hero section'});
 assert.equal((await c.next(store)).action,'shape');
 await assert.rejects(()=>c.invalidate(store,{id:'hero',reason:'user rejected it',noProbe:'taste'}),/waits for the feedback/);
 await assert.rejects(()=>delegate(store,'hero',{workspace:dir}),/delegate waits for the feedback/);
 await c.shape(store,{understanding:'The user wants a real hero: one headline, one line',options,recommendation:'headline',affects:['hero'],chosen:{option:'headline',quote:'headline please'}});
 await c.invalidate(store,{id:'hero',reason:'Deliver the shaped hero feedback',feedback:true});
 const t1=c.taskOf(await store.load(),'hero');
 assert.equal(t1.status,'ready');
 assert.equal(t1.cycles,0,'new scope from the user is not a failed repair');
 assert.equal(t1.depth,'flash');
 assert.match(c.reviewObligations(await store.load(),t1).at(-1)!.question,/Deliver the shaped hero feedback/);
});

test('a feedback reopen is limited to the tasks the shape names, once each',async t=>{
 const {store}=await run(t,clearCut);
 await c.plan(store,{tasks:[task('hero'),task('docs')],integrationChecks:[]});
 await c.feedback(store,{text:'the hero is too wordy'});
 await c.shape(store,{understanding:'Trim the hero',clearCut:'The user named the exact change',affects:['hero']});
 await assert.rejects(()=>c.invalidate(store,{id:'docs',reason:'x',feedback:true}),/does not name docs in affects/);
 await c.invalidate(store,{id:'hero',reason:'Trim the hero copy',feedback:true});
 await assert.rejects(()=>c.invalidate(store,{id:'hero',reason:'again',feedback:true}),/already reopened for feedback 2/);
});

test('an amend that delivers shaped feedback keeps the repair counter',async t=>{
 const {dir,store}=await run(t,clearCut);
 await delivered(store,dir,'hero');
 await c.feedback(store,{text:'give Jev the TypeSafe logo'});
 await c.shape(store,{understanding:'Jev gets the TypeSafe mark',clearCut:'The user named the logo',affects:['hero']});
 await c.amend(store,{id:'hero',reason:'User asked for the TypeSafe logo',feedback:true,task:{...task('hero'),criteria:['hero works','Jev shows the TypeSafe mark']}});
 const t1=c.taskOf(await store.load(),'hero');
 assert.equal(t1.cycles,0);
 assert.deepEqual(t1.criteria,['hero works','Jev shows the TypeSafe mark']);
});

test('a second reopen without a probe is refused: the checks are missing something',async t=>{
 const {dir,store}=await run(t,clearCut);
 await delivered(store,dir,'hero');
 await c.invalidate(store,{id:'hero',reason:'Clipped glyph',noProbe:'Seen only in a screenshot'});
 await fixtureClaim(store,'hero',{workspace:dir,model:'deepseek/flash'});await c.result(store,'hero',{done:true});
 await assert.rejects(()=>c.invalidate(store,{id:'hero',reason:'Overflow at 320',noProbe:'again'}),/already reopened once without a probe \("Seen only in a screenshot"\)/);
 await c.invalidate(store,{id:'hero',reason:'Overflow at 320',check:{id:'rendered',command:process.execPath,args:['-e','0']}});
 assert.ok(c.taskOf(await store.load(),'hero').checks.some(ch=>ch.id==='rendered'));
});

test('runs recorded before shaping existed are not held back',async t=>{
 const {store}=await run(t,clearCut);
 await store.transaction(s=>{s.events=s.events.filter(e=>e.type!=='request'&&e.type!=='shaped');});
 await c.plan(store,{tasks:[task('hero')],integrationChecks:[]});
 assert.equal((await c.next(store)).action,'route-dispatch');
});
