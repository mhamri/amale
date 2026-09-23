import { mkdir, writeFile, readdir, readFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

const secrets = new Set<string>();
export function registerSecret(value:string){if(value.length>7)secrets.add(value);}
export function sanitize(value:unknown):unknown {
 if(typeof value==='string'){
  let safe=value;for(const secret of secrets)safe=safe.split(secret).join('[REDACTED]');
  return safe.replace(/Bearer\s+\S+/gi,'Bearer [REDACTED]').replace(/\bsk-[A-Za-z0-9_-]{8,}/g,'[REDACTED]').slice(0,4096);
 }
 if(Array.isArray(value))return value.map(sanitize);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,/^(authorization|api[_-]?key|access|refresh|access_token|refresh_token|password|secret|credential|headers)$/i.test(key)?'[REDACTED]':sanitize(item)]));
 return value;
}
export type Trace={id:string;write:(stage:string,data?:unknown)=>Promise<void>;end:(outcome:string,data?:unknown)=>Promise<void>};
export async function trace(root:string|undefined,operation:string,metadata:unknown={}):Promise<Trace>{
 const id=randomUUID(),started=Date.now();let sequence=0;
 const write=async(stage:string,data:unknown={})=>{
  if(!root)return;
  const dir=join(root,'diagnostics');await mkdir(dir,{recursive:true});
  const row={schema:1,id,sequence:sequence++,operation,stage,at:new Date().toISOString(),elapsedMs:Date.now()-started,pid:process.pid,host:hostname(),metadata:sanitize(metadata),data:sanitize(data)};
  await writeFile(join(dir,`${id}-${String(row.sequence).padStart(6,'0')}.json`),JSON.stringify(row),{flag:'wx'});
 };
 await write('started');return {id,write,end:(outcome,data)=>write('finished',{outcome,...(data&&typeof data==='object'?data:{detail:data})})};
}
export type SpeedRole='worker'|'reviewer';
export type SpeedSample={at:string;model:string;role:SpeedRole;ms:number;outputTokens:number};
export type ModelSpeed={model:string;role:SpeedRole;calls:number;averageMinutes:number;longestMinutes:number;outputTokensPerCall:number;outputTokensPerSecond:number};
export type SlowModel=ModelSpeed&{medianMinutes:number;times:number};
const round1=(n:number)=>Math.round(n*10)/10;
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b),mid=sorted.length>>1;return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;};
type Operation={operation:string;outcome:string;started:string;elapsedMs:number;metadata:any;events:{stage:string;data:any}[]};
export function speedSamples(operations:Operation[]):SpeedSample[]{
 return operations.filter(o=>o.operation==='pi'&&o.outcome==='success'&&typeof o.metadata?.model==='string').map(o=>({at:o.started,model:o.metadata.model,role:o.metadata.readOnly?'reviewer':'worker',ms:o.elapsedMs,
  outputTokens:o.events.filter(e=>e.stage==='usage').reduce((sum,e)=>sum+(Number(e.data?.outputTokens)||0),0)}));
}
export function modelSpeed(samples:SpeedSample[]):ModelSpeed[]{
 const groups=new Map<string,{model:string;role:SpeedRole;ms:number[];tokens:number}>();
 for(const s of samples){const key=s.model+'|'+s.role,group=groups.get(key)??{model:s.model,role:s.role,ms:[],tokens:0};group.ms.push(s.ms);group.tokens+=s.outputTokens;groups.set(key,group);}
 return [...groups.values()].map(g=>{const total=g.ms.reduce((a,b)=>a+b,0);return {model:g.model,role:g.role,calls:g.ms.length,averageMinutes:round1(total/g.ms.length/60000),longestMinutes:round1(Math.max(...g.ms)/60000),outputTokensPerCall:Math.round(g.tokens/g.ms.length),outputTokensPerSecond:round1(g.tokens/Math.max(total/1000,1))};}).sort((a,b)=>a.role.localeCompare(b.role)||b.averageMinutes-a.averageMinutes);
}
// See references/runtime.md#diagnostic-traces
export const speedLedger=(amaleDir:string)=>join(amaleDir,'model-speed.jsonl');
const validSample=(s:any):s is SpeedSample=>s&&typeof s.at==='string'&&typeof s.model==='string'&&(s.role==='worker'||s.role==='reviewer')&&Number.isFinite(s.ms)&&Number.isFinite(s.outputTokens);
export async function recordSpeed(amaleDir:string,sample:SpeedSample){await readSpeedSamples(amaleDir);await appendFile(speedLedger(amaleDir),JSON.stringify(sample)+'\n');}
export async function readSpeedSamples(amaleDir:string):Promise<SpeedSample[]>{
 let text:string;
 try{text=await readFile(speedLedger(amaleDir),'utf8');}
 catch(e){
  if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;
  const seeded:SpeedSample[]=[];
  for(const run of await readdir(join(amaleDir,'runs')).catch(()=>[] as string[]))seeded.push(...speedSamples((await diagnostics(join(amaleDir,'runs',run))).operations));
  await mkdir(amaleDir,{recursive:true});
  await writeFile(speedLedger(amaleDir),seeded.map(s=>JSON.stringify(s)+'\n').join(''),{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  text=await readFile(speedLedger(amaleDir),'utf8');
 }
 return text.split('\n').flatMap(line=>{try{const s=JSON.parse(line);return validSample(s)?[s]:[];}catch{return [];}});
}
export async function recentSpeeds(amaleDir:string,windowMs:number,now=Date.now()){return modelSpeed((await readSpeedSamples(amaleDir)).filter(s=>now-Date.parse(s.at)<=windowMs));}
export function slowModels(speeds:ModelSpeed[],minimumCalls=3,factor=2):SlowModel[]{
 return (['worker','reviewer'] as const).flatMap(role=>{
  const measured=speeds.filter(s=>s.role===role&&s.calls>=minimumCalls);if(measured.length<3)return [];
  const typical=median(measured.map(s=>s.averageMinutes));
  return measured.filter(s=>s.averageMinutes>=factor*typical).map(s=>({...s,medianMinutes:round1(typical),times:round1(s.averageMinutes/typical)}));
 });
}
export async function diagnostics(root:string){
 let names:string[];try{names=await readdir(join(root,'diagnostics'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {operations:[],totals:{operations:0,unfinished:0,failures:0,reportedCost:0,estimatedCost:0,inputTokens:0,outputTokens:0},unreadable:[]};throw e;}
 const rows:any[]=[],unreadable:string[]=[];
 for(const name of names.filter(n=>/^[a-f0-9-]+-\d{6}\.json$/.test(n))){try{rows.push(JSON.parse(await readFile(join(root,'diagnostics',name),'utf8')));}catch{unreadable.push(name);}}
 const groups=new Map<string,any[]>();for(const row of rows){const items=groups.get(row.id)??[];items.push(row);groups.set(row.id,items);}
 const operations=[...groups.entries()].map(([id,items])=>{items.sort((a,b)=>a.sequence-b.sequence);const first=items[0],last=items.at(-1),completed=last.stage==='finished';return {id,operation:first.operation,started:first.at,elapsedMs:last.elapsedMs,outcome:completed?last.data.outcome:'unfinished (active or interrupted)',metadata:first.metadata,events:items.map(r=>({stage:r.stage,data:r.data,elapsedMs:r.elapsedMs}))};}).sort((a,b)=>a.started.localeCompare(b.started));
 const usage=rows.filter(r=>r.stage==='usage');
 return {operations,totals:{operations:operations.length,unfinished:operations.filter(o=>o.outcome.startsWith('unfinished')).length,failures:operations.filter(o=>o.outcome==='failed').length,reportedCost:usage.filter(r=>(r.data.costSource==='openrouter-response'||(!r.data.costSource&&r.operation==='openrouter'))).reduce((sum,r)=>sum+(Number(r.data.cost)||0),0),estimatedCost:usage.filter(r=>(r.data.costSource==='pi-estimate'||(!r.data.costSource&&r.operation==='pi'))).reduce((sum,r)=>sum+(Number(r.data.cost)||0),0),inputTokens:usage.reduce((sum,r)=>sum+(Number(r.data.inputTokens)||0),0),outputTokens:usage.reduce((sum,r)=>sum+(Number(r.data.outputTokens)||0),0)},unreadable};
}
