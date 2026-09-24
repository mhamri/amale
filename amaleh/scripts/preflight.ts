import { Store, invariant } from './core.ts';
import { credential, requestJson, choiceAnswer } from './adapters.ts';
import { sanitize } from './telemetry.ts';
import { jevModel } from './config.ts';

export type PreflightInput = { network:'restricted'|'allowed'|'unknown'; channel:string };
// The host supplies its effective permission context. A child process cannot
// grant itself permissions or infer a sandbox denial from a connection error.
export async function preflight(store:Store,input:PreflightInput,fetcher:typeof fetch=fetch){
 invariant(['restricted','allowed','unknown'].includes(input.network)&&typeof input.channel==='string'&&!!input.channel.trim(),'Preflight needs host network status and execution channel');
 const started=Date.now();
 const base={checkedAt:new Date().toISOString(),channel:input.channel,network:input.network,permissionSource:'host-declared',synthetic:true,projectExportAuthorized:false};
 let outcome:{action:string;ready:boolean;model?:string;confidence?:number;reason?:string;status?:number;answer?:unknown};
 if(input.network==='restricted'){
  outcome={action:'network-permission-needed',ready:false,reason:'Host reports restricted networking. Obtain supported host permission, then rerun in that execution channel. No request was sent.'};
 }else{
  let stage='credentials';
  try{
   await credential();stage='request';
   const criteria={a:'Option A has number 1',b:'Option B has number 9'};
   const raw=await requestJson('https://openrouter.ai/api/alpha/decisions',{
    model:await jevModel(),state:{synthetic:true,options:{a:1,b:9}},
    questions:{selection:{type:'choice',instructions:'Which option has the smaller stated number?',criteria}},
   },fetcher,store.root,{attempts:1,timeoutMs:10000});
   stage='response';const answer=choiceAnswer(raw,criteria);
   outcome=answer.choice==='a'?{action:'ready',ready:true,model:answer.source,confidence:answer.confidence}:{action:'jev-verification-needed',ready:false,reason:'Synthetic response did not confidently select the expected option',answer};
  }catch(error){
   const message=String(sanitize((error as Error).message));
   const status=Number(message.match(/OpenRouter HTTP (\d+)/)?.[1])||undefined;
   const action=stage==='credentials'?'credentials-needed':status===401?'credentials-needed':status===402?'credits-needed':status===403?'provider-access-denied':status?'provider-unavailable':stage==='response'?'jev-protocol-error':/unreachable/.test(message)?'network-unreachable':'jev-protocol-error';
   outcome={action,ready:false,status,reason:message};
  }
 }
 const result={...base,...outcome,elapsedMs:Date.now()-started};
 return {...result,artifact:await store.artifact(result)};
}
