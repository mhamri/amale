import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
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
export async function diagnostics(root:string){
 let names:string[];try{names=await readdir(join(root,'diagnostics'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {operations:[],totals:{operations:0,unfinished:0,failures:0,reportedCost:0,estimatedCost:0,inputTokens:0,outputTokens:0},unreadable:[]};throw e;}
 const rows:any[]=[],unreadable:string[]=[];
 for(const name of names.filter(n=>/^[a-f0-9-]+-\d{6}\.json$/.test(n))){try{rows.push(JSON.parse(await readFile(join(root,'diagnostics',name),'utf8')));}catch{unreadable.push(name);}}
 const groups=new Map<string,any[]>();for(const row of rows){const items=groups.get(row.id)??[];items.push(row);groups.set(row.id,items);}
 const operations=[...groups.entries()].map(([id,items])=>{items.sort((a,b)=>a.sequence-b.sequence);const first=items[0],last=items.at(-1),completed=last.stage==='finished';return {id,operation:first.operation,started:first.at,elapsedMs:last.elapsedMs,outcome:completed?last.data.outcome:'unfinished (active or interrupted)',metadata:first.metadata,events:items.map(r=>({stage:r.stage,data:r.data,elapsedMs:r.elapsedMs}))};}).sort((a,b)=>a.started.localeCompare(b.started));
 const usage=rows.filter(r=>r.stage==='usage');
 return {operations,totals:{operations:operations.length,unfinished:operations.filter(o=>o.outcome.startsWith('unfinished')).length,failures:operations.filter(o=>o.outcome==='failed').length,reportedCost:usage.filter(r=>(r.data.costSource==='openrouter-response'||(!r.data.costSource&&r.operation==='openrouter'))).reduce((sum,r)=>sum+(Number(r.data.cost)||0),0),estimatedCost:usage.filter(r=>(r.data.costSource==='pi-estimate'||(!r.data.costSource&&r.operation==='pi'))).reduce((sum,r)=>sum+(Number(r.data.cost)||0),0),inputTokens:usage.reduce((sum,r)=>sum+(Number(r.data.inputTokens)||0),0),outputTokens:usage.reduce((sum,r)=>sum+(Number(r.data.outputTokens)||0),0)},unreadable};
}
