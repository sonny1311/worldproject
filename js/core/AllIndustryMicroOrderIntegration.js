// WorldProject - ergänzt die vorhandenen Mikro-Kundenaufträge um Branchen,
// deren Produkte ausschließlich im zentralen ContentRegistry liegen.
import { ensureMicroLocalOrders } from './MicroLocalOrderIntegration.js';
import { microStarterProfile, starterOrderScale, ensureMicroBusiness } from './MicroBusinessStarterSystem.js';
import { getIndustryProfile } from './IndustryCatalog.js';
import '../content/AllIndustryEconomyContent.js';
import { worldContentRegistry } from './ContentRegistry.js';

const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const openOrders=company=>(company.customerOrders||[]).filter(order=>order.status==='open');

export function registeredStarterProduct(company){
  const profile=getIndustryProfile(company),branchKey=company.branchKey||profile.branchKey;
  return worldContentRegistry.list('products').find(product=>product.sellable!==false&&(product.industries||[]).includes(branchKey))||null;
}

function priceFor(company,productId){
  const direct=num(company.salesPrices?.[productId]);
  if(direct>0)return direct;
  const cost=num(company.costAccounting?.productCosts?.[productId]?.costPerUnit);
  return Math.max(cost>0?cost*1.35:1,0.05);
}

export function ensureAllIndustryMicroLocalOrders(game,company,{targetOpen=2}={}){
  const existing=ensureMicroLocalOrders(game,company,{targetOpen});
  if(existing.length>=targetOpen)return existing;
  if(!game||!company)return existing;
  const state=ensureMicroBusiness(company);
  if(state.stage!=='micro'||company.setupPhase!=='operating')return existing;
  const legacyProducts=getIndustryProfile(company).products||[];
  if(legacyProducts.some(Boolean))return existing;
  const product=registeredStarterProduct(company);
  if(!product)return existing;
  const scale=starterOrderScale(company),profile=microStarterProfile(company),customers=profile.customers||['Privatkunde'];
  let open=openOrders(company),guard=0;
  while(open.length<targetOpen&&guard++<targetOpen+2){
    const customer=customers[(state.completedStarterOrders+open.length+guard-1)%customers.length];
    const unitPrice=priceFor(company,product.id);
    const maxByValue=Math.max(1,Math.floor(scale.maxValue/unitPrice));
    const maxQty=Math.max(1,Math.min(scale.maxQuantity,maxByValue));
    const minQty=Math.max(1,Math.min(maxQty,Math.ceil(Math.min(scale.minValue,scale.maxValue)/unitPrice)));
    const span=Math.max(maxQty-minQty,0),amount=Math.max(1,Math.round(minQty+span*(0.25+Math.random()*0.45)));
    const result=game.createCustomerOrder(company,{customer,productId:product.id,amount,unitPrice,dueHours:48+scale.tier*24});
    if(!result?.success)break;
    Object.assign(result.order,{starterOrder:true,local:true,customerClass:scale.customerClass,microTier:scale.tier});
    open=openOrders(company);
  }
  return open;
}

export function runAllIndustryMicroOrderRegression(){
  const bakery={type:'Bäckerei',setupPhase:'operating',customerOrders:[],salesPrices:{bread_basic:3.8},costAccounting:{productCosts:{}},microBusiness:null};
  const fake={createCustomerOrder(company,options){const order={id:`test-${company.customerOrders.length+1}`,...options,status:'open'};company.customerOrders.push(order);return{success:true,order};}};
  const rows=ensureAllIndustryMicroLocalOrders(fake,bakery,{targetOpen:2});
  const success=rows.length===2&&rows.every(order=>order.productId==='bread_basic'&&order.starterOrder&&order.local&&order.amount*order.unitPrice<=1200.01);
  const report={success,product:registeredStarterProduct(bakery)?.id||null,rows};
  console[success?'log':'error'](success?'✅ ALLE-GEWERBE-MIKROAUFTRAG-TEST ERFOLGREICH':'❌ ALLE-GEWERBE-MIKROAUFTRAG-TEST FEHLGESCHLAGEN',report);
  return report;
}

if(typeof window!=='undefined')window.runAllIndustryMicroOrderRegression=runAllIndustryMicroOrderRegression;
