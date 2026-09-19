import { realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Store, taskOf, invariant, hash, family, fingerprint, event, conflict, activeTasks } from './core.ts';
import type { Run } from './core.ts';
import { catalog, requestJson, choiceAnswer } from './adapters.ts';

export type RoutingRequest = { role?:string; requiredInputs?:string[]; contextTokens?:number; evidence?:string };
type Purpose = 'worker'|'reviewer';
type Scope = { taskId:string; purpose:Purpose; workspace:string; request:RoutingRequest; content?:string };
type Grant = { action:'launch'; model:string; decisionId:string; key:string; scope:Scope };
type Route = {action:'dispatch-blocked';reason:string;tasks:string[]} | Grant | {action:'host-decision';decisionId:string} | {action:'route-blocked';reason:string;decisionId?:string} | {action:'host-takeover';model:string};

function scopeKey(s:Run,scope:Scope){
 const t=taskOf(s,scope.taskId);
 return hash(JSON.stringify({scope,host:s.host,intent:s.intent,constraints:s.constraints,pools:s.modelPools,
  task:{id:t.id,goal:t.goal,criteria:t.criteria,checks:t.checks,kind:t.kind,deps:t.deps,resources:t.resources,status:t.status,cycles:t.cycles,depth:t.depth,author:t.author,output:t.output},
  dependencies:t.deps.map(id=>{const d=taskOf(s,id);return [id,d.status,d.integrated];})}));
}
const used=(s:Run,id:string)=>s.events.some(e=>e.type==='route-used'&&(e.detail as any).decisionId===id);

/** Consume with the task claim in the same transaction, before any process starts. */
export function consumeRoute(s:Run,route:Grant){
 const d=s.decisions.find(d=>d.id===route.decisionId),state=d?.state as any;
 invariant(s.status==='active'&&d?.choice&&state?.routing?.key===route.key,'Resolved routing decision required');
 invariant(state.routing.models[d.choice]===route.model,'Selected model differs from routing decision');
 invariant(scopeKey(s,route.scope)===route.key,'Task or routing requirements changed; route again');
 invariant(!used(s,d.id),'Routing decision already consumed');
 event(s,'route-used',{decisionId:d.id,taskId:route.scope.taskId,purpose:route.scope.purpose,model:route.model});
}

