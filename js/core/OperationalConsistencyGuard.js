// WorldProject - stille Konsistenzpflege fuer lang laufende Spielstaende.
// Repariert nur eindeutig ableitbare Zustaende; keine erfundenen Mengen/Zeiten.
import { timerEnd } from './TimeValueUtils.js';

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const active=s=>!['finished','completed','cancelled','admin_cancelled','delivered','received','sold','closed','failed'].includes(String(s||'').toLowerCase());

export function reconcileCustomerReservations(company={}){
 let repaired=0;
 for(const o of company.customerOrders||[]){
  const total=Math.max(0,n(o.quantity??o.amount));
  const delivered=Math.max(0,n(o.delivered??o.deliveredQuantity??o.fulfilledQuantity??o.deliveredAmount));
  const maxReserved=Math.max(0,total-delivered);
  const reserved=Math.max(0,n(o.reserved));
  if(reserved>maxReserved){o.reserved=maxReserved;repaired++;}
  if(total>0&&delivered>=total&&active(o.status)){o.status='completed';o.completedAt??=Date.now();repaired++;}
 }
 return repaired;
}

export function reconcileMachineStatuses(company={}){
 const activeMachineIds=new Set();
 for(const p of [...(company.productionQueue||[]),...(company.productionJobs||[])])if(active(p?.status)&&p?.machineId)activeMachineIds.add(p.machineId);
 let repaired=0;
 for(const m of company.productionMachines||[]){
  if(['producing','reserved'].includes(String(m?.status||''))&&!activeMachineIds.has(m.id)){m.status=n(m.condition,100)<=25?'workshop_required':'available';repaired++;}
 }
 return repaired;
}

export function overdueOperations(company={},now=Date.now()){
 const rows=[];
 const lists=[['production',company.productionQueue||[]],['production',company.productionJobs||[]],['delivery',company.supplierOrders||[]],['delivery',company.operationalSupplyState?.orders||[]],['construction',company.constructionSite?.jobs||[]],['warehouse',company.warehouseExpansion?.jobs||[]],['upgrade',company.machineUpgradeJobs||[]],['upgrade',company.upgradeJobs||[]]];
 const seen=new Set();
 for(const [kind,list] of lists)for(const row of list){if(!row||!active(row.status))continue;const key=`${kind}:${row.id??row.instanceId??row}`;if(seen.has(key))continue;seen.add(key);const end=timerEnd(row)?.value||0;if(end&&end<now)rows.push({kind,row,end,overdueMs:now-end});}
 return rows;
}

export function runOperationalConsistency(company={},now=Date.now()){
 const reservationRepairs=reconcileCustomerReservations(company);
 const machineRepairs=reconcileMachineStatuses(company);
 const overdue=overdueOperations(company,now);
 return {success:true,reservationRepairs,machineRepairs,overdueCount:overdue.length,overdue};
}

export function runOperationalConsistencyGuardTest(){
 const now=Date.parse('2026-08-14T10:00:00Z');
 const c={customerOrders:[{id:1,status:'open',quantity:100,delivered:100,reserved:20}],productionMachines:[{id:'m1',status:'producing',condition:80}],productionQueue:[{id:2,status:'completed',machineId:'m1',completeAt:now-1000}],supplierOrders:[{id:3,status:'in_transit',arrivalAt:now-5000}]};
 const r=runOperationalConsistency(c,now);
 if(c.customerOrders[0].reserved!==0||c.customerOrders[0].status!=='completed')throw new Error('Kundenauftrag wurde nicht konsistent repariert');
 if(c.productionMachines[0].status!=='available')throw new Error('Verwaister Maschinenstatus wurde nicht repariert');
 if(r.overdueCount!==1)throw new Error('Ueberfaelliger Vorgang wurde nicht erkannt');
 return true;
}

if(typeof window!=='undefined')window.worldOperationalConsistency={run:runOperationalConsistency,overdue:overdueOperations,test:runOperationalConsistencyGuardTest};
