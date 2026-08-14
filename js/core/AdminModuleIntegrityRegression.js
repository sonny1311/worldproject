// WorldProject – prüft kritische Adminmodule auf vorhandene Exporte und konsistente Grundkonfiguration.
import { adminControlSystem, AdminSections, AdminRoles } from './AdminControlSystem.js';
import { adminSystemHealth } from './AdminSystemHealth.js';
import { currencyAdminSnapshot, adminSetExchangeRate } from './AdminCurrencySystem.js';
import { setSupplierActive } from './AdminSupplierControl.js';
import { setNpcActive } from './AdminNpcControl.js';
import { supportSlaSnapshot } from './AdminSupportSlaSystem.js';
import { setProductActive, grantAward } from './AdminProductAwardControl.js';
import { adminAuditKpis, searchAdminAudit } from './AdminAuditAnalytics.js';
import { requestRelease, approveRelease } from './AdminReleaseControl.js';
import { adminWorldOverview } from './AdminDashboardData.js';
export function runAdminModuleIntegrityRegression(){const checks=[],check=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});try{const functions={adminSystemHealth,currencyAdminSnapshot,adminSetExchangeRate,setSupplierActive,setNpcActive,supportSlaSnapshot,setProductActive,grantAward,adminAuditKpis,searchAdminAudit,requestRelease,approveRelease,adminWorldOverview};for(const[name,fn]of Object.entries(functions))check(`export ${name}`,typeof fn==='function');check('admin sections unique',new Set(Object.values(AdminSections)).size===Object.values(AdminSections).length);check('owner wildcard',AdminRoles.owner?.includes('*'));check('admin world permission',adminControlSystem.can({id:'a',role:'admin'},'world.write'));check('admin supplier permission',adminControlSystem.can({id:'a',role:'admin'},'suppliers.write'));check('admin npc permission',adminControlSystem.can({id:'a',role:'admin'},'npc.write'));check('admin awards permission',adminControlSystem.can({id:'a',role:'admin'},'awards.write'));check('support cannot economy',!adminControlSystem.can({id:'s',role:'support'},'economy.write'));check('economy cannot moderation',!adminControlSystem.can({id:'e',role:'economy'},'moderation.write'));}catch(error){check('module integrity exception',false,error.message);}const failed=checks.filter(x=>!x.success),result={success:!failed.length,total:checks.length,passed:checks.length-failed.length,failed,checks};if(typeof console!=='undefined')console[result.success?'log':'error'](`WORLDPROJECT ADMIN MODULE INTEGRITY ${result.passed}/${result.total}`,result);return result;}
if(typeof window!=='undefined')window.runAdminModuleIntegrityRegression=runAdminModuleIntegrityRegression;
