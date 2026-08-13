// WorldProject – ein Datenmodell für bestehende Dashboards; bewusst KEINE neue UI.
import { profitAndLoss, liquidityForecast } from "./IndustryFinanceAndTax.js";
import { qualityKpis } from "./IndustryQualitySystem.js";
import { contractKpis } from "./IndustryContractsSystem.js";
import { growthBonuses, ensureGrowth } from "./IndustryGrowthSystem.js";
import { riskKpis } from "./IndustryRiskAndEvents.js";
import { sustainabilityKpis } from "./IndustrySustainability.js";
import { bottleneckSummary } from "./IndustryCapacityPlanner.js";
import { ensureMarketState } from "./IndustryDemandMarket.js";
import { economicsAudit } from "./IndustryEconomicsEngine.js";
export function managementDashboardData(company){const market=ensureMarketState(company),growth=ensureGrowth(company),orders=company.customerOrders||[];return{finance:{...profitAndLoss(company),...liquidityForecast(company)},quality:qualityKpis(company),contracts:contractKpis(company),growth:{level:growth.level,xp:growth.xp,researchPoints:growth.researchPoints,bonuses:growthBonuses(company)},risk:riskKpis(company),sustainability:sustainabilityKpis(company),capacity:bottleneckSummary(company,orders),market:{day:market.day,reputation:market.reputation,openOrders:market.orders.filter(x=>x.status==="open").length},economics:economicsAudit(company),operations:{inventoryItems:Object.keys(company.inventory||{}).length,finishedProducts:Object.keys(company.finishedGoods||{}).length,runningJobs:(company.productionJobs||[]).filter(x=>x.status==="running").length,employees:(company.employees||[]).length,machines:(company.buildingState?.equipment||[]).length}};}
if(typeof window!=="undefined")window.worldManagementDashboardData=managementDashboardData;
