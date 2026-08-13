// WorldProject – separater Admin-Einstieg.
// NICHT aus js/bootstrap.js importieren. Der normale Spielerclient lädt diesen Code nicht.
import { adminControlSystem } from "./core/AdminControlSystem.js";
import "./core/AdminDashboardData.js";
import "./core/ModerationCaseSystem.js";
import "./core/LiveOpsSystem.js";
import "./core/AdminBalancingSystem.js";
import "./core/AdminEntityActions.js";
import "./core/SupportCaseSystem.js";
import "./core/AdminWorldControl.js";
import "./core/AdminSecurityIntegration.js";
import "./core/AllianceSystem.js";

export async function startWorldProjectAdmin({actor,loadAdminUi=null}={}){
  adminControlSystem.requireAdmin(actor);
  if(typeof loadAdminUi==="function")await loadAdminUi({actor,adminControlSystem});
  console.log("✅ WORLDPROJECT ADMIN-BEREICH FREIGEGEBEN");
  return {actor,adminControlSystem};
}

if(typeof window!=="undefined")window.startWorldProjectAdmin=startWorldProjectAdmin;
