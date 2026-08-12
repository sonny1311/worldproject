// WorldProject - verbindet Standort, Management, Finanzierung und Betriebsausbau
import {canExpand,expansionRequirements,applyUpgrade,operationalModifiers,getUpgradeState} from './BusinessExpansionSystem.js';
import {propertyOffer,managementCapacity,managementMonthlyCost,administrationMonthlyCost,expansionLoanOffer} from './BusinessLocationSystem.js';

export class BusinessGrowthIntegration{
 constructor(company,portfolio){this.company=company;this.portfolio=portfolio;this.ensureState();}
 ensureState(){const c=this.company;c.upgrades=getUpgradeState(c);c.managementStaff=c.managementStaff||[];c.expansionLoans=c.expansionLoans||[];c.property=c.property||null;c.internalTransfers=c.internalTransfers||[];return c;}
 previewProperty(location,mode,sizeLevel=1){return propertyOffer(location,mode,sizeLevel);}
 acquireProperty(location,mode,sizeLevel=1){const o=propertyOffer(location,mode,sizeLevel);if(Number(this.company.money||0)<o.upfront)throw new Error('Nicht genügend Geld für Standort');this.company.money-=o.upfront;this.company.property={...o,acquiredAt:Date.now()};return this.company.property;}
 hireManager(role){const monthly={supervisor:4200,regional:7800,executive:14500}[role];if(!monthly)throw new Error('Unbekannte Managementstelle');this.company.managementStaff.push({role,hiredAt:Date.now()});return {role,monthlyCost:monthly,capacity:managementCapacity(this.company.managementStaff)};}
 fireManager(index){return this.company.managementStaff.splice(index,1)[0]||null;}
 managementSummary(){return {capacity:managementCapacity(this.company.managementStaff),monthlyCost:managementMonthlyCost(this.company.managementStaff),administrationCost:administrationMonthlyCost(this.portfolio?.companies?.length||1)};}
 upgrade(track){return applyUpgrade(this.company,track);}
 modifiers(){return operationalModifiers(this.company);}
 expansionStatus(){const companies=this.portfolio?.companies||[];return canExpand({businesses:companies,sourceCompany:this.company,managementCapacity:managementCapacity(this.company.managementStaff)});}
 loanOffer(amount){return expansionLoanOffer({amount,netWorth:Number(this.company.assetValue||0)+Number(this.company.money||0),businessCount:this.portfolio?.companies?.length||1});}
 takeExpansionLoan(amount){const o=this.loanOffer(amount);if(!o.amount)throw new Error('Ungültiger Kreditbetrag');this.company.money=Number(this.company.money||0)+o.amount;this.company.expansionLoans.push({...o,remaining:o.amount,startedAt:Date.now()});return o;}
 monthlyExpansionCosts(){const management=managementMonthlyCost(this.company.managementStaff),admin=administrationMonthlyCost(this.portfolio?.companies?.length||1),rent=Number(this.company.property?.monthly||0),loans=this.company.expansionLoans.reduce((s,l)=>s+Number(l.monthlyPayment||0),0);return {management,administration:admin,rent,loans,total:management+admin+rent+loans};}
 recordInternalTransfer(fromId,toId,amount){const row={fromId,toId,amount:Number(amount),createdAt:Date.now()};this.company.internalTransfers.push(row);return row;}
 getLongTermProgress(){const req=expansionRequirements(this.portfolio?.companies?.length||0);return {businesses:this.portfolio?.companies?.length||0,upgrades:this.company.upgrades,property:this.company.property,management:this.managementSummary(),nextExpansion:req,status:this.expansionStatus(),monthlyCosts:this.monthlyExpansionCosts()};}
}

export function runBusinessGrowthIntegrationTest(){const c={money:1000000,assetValue:500000};const p={companies:[c]};const g=new BusinessGrowthIntegration(c,p);g.acquireProperty('smallTown','rent',1);g.hireManager('supervisor');g.upgrade('production');g.upgrade('storage');const loan=g.takeExpansionLoan(50000);const costs=g.monthlyExpansionCosts();if(!c.property||c.upgrades.production!==1||loan.monthlyPayment<=0||costs.total<=0)throw new Error('Business-Growth-Integration fehlerhaft');console.log('✅ BUSINESS-GROWTH-INTEGRATIONSTEST ERFOLGREICH',g.getLongTermProgress());}
