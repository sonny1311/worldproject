// WorldProject – Doppelklick-/Busy-Schutz für Betriebsaktionen.
const running=new Map();
export async function executeOperation(key,action,{requestId=`${key}-${Date.now()}`}={}){if(running.has(key))return{success:false,busy:true};running.set(key,true);try{const result=await action({requestId});return{success:true,result,requestId};}catch(error){return{success:false,error,requestId};}finally{running.delete(key);}}
export function operationBusy(key){return running.has(key);}
if(typeof window!=='undefined')window.worldOperationExecutor={execute:executeOperation,busy:operationBusy};
