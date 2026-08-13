// WorldProject - lokale Kleinauftraege fuer Mikrobetriebe.
import { microStarterProfile, starterOrderScale, ensureMicroBusiness } from './MicroBusinessStarterSystem.js';
import { getIndustryProfile } from './IndustryCatalog.js';

const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function openOrders(company){return (company.customerOrders||[]).filter(o=>o.status==='open');}
function chooseProduct(company){const p=getIndustryProfile(company),ids=p.products||[];return ids.find(Boolean)||null;}
function priceFor(company,productId){const direct=num(company.salesPrices?.[productId]);if(direct>0)return direct;const cost=num(company.costAccounting?.productCosts?.[productId]?.costPerUnit);return Math.max(cost>0?cost*1.35:1,0.05);}

export function ensureMicroLocalOrders(game,company,{targetOpen=2}={}){
  if(!game||!company)return[];
  const state=ensureMicroBusiness(company);
  if(state.stage!=='micro'||company.setupPhase!=='operating')return openOrders(company);
  const productId=chooseProduct(company);
  if(!productId)return openOrders(company);
  const scale=starterOrderScale(company),profile=microStarterProfile(company),customers=profile.customers||['Privatkunde'];
  let open=openOrders(company),guard=0;
  while(open.length<targetOpen&&guard++<targetOpen+2){
    const customer=customers[(state.completedStarterOrders+open.length+guard-1)%customers.length];
    const unitPrice=priceFor(company,productId);
    const maxByValue=Math.max(1,Math.floor(scale.maxValue/unitPrice));
    const maxQty=Math.max(1,Math.min(scale.maxQuantity,maxByValue));
    const minQty=Math.max(1,Math.min(maxQty,Math.ceil(Math.min(scale.minValue,scale.maxValue)/unitPrice)));
    const span=Math.max(maxQty-minQty,0),amount=Math.max(1,Math.round(minQty+span*(0.25+Math.random()*0.45)));
    const result=game.createCustomerOrder(company,{customer,productId,amount,unitPrice,dueHours:48+scale.tier*24});
    if(!result?.success)break;
    Object.assign(result.order,{starterOrder:true,local:true,customerClass:scale.customerClass,microTier:scale.tier});
    open=openOrders(company);
  }
  return open;
}

export function runMicroLocalOrderTest(){
 const company={type:'Schreinerei',setupPhase:'operating',customerOrders:[],salesPrices:{table_basic:125},costAccounting:{productCosts:{}},microBusiness:null};
 const fake={createCustomerOrder(c,o){const order={id:`o${c.customerOrders.length+1}`,...o,status:'open'};c.customerOrders.push(order);return{success:true,order};}};
 const rows=ensureMicroLocalOrders(fake,company,{targetOpen:2});
 const success=rows.length===2&&rows.every(o=>o.starterOrder&&o.local&&o.amount*o.unitPrice<=1200.01);
 console[success?'log':'error'](success?'✅ MIKRO-KLEINAUFTRAG-TEST ERFOLGREICH':'❌ MIKRO-KLEINAUFTRAG-TEST FEHLGESCHLAGEN',rows);return{success,rows};
}
if(typeof window!=='undefined'){window.ensureMicroLocalOrders=ensureMicroLocalOrders;window.runMicroLocalOrderTest=runMicroLocalOrderTest;}
