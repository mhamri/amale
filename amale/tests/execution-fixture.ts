// Synthetic durable routing evidence for offline lifecycle fixtures only.
import {randomUUID} from 'node:crypto';
import {realpath} from 'node:fs/promises';
import * as c from '../scripts/core.ts';
import {scopeKey} from '../scripts/routing.ts';
export async function fixtureClaim(store:c.Store,id:string,input:Parameters<typeof c.claim>[2]){
 const initial=await store.load(),t=c.taskOf(initial,id);
 if(t.depth==='host'&&input.model===initial.host.model){const grant=await c.hostException(store,{id,reason:'repair-escalation',evidence:'Synthetic exhausted-repair fixture'});return c.claim(store,id,{...input,hostAuthorization:grant.authorization});}
 const workspace=await realpath(input.workspace),decisionId='fixture-'+randomUUID();
 await store.transaction(s=>{const scope={taskId:id,purpose:'worker' as const,workspace,request:{}};s.decisions.push({id:decisionId,question:'Synthetic test-only worker selection',criteria:{selected:input.model},choice:'selected',source:'synthetic-fixture',revision:s.revision,state:{routing:{scope,key:scopeKey(s,scope),models:{selected:input.model}}}});});
 return c.claim(store,id,{...input,routeDecisionId:decisionId});
}
