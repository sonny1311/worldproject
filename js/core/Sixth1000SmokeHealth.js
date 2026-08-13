// WorldProject – leichter Abschluss-Smokecheck für den aktuellen 1000er.
export function runSixth1000SmokeHealth(company=window.worldPlayerCompany){
 const checks=[
  {name:'company',success:!!company},
  {name:'money-finite',success:!company||Number.isFinite(Number(company.money||0))},
  {name:'operations-sections',success:typeof window.worldOperationsSections?.all==='function'},
  {name:'context-actions',success:typeof window.worldContextualPlayerActions?.all==='function'},
  {name:'localization',success:typeof window.worldOperationsLocalization?.status==='function'},
  {name:'accessibility',success:typeof window.worldOperationsAccessibility?.audit==='function'},
  {name:'monitor',success:typeof window.worldSystemOperationsMonitor?.company==='function'},
  {name:'reload-health',success:typeof window.persistenceReloadHealth==='function'}
 ];
 const failed=checks.filter(x=>!x.success);
 return{success:failed.length===0,total:checks.length,passed:checks.length-failed.length,failed,checks,ranAt:Date.now()};
}
if(typeof window!=='undefined')window.runSixth1000SmokeHealth=runSixth1000SmokeHealth;