export async function selectModel(store:Store,id:string,purpose:Purpose,workspace:string,request:RoutingRequest={},fetcher:typeof fetch=fetch):Promise<Route>{
 invariant(['worker','reviewer'].includes(purpose),'Invalid routing purpose');
 invariant(!request.role||typeof request.role==='string','Invalid routing role');
 invariant(!request.requiredInputs||(Array.isArray(request.requiredInputs)&&request.requiredInputs.every(x=>typeof x==='string')),'Invalid required input modalities');
 invariant(request.contextTokens===undefined||(Number.isInteger(request.contextTokens)&&request.contextTokens>0),'Invalid context requirement');
 const s=await store.load(),t=taskOf(s,id);
 invariant(s.status==='active','Run is not active');
 invariant(purpose==='worker'?['ready','repair'].includes(t.status):t.status==='review','Task is not ready for requested route');
 const resolvedWorkspace=await realpath(workspace);
 if(t.activity)return {action:'dispatch-blocked',reason:'Task verification already active',tasks:[id]};
 {
  const unmet=t.deps.filter(id=>taskOf(s,id).status!=='accepted'||!taskOf(s,id).integrated);
  if(unmet.length)return {action:'dispatch-blocked',reason:'Unmet dependencies; integrate prerequisite tasks before routing',tasks:unmet};
  const live=activeTasks(s).filter(other=>other.id!==id);
  if(live.length>=s.config.maxWorkers)return {action:'dispatch-blocked',reason:'Worker capacity reached; wait for a running task',tasks:live.map(t=>t.id)};
  const conflicts=live.filter(other=>conflict({...t,workspace:resolvedWorkspace},other));
  if(conflicts.length)return {action:'dispatch-blocked',reason:'Conflicting live task; wait for resource or workspace ownership',tasks:conflicts.map(t=>t.id)};
 }
 if(purpose==='worker'&&t.depth==='host')return {action:'host-takeover',model:s.host.model};
 const scope:Scope={taskId:id,purpose,workspace:resolvedWorkspace,request,content:purpose==='reviewer'?await fingerprint(workspace):undefined};
 if(purpose==='reviewer')invariant(scope.workspace===t.workspace,'Reviewer must inspect the task workspace');
 const key=scopeKey(s,scope);
 const stale=s.decisions.filter(d=>{const r=(d.state as any)?.routing;return !d.choice&&r?.scope?.taskId===id&&r.scope.purpose===purpose&&r.key!==key;});
 if(stale.length)await store.transaction(current=>{
  invariant(scopeKey(current,scope)===key,'Task changed while invalidating its old route');
  for(const old of stale){const d=current.decisions.find(d=>d.id===old.id);if(d&&!d.choice){d.choice='reassess';d.source='runtime:route-invalidated';d.reason='Task, workspace content or routing requirements changed; old route cannot authorize launch';event(current,'route-invalidated',{decisionId:d.id,taskId:id,purpose});}}
 });
 const existing=s.decisions.find(d=>(d.state as any)?.routing?.key===key&&!used(s,d.id));
 const resolve=(d:Run['decisions'][number]):Route=>{
  if(!d.choice)return {action:'host-decision',decisionId:d.id};
  const model=(d.state as any).routing.models[d.choice];
  return model?{action:'launch',model,decisionId:d.id,key,scope}:{action:'route-blocked',reason:'Jev/host selected reassessment; update task requirements, pool or evidence before routing again',decisionId:d.id};
 };
 if(existing)return resolve(existing);
 const pool=request.role?s.modelPools?.find(p=>p.role===request.role):s.modelPools?.find(p=>p.role===purpose);
 invariant(!request.role||pool,`No configured model pool for role ${request.role}`);
 const inputs=[...new Set(['text',...(pool?.requiredInputs??[]),...(request.requiredInputs??[])])];
 const cards=await catalog(store,fetcher);
 let eligible=cards.models.filter((m:any)=>!/(^~|preview|experimental|:free|[/:_-]latest(?:$|[/:_-]))/i.test(m.id)&&m.parameters?.includes('tools')&&inputs.every(i=>m.modalities?.includes(i))&&(!request.contextTokens||m.context>=request.contextTokens));
 if(pool)eligible=eligible.filter((m:any)=>pool.models.includes(m.id));
 else {
  const candidates=eligible.filter((m:any)=>purpose==='worker'&&t.depth==='deep'?family(m.id)==='kimi':/flash/i.test(m.id)&&['deepseek','glm'].includes(family(m.id)));
  // Catalog is newest first. Keep one current eligible Flash per family, not one hardcoded author.
  const families=new Set<string>();eligible=candidates.filter((m:any)=>{const f=family(m.id);if(families.has(f))return false;families.add(f);return true;});
 }
 if(purpose==='worker'&&t.depth==='deep')eligible=eligible.filter((m:any)=>family(m.id)==='kimi');
 if(purpose==='reviewer')eligible=eligible.filter((m:any)=>family(m.id)!==t.family);
 if(!eligible.length)return {action:'route-blocked',reason:'No stable tool-capable model satisfies the pool, inputs, context, independence and escalation requirements'};
 const models:Record<string,string>={},criteria:Record<string,string>={};
 eligible.forEach((m:any,i:number)=>{const option=`model_${i}`;models[option]=m.id;criteria[option]=`Use ${m.id}: meets enforced requirements; compare its supplied capabilities, pricing and task evidence.`;});
 criteria.reassess='No offered model is sufficiently suitable: revise requirements/pool or use host diagnosis. Do not invent strengths or latency.';
 const decisionId=`route-${randomUUID()}`;
 const state={routing:{key,models,scope},task:{goal:t.goal,criteria:t.criteria,kind:t.kind,depth:t.depth},purpose,
  preferences:'Routine footwork should use the cheapest suitable fast Flash model. Specialized work may justify a configured specialist. Descriptions are vendor claims, not measured quality. No latency measurements are supplied.',
  poolNotes:pool?.notes,evidence:request.evidence,catalog:{verifiedAt:cards.verifiedAt,source:cards.source,models:eligible}};
 const question='Choose the best suitable model for this task and purpose, balancing correctness, cost and speed from the supplied evidence.';
 const raw=await requestJson('https://openrouter.ai/api/alpha/decisions',{model:process.env.AMALE_JEV_MODEL??'typesafe/jev-1.13',state,questions:{selection:{type:'choice',instructions:question,criteria}}},fetcher,store.root);
 const artifact=await store.artifact(raw);let answer:{choice?:string;source:string;confidence?:number;reason?:string};
 try{answer=choiceAnswer(raw,criteria);}catch(error){answer={source:'invalid-jev-response',reason:(error as Error).message};}
 const decision={id:decisionId,question,criteria,state,revision:s.revision,artifact,...answer};
 await store.transaction(current=>{
  invariant(scopeKey(current,scope)===key,'Task changed during routing; request a fresh route');
  invariant(!current.decisions.some(d=>(d.state as any)?.routing?.key===key&&!used(current,d.id)),'Another route already exists; reuse it');
  current.decisions.push(decision);event(current,'model-routed',{id:decisionId,taskId:id,purpose,eligible:eligible.map((m:any)=>m.id),...answer,artifact});
 });
 return resolve(decision);
}
