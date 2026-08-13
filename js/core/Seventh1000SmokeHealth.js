// WorldProject – leichter Smokecheck für den siebten 1000er-Integrationsblock.
export function runSeventh1000SmokeHealth(company=window.worldPlayerCompany){
 const checks=[];const add=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});
 add('active-company',!!company);
 add('finite-money',!!company&&Number.isFinite(Number(company.money)));
 add('operations-sections',typeof window.worldOperationsSections?.all==='function');
 add('production-panel',typeof window.worldProductionPanel?.state==='function');
 add('inventory-panel',typeof window.worldInventoryPanel?.state==='function');
 add('workforce-panel',typeof window.worldWorkforcePanel?.state==='function');
 add('command-center',typeof window.worldBusinessCommandCenter==='function');
 add('contextual-actions',typeof window.worldContextualPlayerActions?.all==='function');
 add('persistence-health',typeof window.persistenceReloadHealth==='function');
 if(company){
  try{const p=window.worldProductionPanel?.state?.(company);add('production-state-readable',!!p&&Array.isArray(p.recipes),p?.blockedCount);}catch(e){add('production-state-readable',false,e.message);}
  try{const i=window.worldInventoryPanel?.state?.(company);add('inventory-state-readable',!!i&&Array.isArray(i.items),i?.source);}catch(e){add('inventory-state-readable',false,e.message);}
  try{const w=window.worldWorkforcePanel?.state?.(company);add('workforce-state-readable',!!w&&Array.isArray(w.employees),w?.missing);}catch(e){add('workforce-state-readable',false,e.message);}
 }
 const failed=checks.filter(x=>!x.success);return{success:failed.length===0,total:checks.length,passed:checks.length-failed.length,failed,checks,ranAt:Date.now()};
}
if(typeof window!=='undefined')window.runSeventh1000SmokeHealth=runSeventh1000SmokeHealth;
