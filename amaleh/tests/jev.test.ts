import {clearCut} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as c from '../scripts/core.ts';
import { jevAsk } from '../scripts/jev.ts';

const answer=(choice:string)=>(async()=>Response.json({model:'test/jev',answers:{selection:{type:'choice',choice,confidence:.9,probabilities:{[choice]:.9,other:.1}}}})) as typeof fetch;

async function fixture(t:any){
 const dir=await mkdtemp(join(tmpdir(),'amaleh-jev-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const old=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='sk-jev-fixture-not-real';
 t.after(()=>{if(old===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=old;});
 const store=await c.start(dir,{shape:clearCut,id:'jev',host:{kind:'codex',model:'gpt-6-astra'},intent:'Record worker-side Jev usage',criteria:['In-task choices are recorded against the run']});
 await c.plan(store,{tasks:[{id:'a',title:'a',goal:'Choose a truncation strategy',phase:'one',deps:[],resources:['a'],criteria:['strategy chosen'],checks:[],noProbe:'Jev test fixture with no executable checks',kind:'code'}],integrationChecks:[]});
 return {dir,store};
}

test('a worker choice is recorded as a worker-jev event against the run',async t=>{
 const {dir,store}=await fixture(t);
 const out=await jevAsk(store,{taskId:'a',question:'Cut at a word boundary or mid-word?',options:['boundary','other']},answer('boundary'));
 assert.equal(out.choice,'boundary');
 const events=(await store.load()).events.filter(e=>e.type==='worker-jev');
 assert.equal(events.length,1,'the health metric reads this event; a lost write makes worker Jev usage invisible');
 assert.equal((events[0].detail as any).taskId,'a');
 assert.equal((events[0].detail as any).choice,'boundary');
 assert.ok(dir);
});

test('pointing the helper at a task workspace fails loudly instead of losing the record',async t=>{
 const {dir}=await fixture(t);
 const taskWorkspace=join(dir,'w-a');await mkdir(taskWorkspace,{recursive:true});
 const stray=new c.Store(taskWorkspace,'jev');
 await assert.rejects(()=>jevAsk(stray,{taskId:'a',question:'Cut at a word boundary or mid-word?',options:['boundary','other']},answer('boundary')),
  /No Amaleh run at .*: pass the run's workspace, not the task workspace/);
});

test('run state lives at the run workspace, never at a task workspace',async t=>{
 const {dir,store}=await fixture(t);
 const taskWorkspace=join(dir,'w-a');await mkdir(taskWorkspace,{recursive:true});
 await store.transaction(s=>{c.taskOf(s,'a').workspace=taskWorkspace;});
 const state=await store.load();
 assert.notEqual(state.workspace,taskWorkspace,'the worker brief must send jev.ts to state.workspace, not to the task checkout');
 assert.equal(new c.Store(state.workspace,'jev').root,store.root);
});
