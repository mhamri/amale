// Autonomous chunk execution: the coordinator delegates a whole task once, and
// this loop runs worker -> checks -> independent review -> repair internally
// until the task is accepted or a genuine escalation boundary is reached.
// Workers consult Jev directly through scripts/jev.ts; the loop itself only
// spends one bounded Jev call per repair cycle for course correction.
import { hostname } from 'node:os';
import { Store, taskOf, invariant, check, repair, accept, fingerprint, event, reviewCoverageDebt, openDelegations, next, requireShaped } from './core.ts';
import { worker, reviewer, requestJson, choiceAnswer, transientProvider } from './adapters.ts';
import type { RoutingRequest } from './routing.ts';
import { jevModel, loadModelConfig } from './config.ts';

export type DelegateDeps = { runWorker:typeof worker; runReviewer:typeof reviewer; runCheck:typeof check; fetcher?:typeof fetch };
export type DelegateOutcome = { task:string; trail:Trail; outcome:string; [key:string]:unknown };
const real:DelegateDeps = { runWorker:worker, runReviewer:reviewer, runCheck:check };
type Trail = { stage:string; detail:unknown }[];
const routePending = (r:unknown) => r && typeof r==='object' && 'action' in r && (r as any).action!=='launch' ? r as {action:string} : undefined;

async function repairStrategy(store:Store,id:string,findings:unknown[],failing:string[],fetcher?:typeof fetch){
 try{
  const criteria={
   targeted:'Apply the smallest correct fixes that resolve each listed defect',
   rethink:'The current approach is likely wrong; reconsider the design before editing further',
   simplify:'The implementation is too complex; reduce to the minimal contract-satisfying change'};
  const raw=await requestJson('https://openrouter.ai/api/alpha/decisions',{model:await jevModel(),state:{task:id,findings,failingChecks:failing},questions:{selection:{type:'choice',instructions:'Which repair course is most likely to resolve these verification failures without adding scope?',criteria}}},fetcher,store.root);
  const answer=choiceAnswer(raw,criteria);
  if(answer.choice)return {choice:answer.choice,confidence:answer.confidence,meaning:criteria[answer.choice as keyof typeof criteria]};
 }catch{}
 return undefined;
}

const repairBrief=(findings:unknown[],failing:string[],guidance?:{confidence?:number;meaning:string})=>
 `Repair this task: verification failed. ${guidance?`Course guidance (Jev, confidence ${guidance.confidence}): ${guidance.meaning}`:'Apply the smallest correct fixes.'}\nBlocking review findings: ${JSON.stringify(findings)}\nFailing checks: ${JSON.stringify(failing)}\nResolve every listed defect, keep the task contract and scope, and do not run checks yourself; verification follows automatically. Consult the Jev helper for uncertain choices as instructed.`;

