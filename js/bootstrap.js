// ============================================
// bootstrap.js
// WorldProject
//
// Spielcode wird erst nach erfolgreicher
// Registrierung/Anmeldung geladen.
// ============================================

import "./core/TransportVehicleCostIntegration.js";
import "./core/TransportFuelTimeIntegration.js";
import "./core/TransportGameplayIntegration.js";
import "./core/CompanyEconomyIntegration.js";
import "./core/ConnectedEconomyGameplay.js";
import "./core/CommercialFulfillmentGameplayBridge.js";
import "./core/CoreRegressionSuite.js";
import { runAllIndustryPlayabilityAudit } from "./core/AllIndustryPlayabilityAudit.js";
import { universalOperationsDialog } from "./core/UniversalOperationsDialog.js";
import { runPlayability2HealthCheck, openPlayabilityMatrix } from "./core/IndustryPlayabilityMatrix.js";
import { gameAccessGate } from "./core/AccountMultiplayerIntegration.js";

function mountUniversalOpsButtons(){
    if(document.getElementById("world-universal-ops-button"))return;
    const ops=document.createElement("button");ops.id="world-universal-ops-button";ops.textContent="🧰 Betrieb";Object.assign(ops.style,{position:"fixed",left:"18px",bottom:"18px",zIndex:"12000",padding:"11px 15px",borderRadius:"10px",fontWeight:"800",cursor:"pointer"});ops.onclick=()=>universalOperationsDialog.open("machines");document.body.append(ops);
    const health=document.createElement("button");health.id="world-playability-button";health.textContent="✅ Spielbarkeit";Object.assign(health.style,{position:"fixed",left:"122px",bottom:"18px",zIndex:"12000",padding:"11px 15px",borderRadius:"10px",fontWeight:"800",cursor:"pointer"});health.onclick=()=>openPlayabilityMatrix();document.body.append(health);
}

async function startWorldProject(){
    await gameAccessGate.ensureAccess();
    console.log("✅ ACCOUNT FREIGEGEN – SPIEL WIRD GELADEN");
    const industryAudit=runAllIndustryPlayabilityAudit();
    window.worldProjectIndustryHealth=industryAudit;
    window.worldPlayability2=runPlayability2HealthCheck();
    await import("./main.js");
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountUniversalOpsButtons,{once:true});else mountUniversalOpsButtons();
}

startWorldProject().catch(error=>{
    console.error("❌ SPIELSTART FEHLGESCHLAGEN",error);
});
