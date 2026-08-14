// WorldProject – separater Admin-Einstieg.
// NICHT aus js/bootstrap.js importieren. Der normale Spielerclient lädt diesen Code nicht.
import { adminControlSystem } from "./core/AdminControlSystem.js";
import { createAdminFrontend } from "./core/AdminFrontendModel.js";
import { AdminWorkspaceController } from "./core/AdminWorkspaceController.js";
import { mountAdminConsole } from "./core/AdminConsoleUI.js";
import { runAdminRegressionTest } from "./core/AdminRegressionTest.js";
import { runAdminAuditRegression } from "./core/AdminAuditRegression.js";
import { runAdminRoleRegression } from "./core/AdminRoleRegression.js";
import { runCurrencyLocalizationRegression } from "./core/CurrencyLocalizationRegression.js";
import { runAdminOperationsExpansionRegression } from "./core/AdminOperationsExpansionRegression.js";
import { runAdminSupplierNpcRegression } from "./core/AdminSupplierNpcRegression.js";
import { runAdminSupportSlaRegression } from "./core/AdminSupportSlaRegression.js";
import { runAdminProductAwardRegression } from "./core/AdminProductAwardRegression.js";
import { runAdminSystemHealthRegression } from "./core/AdminSystemHealthRegression.js";
import { runAdminModuleIntegrityRegression } from "./core/AdminModuleIntegrityRegression.js";
import "./core/AdminConsoleSectionViews.js";
import "./core/AdminConsoleActionViews.js";
import "./core/AdminAuditAnalytics.js";
import "./core/AdminAuditConsoleView.js";
import "./core/AdminPersistentAuditView.js";
import "./core/AdminRoleManagementView.js";
import "./core/AdminCurrencySystem.js";
import "./core/AdminCurrencyConsoleView.js";
import "./core/AdminSupplierAwardConsoleViews.js";
import "./core/AdminSupplierControl.js";
import "./core/AdminNpcControl.js";
import "./core/AdminSupplierNpcActionViews.js";
import "./core/AdminSupportSlaSystem.js";
import "./core/AdminSupportSlaConsoleView.js";
import "./core/AdminProductAwardControl.js";
import "./core/AdminProductAwardActionViews.js";
import "./core/AdminSystemHealth.js";
import "./core/AdminSystemHealthConsoleView.js";
import "./core/AdminDashboardData.js";
import "./core/ModerationCaseSystem.js";
import "./core/LiveOpsSystem.js";
import "./core/AdminBalancingSystem.js";
import "./core/AdminEntityActions.js";
import "./core/SupportCaseSystem.js";
import "./core/AdminWorldControl.js";
import "./core/AdminSecurityIntegration.js";
import "./core/AdminReleaseControl.js";
import "./core/AllianceSystem.js";
import "./core/AllianceAdvancedSystem.js";
import "./core/AllianceLaunchGuard.js";

function blank(){return{success:false,passed:0,total:0,failed:[{error:"nicht ausgeführt"}]};}
function runAdminStartupRegressions(){
  const auditCheckpoint=adminControlSystem.auditLog.length;
  let regression=blank(),auditRegression=blank(),roleRegression=blank(),currencyRegression=blank(),operationsExpansionRegression=blank(),supplierNpcRegression=blank(),supportSlaRegression=blank(),productAwardRegression=blank(),systemHealthRegression=blank(),moduleIntegrityRegression=blank();
  try{
    regression=runAdminRegressionTest();
    auditRegression=runAdminAuditRegression();
    roleRegression=runAdminRoleRegression();
    currencyRegression=runCurrencyLocalizationRegression();
    operationsExpansionRegression=runAdminOperationsExpansionRegression();
    supplierNpcRegression=runAdminSupplierNpcRegression();
    supportSlaRegression=runAdminSupportSlaRegression();
    productAwardRegression=runAdminProductAwardRegression();
    systemHealthRegression=runAdminSystemHealthRegression();
    moduleIntegrityRegression=runAdminModuleIntegrityRegression();
    return {regression,auditRegression,roleRegression,currencyRegression,operationsExpansionRegression,supplierNpcRegression,supportSlaRegression,productAwardRegression,systemHealthRegression,moduleIntegrityRegression};
  } finally {
    if(adminControlSystem.auditLog.length>auditCheckpoint)adminControlSystem.auditLog.splice(auditCheckpoint);
  }
}

export async function startWorldProjectAdmin({actor,context={},loadAdminUi=null,mount=null}={}){
  adminControlSystem.requireAdmin(actor);
  const tests=runAdminStartupRegressions();
  for(const [name,result] of Object.entries(tests))if(!result.success)console.error(`❌ WORLDPROJECT ${name}`,result);
  const frontend=createAdminFrontend(actor,adminControlSystem,context);
  const workspace=new AdminWorkspaceController({control:adminControlSystem,dashboard:typeof window!=="undefined"?window.worldAdminDashboard:null,audit:typeof window!=="undefined"?window.worldAdminAudit:null});
  let ui=null;
  if(typeof loadAdminUi==="function")await loadAdminUi({actor,adminControlSystem,frontend,workspace,...tests});
  else if(typeof document!=="undefined")ui=mountAdminConsole({actor,admin:adminControlSystem,context,frontend,workspace,mount:mount||document.body});
  const testStatus=Object.fromEntries(Object.entries(tests).map(([k,v])=>[k,`${v.passed}/${v.total}`]));
  console.log("✅ WORLDPROJECT ADMIN-BEREICH FREIGEGEBEN",testStatus);
  return {actor,adminControlSystem,frontend,workspace,ui,...tests};
}

if(typeof window!=="undefined")window.startWorldProjectAdmin=startWorldProjectAdmin;