// A check that writes into the workspace invalidates its own receipt and every
// earlier one, and acceptance compares receipts against the current tree. Re-run
// until every receipt matches the tree the checks leave behind.
export const checkSettlePasses=3;
// A provider outage is not a defect in the task, so it must not consume a repair
// cycle: restore the status the task held and route again, which now skips the
// model recorded unavailable.
async function failover<T>(store:Store,id:string,stage:'worker'|'reviewer',trail:Trail,attempt:(n:number)=>Promise<T>):Promise<T>{
 const budget=(await loadModelConfig()).providerFailovers;
 for(let n=1;;n++){
  const before=taskOf(await store.load(),id).status;
  try{return await attempt(n);}
  catch(error){
   const reason=(error as Error).message;
   if(n>=budget||!transientProvider(reason))throw error;
   await store.transaction(s=>{const t=taskOf(s,id);t.status=before;t.blocked=undefined;t.owner=undefined;t.activity=undefined;event(s,'provider-failover',{id,stage,attempt:n,reason});});
   trail.push({stage:'provider-failover',detail:{stage,attempt:n,reason}});
  }
 }
}
export async function delegate(store:Store,id:string,input:{workspace?:string;brief?:string;routing?:RoutingRequest;lenses?:string[];skills?:string[];references?:string[]}={},deps:Partial<DelegateDeps>={}):Promise<DelegateOutcome>{
 const d:DelegateDeps={...real,...deps};
 const trail:Trail=[];
 await store.transaction(s=>{requireShaped(s,'delegate');const t=taskOf(s,id);invariant(['ready','repair'].includes(t.status),'Task is not delegable; reconcile or requeue it first');invariant(t.workspace||input.workspace,'Task workspace required');event(s,'delegate-started',{id,pid:process.pid,host:hostname()});});
 const finish=async(outcome:Record<string,unknown>):Promise<DelegateOutcome>=>{await store.transaction(s=>event(s,'delegate-finished',{id,outcome:outcome.outcome})).catch(()=>{});return {task:id,trail,outcome:String(outcome.outcome),...outcome};};
 try{
  let out=await failover(store,id,'worker',trail,async()=>d.runWorker(store,id,{workspace:input.workspace??taskOf(await store.load(),id).workspace!,brief:input.brief,routing:input.routing,skills:input.skills,references:input.references}));
  let pending=routePending(out);if(pending)return finish({outcome:'route-pending',route:pending});
  trail.push({stage:'worker',detail:out});
  for(;;){
   let s=await store.load(),t=taskOf(s,id);
   let mutating:string[]=[],settled=false;
   for(let pass=1;pass<=checkSettlePasses&&!settled;pass++){
    s=await store.load();t=taskOf(s,id);
    const fp=await fingerprint(t.workspace!);
    mutating=[];
    for(const c of t.checks){
     const r=t.receipts.find(r=>r.id===c.id);
     if(!r||r.fingerprint!==fp){const receipt=await d.runCheck(store,id,c.id);trail.push({stage:'check',detail:{check:c.id,code:receipt.code,pass}});if(receipt.changed)mutating.push(c.id);}
    }
    s=await store.load();t=taskOf(s,id);
    const current=await fingerprint(t.workspace!);
    settled=t.checks.every(c=>t.receipts.some(r=>r.id===c.id&&r.fingerprint===current));
   }
   if(!settled)return finish({outcome:'escalated',stage:'unstable-checks',mutating,
    reason:`Checks never settled: ${mutating.length?mutating.join(', ')+' rewrite the workspace every run, so no receipt can match the tree acceptance compares against':'the workspace keeps changing between check runs'}. Register a check that leaves the tree unchanged, or exclude its generated output from the task workspace.`});
   s=await store.load();t=taskOf(s,id);
   const failing=t.receipts.filter(r=>r.code!==0).map(r=>r.id);
   let blocking:unknown[]=[];
   if(!failing.length){
    const lenses=input.lenses??['Spec','Standards','Correctness','Omissions'];
    const obtainReview=async(excludeFamilies:string[]=[])=>{
     const routing=excludeFamilies.length?{...input.routing,excludeFamilies:[...(input.routing?.excludeFamilies??[]),...excludeFamilies]}:input.routing;
     const rev=await failover(store,id,'reviewer',trail,async()=>d.runReviewer(store,id,undefined,lenses,routing));
     const pending=routePending(rev);
     if(pending)return pending;
     trail.push({stage:'review',detail:{findings:(rev as {findings?:unknown[]}).findings?.length??0}});
     return undefined;
    };
    const first=await obtainReview();if(first)return finish({outcome:'route-pending',route:first});
    s=await store.load();t=taskOf(s,id);
    blocking=t.review?.findings.filter(f=>f.blocking&&f.disposition==='open')??[];
    let debt=reviewCoverageDebt(s,t);
    if(!blocking.length&&debt.length){
     const firstFamily=t.review?.family;
     const retry=await obtainReview(firstFamily?[firstFamily]:[]);
     if(retry)return finish({outcome:'route-pending',route:retry});
     s=await store.load();t=taskOf(s,id);
     blocking=t.review?.findings.filter(f=>f.blocking&&f.disposition==='open')??[];
     debt=reviewCoverageDebt(s,t);
    }
    if(!blocking.length&&!debt.length){await accept(store,id);return finish({outcome:'accepted',cycles:t.cycles,author:t.author,reviewFamily:t.review?.family,fingerprint:t.fingerprint});}
    if(!blocking.length)return finish({outcome:'escalated',stage:'review-evidence',reason:'Reviewer left obligations unreviewed; supply the requested host evidence or a corrected independent review',obligations:debt});
   }
   s=await store.load();t=taskOf(s,id);
   if(t.cycles>=s.config.flashRepairCycles+s.config.deepRepairCycles){
    await repair(store,id);
    return finish({outcome:'escalated',stage:'repair-exhausted',depth:'host',reason:'Persistent repair allowance exhausted; host-depth diagnosis required',findings:blocking,failingChecks:failing});
   }
   const guidance=await repairStrategy(store,id,blocking,failing,d.fetcher);
   if(guidance)trail.push({stage:'jev-strategy',detail:guidance});
   await repair(store,id);
   out=await failover(store,id,'worker',trail,async()=>d.runWorker(store,id,{workspace:t.workspace!,brief:repairBrief(blocking,failing,guidance),skills:input.skills,references:input.references}));
   pending=routePending(out);
   if(pending)return (pending as any).action==='host-takeover'?finish({outcome:'escalated',stage:'host-takeover',model:(pending as any).model}):finish({outcome:'route-pending',route:pending});
   trail.push({stage:'repair-worker',detail:{cycle:taskOf(await store.load(),id).cycles}});
  }
 }catch(error){
  return finish({outcome:'failed',reason:(error as Error).message});
 }
}

