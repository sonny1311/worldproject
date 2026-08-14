// WorldProject – zentrale Übersicht aller gerade laufenden/ausstehenden Betriebsaktivitäten.
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const activeStatus=s=>!['finished','completed','cancelled','admin_cancelled','delivered','received','sold','closed'].includes(String(s||'').toLowerCase());
const progress=(row,now=Date.now())=>{if(Number(row?.progress)>=0)return Math.max(0,Math.min(100,Math.round(Number(row.progress))));const start=n(row?.startedAt||row?.createdAt),end=n(row?.finishAt||row?.completeAt||row?.arriveAt||row?.arrivalAt||row?.deliveryAt||row?.eta||row?.endsAt);if(!start||!end||end<=start)return null;return Math.max(0,Math.min(99,Math.round((now-start)/(end-start)*100)));};
const remaining=(row,now=Date.now())=>{const end=n(row?.finishAt||row?.completeAt||row?.arriveAt||row?.arrivalAt||row?.deliveryAt||row?.eta||row?.endsAt);return end?Math.max(0,end-now):null;};
function normalize(kind,label,row,now){return{kind,label:label||row?.label||row?.name||row?.product||row?.recipeId||row?.material||row?.itemId||kind,status:row?.status||'aktiv',progress:progress(row,now),remainingMs:remaining(row,now),id:row?.id||row?.instanceId||null,raw:row};}
export function activeOperations(company={},now=Date.now()){
 const rows=[],productionSeen=new Set();
 for(const list of [company.productionJobs||[],company.productionQueue||[]])for(const j of list){const key=j?.id||j;if(!j||productionSeen.has(key)||!activeStatus(j.status))continue;productionSeen.add(key);rows.push(normalize('production',j.label||j.product||j.recipeId||'Produktion',j,now));}
 const supply=[...(company.operationalSupplyState?.orders||[]),...(company.supplierOrders||[])];const seen=new Set();for(const j of supply){const key=j.id||JSON.stringify([j.material||j.itemId,j.createdAt||j.orderedAt]);if(seen.has(key))continue;seen.add(key);if(activeStatus(j.status))rows.push(normalize('delivery',j.label||j.material||j.itemId||'Lieferung',j,now));}
 for(const j of company.constructionSite?.jobs||[])if(activeStatus(j.status))rows.push(normalize(j.kind==='land'?'land':'construction',j.label||'Bauprojekt',j,now));
 for(const j of company.warehouseExpansion?.jobs||[])if(activeStatus(j.status))rows.push(normalize('warehouse_expansion',j.label||'Lagerausbau',j,now));
 for(const j of company.machineUpgradeJobs||[])if(activeStatus(j.status))rows.push(normalize('machine_upgrade',j.label||'Maschinenupgrade',j,now));
 for(const j of company.upgradeJobs||[])if(activeStatus(j.status))rows.push(normalize('business_upgrade',`${j.label||'Betriebsausbau'} → Stufe ${j.targetLevel||'?'}`,j,now));
 for(const j of company.customerOrders||[])if(activeStatus(j.status)&&n(j.remainingQuantity??j.quantity)>0)rows.push(normalize('customer_order',j.label||j.product||'Kundenauftrag',j,now));
 return rows.sort((a,b)=>(a.remainingMs??Infinity)-(b.remainingMs??Infinity));
}
export function activeOperationsSummary(company={},now=Date.now()){const rows=activeOperations(company,now),byType={};for(const r of rows)byType[r.kind]=(byType[r.kind]||0)+1;return{total:rows.length,byType,rows,next:rows.find(x=>x.remainingMs!==null)||null};}
export function runActiveOperationsOverviewTest(){const c={productionJobs:[{id:1,status:'running',startedAt:0,finishAt:1000,label:'Pils'}],productionQueue:[{id:5,status:'running',startedAt:100,completeAt:1500,recipeId:'lager'}],machineUpgradeJobs:[{id:2,status:'upgrading',startedAt:0,finishAt:2000,label:'Tank'}],upgradeJobs:[{id:4,status:'running',startedAt:100,finishAt:3000,label:'Produktionsleistung',targetLevel:2}],customerOrders:[{id:3,status:'open',quantity:10,product:'Bier'}]};const s=activeOperationsSummary(c,500);if(s.total!==5||s.byType.production!==2||s.byType.machine_upgrade!==1||s.byType.business_upgrade!==1||s.byType.customer_order!==1)throw new Error('Aktivitaetsuebersicht fehlerhaft');return true;}
if(typeof window!=='undefined')window.worldActiveOperations={list:activeOperations,summary:activeOperationsSummary,runTest:runActiveOperationsOverviewTest};
