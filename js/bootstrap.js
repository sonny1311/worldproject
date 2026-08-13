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
import { gameAccessGate } from "./core/AccountMultiplayerIntegration.js";

async function startWorldProject(){
    await gameAccessGate.ensureAccess();
    console.log("✅ ACCOUNT FREIGEGEBEN – SPIEL WIRD GELADEN");
    const industryAudit=runAllIndustryPlayabilityAudit();
    window.worldProjectIndustryHealth=industryAudit;
    await import("./main.js");
}

startWorldProject().catch(error=>{
    console.error("❌ SPIELSTART FEHLGESCHLAGEN",error);
});
