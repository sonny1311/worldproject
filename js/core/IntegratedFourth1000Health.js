// WorldProject – integrierter Healthcheck für den vierten 1000er-Block.
import { equipmentAssetKpis } from './EquipmentAssetAccounting.js';
import { employmentKpis } from './EmploymentLawAndPayroll.js';
import { utilityKpis } from './UtilityAndEnergySystem.js';
import { wasteKpis } from './WasteAndRecyclingSystem.js';
import { productLifecycleKpis } from './ProductLifecycleSystem.js';
import { customerServiceKpis } from './CustomerServiceSLASystem.js';
import { negotiationKpis } from './ContractNegotiationSystem.js';
import { freightBrokerageKpis } from './FreightBrokerageSystem.js';
import { lendingTerms } from './BusinessCreditRatingSystem.js';
import { capitalMarketsKpis } from './CapitalMarketsSystem.js';
import { realEstateKpis } from './CommercialRealEstateSystem.js';
import { continuityKpis } from './BusinessContinuitySystem.js';
import { fraudKpis } from './EconomyFraudDetection.js';
import { seasonalCalendarKpis } from './SeasonalBusinessCalendar.js';
import { inboundQualityKpis } from './ProcurementQualityControl.js';
import { traceabilityKpis } from './ProductionTraceabilitySystem.js';
import { salesChannelKpis } from './SalesChannelSystem.js';
import { franchiseLicensingKpis } from './FranchiseLicensingSystem.js';
import { executiveKpis } from './ExecutiveStrategySystem.js';
import { IndustryProfiles,createStarterBuilding } from './IndustryCatalog.js';
function sample(type){return{type,industry:'',money:500000,buildingState:createStarterBuilding(type),inventory:{},finishedGoods:{},employees:[],salesLedger:[],costLedger:[]};}
export function runIntegratedFourth1000Health(){const checks=[],add=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});for(const type of Object.keys(IndustryProfiles)){const c=sample(type);try{add(`${type}: equipment assets`,Number.isFinite(equipmentAssetKpis(c).bookValue));add(`${type}: employment`,Number.isFinite(employmentKpis(c).monthlyEmployerCost));add(`${type}: utilities`,Number.isFinite(utilityKpis(c).electricityPrice));add(`${type}: waste`,Number.isFinite(wasteKpis(c).openKg));add(`${type}: product lifecycle`,Number.isFinite(productLifecycleKpis(c).products));add(`${type}: customer service`,Number.isFinite(customerServiceKpis(c).open));add(`${type}: negotiations`,Number.isFinite(negotiationKpis(c).open));add(`${type}: freight`,Number.isFinite(freightBrokerageKpis(c).requests));add(`${type}: credit rating`,Number.isFinite(lendingTerms(c).score));add(`${type}: capital markets`,Number.isFinite(capitalMarketsKpis(c).bondsOutstanding));add(`${type}: real estate`,Number.isFinite(realEstateKpis(c).propertyValue));add(`${type}: continuity`,Number.isFinite(continuityKpis(c).readiness));add(`${type}: fraud`,Number.isFinite(fraudKpis(c).signals));add(`${type}: seasonal calendar`,!!seasonalCalendarKpis(c).season);add(`${type}: inbound quality`,Number.isFinite(inboundQualityKpis(c).passRate));add(`${type}: traceability`,Number.isFinite(traceabilityKpis(c).lots));add(`${type}: sales channels`,Number.isFinite(salesChannelKpis(c).enabled));add(`${type}: franchise`,Number.isFinite(franchiseLicensingKpis(c).activeLicenses));add(`${type}: executive`,Number.isFinite(executiveKpis(c).allocated));}catch(error){add(`${type}: fourth1000 integration`,false,error.message);}}
const failed=checks.filter(x=>!x.success),report={success:failed.length===0,passed:checks.length-failed.length,total:checks.length,failed,checks,ranAt:Date.now()};if(typeof window!=='undefined')window.worldFourth1000Health=report;console[report.success?'log':'error'](`WORLDPROJECT FOURTH-1000 HEALTH ${report.passed}/${report.total}`,report);return report;}
