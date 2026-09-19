import { readFile, mkdir, access } from 'node:fs/promises';
import { join, delimiter, dirname } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { invariant, execute, Store, event, claim, result, review, packet, fingerprint, taskOf, family, acquireActivity, releaseActivity, activitySpawned, reviewObligations } from './core.ts';
import type { Decision, Command } from './core.ts';
import { selectModel, consumeRoute } from './routing.ts';
import type { RoutingRequest } from './routing.ts';
import { trace, registerSecret, sanitize } from './telemetry.ts';

export async function piCommand():Promise<Command>{
 if(process.env.AMALE_PI_ENTRY)return {command:process.env.AMALE_NODE??'node',args:[process.env.AMALE_PI_ENTRY]};
 for(const root of (process.env.PATH??'').split(delimiter))for(const candidate of [join(root,'node_modules','@earendil-works','pi-coding-agent','dist','bundle','cli.js'),join(root,'..','lib','node_modules','@earendil-works','pi-coding-agent','dist','bundle','cli.js')]){try{await access(candidate);return {command:process.env.AMALE_NODE??'node',args:[candidate]};}catch{}}
 if(process.platform!=='win32')return {command:'pi',args:[]};
 throw new Error('Set AMALE_PI_ENTRY to the installed pi JavaScript entrypoint; no shell shim is executed.');
}
export async function credential():Promise<string>{
 if(process.env.OPENROUTER_API_KEY){registerSecret(process.env.OPENROUTER_API_KEY);return process.env.OPENROUTER_API_KEY;}
 const path=join(process.env.PI_CODING_AGENT_DIR??join(homedir(),'.pi','agent'),'auth.json');
 const auth=JSON.parse(await readFile(path,'utf8')).openrouter;
 // pi OpenRouter OAuth stores the gateway key in access. Do not copy it into run files or command arguments.
 const key=auth?.type==='api_key'?auth.key:auth?.type==='oauth'?auth.access:undefined;
 invariant(typeof key==='string'&&key.length>8,'OpenRouter credential unavailable; configure pi or OPENROUTER_API_KEY');
 if(auth.type==='oauth'&&auth.expires&&auth.expires<Date.now())throw new Error('pi OpenRouter credential expired; refresh it through pi auth before resuming');
 registerSecret(key);return key;
}
export async function requestJson(url:string,body?:unknown,fetcher:typeof fetch=fetch,diagnosticRoot?:string,options:{attempts?:number;timeoutMs?:number}={}){
 const attempts=options.attempts??3;invariant(Number.isInteger(attempts)&&attempts>=1&&attempts<=3,'Invalid request attempt count');
 const telemetry=await trace(diagnosticRoot,'openrouter',{endpoint:new URL(url).pathname,model:(body as any)?.model});
 try{const key=await credential();
 for(let attempt=0;attempt<attempts;attempt++){
  let response:Response;
  await telemetry.write('attempt',{attempt:attempt+1});
  try{response=await fetcher(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(options.timeoutMs??60000)});}catch(error){await telemetry.write('transport-error',{attempt:attempt+1,message:(error as Error).message});if(attempt===attempts-1)throw new Error('OpenRouter unreachable after bounded retries');await new Promise(r=>setTimeout(r,500*(attempt+1)));continue;}
  await telemetry.write('response',{status:response.status,requestId:response.headers.get('x-request-id')});
  if(response.ok){const value=await response.json();if(value.usage)await telemetry.write('usage',{inputTokens:value.usage.input_tokens,outputTokens:value.usage.output_tokens,cost:value.usage.cost,costSource:'openrouter-response'});await telemetry.end('success',{model:value.model,provider:value.provider,requestId:value.id});return value;}
  if((response.status===429||response.status>=500)&&attempt<attempts-1){const seconds=Number(response.headers.get('retry-after'));await new Promise(r=>setTimeout(r,Math.min(10000,Number.isFinite(seconds)&&seconds>0?seconds*1000:1000*(attempt+1))));continue;}
  throw new Error(`OpenRouter HTTP ${response.status}${response.status===402?': credits exhausted; top up and resume':''}`);
 }
 throw new Error('OpenRouter request failed');
 }catch(error){await telemetry.end('failed',{message:(error as Error).message});throw error;}
}
export function choiceAnswer(raw:any,criteria:Record<string,string>,threshold=.7){const a=raw?.answers?.selection;invariant(a?.type==='choice'&&typeof a.choice==='string'&&Object.hasOwn(criteria,a.choice),'Invalid Jev choice');invariant(Number.isFinite(a.confidence)&&a.confidence>=0&&a.confidence<=1,'Invalid Jev confidence');invariant(a.probabilities&&Object.keys(a.probabilities).length===Object.keys(criteria).length&&Object.keys(criteria).every(k=>Number.isFinite(a.probabilities[k])&&a.probabilities[k]>=0&&a.probabilities[k]<=1),'Invalid Jev probabilities');invariant(Math.abs(Object.values(a.probabilities as Record<string,number>).reduce((a,b)=>a+b,0)-1)<.02,'Invalid Jev probability sum');return {choice:a.confidence>=threshold?a.choice:undefined,confidence:a.confidence,source:String(raw.model??'OpenRouter Jev')};}
export async function decide(store:Store,input:Omit<Decision,'revision'>,fetcher?:typeof fetch){
 invariant(input.id&&input.question&&input.criteria&&Object.keys(input.criteria).length>=2,'Decision needs ID, question and at least two options');
 const before=await store.load();invariant(!before.decisions.some(d=>d.id===input.id),'Decision ID already exists');
 const raw=await requestJson('https://openrouter.ai/api/alpha/decisions',{model:process.env.AMALE_JEV_MODEL??'typesafe/jev-1.13',state:input.state,questions:{selection:{type:'choice',instructions:input.question,criteria:input.criteria}}},fetcher,store.root);
 const artifact=await store.artifact(raw);let answer:{choice?:string;confidence?:number;source:string;reason?:string};try{answer=choiceAnswer(raw,input.criteria);}catch(e){answer={source:'invalid-jev-response',reason:(e as Error).message};}
 await store.transaction(s=>{invariant(s.revision===before.revision,'State changed during decision; request a fresh decision');s.decisions.push({...input,revision:before.revision,...answer,artifact});event(s,'decision',{id:input.id,...answer,artifact});});return answer;
}
export async function hostDecision(store:Store,id:string,choice:string,reason:string){await store.transaction(s=>{const d=s.decisions.find(d=>d.id===id);invariant(d&&!d.choice&&Object.hasOwn(d.criteria,choice)&&reason,'Pending decision, eligible option and reason required');d.choice=choice;d.source='host:'+s.host.model;d.reason=reason;event(s,'host-decision',{id,choice,reason});});}
export async function catalog(store?:Store,fetcher:typeof fetch=fetch){const data=await requestJson('https://openrouter.ai/api/v1/models',undefined,fetcher,store?.root);invariant(Array.isArray(data.data),'Invalid OpenRouter catalog');const selected=data.data.filter((m:any)=>typeof m.id==='string').map((m:any)=>({id:m.id,created:m.created,context:m.context_length,modalities:m.architecture?.input_modalities,parameters:m.supported_parameters,pricing:m.pricing,description:m.description})).sort((a:any,b:any)=>b.created-a.created);const record={verifiedAt:new Date().toISOString(),source:'https://openrouter.ai/api/v1/models',models:selected};if(store)await store.artifact(record);return record;}

