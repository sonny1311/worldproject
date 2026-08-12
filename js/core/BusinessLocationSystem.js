// WorldProject - Standorte, Immobilien, Management und laufende Expansionskosten
export const LocationClasses={
 rural:{label:"Ländlich",purchaseBase:65000,rentMonthly:650,logistics:0.90,customers:0.82,workers:0.88},
 smallTown:{label:"Kleinstadt",purchaseBase:105000,rentMonthly:1050,logistics:1.00,customers:0.95,workers:0.96},
 city:{label:"Stadt",purchaseBase:185000,rentMonthly:1850,logistics:1.08,customers:1.08,workers:1.05},
 metro:{label:"Großstadt",purchaseBase:330000,rentMonthly:3300,logistics:1.14,customers:1.20,workers:1.12}
};
export const ManagementRoles={owner:{label:"Inhaber",capacity:1,monthlyCost:0},supervisor:{label:"Betriebsleiter",capacity:1,monthlyCost:4200},regional:{label:"Regionalleiter",capacity:3,monthlyCost:7800},executive:{label:"Geschäftsführung",capacity:8,monthlyCost:14500}};
export function propertyOffer(location="smallTown",mode="rent",sizeLevel=1){const l=LocationClasses[location]||LocationClasses.smallTown;const size=Math.max(1,Number(sizeLevel||1));return {location,mode,sizeLevel:size,upfront:mode==="buy"?Math.round(l.purchaseBase*Math.pow(1.55,size-1)):Math.round(l.rentMonthly*3*Math.pow(1.35,size-1)),monthly:mode==="rent"?Math.round(l.rentMonthly*Math.pow(1.35,size-1)):0,modifiers:{logistics:l.logistics,customers:l.customers,workers:l.workers}};}
export function managementCapacity(staff=[]){return 1+(staff||[]).reduce((s,x)=>s+Number(ManagementRoles[x.role]?.capacity||0),0);}
export function managementMonthlyCost(staff=[]){return (staff||[]).reduce((s,x)=>s+Number(ManagementRoles[x.role]?.monthlyCost||0),0);}
export function administrationMonthlyCost(businessCount=1){const n=Math.max(1,Number(businessCount||1));return Math.round(900*n*Math.pow(1.14,n-1));}
export function expansionLoanOffer({amount,netWorth=0,businessCount=1}={}){const a=Math.max(0,Number(amount||0));const risk=Math.max(0,Math.min(.12,(a/Math.max(1,netWorth))*.035+Math.max(0,businessCount-1)*.004));const annualRate=.045+risk;return {amount:a,annualRate,termMonths:60,monthlyPayment:a?Math.round((a*(annualRate/12))/(1-Math.pow(1+annualRate/12,-60))*100)/100:0};}
export function runBusinessLocationTest(){const a=propertyOffer("rural","rent",1),b=propertyOffer("metro","buy",2),loan=expansionLoanOffer({amount:100000,netWorth:300000,businessCount:2});if(!(b.upfront>a.upfront)||loan.monthlyPayment<=0)throw new Error("Standort-/Finanztest fehlgeschlagen");console.log("✅ STANDORT-/EXPANSIONSFINANZTEST ERFOLGREICH",{a,b,loan});}
