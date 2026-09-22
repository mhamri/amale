import {fixtureClaim} from './execution-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as c from '../scripts/core.ts';

async function setup(t:any,shared=false){
 const root=await mkdtemp(join(tmpdir(),'amale-frontier-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const store=await c.start(root,{id:'fixture',host:{kind:'codex',model:'fixture-host'},intent:'Expose independent verification',criteria:['Preserve verification gates']});
 await c.plan(store,{tasks:['a','b','c'].map(id=>({id,title:id,goal:id,phase:'one',deps:[],resources:[shared?'shared':id],criteria:['pass'],kind:'code',checks:[{id:'test',command:process.execPath,args:['-e','process.exit(0)']}]})),integrationChecks:[]});
 for(const id of ['a','b','c']){const dir=join(root,id);await mkdir(dir);await fixtureClaim(store,id,{workspace:dir,model:'fixture-author'});await c.result(store,id,{fixture:true});}
 return store;
}
test('frontier exposes independent checks and reviews beyond the focus task',async t=>{
 const store=await setup(t);let next=await c.next(store);assert.equal(next.action,'check');assert.deepEqual(next.parallel?.independent.map(a=>a.task),['a','b','c']);
 await Promise.all(next.parallel!.independent.map(a=>c.check(store,a.task,'test')));
 next=await c.next(store);assert.deepEqual(next.parallel?.independent.map(a=>a.action),['review','review','review']);
});
test('suggested verification batch respects shared resources and capacity',async t=>{
 const shared=await setup(t,true);assert.equal((await c.next(shared)).parallel?.independent.length,1);
 const limited=await setup(t);await limited.transaction(s=>{s.config.maxWorkers=2;});assert.equal((await c.next(limited)).parallel?.independent.length,2);
});
test('a recovery focus does not hide verification in healthy isolated workspaces',async t=>{
 const store=await setup(t);await rm(c.taskOf(await store.load(),'a').workspace!,{recursive:true});
 const next=await c.next(store);assert.equal(next.action,'reconcile-workspace');assert.deepEqual(next.parallel?.independent.map(a=>a.task),['b','c']);
});
