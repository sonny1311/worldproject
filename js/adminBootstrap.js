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
import "./core/AdminConsoleSectionViews.js";
import "./core/AdminConsoleActionViews.js";
import "./core/AdminAuditAnalytics.js";
import "./core/AdminAuditConsoleView.js";
import "./core/AdminCurrencySystem.js";
import "./core/AdminCurrencyConsoleView.js";
import "./core/AdminSupplierAwardConsoleViews.js";
import "./core/AdminSupplierControl.js";
import "./core/AdminNpcControl.js";
import "./core/AdminSupplierNpcActionViews.js";
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

function runAdminStartupRegressions(){
  const auditCheckpoint=adminControlSystem.auditLog.length;
  let regression={success:false,passed:0,total:0,failed:[{error:"nicht ausgeführt"}]};
  let auditRegression={success:false,passed:0,total:0,failed:[{error:"nicht ausgeführt"}]};
  let roleRegression={success:false,passed:0,total:0,failed:[{error:"nicht ausgeführt"}]};
  let currencyRegression={success:false,passed:0,total:0,failed:[{error:"nicht ausgeführt"}]};
  let operationsExpansionRegression={success:false,passed:0,total:0,failed:[{error:"nicht ausgeführt"}]};
  let supplierNpcRegression={success:false,passed:0,total:0,failed:[{error:"nicht ausgeführt"}]};
  try{
    regression=runAdminRegressionTest();
    auditRegression=runAdminAuditRegression();
    roleRegression=runAdminRoleRegression();
    currencyRegression=runCurrencyLocalizationRegression();
    operationsExpansionRegression=runAdminOperationsExpansionRegression();
    supplierNpcRegression=runAdminSupplierNpcRegression();
    return {regression,auditRegression,roleRegression,currencyRegression,operationsExpansionRegression,supplierNpcRegression};
  } finally {
    if(adminControlSystem.auditLog.length>auditCheckpoint)adminControlSystem.auditLog.splice(auditCheckpoint);
  }
}

export async function startWorldProjectAdmin({actor,context={},loadAdminUi=null,mount=null}={}){
  adminControlSystem.requireAdmin(actor);
  const {regression,auditRegression,roleRegression,currencyRegression,operationsExpansionRegression,supplierNpcRegression}=runAdminStartupRegressions();
  if(!regression.success)console.error("❌ WORLDPROJECT ADMIN-REGRESSION",regression);
  if(!auditRegression.success)console.error("❌ WORLDPROJECT ADMIN-AUDIT-REGRESSION",auditRegression);
  if(!roleRegression.success)console.error("❌ WORLDPROJECT ADMIN-ROLLEN-REGRESSION",roleRegression);
  if(!currencyRegression.success)console.error("❌ WORLDPROJECT WÄHRUNGS-REGRESSION",currencyRegression);
  if(!operationsExpansionRegression.success)console.error("❌ WORLDPROJECT ADMIN-FACHBEREICH-REGRESSION",operationsExpansionRegression);
  if(!supplierNpcRegression.success)console.error("❌ WORLDPROJECT LIEFERANT/NPC-REGRESSION",supplierNpcRegression);
  const frontend=createAdminFrontend(actor,adminControlSystem,context);
  const workspace=new AdminWorkspaceController({control:adminControlSystem,dashboard:typeof window!=="undefined"?window.worldAdminDashboard:null,audit:typeof window!=="undefined"?window.worldAdminAudit:null});
  let ui=null;
  if(typeof loadAdminUi==="function")await loadAdminUi({actor,adminControlSystem,frontend,workspace,regression,auditRegression,roleRegression,currencyRegression,operationsExpansionRegression,supplierNpcRegression});
  else if(typeof document!=="undefined")ui=mountAdminConsole({actor,admin:adminControlSystem,context,frontend,workspace,mount:mount||document.body});
  console.log("✅ WORLDPROJECT ADMIN-BEREICH FREIGEGEBEN",{regression:`${regression.passed}/${regression.total}`,auditRegression:`${auditRegression.passed}/${auditRegression.total}`,roleRegression:`${roleRegression.passed}/${roleRegression.total}`,currencyRegression:`${currencyRegression.passed}/${currencyRegression.total}`,operationsExpansionRegression:`${operationsExpansionRegression.passed}/${operationsExpansionRegression.total}`,supplierNpcRegression:`${supplierNpcRegression.passed}/${supplierNpcRegression.total}`});
  return {actor,adminControlSystem,frontend,workspace,ui,regression,auditRegression,roleRegression,currencyRegression,operationsExpansionRegression,supplierNpcRegression};
}

if(typeof window!=="undefined")window.startWorldProjectAdmin=startWorldProjectAdmin;