export async function piRun(input:{workspace:string;model:string;prompt:string;sessionDir:string;readOnly?:boolean;diagnosticRoot?:string;onSpawn?:(pid:number)=>Promise<void>}){
 const telemetry=await trace(input.diagnosticRoot,'pi',{model:input.model,workspace:input.workspace,readOnly:!!input.readOnly,sessionDir:input.sessionDir});
 try{
  const pi=await piCommand();await mkdir(input.sessionDir,{recursive:true});const key=await credential();
  const output=await new Promise<{events:any[];text:string;model:string;code:number}>((done,fail)=>{
   const args=[...pi.args,'--mode','json','--print','--provider','openrouter','--model',input.model,'--session-dir',input.sessionDir,'--no-extensions','--no-skills','--no-prompt-templates','--no-context-files','--offline','--tools',input.readOnly?'read,grep,find,ls':'read,grep,find,ls,edit,write,bash,powershell','--',input.prompt];
   // Synchronous spawn errors reject this ordinary Promise executor; no async-executor hang.
   const child=spawn(pi.command,args,{cwd:input.workspace,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:{...process.env,OPENROUTER_API_KEY:key,PI_TELEMETRY:'0'}});
   let buffer='',stderr='',events:any[]=[],text='',actual='',protocolError='',providerError='',ended=false;
   let spawnError:Error|undefined;
   let writes=Promise.resolve();const record=(stage:string,data:unknown)=>{writes=writes.then(()=>telemetry.write(stage,data));writes.catch(()=>child.kill());};
   const parse=(line:string)=>{
    if(!line.trim())return;
    let item:any;try{item=JSON.parse(line);}catch{protocolError='pi emitted malformed JSONL';record('protocol-error',{bytes:line.length});return;}
    if(!item||typeof item.type!=='string'){protocolError='pi event lacks a type';return;}
    if(!['message_update','tool_execution_update'].includes(item.type))events.push(item);
    if(item.type==='agent_end')ended=true;
    if(['agent_start','agent_end','tool_execution_start','tool_execution_end'].includes(item.type))record('progress',{type:item.type,tool:item.toolName,isError:item.isError});
    if(item.type==='message_end'&&item.message?.role==='assistant'){
     if(!Array.isArray(item.message.content)||item.message.content.some((c:any)=>!c||typeof c.type!=='string'||(c.type==='text'&&typeof c.text!=='string'))||typeof item.message.model!=='string'){protocolError='pi assistant event has invalid model/content shape';record('protocol-error',{reason:protocolError});return;}
     actual=item.message.model??actual;text=(item.message.content??[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('\n');
     if(['error','aborted','length'].includes(item.message.stopReason)||item.message.errorMessage)providerError=String(item.message.errorMessage??`Assistant stopped: ${item.message.stopReason}`);
     const usage=item.message.usage;if(usage)record('usage',{inputTokens:usage.input,outputTokens:usage.output,cacheRead:usage.cacheRead,cacheWrite:usage.cacheWrite,cost:usage.cost?.total,costSource:'pi-estimate',model:actual});
    }
   };
   child.stdout.on('data',data=>{buffer+=data;let newline;while((newline=buffer.indexOf('\n'))>=0){parse(buffer.slice(0,newline).replace(/\r$/,''));buffer=buffer.slice(newline+1);}});
   child.stderr.on('data',data=>{stderr=(stderr+data).slice(-4096);});
   const ownership=Promise.resolve().then(async()=>{if(child.pid){record('spawned',{pid:child.pid});await input.onSpawn?.(child.pid);}});
   ownership.catch(error=>{providerError='Ownership registration failed: '+(error as Error).message;child.kill();});
   child.on('error',error=>{spawnError=error;});
   child.on('close',(code,signal)=>{void (async()=>{
    if(buffer.trim())parse(buffer.replace(/\r$/,''));
    await ownership;await writes;
    await telemetry.write('process-exit',{code,signal,stderr,protocolError,providerError,ended,actualModel:actual});
    if(spawnError)throw spawnError;
    invariant(!protocolError,protocolError);
    invariant(!providerError,String(sanitize(providerError)));
    invariant(code===0&&ended&&text&&actual,`pi incomplete: exit ${code}, agent_end=${ended}; inspect diagnostic trace ${telemetry.id}`);
    invariant(actual===input.model,`pi resolved a different model (${actual}); update the task route explicitly`);
    done({events,text,model:actual,code:0});
   })().catch(fail);});
  });
  await telemetry.end('success',{model:output.model});return output;
 }catch(error){await telemetry.end('failed',{message:(error as Error).message});throw error;}
}
export async function worker(store:Store,id:string,input:{workspace:string;model?:string;brief:string;routing?:RoutingRequest}){
 const route=await selectModel(store,id,'worker',input.workspace,input.routing);if(route.action!=='launch')return route;
 invariant(!input.model||input.model===route.model,'Explicit model disagrees with recorded route; omit model for automatic selection');
 const model=route.model;
 const s=await store.load(),t=taskOf(s,id);const context=await packet(store,id);const prompt=`You are an Amale worker. Work only on this task within the supplied workspace. Do not invoke other skills or delegate. Follow constraints and acceptance criteria. Do not add hypothetical features. Return actual changed artifacts, checks and unresolved issues.\n${JSON.stringify(context)}\n${input.brief}`;
 await claim(store,id,{...input,model,pid:process.pid,beforeClaim:s=>consumeRoute(s,route)});try{const out=await piRun({...input,model,prompt,diagnosticRoot:store.root,sessionDir:join(store.root,'sessions',id),onSpawn:async pid=>{await store.transaction(s=>{taskOf(s,id).owner!.pid=pid;});}});await result(store,id,out);return {artifact:taskOf(await store.load(),id).output};}catch(e){await store.transaction(s=>{const t=taskOf(s,id);t.status='blocked';t.owner=undefined;t.blocked=(e as Error).message;event(s,'worker-blocked',{id,reason:t.blocked});});throw e;}
}
// Factual projection: never forward author output, verdicts or decision rationale.
export async function reviewPacket(store:Store,id:string,lenses:string[]=[]){
 const s=await store.load(),t=taskOf(s,id),context=await packet(store,id);
 return {intent:s.intent,constraints:s.constraints,goal:t.goal,criteria:t.criteria,outcomes:s.criteria,
  workspace:t.workspace,fingerprint:t.workspace?await fingerprint(t.workspace):undefined,lenses,
  obligations:reviewObligations(s,t),artifactDirectory:join(store.root,'artifacts'),
  checks:t.checks.map(command=>({command,receipt:t.receipts.find(r=>r.id===command.id)})),
  decisions:s.decisions.filter(d=>d.purpose==='requirement'&&d.choice&&context.decisions.some(ref=>ref.id===d.id)).map(d=>({id:d.id,question:d.question,choice:d.choice,answer:d.criteria[d.choice!]})),
  dependencies:s.tasks.filter(d=>('dependencies' in context && context.dependencies.some(ref=>ref.id===d.id))).map(d=>({id:d.id,goal:d.goal,criteria:d.criteria,workspace:d.workspace,integrated:d.integrated})),
  inspection:{standards:'Read applicable repository AGENTS.md and existing conventions. Context files are not automatically injected.',
   scope:'Trace changed behavior to its callers and consumers. A pinned Git baseline/diff is not supplied automatically; locate trustworthy scope evidence or mark the relevant boundary unreviewed.',
   probes:'Read registered command receipts via artifactDirectory. You cannot execute tests. Missing behavioral evidence must be unreviewed with an exact requested host probe, never a passing claim.'}};
}
export async function reviewer(store:Store,id:string,model:string|undefined,lenses:string[],routing?:RoutingRequest){const original=taskOf(await store.load(),id);invariant(original.workspace,'Task workspace missing');const route=await selectModel(store,id,'reviewer',original.workspace,routing);if(route.action!=='launch')return route;invariant(!model||model===route.model,'Explicit reviewer disagrees with recorded route; omit model for automatic selection');model=route.model;const s=await store.load(),t=taskOf(s,id);invariant(t.status==='review'&&t.workspace,'Task not awaiting review');invariant(family(model)!==t.family,'Reviewer must use a different model family');const fp=await fingerprint(t.workspace);invariant(fp===route.scope.content,'Review content changed after routing; route again');
 const clean=await reviewPacket(store,id,lenses);
 const prompt=`You are an independent read-only reviewer. Inspect actual files and affected consumers. Report only supported reachable defects, not hypothetical requirements. Keep Spec and Standards coverage distinct. Do not invoke other skills. Return ONLY JSON with report (nonempty string explaining coverage), coverage (array), and findings (array). For EVERY supplied obligation return exactly one coverage entry {id,status,evidence}. Status is covered, finding, unreviewed, or not-applicable. Evidence must name inspected files/consumers or executed receipt paths and observed results, or the exact missing host probe. Task criteria and outcomes cannot be not-applicable; explain preservation or contribution to global outcomes. Other nonapplicability needs a concrete reason. A finding entry remains unresolved until a corrected review. Enumerate reachable failure/recovery exits, protocol boundaries, shared ownership and affected consumers before judging these obligations. Never invent execution evidence or treat no findings as complete coverage. Each finding requires id,lens,location,scenario,evidence,consequence,blocking (boolean). Group multiple lenses describing the same root defect into one finding; keep each lens and its evidence in the report. An empty findings array is allowed only after inspection.\n${JSON.stringify(clean)}`;
 const operation=await acquireActivity(store,id,'review',undefined,async current=>{invariant(fp===await fingerprint(t.workspace!),'Review workspace changed during routing');consumeRoute(current,route);});
 try{
 const out=await piRun({workspace:t.workspace,model,prompt,diagnosticRoot:store.root,sessionDir:join(store.root,'sessions',id+'-review-'+Date.now()),readOnly:true,onSpawn:pid=>activitySpawned(store,id,operation,pid)});const raw=out.text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');let report;try{report=JSON.parse(raw);}catch{throw new Error('Reviewer did not return valid JSON; retain session and retry a targeted format correction');}await review(store,id,{model,findings:report.findings,coverage:report.coverage,report:report.report,fingerprint:fp});return {findings:report.findings,artifact:await store.artifact(out)};}finally{await releaseActivity(store,id,operation);}}
