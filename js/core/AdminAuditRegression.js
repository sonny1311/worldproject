// WorldProject – isolierter Regressionstest für die Audit-Analyse.
import { adminControlSystem } from './AdminControlSystem.js';
import { searchAdminAudit, adminAuditKpis, adminAuditAnomalies, exportAdminAudit } from './AdminAuditAnalytics.js';
export function runAdminAuditRegression(){
 const actor={id:'audit-test-admin',username:'AuditTest',role:'admin'},before=adminControlSystem.auditLog.length,checks=[],check=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});
 adminControlSystem.log(actor,'audit_regression_alpha',{marker:'needle-alpha'});
 adminControlSystem.log(actor,'audit_regression_beta',{marker:'needle-beta'});
 try{const all=searchAdminAudit(actor,{query:'needle-',limit:10});check('fulltext search',all.total>=2,all.total);const one=searchAdminAudit(actor,{action:'audit_regression_alpha',actorId:actor.id,limit:10});check('action and actor filter',one.total>=1,one.total);const k=adminAuditKpis(actor,{hours:1});check('kpis count',k.entries>=2,k.entries);check('kpis action list',k.actions.some(x=>x.key==='audit_regression_alpha'));const a=adminAuditAnomalies(actor,{hours:1,actionThreshold:9999,actorThreshold:9999});check('anomaly model',Array.isArray(a.alerts)&&a.kpis?.entries>=2);const ex=exportAdminAudit(actor,{query:'needle-',limit:10});check('export model',Array.isArray(ex.rows)&&ex.totalMatched>=2);}catch(error){check('audit analytics',false,error.message);}
 const added=adminControlSystem.auditLog.length-before;check('test audit entries',added===2,added);
 const failed=checks.filter(x=>!x.success);return{success:failed.length===0,total:checks.length,passed:checks.length-failed.length,failed,checks};
}
