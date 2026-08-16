// ORVUNO – gemeinsame Auswahlregeln fuer abwechslungsreiche, produzierbare Kundenauftraege.
// Keine UI- oder Prototyp-Patches hier: die bestehende Kapazitaets-/Fuhrparklogik nutzt diese Helfer.
import { BeverageRecipeCatalog } from './BeverageRecipeCatalog.js';
import { getIndustryProfile } from './IndustryCatalog.js';

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

export function chooseCustomerOrderProduct(company,index=0){
  const eligible=eligibleCustomerProducts(company);
  if(!eligible.length)return null;
  if(eligible.length===1)return eligible[0];
  const orders=Array.isArray(company?.customerOrders)?company.customerOrders:[];
  const open=orders.filter(x=>x?.status==='open');
  const recent=orders.slice(-4);
  const score=item=>{
    const id=String(item.productId);
    const openCount=open.filter(x=>String(x.productId||x.product||'')===id).length;
    const recentCount=recent.filter(x=>String(x.productId||x.product||'')===id).length;
    const wasLast=String(orders.at(-1)?.productId||orders.at(-1)?.product||'')===id?1:0;
    return openCount*100+recentCount*10+wasLast*25;
  };
  const min=Math.min(...eligible.map(score));
  const best=eligible.filter(x=>score(x)===min);
  return best[Math.abs(Number(index)||0)%best.length];
}

export function runCustomerOrderVarietyRegression(){
  const company={type:'Brauerei',customerOrders:[]};
  const first=chooseCustomerOrderProduct(company,0);
  if(!first)throw new Error('Kein produzierbares Kundenprodukt gefunden');
  company.customerOrders.push({productId:first.productId,status:'open'});
  const second=chooseCustomerOrderProduct(company,1);
  if(!second||second.productId===first.productId)throw new Error('Produktwiederholung wurde trotz Alternative nicht vermieden');
  const locked={type:'Brauerei',customerOrders:[],lockedProducts:[second.productId]};
  if(eligibleCustomerProducts(locked).some(x=>x.productId===second.productId))throw new Error('Gesperrtes Produkt ist kundenauftragsfaehig');
  return{success:true,first:first.productId,second:second.productId};
}

if(typeof window!=='undefined')window.worldCustomerOrderVariety={eligibleCustomerProducts,chooseCustomerOrderProduct,test:runCustomerOrderVarietyRegression};