export type BatchOutcome = DelegateOutcome|{task:string;outcome:'failed';reason:string};
export type BatchInput={ids:string[];workspace?:string;briefs?:Record<string,string>;lenses?:string[];skills?:string[];references?:string[]};
export function validateBatch(input:BatchInput){
 const ids=input.ids;
 invariant(Array.isArray(ids)&&ids.length>0&&ids.every(id=>typeof id==='string'&&!!id.trim()),'delegate-batch needs an ids array of one or more task id strings; received '+JSON.stringify(input.ids));
 const repeated=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
 invariant(!repeated.length,'delegate-batch received duplicate task ids ('+repeated.join(', ')+'); delegate each task exactly once per batch');
 invariant(input.briefs===undefined||input.briefs!==null&&typeof input.briefs==='object'&&!Array.isArray(input.briefs)&&Object.values(input.briefs).every(b=>typeof b==='string'&&!!b.trim()),'delegate-batch briefs must map task ids to non-empty brief strings');
 const strays=Object.keys(input.briefs??{}).filter(id=>!ids.includes(id));
 invariant(!strays.length,`delegate-batch has briefs for ${strays.join(', ')}, which ${strays.length===1?'is':'are'} not in ids`);
}
export async function delegateBatch(store:Store,input:BatchInput,deps:Partial<DelegateDeps>={}){
 validateBatch(input);
 const ids=input.ids;
 const s=await store.load();
 const shared=new Map<string,string[]>();
 for(const id of ids){const workspace=input.workspace??taskOf(s,id).workspace;invariant(workspace,`Task ${id} has no workspace; prepare an isolated checkout per task before delegating a batch`);shared.set(workspace,[...shared.get(workspace)??[],id]);}
 const collided=[...shared.entries()].filter(([,members])=>members.length>1);
 invariant(!collided.length,collided.map(([workspace,members])=>`${members.join(' and ')} share workspace ${workspace}`).join('; ')+'. Batched tasks run concurrently and a shared workspace serializes them into conflicts; give each task its own checkout, and omit the batch workspace so each task uses its own.');
 const concurrency=Math.max(1,s.config.maxWorkers);
 const outcomes=new Array<BatchOutcome>(ids.length);
 let cursor=0;
 const refused=async(id:string,reason:string)=>{await store.transaction(s=>event(s,'delegate-finished',{id,outcome:'failed',reason})).catch(()=>{});return {task:id,outcome:'failed' as const,reason};};
 const pump=async()=>{for(let index=cursor++;index<ids.length;index=cursor++){const id=ids[index];try{outcomes[index]=await delegate(store,id,{workspace:input.workspace,brief:input.briefs?.[id],lenses:input.lenses,skills:input.skills,references:input.references},deps);}catch(error){outcomes[index]=await refused(id,(error as Error).message);}}};
 await Promise.all(Array.from({length:Math.min(concurrency,ids.length)},pump));
 return {delegated:ids.length,concurrency,outcomes};
}

export const waitLimitMs=540000;
export async function waitForDelegations(store:Store,input:{after?:number;timeoutMs?:number}={},pollMs=2000){
 const timeoutMs=input.timeoutMs??100000;
 invariant(Number.isInteger(timeoutMs)&&timeoutMs>=0&&timeoutMs<=waitLimitMs,`wait timeoutMs must be a whole number of milliseconds from 0 to ${waitLimitMs}`);
 invariant(input.after===undefined||Number.isInteger(input.after)&&input.after>=0,'wait after must be the cursor an earlier wait or delegate-batch returned');
 const deadline=Date.now()+timeoutMs;let after=input.after;
 for(;;){
  const s=await store.load();after??=s.events.length;
  const finished=s.events.slice(after).filter(e=>e.type==='delegate-finished').map(e=>{const d=e.detail as {id:string;outcome:string;reason?:string};return {id:d.id,outcome:d.outcome,reason:d.reason,at:e.at};});
  const open=openDelegations(s),live=open.filter(d=>d.alive).map(d=>d.id),interrupted=open.filter(d=>!d.alive).map(d=>d.id);
  if(finished.length||interrupted.length||!live.length||Date.now()>=deadline)
   return {outcome:finished.length?'finished':interrupted.length?'interrupted':live.length?'still-running':'idle',cursor:s.events.length,finished,live,interrupted,next:await next(store)};
  await new Promise(r=>setTimeout(r,Math.min(pollMs,Math.max(0,deadline-Date.now()))));
 }
}
