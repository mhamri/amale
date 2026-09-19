import {mkdir,writeFile,readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Store,invariant} from './core.ts';
import {sanitize,diagnostics} from './telemetry.ts';

const kinds=['decision','worker','review','edit','check','integration','permission','other'] as const;
const phases=['planned','permission-granted','permission-denied','started','completed','failed','skipped'] as const;
type HostAction={actionId:string;sessionId:string;kind:typeof kinds[number];phase:typeof phases[number];summary:string;next?:string;taskId?:string};
export async function recordHostAction(store:Store,input:HostAction){
 invariant(input&&typeof input.actionId==='string'&&!!input.actionId.trim()&&typeof input.sessionId==='string'&&!!input.sessionId.trim(),'Action and session IDs required');
 invariant(kinds.includes(input.kind)&&phases.includes(input.phase)&&typeof input.summary==='string'&&!!input.summary.trim(),'Valid action kind, phase and summary required');
 for(const value of [input.next,input.taskId])invariant(value===undefined||typeof value==='string','Optional fields must be strings');
 const record={schema:1,id:randomUUID(),at:new Date().toISOString(),source:'host-reported',actionId:input.actionId,sessionId:input.sessionId,kind:input.kind,phase:input.phase,summary:input.summary,next:input.next,taskId:input.taskId};
 const directory=join(store.root,'host-actions');await mkdir(directory,{recursive:true});
 await writeFile(join(directory,record.id+'.json'),JSON.stringify(sanitize(record)),{flag:'wx'});
 return {id:record.id,source:record.source};
}
export async function hostActions(store:Store){
 const directory=join(store.root,'host-actions');let files:string[];
 try{files=await readdir(directory);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {records:[],unreadable:[]};throw error;}
 const records:any[]=[],unreadable:string[]=[];
 for(const file of files.filter(f=>/^[a-f0-9-]+\.json$/.test(f))){try{const row=JSON.parse(await readFile(join(directory,file),'utf8'));invariant(row?.schema===1&&typeof row.id==='string'&&typeof row.actionId==='string'&&typeof row.sessionId==='string'&&typeof row.at==='string'&&kinds.includes(row.kind)&&phases.includes(row.phase),'Invalid ledger record');records.push(row);}catch{unreadable.push(file);}}
 records.sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));return {records,unreadable};
}
// Shareable by explicit user choice: omit all free text, paths, models, raw
// identifiers, prompts, artifact bodies and original exception messages.
export async function exportDiagnostics(store:Store){
 const ledger=await hostActions(store),runtime=await diagnostics(store.root);
 const aliases=(prefix:string)=>{const map=new Map<string,string>();return (value:string)=>{if(!map.has(value))map.set(value,`${prefix}-${map.size+1}`);return map.get(value)!;};};
 const action=aliases('action'),session=aliases('session');
 const safeNumber=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:0;
 let state:Record<string,unknown>={available:false};
 try{const run=await store.load();state={available:true,revision:safeNumber(run.revision),status:['active','blocked','complete'].includes(run.status)?run.status:'unknown',tasks:run.tasks.map((t,i)=>({task:`task-${i+1}`,status:['ready','running','review','repair','accepted','blocked'].includes(t.status)?t.status:'unknown',cycles:safeNumber(t.cycles),hasReview:!!t.review,checks:t.receipts.length}))};}catch{}
 const bundle={schema:1,createdAt:new Date().toISOString(),redaction:'structural allowlist; free text and source identifiers omitted',limitations:['Host actions are attestations, not automatic hooks.','Absent events cannot establish that an action was skipped.','Same-timestamp observations have no guaranteed causal order.'],state,
  hostActions:ledger.records.map(r=>({action:action(r.actionId),session:session(r.sessionId),kind:r.kind,phase:r.phase})),unreadableHostRecords:ledger.unreadable.length,
  operations:runtime.operations.map((o,i)=>({operation:`operation-${i+1}`,outcome:o.outcome==='success'?'success':o.outcome==='failed'?'failed':'unfinished-or-other',elapsedMs:safeNumber(o.elapsedMs),stages:o.events.length})),unreadableRuntimeRecords:runtime.unreadable.length,
  totals:Object.fromEntries(Object.entries(runtime.totals).map(([k,v])=>[k,safeNumber(v)]))};
 const dir=join(store.root,'exports');await mkdir(dir,{recursive:true});const path=join(dir,randomUUID()+'.json');await writeFile(path,JSON.stringify(bundle,null,2),{flag:'wx'});return {path,bundle};
}
