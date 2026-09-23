import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {taskDiff,piRun} from '../scripts/adapters.ts';
import {spend,trace,diagnostics} from '../scripts/telemetry.ts';
import {processHealth} from '../scripts/host-diagnostics.ts';
import * as c from '../scripts/core.ts';
import {clearCut} from './execution-fixture.ts';

async function temp(t:any,prefix:string){const dir=await mkdtemp(join(tmpdir(),prefix));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
const git=(cwd:string,...args:string[])=>execFileSync('git',['-c','user.email=fixture@example.invalid','-c','user.name=fixture',...args],{cwd,encoding:'utf8'});

test('the reviewer diff covers committed and uncommitted work since the task forked from the main checkout',async t=>{
 const main=await temp(t,'amale-diff-');
 git(main,'init','-q');await mkdir(join(main,'site'));await writeFile(join(main,'site','hero.tsx'),'old\n');await writeFile(join(main,'readme.md'),'root\n');
 git(main,'add','.');git(main,'commit','-qm','base');
 const tree=join(main,'..',`${main.split(/[\\/]/).pop()}-wt`);t.after(()=>rm(tree,{recursive:true,force:true}));
 git(main,'worktree','add','-q',tree);
 const workspace=join(tree,'site');
 await writeFile(join(workspace,'hero.tsx'),'committed\n');git(tree,'commit','-qam','task work');
 await writeFile(join(workspace,'hero.tsx'),'uncommitted\n');await writeFile(join(workspace,'new.tsx'),'fresh\n');
 await writeFile(join(main,'readme.md'),'main moved on\n');git(main,'commit','-qam','unrelated');
 const diff=await taskDiff(main,workspace);
 assert.ok(diff);
 assert.match(diff.patch,/-old\n\+uncommitted/);
 assert.doesNotMatch(diff.patch,/readme/,'changes outside the task workspace are not the task\'s');
 assert.deepEqual(diff.untracked,['new.tsx']);
 assert.match(diff.stat,/hero\.tsx/);
});

test('a workspace outside Git yields no diff rather than a misleading one',async t=>{
 const dir=await temp(t,'amale-nodiff-');
 assert.equal(await taskDiff(dir,dir),undefined);
});

const turn=(stopReason:string,text='working')=>({type:'message_end',message:{role:'assistant',model:'test/model',content:[{type:'text',text}],stopReason,usage:{input:10,output:3,cacheRead:100,cost:{total:.001}}}});
test('a call that keeps using tools past its turn limit is stopped with the reason',async t=>{
 const dir=await temp(t,'amale-turns-'),entry=join(dir,'fake-pi.ts');
 const lines=Array.from({length:8},()=>JSON.stringify(turn('toolUse'))).join('\n');
 await writeFile(entry,`process.stdout.write(${JSON.stringify(lines+'\n')});setTimeout(()=>{},20000);`);
 const old={key:process.env.OPENROUTER_API_KEY,pi:process.env.AMALE_PI_ENTRY,node:process.env.AMALE_NODE};
 process.env.OPENROUTER_API_KEY='sk-or-fake-turn-limit-secret-123';process.env.AMALE_PI_ENTRY=entry;process.env.AMALE_NODE=process.execPath;
 t.after(()=>{for(const [name,value] of [['OPENROUTER_API_KEY',old.key],['AMALE_PI_ENTRY',old.pi],['AMALE_NODE',old.node]] as const)if(value===undefined)delete process.env[name];else process.env[name]=value;});
 const started=Date.now();
 await assert.rejects(()=>piRun({workspace:dir,model:'test/model',prompt:'fixture',sessionDir:join(dir,'.sessions'),diagnosticRoot:join(dir,'.diagnostics'),maxTurns:5,attempts:1}),/Stopped after 5 turns, the limit for this call/);
 assert.ok(Date.now()-started<15000,'the process tree is killed instead of waiting for it');
 const report=await diagnostics(join(dir,'.diagnostics'));
 assert.ok(report.operations[0].events.some(e=>e.stage==='turn-limit'));
});

test('spend splits estimated cost and cached tokens by model, role and task',async t=>{
 const root=await temp(t,'amale-spend-');
 const call=async(model:string,session:string,readOnly:boolean,cost:number)=>{const tr=await trace(root,'pi',{model,readOnly,sessionDir:join(root,'sessions',session)});await tr.write('usage',{inputTokens:10,outputTokens:5,cacheRead:1000,cost,costSource:'pi-estimate'});await tr.end('success');};
 await call('moonshotai/kimi-k3','hero',false,2);
 await call('xiaomi/mimo-v2.5','hero-review-1790000000000',true,.5);
 await call('xiaomi/mimo-v2.5','docs',false,.25);
 const report=await diagnostics(root),costs=spend(report.operations);
 assert.equal(report.totals.cacheReadTokens,3000);
 assert.deepEqual(costs.byModel.map(r=>[r.key,r.estimatedCost]),[['moonshotai/kimi-k3',2],['xiaomi/mimo-v2.5',.75]]);
 assert.deepEqual(costs.byTask.map(r=>[r.key,r.calls]),[['hero',2],['docs',1]]);
 assert.deepEqual(costs.byRole.map(r=>r.key),['worker','reviewer']);
});

test('health warns when the deep model takes most of the spend, and stays quiet otherwise',async t=>{
 const dir=await temp(t,'amale-deepshare-');
 const store=await c.start(dir,{shape:clearCut,id:'share',host:{kind:'claude',model:'claude-opus-5-5'},intent:'Polish the site',criteria:['Site polished']});
 const call=async(model:string,cost:number)=>{const tr=await trace(store.root,'pi',{model,readOnly:false,sessionDir:join(store.root,'sessions','hero')});await tr.write('usage',{inputTokens:1,outputTokens:1,cost,costSource:'pi-estimate'});await tr.end('success');};
 await call('xiaomi/mimo-v2.5',.9);
 assert.ok(!(await processHealth(store) as any).warnings.some((w:string)=>/moonshotai\/kimi-k3 took/.test(w)));
 await call('moonshotai/kimi-k3',1.5);
 const health=await processHealth(store) as any;
 assert.ok(health.warnings.some((w:string)=>/moonshotai\/kimi-k3 took 63% of the \$2\.40 estimated spend across 1 call/.test(w)),health.warnings.join('\n'));
 assert.equal(health.metrics.spend.byModel[0].key,'moonshotai/kimi-k3');
});
