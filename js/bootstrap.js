// ============================================
// bootstrap.js
// WorldProject
// ============================================
import "./core/TransportVehicleCostIntegration.js";
import "./core/TransportFuelTimeIntegration.js";
import "./core/TransportGameplayIntegration.js";
import "./core/CompanyEconomyIntegration.js";
import "./core/OperationalSupplyChainEquipmentIntegration.js";
import "./core/UniversalOperationsDialog.js";
import "./core/EconomyDashboardSetupIntegration.js";
import "./core/ConnectedEconomyGameplay.js";
import "./core/CustomerOrderPricingIntegration.js";
import "./core/ProductionProgressIntegration.js";
import "./core/ProductionStatusBannerIntegration.js";
import "./core/MachineStaffingOverviewIntegration.js";
import "./core/CommercialFulfillmentGameplayBridge.js";
import "./core/CoreRegressionSuite.js";
import { runAllIndustryPlayabilityAudit } from "./core/AllIndustryPlayabilityAudit.js";
import { runAllIndustryEconomyHealth } from "./core/AllIndustryEconomyBootstrap.js";
import { gameAccessGate } from "./core/AccountMultiplayerIntegration.js";
async function startWorldProject(){
    await gameAccessGate.ensureAccess();
    console.log("✅ ACCOUNT FREIGEGEBEN – SPIEL WIRD GELADEN");
    window.worldProjectIndustryHealth=runAllIndustryPlayabilityAudit();
    window.worldAllIndustryEconomyHealth=runAllIndustryEconomyHealth();
    await import("./main.js");
}
startWorldProject().catch(error=>console.error("❌ SPIELSTART FEHLGESCHLAGEN",error));
