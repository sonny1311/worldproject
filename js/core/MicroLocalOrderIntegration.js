// WorldProject – verbindet Mikro-Unternehmensstart und lokale Kundenaufträge mit dem aktiven Betrieb.
import { microStarterProfile, starterOrderScale, ensureMicroBusiness } from './MicroBusinessStarterSystem.js';
import { getIndustryProfile } from './IndustryCatalog.js';
import { chooseCustomerOrderProduct } from './CustomerOrderVarietyIntegration.js';
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const now=()=>window.worldTime?.now?.()||Date.now();
function productCandidates(company){
 const ids=[];const push=id=>{if(id&&id!=='undefined'&&!ids.includes(id))ids.push(id);};
 for(const o of [...(company.completedCustomerOrders||[]),...(company.customerOrders||[])].reverse())push(o?.productId||o?.product);
 for(const [id,value] of Object.entries(company.operationalSupplyState?.warehouseStock?.finished||{}))if(num(value)>0)push(id);
 for(const [id,value] of Object.entries(company.finishedGoods||{}))if(num(value)>0)push(id);
 for(const id of Object.keys(company.salesPrices||{}))push(id);
 for(const id of getIndustryProfile(company).products||[])push(id);
 return ids;
}
function chooseProduct(company,index=0){return chooseCustomerOrderProduct(company,index)?.productId||productCandidates(company)[0]||null;}
function priceFor(company,productId){return Math.max(.01,num(company.salesPrices?.[productId],num(company.productPrices?.[productId],1));}
function createLegacyOrder(company,opts){
 if(typeof company.createCustomerOrder==='function')return company.createCustomerOrder(opts);
 const order={id:`micro-order-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,status:'open',createdAt:now(),customer:opts.customer,customerName:opts.customer?.name||'Lokaler Kunde',productId:opts.productId,product:opts.productId,amount:opts.amount,quantity:opts.amount,unitPrice:opts.unitPrice,total:opts.amount*opts.unitPrice,dueAt:now()+opts.dueHours*3600000,source:'micro_local'};
 company.customerOrders=Array.isArray(company.customerOrders)?company.customerOrders:[];company.customerOrders.push(order);return order;
}
export function ensureMicroLocalOrders(game,company,{targetOpen=4}={}){
 if(!company)return[];
 ensureMicroBusiness(company,now());
 const profile=microStarterProfile(company),state=company.microBusinessState||{};
 const open=(company.customerOrders=Array.isArray(company.customerOrders)?company.customerOrders:[]).filter(o=>o?.status==='open');
 let guard=0;
 while(open.length<targetOpen&&guard<Math.max(8,targetOpen*3)){
  const sequence=num(state.completedStarterOrders,0)+open.length+guard;
  const productId=chooseProduct(company,sequence);if(!productId)break;
  const scale=starterOrderScale(company),amount=Math.max(1,Math.round(scale.quantity*(.82+Math.random()*.36)));
  const unitPrice=priceFor(company,productId),customer={id:`local-${profile.industry}-${sequence}`,name:`${profile.customerLabel} ${sequence+1}`,type:'local_micro',starter:true};
  const options={customer,productId,amount,unitPrice,dueHours:Math.max(2,Math.round(scale.durationHours*(.8+Math.random()*.4)))};
  let order=null;
  try{order=game?.customerOrderLifecycle?.createCustomerOrder?.(company,options)||createLegacyOrder(company,options);}catch(error){console.warn('Lokaler Mikroauftrag konnte nicht über Lifecycle erzeugt werden',error);order=createLegacyOrder(company,options);}
  if(order){order.source=order.source||'micro_local';order.microStarter=true;open.push(order);}
  guard++;
 }
 return open;
}
export function installMicroLocalOrders({targetOpen=4}={}){
 if(typeof window==='undefined')return false;
 const run=()=>{const company=window.worldPlayerCompany,game=window.worldEngine;if(!company)return;try{ensureMicroLocalOrders(game,company,{targetOpen});}catch(error){console.warn('Mikro-Kundenaufträge konnten nicht vorbereitet werden',error);}};
 for(const event of ['worldproject:company-founded','worldproject:company-loaded','worldproject:company-switched','world:customer-order-completed'])window.addEventListener(event,()=>setTimeout(run,40));
 setTimeout(run,120);return true;
}
if(typeof window!=='undefined'){window.worldMicroLocalOrders={ensure:ensureMicroLocalOrders,install:installMicroLocalOrders};installMicroLocalOrders();}
