// ORVUNO – zeitversetzte Baumaterial-Lieferungen zur Baustelle.
import { ensureExpansionState, ConstructionMaterials } from './LandConstructionExpansionSystem.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const ids=()=>`construction-material-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const baseMinutes=Object.freeze({concrete:18,steel:35,brick:22,insulation:24,electrical:28,pipes:30,roofing:26});
export function pendingConstructionMaterial(company={},item){ensureExpansionState(company);return company.constructionSite.deliveries.filter(d=>d?.kind==='construction_material_order'&&d.item===item&&d.status==='in_transit').reduce((s,d)=>s+n(d.quantity),0);}
export function constructionMaterialEtaMinutes(item,quantity=1){const base=baseMinutes[item]||25,load=Math.min(30,Math.ceil(Math.max(1,n(quantity))/5)*2);return base+load;}
export function orderConstructionMaterial(company={},item,quantity,{unitPrice=0,now=Date.now()}={}){
 ensureExpansionState(company);if(!ConstructionMaterials[item])throw new Error('Unbekanntes Baumaterial');const q=Math.max(0,n(quantity));if(q<=0)throw new Error('Menge muss größer als 0 sein');const cost=Math.max(0,n(unitPrice))*q;if(n(company.money)<cost)throw new Error('Nicht genug Betriebsgeld für Baumaterial');const etaMinutes=constructionMaterialEtaMinutes(item,q);company.money=n(company.money)-cost;const d={id:ids(),kind:'construction_material_order',item,quantity:q,cost,orderedAt:now,etaMinutes,arrivesAt:now+etaMinutes*60000,status:'in_transit',destination:'construction_site'};company.constructionSite.deliveries.push(d);return d;
}
export function processConstructionMaterialDeliveries(company={},now=Date.now()){
 ensureExpansionState(company);const completed=[];for(const d of company.constructionSite.deliveries){if(d?.kind!=='construction_material_order'||d.status!=='in_transit'||n(d.arrivesAt)>now)continue;company.constructionSite.materials[d.item]=n(company.constructionSite.materials[d.item])+n(d.quantity);d.status='delivered';d.deliveredAt=now;completed.push(d);}return completed;
}
export function activeConstructionMaterialDeliveries(company={},now=Date.now()){
 processConstructionMaterialDeliveries(company,now);return company.constructionSite.deliveries.filter(d=>d?.kind==='construction_material_order'&&d.status==='in_transit').map(d=>({...d,remainingMinutes:Math.max(0,Math.ceil((n(d.arrivesAt)-now)/60000))}));
}
if(typeof window!=='undefined')window.worldConstructionMaterialLogistics={order:orderConstructionMaterial,process:processConstructionMaterialDeliveries,active:activeConstructionMaterialDeliveries,pending:pendingConstructionMaterial};
