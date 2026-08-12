// WorldProject - Langzeitwachstum: Personal, Verwaltung, Standorte, Finanzierung und Expansion
import { expansionRequirements, estimateCompanyNetWorth } from "./BusinessExpansionSystem.js";
import { propertyOffer, managementCapacity, managementMonthlyCost, administrationMonthlyCost, expansionLoanOffer } from "./BusinessLocationSystem.js";

export function normalizeGrowth(company={}){
 company.growth ||= {};
 company.growth.managementStaff ||= [];
 company.growth.locations ||= [];
 company.growth.loans ||= [];
 company.growth.internalTransfers ||= [];
 company.growth.successfulYears ||= 0;
 company.growth.totalRevenue ||= 0;
 return company.growth;
}
export function addManager(company,role){const g=normalizeGrowth(company);g.managementStaff.push({role,hiredAt:Date.now()});company.managementCapacity=managementCapacity(g.managementStaff);return company.managementCapacity;}
export function removeManager(company,index){const g=normalizeGrowth(company);g.managementStaff.splice(index,1);company.managementCapacity=managementCapacity(g.managementStaff);return company.managementCapacity;}
export function monthlyAdministration(company,businessCount=1){const g=normalizeGrowth(company);return administrationMonthlyCost(businessCount)+managementMonthlyCost(g.managementStaff)+(g.locations||[]).reduce((s,l)=>s+Number(l.monthly||0),0);}
export function acquireLocation(company,{location="smallTown",mode="rent",sizeLevel=1}={}){const g=normalizeGrowth(company),offer=propertyOffer(location,mode,sizeLevel);if(Number(company.money||0)<offer.upfront)throw new Error("Nicht genügend Geld für den Standort");company.money-=offer.upfront;g.locations.push({...offer,acquiredAt:Date.now()});return offer;}
export function requestExpansionLoan(company,{amount,businessCount=1,totalNetWorth=0}={}){const g=normalizeGrowth(company),offer=expansionLoanOffer({amount,netWorth:totalNetWorth||estimateCompanyNetWorth(company),businessCount});if(!offer.amount)throw new Error("Ungültiger Kreditbetrag");g.loans.push({...offer,remaining:offer.amount,createdAt:Date.now()});company.money=Number(company.money||0)+offer.amount;company.debt=Number(company.debt||0)+offer.amount;return offer;}
export function recordInternalTransfer(from,to,amount){const a=Number(amount||0);if(a<=0||Number(from.money||0)<a)throw new Error("Ungültiger interner Transfer");from.money-=a;to.money=Number(to.money||0)+a;const row={from:from.serverCompanyId||from.id,to:to.serverCompanyId||to.id,amount:a,at:Date.now()};normalizeGrowth(from).internalTransfers.push(row);normalizeGrowth(to).internalTransfers.push(row);return row;}
export function recordProgress(company,{revenue=0,successfulYear=false}={}){const g=normalizeGrowth(company);g.totalRevenue+=Math.max(0,Number(revenue||0));if(successfulYear)g.successfulYears++;return g;}
export function expansionProgress({businesses=[],sourceCompany}={}){const g=normalizeGrowth(sourceCompany||{}),req=expansionRequirements(businesses.length);const worth=businesses.reduce((s,c)=>s+estimateCompanyNetWorth(c),0);const capacity=managementCapacity(g.managementStaff);return {requirements:req,netWorth:worth,managementCapacity:capacity,successfulYears:g.successfulYears,totalRevenue:g.totalRevenue,financialReady:Number(sourceCompany?.money||0)>=req.creationCost+req.requiredCashReserve,worthReady:worth>=req.requiredNetWorth,managementReady:capacity>=req.requiredManagement};}
export function runBusinessGrowthTest(){const a={money:500000,assetValue:250000},b={money:10000};addManager(a,"regional");const loc=acquireLocation(a,{location:"smallTown",mode:"rent"});const loan=requestExpansionLoan(a,{amount:50000,businessCount:2,totalNetWorth:500000});recordInternalTransfer(a,b,10000);recordProgress(a,{revenue:100000,successfulYear:true});if(!loc||!loan||b.money!==20000||a.managementCapacity<1)throw new Error("BusinessGrowthSystem Test fehlgeschlagen");console.log("✅ BUSINESS-GROWTH-TEST ERFOLGREICH");}
