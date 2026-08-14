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
import "./core/BottlingSizeSelectionIntegration.js";
import "./core/ProductionStatusBannerIntegration.js";
import "./core/MachineStaffingOverviewIntegration.js";
import "./core/MachineStaffingHireLinkIntegration.js";
import "./core/WorkforceMachineAssignmentIntegration.js";
import "./core/WorkforceAssignmentStatusIntegration.js";
import "./core/ProductionReadinessChecklistView.js";
import "./core/DashboardSummaryNavigationIntegration.js";
import "./core/DashboardFinishedGoodsSummaryIntegration.js";
import "./core/DashboardSummaryGradientIntegration.js";
import "./core/OperationalDialogSectionPersistenceIntegration.js";
import "./core/MachinePurchaseTabIntegration.js";
import "./core/ProductionReadinessPremiumNavigationV2.js";
import "./core/ProductionQueueLimitIntegration.js";
import "./core/CommercialFulfillmentGameplayBridge.js";
import "./core/PlayerMarketDialog.js";
import "./core/DashboardUsabilityIntegration.js";
import "./core/DashboardFinanceLedgerIntegration.js";
import "./core/BusinessExpansionOperationalEffectsIntegration.js";
import "./core/LongDialogUsabilityIntegration.js";
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
