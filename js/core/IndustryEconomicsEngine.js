// WorldProject – tiefer Wirtschaftskern für alle Gewerbe.
// Kalkuliert echte Vollkosten, Mindestpreis, Marge, Break-even und Kapazität ohne neue UI.
import { industryRecipes, industrySuppliers, recipeScale } from "./UniversalIndustryCycle.js";
import { getIndustryProfile } from "./IndustryCatalog.js";
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function cheapestInputPriceInternal(company,item,visited=new Set()){
 const rows=industrySuppliers(company).filter(s=>(s.materials||[]).includes(item)&&Number.isFinite(Number(s.prices?.[item])));
 if(rows.length)return rows.map(s=>({supplierId:s.id,unitPrice:n(s.prices[item]),deliveryBase:n(s.deliveryBase),deliveryPerKm:n(s.deliveryPerKm),distanceKm:n(s.distanceKm),sourceType:'supplier'})).sort((a,b)=>a.unitPrice-b.unitPrice)[0];
 // Zwischenprodukte wie Bier-Fluessigware werden im eigenen Betrieb hergestellt und haben
 // deshalb bewusst keinen Lieferanten. Fuer die Kalkulation verwenden wir deren interne
 // Herstellkosten statt sie als "fehlenden Preis" zu markieren.
 const key=String(item);if(visited.has(key))return null;const nextVisited=new Set(visited);nextVisited.add(key);
 const producer=industryRecipes(company).find(r=>r.product===item&&!r.deprecated);if(!producer)return null;
 let materialCost=0;for(const[input,qtyRaw]of Object.entries(producer.materials||{})){const price=cheapestInputPriceInternal(company,input,nextVisited);if(!price)return null;materialCost+=Math.max(0,n(qtyRaw))*price.unitPrice;}
 const output=Math.max(1,n(producer.output,1)),unitPrice=(materialCost+Math.max(0,n(producer.variableCost)))/output;
 return{supplierId:`internal:${producer.id}`,unitPrice,deliveryBase:0,deliveryPerKm:0,distanceKm:0,sourceType:'internal',recipeId:producer.id};
}
export function cheapestInputPrice(company,item){return cheapestInputPriceInternal(company,item);}
export function recipeCostBreakdown(company,recipeId,amount,{energyRate=.32,laborHourly=24,machineHourly=8,overheadRate=.12}={}){const r=industryRecipes(company).find(x=>x.id===recipeId);if(!r)throw new Error("Rezept nicht gefunden");const q=Math.max(0,n(amount)),need=recipeScale(r,q),inputs=[];let materialCost=0;for(const[item,qty]of Object.entries(need)){const p=cheapestInputPrice(company,item),cost=p?qty*p.unitPrice:0;inputs.push({item,quantity:qty,unitPrice:p?.unitPrice??null,supplierId:p?.supplierId??null,sourceType:p?.sourceType??null,cost,missingPrice:!p});materialCost+=cost;}const factor=q/Math.max(1,n(r.output,1)),minutes=Math.max(1,n(r.durationMinutes,1)*factor),laborCost=minutes/60*laborHourly,machineCost=minutes/60*machineHourly,energyCost=Math.max(.01,minutes/60*energyRate*n(r.energyKw,5)),variableCost=n(r.variableCost)*factor,base=materialCost+laborCost+machineCost+energyCost+variableCost,overhead=base*overheadRate,total=base+overhead,unit=q?total/q:0;return{recipeId,amount:q,inputs,materialCost,laborCost,machineCost,energyCost,variableCost,overhead,total,unitCost:unit,durationMinutes:minutes,missingPrices:inputs.filter(x=>x.missingPrice).map(x=>x.item)};}
export function minimumSalePrice(company,recipeId,amount,{targetMargin=.2,...opts}={}){const c=recipeCostBreakdown(company,recipeId,amount,opts),margin=Math.min(.9,Math.max(0,n(targetMargin,.2))),price=c.unitCost/(1-margin);return{...c,targetMargin:margin,minimumUnitPrice:price,totalRevenueTarget:price*c.amount};}
export function profitabilityAtPrice(company,recipeId,amount,unitPrice,opts={}){const c=recipeCostBreakdown(company,recipeId,amount,opts),revenue=n(unitPrice)*c.amount,profit=revenue-c.total;return{...c,unitPrice:n(unitPrice),revenue,profit,margin:revenue?profit/revenue:0,profitable:profit>=0};}
export function breakEvenQuantity(company,recipeId,unitPrice,{fixedCost=0,...opts}={}){const sample=recipeCostBreakdown(company,recipeId,Math.max(1,n(industryRecipes(company).find(x=>x.id===recipeId)?.output,1)),opts),contribution=n(unitPrice)-sample.unitCost;if(contribution<=0)return Infinity;return Math.ceil(Math.max(0,n(fixedCost))/contribution);}
export function equipmentInvestment(company){const p=getIndustryProfile(company);return(p.equipment||[]).filter(x=>x.required!==false).reduce((s,x)=>s+n(x.price),0);}
export function productionCapacity(company,recipeId,hours=24){const r=industryRecipes(company).find(x=>x.id===recipeId);if(!r)return 0;return Math.floor(Math.max(0,n(hours))*60/Math.max(1,n(r.durationMinutes))*Math.max(1,n(r.output,1)));}
export function economicsAudit(company){const rows=industryRecipes(company).map(r=>{const c=recipeCostBreakdown(company,r.id,Math.max(1,n(r.output,1)));return{recipeId:r.id,unitCost:c.unitCost,missingPrices:c.missingPrices,durationMinutes:c.durationMinutes,capacity24h:productionCapacity(company,r.id,24)};});return{success:rows.every(x=>!x.missingPrices.length&&Number.isFinite(x.unitCost)&&x.unitCost>=0),equipmentInvestment:equipmentInvestment(company),recipes:rows};}
