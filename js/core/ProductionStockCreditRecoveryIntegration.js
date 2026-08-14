// WorldProject - schuetzt Fertigwaren vor Verlust zwischen Produktionsabschluss und Persistenz.
// Neue Abschluesse erhalten einen dauerhaften Buchungsmarker. Kuerzlich verlorene, unmarkierte
// Fertigwaren koennen einmalig und nur unter engen Bedingungen wiederhergestellt werden.
import { ProductionPlanner } from './OperationalSupplyChainSystem.js';

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const currentCompany=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;

function hasSaleSince(company,productId,since=0){
 const logs=company?.financialLog||[];
 return logs.some(row=>String(row?.type||'')==='customer_sale'&&String(row?.details?.productId||row?.details?.product||'')===String(productId||'')&&new Date(row?.time||0).getTime()>=since);
}

export function recoverRecentFinishedProductionStock(company=currentCompany(),{maxAgeMs=12*3600000}={}){
 if(!company?.operationalSupplyState?.warehouseStock)return{recovered:0,rows:[]};
 const state=company.operationalSupplyState,finished=state.warehouseStock.finished??=( {} ),queue=state.productionQueue||[],now=Date.now(),rows=[];
 for(const job of queue){
  if(String(job?.status||'')!=='finished'||job.stockCreditedAt||job.stockRecoveryAt)continue;
  const product=job?.recipe?.product||job?.product||job?.productId;
  const qty=n(job?.stockCreditQuantity??job?.plan?.output??job?.output);
  const ended=n(job?.finishedAt??job?.finishAt??job?.completedAt);
  if(!product||!(qty>0)||!ended||now-ended>maxAgeMs)continue;
  if(n(finished[product])>0)continue;
  const delivered=(company.customerOrders||[]).filter(o=>String(o.productId||o.product||'')===String(product)).reduce((s,o)=>s+n(o.delivered??o.deliveredQuantity??o.fulfilledQuantity),0);
  if(delivered>0||hasSaleSince(company,product,ended))continue;
  finished[product]=qty;
  job.stockRecoveryAt=now;
  job.stockCreditedAt=now;
  job.stockCreditProduct=product;
  job.stockCreditQuantity=qty;
  rows.push({jobId:job.id,product,quantity:qty});
 }
 if(rows.length){state.updatedAt=now;window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'production-stock-recovery',rows}}));console.warn('♻️ VERLORENE FERTIGWARE WIEDERHERGESTELLT',rows);}
 return{recovered:rows.reduce((s,r)=>s+r.quantity,0),rows};
}

const p=ProductionPlanner.prototype;
if(!p.__worldProductionStockCreditGuard){
 p.__worldProductionStockCreditGuard=true;
 const originalAdvance=p.advance;
 p.advance=function(now=Date.now()){
  const before=new Map((this.queue||[]).map(j=>[j.id,{status:j.status,stock:n(this.warehouse?.stock?.finished?.[j?.recipe?.product])}]));
  const result=originalAdvance.call(this,now);
  for(const j of this.queue||[]){
   const prev=before.get(j.id);if(!prev||prev.status==='finished'||String(j.status)!=='finished'||j.stockCreditedAt)continue;
   const product=j?.recipe?.product,after=n(this.warehouse?.stock?.finished?.[product]),delta=Math.max(0,after-n(prev.stock));
   j.finishedAt??=Number(now);j.stockCreditedAt=Number(now);j.stockCreditProduct=product;j.stockCreditQuantity=delta>0?delta:n(j?.plan?.output);
  }
  return result;
 };
}

function recoverSoon(){setTimeout(()=>recoverRecentFinishedProductionStock(),700);}
for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched'])window.addEventListener(ev,recoverSoon);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',recoverSoon,{once:true});else recoverSoon();
if(typeof window!=='undefined')window.worldProductionStockRecovery={recover:recoverRecentFinishedProductionStock};
