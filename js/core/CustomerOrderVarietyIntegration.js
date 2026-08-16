// ORVUNO – Kundenauftraege mit Produktvielfalt statt Lagerbier-Dauerschleife.
// Bleibt bewusst auf der bestehenden Kundenauftrags-Engine und aendert weder Dashboard noch Lieferlogik.
import { ConnectedEconomyGameplay } from './ConnectedEconomyGameplay.js';
import { BeverageRecipeCatalog } from './BeverageRecipeCatalog.js';
import { getIndustryProfile } from './IndustryCatalog.js';

const CUSTOMER_PROFILES=[
  {customer:'REWE Regional',min:700,max:1500,dueMin:60,dueMax:96,distanceMin:15,distanceMax:60,priceFactor:1.03,weight:1.1},
  {customer:'Getränkemarkt West',min:450,max:1200,dueMin:54,dueMax:90,distanceMin:8,distanceMax:45,priceFactor:1.05,weight:1.2},
  {customer:'Gasthaus & Gastronomie',min:180,max:650,dueMin:36,dueMax:72,distanceMin:5,distanceMax:35,priceFactor:1.09,weight:.9},
  {customer:'Verein & Veranstaltung',min:80,max:420,dueMin:24,dueMax:60,distanceMin:4,distanceMax:28,priceFactor:1.12,weight:.8}
];

const randomInt=(min,max)=>Math.floor(min+Math.random()*(max-min+1));
const weightedPick=rows=>{const total=rows.reduce((s,x)=>s+(Number(x.weight)||1),0);let r=Math.random()*total;for(const row of rows){r-=Number(row.weight)||1;if(r<=0)return row;}return rows[rows.length-1];};
const setFrom=value=>Array.isArray(value)?new Set(value.map(String)):null;

export function eligibleCustomerProducts(company){
  const profile=getIndustryProfile(company);
  const allowedProducts=new Set((profile.products||[]).map(String));
  const recipes=(profile.recipes||[]).map(id=>BeverageRecipeCatalog[id]).filter(Boolean);
  const explicitUnlocked=setFrom(company?.unlockedRecipes||company?.unlocked_recipes);
  const lockedRecipes=new Set((company?.lockedRecipes||company?.locked_recipes||[]).map(String));
  const lockedProducts=new Set((company?.lockedProducts||company?.locked_products||[]).map(String));
  const productUnlocks=company?.productUnlocks||company?.product_unlocks||{};
  return recipes.filter(recipe=>{
    if(allowedProducts.size&&!allowedProducts.has(String(recipe.outputId)))return false;
    if(explicitUnlocked&&!explicitUnlocked.has(String(recipe.id)))return false;
    if(lockedRecipes.has(String(recipe.id))||lockedProducts.has(String(recipe.outputId)))return false;
    if(Object.prototype.hasOwnProperty.call(productUnlocks,recipe.outputId)&&productUnlocks[recipe.outputId]===false)return false;
    return true;
  }).map(recipe=>({recipeId:recipe.id,productId:recipe.outputId,name:recipe.name}));
}

function chooseProduct(company,openOrders=[]){
  const eligible=eligibleCustomerProducts(company);
  if(!eligible.length)return null;
  const recent=[...company.customerOrders].slice(-4).map(x=>String(x.productId||''));
  const openCounts=new Map();for(const order of openOrders)openCounts.set(String(order.productId),(openCounts.get(String(order.productId))||0)+1);
  const scored=eligible.map(item=>{const repeats=recent.filter(x=>x===String(item.productId)).length,open=openCounts.get(String(item.productId))||0;return{...item,weight:Math.max(.12,1/(1+repeats*1.5+open*2))};});
  if(scored.length>1){const last=String(company.customerOrders.at(-1)?.productId||'');const alternatives=scored.filter(x=>String(x.productId)!==last);if(alternatives.length&&Math.random()<.82)return weightedPick(alternatives);}
  return weightedPick(scored);
}

function chooseCustomer(openOrders=[]){
  const openNames=new Set(openOrders.map(x=>x.customer));
  const candidates=CUSTOMER_PROFILES.filter(x=>!openNames.has(x.customer));
  return weightedPick(candidates.length?candidates:CUSTOMER_PROFILES);
}

function createVariedOrder(game,company,openOrders=[]){
  const product=chooseProduct(company,openOrders);if(!product)return null;
  const customer=chooseCustomer(openOrders);
  const amount=randomInt(customer.min,customer.max);
  const dueHours=randomInt(customer.dueMin,customer.dueMax);
  const distanceKm=randomInt(customer.distanceMin,customer.distanceMax);
  const market=game.getDemand(company,product.productId);
  const base=Number(company.salesPrices?.[product.productId])||Number(market?.competitorAverage)||.95;
  const unitPrice=Math.round(Math.max(.01,base*customer.priceFactor)*100)/100;
  const result=game.createCustomerOrder(company,{productId:product.productId,amount,unitPrice,dueHours,customer:customer.customer});
  if(result?.success&&result.order){result.order.distanceKm=distanceKm;result.order.customerType=customer.customer;result.order.generatedBy='variety-v1';}
  return result;
}

const original=ConnectedEconomyGameplay.prototype.ensureCustomerOrders;
ConnectedEconomyGameplay.prototype.ensureCustomerOrders=function(company){
  this.ensureCompany(company);
  if(company.setupPhase&&company.setupPhase!=='operating')return[];
  if(company.microBusiness?.stage==='micro')return original.call(this,company);
  const profile=getIndustryProfile(company);
  if(profile.branchKey!=='brewery')return original.call(this,company);
  let open=company.customerOrders.filter(x=>x.status==='open');
  const targetOpen=Math.min(2,Math.max(1,Number(company.customerOrderTarget)||2));
  let guard=0;
  while(open.length<targetOpen&&guard++<8){const result=createVariedOrder(this,company,open);if(!result?.success)break;open=company.customerOrders.filter(x=>x.status==='open');}
  return open;
};

export function runCustomerOrderVarietyRegression(){
  const game=new ConnectedEconomyGameplay();
  const company={type:'Brauerei',setupPhase:'operating',money:10000,customerOrders:[],finishedGoods:{},salesPrices:{lager033_bottle:.95,pils033_bottle:.99},productionMachines:[]};
  game.ensureCompany(company);game.ensureCustomerOrders(company);
  const allowed=new Set(eligibleCustomerProducts(company).map(x=>x.productId));
  const valid=company.customerOrders.length===2&&company.customerOrders.every(x=>allowed.has(x.productId)&&x.amount>0&&x.dueAt&&x.distanceKm>0);
  if(!valid)throw new Error('Kundenauftrag-Vielfalt Regression fehlgeschlagen');
  return{success:true,products:company.customerOrders.map(x=>x.productId)};
}

if(typeof window!=='undefined')window.worldCustomerOrderVariety={eligibleCustomerProducts,test:runCustomerOrderVarietyRegression};
