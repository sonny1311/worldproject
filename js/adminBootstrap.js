// WorldProject – separater Admin-Einstieg.
// NICHT aus js/bootstrap.js importieren. Der normale Spielerclient lädt diesen Code nicht.
import { adminControlSystem } from "./core/AdminControlSystem.js";
import { createAdminFrontend } from "./core/AdminFrontendModel.js";
import { AdminWorkspaceController } from "./core/AdminWorkspaceController.js";
import { mountAdminConsole } from "./core/AdminConsoleUI.js";
import { runAdminRegressionTest } from "./core/AdminRegressionTest.js";
import { runAdminAuditRegression } from "./core/AdminAuditRegression.js";
import "./core/AdminConsoleSectionViews.js";
import "./core/AdminConsoleActionViews.js";
import "./core/AdminAuditAnalytics.js";
import "./core/AdminAuditConsoleView.js";
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

export async function startWorldProjectAdmin({actor,context={},loadAdminUi=null,mount=null}={}){
  adminControlSystem.requireAdmin(actor);
  const regression=runAdminRegressionTest();
  const auditRegression=runAdminAuditRegression();
  if(!regression.success)console.error("❌ WORLDPROJECT ADMIN-REGRESSION",regression);
  if(!auditRegression.success)console.error("❌ WORLDPROJECT ADMIN-AUDIT-REGRESSION",auditRegression);
  const frontend=createAdminFrontend(actor,adminControlSystem,context);
  const workspace=new AdminWorkspaceController({control:adminControlSystem,dashboard:typeof window!=="undefined"?window.worldAdminDashboard:null,audit:typeof window!=="undefined"?window.worldAdminAudit:null});
  let ui=null;
  if(typeof loadAdminUi==="function")await loadAdminUi({actor,adminControlSystem,frontend,workspace,regression,auditRegression});
  else if(typeof document!=="undefined")ui=mountAdminConsole({actor,admin:adminControlSystem,context,frontend,workspace,mount:mount||document.body});
  console.log("✅ WORLDPROJECT ADMIN-BEREICH FREIGEGEBEN",{regression:`${regression.passed}/${regression.total}`,auditRegression:`${auditRegression.passed}/${auditRegression.total}`});
  return {actor,adminControlSystem,frontend,workspace,ui,regression,auditRegression};
}

if(typeof window!=="undefined")window.startWorldProjectAdmin=startWorldProjectAdmin;
