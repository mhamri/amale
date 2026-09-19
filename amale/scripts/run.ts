// Portable bootstrap: Bun first, modern Node fallback. No shell interpolation.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const entry=fileURLToPath(new URL('./cli.ts',import.meta.url));
function run(command:string,args:string[],fallback:boolean){const child=spawn(command,args,{stdio:'inherit',shell:false,windowsHide:true,env:{...process.env,AMALE_HOST_PID:process.env.AMALE_HOST_PID??String(process.ppid)}});child.on('error',(e:NodeJS.ErrnoException)=>{if(e.code==='ENOENT'&&fallback)run(process.execPath,[entry,...process.argv.slice(2)],false);else{console.error(e.message);process.exitCode=1;}});child.on('exit',(code,signal)=>{if(signal)process.exitCode=1;else if(code!==null)process.exitCode=code;});}
run('bun',[entry,...process.argv.slice(2)],true);
