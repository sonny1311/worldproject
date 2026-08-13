// WorldProject – separater Admin-Einstieg.
// NICHT aus js/bootstrap.js importieren. Der normale Spielerclient lädt diesen Code nicht.
import { adminControlSystem } from "./core/AdminControlSystem.js";
import { createAdminFrontend } from "./core/AdminFrontendModel.js";
import { AdminWorkspaceController } from "./core/AdminWorkspaceController.js";
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

export async function startWorldProjectAdmin({actor,context={},loadAdminUi=null}={}){
  adminControlSystem.requireAdmin(actor);
  const frontend=createAdminFrontend(actor,adminControlSystem,context);
  const workspace=new AdminWorkspaceController({control:adminControlSystem,dashboard:window.worldAdminDashboard,audit:window.worldAdminAudit});
  if(typeof loadAdminUi==="function")await loadAdminUi({actor,adminControlSystem,frontend,workspace});
  console.log("✅ WORLDPROJECT ADMIN-BEREICH FREIGEGEBEN");
  return {actor,adminControlSystem,frontend,workspace};
}

if(typeof window!=="undefined")window.startWorldProjectAdmin=startWorldProjectAdmin;
