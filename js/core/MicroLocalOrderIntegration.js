// WorldProject - lokale Kleinauftraege fuer Mikrobetriebe.
import { microStarterProfile, starterOrderScale, ensureMicroBusiness } from './MicroBusinessStarterSystem.js';
import { getIndustryProfile } from './IndustryCatalog.js';

const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function openOrders(company){return (company.customerOrders||[]).filter(o=>o.status==='open');}
function setupBlocksOrders(company){return Boolean(company?.setupPhase)&&company.setupPhase!=='operating';}
function productCandidates(company){
  const ids=[];
  const push=id=>{if(id&&id!=='undefined'&&!ids.includes(id))ids.push(id);};
  for(const o of [...(company.completedCustomerOrders||[]),...(company.customerOrders||[])].reverse())push(o?.productId||o?.product);
  for(const [id,value] of Object.entries(company.operationalSupplyState?.warehouseStock?.finished||{}))if(num(value)>0)push(id);
  for(const [id,value] of Object.entries(company.finishedGoods||{}))if(num(value)>0)push(id);
  for(const id of Object.keys(company.salesPrices||{}))push(id);
  for(const id of getIndustryProfile(company).products||[])push(id);
  return ids;
}
function chooseProduct(company){return productCandidates(company)[0]||null;}
function priceFor(company,productId){
  const direct=num(company.salesPrices?.[productId]);if(direct>0)return direct;
  const previous=[...(company.completedCustomerOrders||[]),...(company.customerOrders||[])].reverse().find(o=>(o?.productId||o?.product)===productId&&num(o?.unitPrice)>0);
  if(previous)return num(previous.unitPrice);
  const cost=num(company.costAccounting?.productCosts?.[productId]?.costPerUnit);return Math.max(cost>0?cost*1.35:1,0.05);
}
function directOrder(company,options={}){
  company.customerOrders??=[];
  const now=Date.now(),hours=Math.max(1,num(options.dueHours,72));
  const order={id:`micro-${now}-${Math.random().toString(36).slice(2,8)}`,customer:options.customer||'Lokaler Kunde',productId:options.productId,product:options.productId,amount:Math.max(1,Math.round(num(options.amount,1))),quantity:Math.max(1,Math.round(num(options.amount,1))),delivered:0,reserved:0,unitPrice:Math.max(.01,num(options.unitPrice,1)),status:'open',createdAt:now,dueAt:now+hours*3600000,qualityMin:0,penaltyPerMissing:0};
  company.customerOrders.push(order);
  try{window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'micro-customer-order-refill'}}));}catch(_){ }
  return{success:true,order,fallback:true};
}

export function ensureMicroLocalOrders(game,company,{targetOpen=2}={}){
  if(!game||!company)return[];
  const state=ensureMicroBusiness(company);
  if(state.stage!=='micro'||setupBlocksOrders(company))return openOrders(company);
  const productId=chooseProduct(company);
  if(!productId){console.warn('⚠️ Mikro-Kundenauftrag: kein verkaufbares Produkt gefunden',company?.name);return openOrders(company);}
  const scale=starterOrderScale(company),profile=microStarterProfile(company),customers=profile.customers||['Privatkunde'];
  let open=openOrders(company),guard=0;
  while(open.length<targetOpen&&guard++<targetOpen+3){
    const customer=customers[(state.completedStarterOrders+open.length+guard-1)%customers.length];
    const unitPrice=priceFor(company,productId);
    const maxByValue=Math.max(1,Math.floor(scale.maxValue/unitPrice));
    const maxQty=Math.max(1,Math.min(scale.maxQuantity,maxByValue));
    const minQty=Math.max(1,Math.min(maxQty,Math.ceil(Math.min(scale.minValue,scale.maxValue)/unitPrice)));
    const span=Math.max(maxQty-minQty,0),amount=Math.max(1,Math.round(minQty+span*(0.25+Math.random()*0.45)));
    const options={customer,productId,amount,unitPrice,dueHours:48+scale.tier*24};
    let result;
    try{result=game.createCustomerOrder(company,options);}catch(error){console.warn('⚠️ Reguläre Kundenauftragserzeugung fehlgeschlagen, nutze Legacy-Fallback',error);}
    if(!result?.success){console.warn('⚠️ Kundenauftrag wurde vom Wirtschaftssystem abgelehnt, nutze Legacy-Fallback',result?.reason||'unbekannt');result=directOrder(company,options);}
    Object.assign(result.order,{starterOrder:true,local:true,customerClass:scale.customerClass,microTier:scale.tier});
    open=openOrders(company);
  }
  return open;
}

export function runMicroLocalOrderTest(){
 const company={type:'Schreinerei',setupPhase:'operating',customerOrders:[],salesPrices:{table_basic:125},costAccounting:{productCosts:{}},microBusiness:null};
 const fake={createCustomerOrder(c,o){const order={id:`o${c.customerOrders.length+1}`,...o,status:'open'};c.customerOrders.push(order);return{success:true,order};}};
 const rows=ensureMicroLocalOrders(fake,company,{targetOpen:2});
 const legacy={type:'Brauerei',customerOrders:[],completedCustomerOrders:[{productId:'beer_lager_033',unitPrice:1.02,status:'completed'}],operationalSupplyState:{warehouseStock:{finished:{beer_lager_033:688}}},salesPrices:{lager033_bottle:.95},costAccounting:{productCosts:{}},microBusiness:{stage:'micro',completedStarterOrders:0}};
 const rejecting={createCustomerOrder(){return{success:false,reason:'test'};}};
 const legacyRows=ensureMicroLocalOrders(rejecting,legacy,{targetOpen:2});
 const success=rows.length===2&&legacyRows.length===2&&legacyRows.every(o=>o.productId==='beer_lager_033'&&o.status==='open')&&rows.every(o=>o.starterOrder&&o.local&&o.amount*o.unitPrice<=1200.01);
 console[success?'log':'error'](success?'✅ MIKRO-KLEINAUFTRAG-TEST ERFOLGREICH':'❌ MIKRO-KLEINAUFTRAG-TEST FEHLGESCHLAGEN',{rows,legacyRows});return{success,rows,legacyRows};
}
if(typeof window!=='undefined'){window.ensureMicroLocalOrders=ensureMicroLocalOrders;window.runMicroLocalOrderTest=runMicroLocalOrderTest;}
