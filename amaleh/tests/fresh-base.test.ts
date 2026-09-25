import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../scripts/cli.ts';
import { clearCut } from './execution-fixture.ts';

const git=(cwd:string,...args:string[])=>execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','init.defaultBranch=main',...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
async function staleClone(t:any){
 const root=await mkdtemp(join(tmpdir(),'amaleh-fresh-base-'));t.after(()=>rm(root,{recursive:true,force:true}));
 git(root,'init','--bare','-b','main','origin.git');
 git(root,'clone','origin.git','seed');
 const seed=join(root,'seed');
 await writeFile(join(seed,'app.txt'),'first');git(seed,'add','app.txt');git(seed,'commit','-m','first');git(seed,'push','origin','main');
 git(root,'clone','origin.git','work');
 await writeFile(join(seed,'app.txt'),'second');git(seed,'commit','-am','second');git(seed,'push','origin','main');
 return {root,work:join(root,'work')};
}
async function startInput(root:string,name:string,extra:Record<string,unknown>={}){
 const path=join(root,name+'.json');
 await writeFile(path,JSON.stringify({shape:clearCut,host:{kind:'codex',model:'gpt-6-astra'},intent:'Fixture run '+name,criteria:['observable result'],...extra}));
 return path;
}

test('start refuses a checkout that does not contain the freshly fetched origin default branch',async t=>{
 const {root,work}=await staleClone(t);
 const input=await startInput(root,'stale');
 await assert.rejects(()=>main(['start',work,'stale',input]),/origin\/main/);
});

test('start accepts the stale checkout when the user asked for a different base',async t=>{
 const {root,work}=await staleClone(t);
 await main(['start',work,'stacked',await startInput(root,'stacked',{base:{userInstruction:'Build on my current branch; it needs unmerged work'}})]);
});

test('start accepts a checkout that contains the fetched origin default branch',async t=>{
 const {root,work}=await staleClone(t);
 git(work,'pull','--ff-only');
 await main(['start',work,'fresh',await startInput(root,'fresh')]);
});
