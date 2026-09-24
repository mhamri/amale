import { access } from 'node:fs/promises';
import { delimiter, join } from 'node:path';

const candidates=(name:string)=>process.platform==='win32'?[name+'.exe',name+'.cmd',name]:[name];

export async function onPath(name:string):Promise<string|undefined>{
 for(const root of (process.env.PATH??'').split(delimiter))if(root)for(const file of candidates(name)){
  const full=join(root,file);
  try{await access(full);return full;}catch{}
 }
 return undefined;
}

export async function jsRuntime():Promise<string>{
 return process.env.AMALEH_RUNTIME??process.env.AMALEH_NODE??await onPath('bun')??process.execPath;
}
