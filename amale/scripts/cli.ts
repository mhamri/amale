import { readFile, writeFile, mkdir, readdir, realpath, lstat, symlink } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import * as core from './core.ts';
import * as adapters from './adapters.ts';
import { preflight } from './preflight.ts';
import {recordHostAction,hostActions,exportDiagnostics,processHealth} from './host-diagnostics.ts';
import {delegate,delegateBatch} from './delegate.ts';
import {bench,renderScorecard} from './bench.ts';
import { selectModel } from './routing.ts';
import * as effort from './effort.ts';
import { trace, diagnostics } from './telemetry.ts';

const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function statusHtml(store:core.Store){const s=await store.load();const content=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Amale ${esc(s.id)}</title><style>body{max-width:1050px;margin:40px auto;padding:20px;font:16px/1.6 system-ui;background:#f7f6ef;color:#243832}article{padding:18px;border:1px solid #bdcbbb;margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}.muted{color:#52665f}</style><h1>${esc(s.intent)}</h1><p>${esc(s.status)} · revision ${s.revision} · ${esc(s.host.model)}</p><h2>Next action</h2><pre>${esc(JSON.stringify(await core.next(store),null,2))}</pre><h2>Acceptance criteria</h2><ul>${s.criteria.map(c=>`<li>${esc(c)}</li>`).join('')}</ul><h2>Work graph</h2>${s.tasks.map(t=>`<article><h3>${esc(t.id)} · ${esc(t.title)}</h3><p>${esc(t.phase)} / ${esc(t.status)} / ${esc(t.depth)} / repair cycle ${t.cycles}</p><p>Depends on: ${esc(t.deps.join(', ')||'entry')}</p><p>${esc(t.goal)}</p><p class="muted">${esc(t.blocked??'')}</p></article>`).join('')}<h2>Decisions</h2>${s.decisions.map(d=>`<p>${esc(d.question)} → ${esc(d.choice??'host decision pending')} (${esc(d.source??'pending')})</p>`).join('')}<p>Evidence and full history remain in this run’s durable records.</p></html>`;const path=join(store.root,'status.html');await writeFile(path,content);return {path};}
export async function install(targetHome=homedir()){const source=await realpath(join(dirname(fileURLToPath(import.meta.url)),'..'));const targets=[join(process.env.CODEX_HOME??join(targetHome,'.codex'),'skills','amale'),join(targetHome,'.claude','skills','amale')];const result=[];for(const target of targets){await mkdir(dirname(target),{recursive:true});try{await lstat(target);core.invariant(await realpath(target)===source,`Conflicting skill target: ${target}`);result.push({target,status:'already linked'});}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;await symlink(source,target,process.platform==='win32'?'junction':'dir');core.invariant(await realpath(target)===source,'Link verification failed');result.push({target,status:'linked'});}}return result;}
async function finishGate(store:core.Store,input:{claims:string[];acknowledgeWarnings?:string}){
 const health=await processHealth(store);
 if(health.available&&health.warnings.length){
  const reason=typeof input.acknowledgeWarnings==='string'?input.acknowledgeWarnings.trim():'';
  core.invariant(reason,'Delegation health warnings block finish:\n'+health.warnings.map(w=>'- '+w).join('\n')+'\nCorrect the process and re-run, or re-run finish with acknowledgeWarnings set to a written reason for overriding these warnings.');
  await store.transaction(s=>core.event(s,'health-acknowledged',{reason,warnings:health.warnings}));
 }
 await core.finish(store,input.claims);
}
async function executeMain(args=process.argv.slice(2)){
 const [operation,workspace=process.cwd(),runId,inputPath]=args;
 if(operation==='install')return install(args[1]);
 if(operation==='doctor'){const pi=await adapters.piCommand();let auth=false;try{auth=!!await adapters.credential();}catch{}return {runtime:{engine:process.versions.bun?'bun':'node',version:process.versions.bun??process.versions.node,nodeCompatibility:process.versions.node,executable:process.execPath},platform:process.platform,pi,openrouterConfigured:auth,dependencies:'No npm runtime dependencies',jevEndpoint:'https://openrouter.ai/api/alpha/decisions'};}
 if(operation==='list'){let ids:string[];try{ids=(await readdir(join(resolve(workspace),'.amale','runs'))).filter(id=>/^[a-zA-Z0-9_-]+$/.test(id));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e;}const summaries=await Promise.all(ids.map(async id=>{try{return await core.summarize(workspace,id);}catch(e){return {id,status:'blocked',intent:'<unreadable: '+(e as Error).message+'>',criteria:[],tasks:0,revision:-1} satisfies core.RunSummary;}}));return summaries.sort((a:core.RunSummary,b:core.RunSummary)=>b.revision-a.revision||a.id.localeCompare(b.id));}
 const input=inputPath?JSON.parse(await readFile(resolve(inputPath),'utf8')):{};
 if(operation==='start'){const store=await core.start(workspace,{...input,id:runId});return core.packet(store);}
 if(operation==='bench'){core.invariant(runId,'Bench needs a run id; use a new one per measurement');const result=await bench(workspace,runId,input.host);console.error(renderScorecard(result));return result;}
 core.invariant(runId,'Usage: bun scripts/cli.ts <operation> <workspace> <run-id> [input.json]');
 const store=new core.Store(workspace,runId);
 switch(operation){
 case 'host-action':return recordHostAction(store,input);
 case 'diagnostic-export':return exportDiagnostics(store);
 case 'preflight':return preflight(store,input);
 case 'status':return core.packet(store);
 case 'diagnose':{let state:unknown,stateError:string|undefined;try{state=await core.packet(store);}catch(error){stateError=(error as Error).message;}return {state,stateError,hostActions:await hostActions(store),diagnostics:await diagnostics(store.root),health:await processHealth(store).catch(e=>({available:false,reason:(e as Error).message}))};}
 case 'next':return core.next(store);
 case 'resume':return core.resume(store,input.host);
 case 'unlock':await store.unlock();return {unlocked:true};
 case 'plan':await core.plan(store,input);break;
 case 'amend':await core.amend(store,input);break;
 case 'decide':return adapters.decide(store,input);
 case 'decide-batch':return adapters.decideBatch(store,input);
 case 'delegate':return delegate(store,input.id,input);
 case 'delegate-batch':return delegateBatch(store,input);
 case 'health':return processHealth(store);
 case 'host-decision':await adapters.hostDecision(store,input.id,input.choice,input.reason);break;
 case 'effort-configure':await effort.configureEffort(store,input);break;
 case 'effort-request':await effort.requestEffort(store,input);break;
 case 'effort-start':await effort.startedEffort(store,input);break;
 case 'effort-finish':await effort.finishedEffort(store,input);break;
 case 'effort-reconcile':await effort.reconcileEffort(store,input);break;
 case 'route':return selectModel(store,input.id,input.purpose??'worker',input.workspace,input.routing);
 case 'catalog':return adapters.catalog(store);
 case 'reconcile-execution':return core.reconcileExecution(store,input);
case 'host-exception':return core.hostException(store,input);
 case 'claim':await core.claim(store,input.id,{...input,pid:input.pid??Number(process.env.AMALE_HOST_PID??process.ppid)});break;
 case 'result':await core.result(store,input.id,input.output);break;
 case 'check':return core.check(store,input.id,input.checkId);
 case 'review-packet':return adapters.reviewPacket(store,input.id,input.lenses);
 case 'review-check':await core.addReviewCheck(store,input.id,input.check);break;
 case 'review':await core.review(store,input.id,input);break;
 case 'reviewer':return adapters.reviewer(store,input.id,input.model,input.lenses??['Spec','Standards','Correctness','Omissions'],input.routing);
 case 'worker':return adapters.worker(store,input.id,input);
 case 'repair':await core.repair(store,input.id);break;
 case 'accept':await core.accept(store,input.id);break;
 case 'integrated':await core.integrated(store,input.id,input.evidence);break;
 case 'finish':await finishGate(store,input);break;
 case 'fingerprint':return {fingerprint:await core.fingerprint(input.workspace??resolve(workspace))};
 case 'artifact':return {content:await store.readArtifact(input.id)};
 case 'save':return {artifact:await store.artifact(input)};
 case 'html':return statusHtml(store);
 case 'block':await store.transaction(s=>{core.invariant(input.reason,'Block reason required');if(input.id){const t=core.taskOf(s,input.id);core.invariant(t.status!=='running'&&!t.activity,'Reconcile live execution before blocking its task');t.status='blocked';t.blocked=input.reason;}else{s.status='blocked';s.blocked=input.reason;}core.event(s,'blocked',{id:input.id,reason:input.reason});});break;
 case 'record-decision':await store.transaction(s=>{core.invariant(input.id&&input.question&&input.answer&&input.reason&&['user','host'].includes(input.source),'ID, question, answer, source and evidence/reason required');core.invariant(!s.decisions.some(d=>d.id===input.id),'Decision ID exists');s.decisions.push({purpose:'requirement',id:input.id,question:input.question,criteria:{accepted:input.answer},choice:'accepted',source:input.source,reason:input.reason,state:{},revision:s.revision});core.event(s,'recorded-decision',{id:input.id,purpose:'requirement',source:input.source});});break;
 case 'requeue':await store.transaction(s=>{const t=core.taskOf(s,input.id);core.invariant(t.status==='blocked'&&input.evidence,'Blocked task and reconciliation evidence required');t.status='ready';t.blocked=undefined;core.event(s,'reconciled',{id:t.id,evidence:input.evidence});});break;
 case 'invalidate':await store.transaction(s=>{core.invalidateTree(s,input.id,input.reason);});break;
 case 'configure':await store.transaction(s=>{for(const key of ['maxWorkers','flashRepairCycles','deepRepairCycles'] as const)if(input[key]!==undefined){core.invariant(Number.isInteger(input[key])&&input[key]>0,`Invalid ${key}`);s.config[key]=input[key];}core.event(s,'configured',s.config);});break;
 case 'pools':await store.transaction(s=>{core.invariant(Array.isArray(input.pools),'pools array required');for(const pool of input.pools)core.invariant(typeof pool.role==='string'&&Array.isArray(pool.models)&&pool.models.length&&pool.models.every((m:unknown)=>typeof m==='string')&&Array.isArray(pool.requiredInputs)&&typeof pool.requiresTools==='boolean'&&typeof pool.notes==='string','Invalid model pool');s.modelPools=input.pools;core.event(s,'pools-configured',{roles:input.pools.map((p:core.ModelPool)=>p.role)});});break;
 default:throw new Error('Unknown operation: '+operation);
 }
 return core.next(store);
}
export async function main(args=process.argv.slice(2)){
 const [operation,workspace,runId]=args;
 if(!workspace||!runId||['status','next','diagnose','artifact','list','doctor','install','diagnostic-export'].includes(operation))return executeMain(args);
 const store=new core.Store(workspace,runId),operationTrace=await trace(store.root,'cli:'+operation,{runId});
 try{const value=await executeMain(args);await operationTrace.end('success');return value;}catch(error){await operationTrace.end('failed',{name:(error as Error).name,message:(error as Error).message});throw error;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().then(value=>console.log(JSON.stringify(value,null,2))).catch(e=>{console.error(JSON.stringify({error:e.message}));process.exitCode=1;});
