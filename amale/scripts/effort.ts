import { Store, invariant, event } from './core.ts';

export type EffortMode = 'session' | 'same-model-pass';
export type EffortState = {
 model:string; base:string; current:string; levels:string[]; modes:EffortMode[]; evidence:string;
 request?:{decisionId:string;level:string;purpose:string;reason:string;status:'requested'|'running';execution?:string;mode?:EffortMode};
};

export async function configureEffort(store:Store,input:{base:string;current:string;levels:string[];modes:EffortMode[];evidence:string}){
 await store.transaction(s=>{
  invariant(!s.effort?.request,'Complete or reconcile the active effort pass first');
  invariant(Array.isArray(input.levels)&&input.levels.length>0&&input.levels.every(l=>typeof l==='string'&&l.length>0)&&new Set(input.levels).size===input.levels.length,'Supply verified ordered effort levels');
  invariant(input.levels.includes(input.base)&&input.levels.includes(input.current),'Base/current effort must be supported');
  invariant(Array.isArray(input.modes)&&input.modes.every(m=>['session','same-model-pass'].includes(m))&&input.evidence,'Supply verified host mechanisms and their evidence');
  s.effort={model:s.host.model,base:input.base,current:input.current,levels:input.levels,modes:input.modes,evidence:input.evidence};
  event(s,'effort-capabilities',s.effort);
 });
}

export async function requestEffort(store:Store,input:{decisionId:string;purpose:string;reason:string}){
 await store.transaction(s=>{
  const config=s.effort;invariant(config&&config.model===s.host.model,'Discover current host effort capabilities first');
  invariant(!config.request,'An effort pass is already pending');
  const d=s.decisions.find(d=>d.id===input.decisionId);
  invariant(d?.choice&&config.levels.includes(d.choice),'A resolved Jev decision or recorded host fallback must select a supported effort');
  invariant(d.state&&typeof d.state==='object'&&(d.state as any).hostModel===s.host.model&&(d.state as any).baseEffort===config.base,'Decision must reference this host model and baseline');
  invariant(input.purpose&&input.reason,'A bounded purpose and concrete escalation evidence are required');
  invariant(!s.events.some(e=>e.type==='effort-requested'&&(e.detail as any).decisionId===d.id),'Effort decision already consumed; reassess new evidence');
  if(d.choice===config.base){event(s,'effort-retained',{decisionId:d.id,level:d.choice,purpose:input.purpose});return;}
  invariant(config.levels.indexOf(d.choice)>config.levels.indexOf(config.base),'Escalation must increase effort, not change the model or lower baseline');
  config.request={decisionId:d.id,level:d.choice,purpose:input.purpose,reason:input.reason,status:'requested'};
  event(s,'effort-requested',{...config.request,model:config.model});
 });
}

export async function startedEffort(store:Store,input:{execution:string;model:string;level:string;mode:EffortMode;evidence:string}){
 await store.transaction(s=>{
  const config=s.effort,r=config?.request;invariant(config&&r?.status==='requested','No effort escalation awaiting execution');
  invariant(input.model===config.model&&input.model===s.host.model,'Effort escalation must retain the exact host model');
  invariant(input.level===r.level&&config.modes.includes(input.mode),'Requested effort/mechanism does not match verified capabilities');
  invariant(input.execution&&input.evidence,'Execution identity and actual launch/configuration evidence required');
  r.status='running';r.execution=input.execution;r.mode=input.mode;
  if(input.mode==='session')config.current=input.level;
  event(s,'effort-started',{...input,purpose:r.purpose});
 });
}

export async function finishedEffort(store:Store,input:{execution:string;artifact:string;restoredEffort:string;evidence:string}){
 await store.readArtifact(input.artifact);
 await store.transaction(s=>{
  const config=s.effort,r=config?.request;invariant(config&&r?.status==='running'&&r.execution===input.execution,'Execution identity does not match active effort pass');
  invariant(input.restoredEffort===config.base&&input.evidence,'Record result and actual return to baseline before continuing');
  config.current=config.base;event(s,'effort-finished',{...input,model:config.model,level:r.level,purpose:r.purpose,decisionId:r.decisionId});delete config.request;
 });
}

export async function reconcileEffort(store:Store,input:{outcome:'not-started'|'failed';execution?:string;restoredEffort:string;evidence:string}){
 await store.transaction(s=>{
  const config=s.effort,r=config?.request;invariant(config&&r,'No effort request to reconcile');
  invariant(input.evidence&&input.restoredEffort===config.base,'Actual failure/launch evidence and verified baseline are required');
  if(r.status==='requested')invariant(input.outcome==='not-started'&&!input.execution,'Unlaunched requests require a not-started receipt, not a fabricated execution');
  else invariant(input.outcome==='failed'&&input.execution===r.execution,'Confirm the exact failed execution has stopped before reconciliation');
  config.current=config.base;event(s,'effort-reconciled',{...input,request:r,model:config.model});delete config.request;
 });
}
