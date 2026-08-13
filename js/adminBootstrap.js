// WorldProject – separater Admin-Einstieg.
// NICHT aus js/bootstrap.js importieren. Der normale Spielerclient lädt diesen Code nicht.
import { adminControlSystem } from "./core/AdminControlSystem.js";
import { createAdminFrontend } from "./core/AdminFrontendModel.js";
import "./core/AdminDashboardData.js";
import "./core/ModerationCaseSystem.js";
import "./core/LiveOpsSystem.js";
import "./core/AdminBalancingSystem.js";
import "./core/AdminEntityActions.js";
import "./core/SupportCaseSystem.js";
import "./core/AdminWorldControl.js";
import "./core/AdminSecurityIntegration.js";
import "./core/AllianceSystem.js";
import "./core/AllianceAdvancedSystem.js";

export async function startWorldProjectAdmin({actor,context={},loadAdminUi=null}={}){
  adminControlSystem.requireAdmin(actor);
  const frontend=createAdminFrontend(actor,adminControlSystem,context);
  if(typeof loadAdminUi==="function")await loadAdminUi({actor,adminControlSystem,frontend});
  console.log("✅ WORLDPROJECT ADMIN-BEREICH FREIGEGEBEN");
  return {actor,adminControlSystem,frontend};
}

if(typeof window!=="undefined")window.startWorldProjectAdmin=startWorldProjectAdmin;
