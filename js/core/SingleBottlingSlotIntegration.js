// ORVUNO – pro Betrieb darf immer nur ein Abfuellauftrag gleichzeitig aktiv/geplant sein.
// Verhindert das Ausnutzen vieler kleiner 50-l-Abfuellungen fuer kuenstlich schnellen Fortschritt.
import { ProductionPlanner } from './OperationalSupplyChainSystem.js';

const terminalStatuses=new Set(['finished','cancelled']);
const isBottlingRecipe=recipe=>recipe?.productionStage==='bottling';
const isActiveJob=job=>job&&!terminalStatuses.has(String(job.status||'').toLowerCase());

export function activeBottlingJobs(planner,ignoreId=null){
  return (planner?.queue||[]).filter(job=>
    isActiveJob(job)&&
    isBottlingRecipe(job.recipe)&&
    (ignoreId==null||String(job.id)!==String(ignoreId))
  );
}

export function bottlingSlotAvailable(planner,ignoreId=null){
  return activeBottlingJobs(planner,ignoreId).length===0;
}

function assertBottlingSlot(planner,recipe,ignoreId=null){
  if(!isBottlingRecipe(recipe))return;
  if(!bottlingSlotAvailable(planner,ignoreId)){
    throw new Error('Es kann immer nur eine Abfüllung gleichzeitig laufen oder eingeplant sein. Warte, bis die aktuelle Abfüllung abgeschlossen ist.');
  }
}

const proto=ProductionPlanner.prototype;
if(!proto.__worldSingleBottlingSlotIntegrated){
  proto.__worldSingleBottlingSlotIntegrated=true;

  const originalQueueForVolume=proto.queueForVolume;
  proto.queueForVolume=function(recipe,targetLiters,now=Date.now()){
    assertBottlingSlot(this,recipe);
    return originalQueueForVolume.call(this,recipe,targetLiters,now);
  };

  const originalQueueForOutput=proto.queueForOutput;
  proto.queueForOutput=function(recipe,targetOutput,now=Date.now()){
    assertBottlingSlot(this,recipe);
    return originalQueueForOutput.call(this,recipe,targetOutput,now);
  };

  const originalStart=proto.start;
  proto.start=function(recipe,batches=1,now=Date.now()){
    assertBottlingSlot(this,recipe);
    return originalStart.call(this,recipe,batches,now);
  };

  const originalStartQueued=proto.startQueued;
  proto.startQueued=function(id,now=Date.now()){
    const job=(this.queue||[]).find(entry=>String(entry?.id)===String(id));
    if(job&&isBottlingRecipe(job.recipe)&&!bottlingSlotAvailable(this,job.id))return false;
    return originalStartQueued.call(this,id,now);
  };

  const originalResume=proto.resume;
  proto.resume=function(id,now=Date.now()){
    const job=(this.queue||[]).find(entry=>String(entry?.id)===String(id));
    if(job&&isBottlingRecipe(job.recipe)&&!bottlingSlotAvailable(this,job.id))return false;
    return originalResume.call(this,id,now);
  };
}

if(typeof window!=='undefined'){
  window.worldSingleBottlingSlot={activeBottlingJobs,bottlingSlotAvailable};
}
