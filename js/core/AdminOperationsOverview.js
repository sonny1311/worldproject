// WorldProject – reine Admin-Übersichtsdaten.
export function adminCompanySummary(company){return{id:company.serverCompanyId||company.id,name:company.name,type:company.type,status:company.status||'active',setupPhase:company.setupPhase,money:Number(company.money||0),employees:(company.employees||[]).length,vehicles:(company.vehicles||[]).length,jobs:(company.productionJobs||[]).length,deliveries:(company.inboundDeliveries||company.deliveries||[]).length};}
if(typeof window!=='undefined')window.worldAdminCompanySummary=adminCompanySummary;
