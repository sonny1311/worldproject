// WorldProject – Controller für die bestehende Einkaufsansicht.
import { procurementPanelVM } from './ExistingUIIntegrationAdapters.js';
import { supplierCanProvide } from './UniversalIndustryCycle.js';
import { procurementSuggestions } from './IndustryProcurementPlanning.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function procurementPanelState(company){const base=procurementPanelVM(company),suggestions=procurementSuggestions(company);return{...base,suggestions:suggestions.map(s=>({...s,suppliers:supplierCanProvide(company,s.item).map(x=>({id:x.id,label:x.label||x.name||x.id,unitPrice:n(x.prices?.[s.item]),deliveryHours:n(x.deliveryHours)}))})),canOrder:n(company.money)>0};}
export function procurementQuote(company,item,quantity){const q=Math.max(0,n(quantity));const rows=supplierCanProvide(company,item).map(s=>{const unitPrice=n(s.prices?.[item]),shipping=n(s.deliveryBase)+n(s.deliveryPerKm)*n(s.distanceKm);return{supplierId:s.id,label:s.label||s.name||s.id,quantity:q,unitPrice,goodsCost:q*unitPrice,shipping,total:q*unitPrice+shipping,deliveryHours:n(s.deliveryHours),affordable:n(company.money)>=q*unitPrice+shipping};}).sort((a,b)=>a.total-b.total||a.deliveryHours-b.deliveryHours);return{item,quantity:q,quotes:rows,best:rows[0]||null};}
if(typeof window!=='undefined')window.worldProcurementPanel={state:procurementPanelState,quote:procurementQuote};
