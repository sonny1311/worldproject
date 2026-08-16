// WorldProject - lesbare Lieferketten fuer Gewerbeauswahl und Betriebsuebersicht.
import { IndustryProfiles } from './IndustryCatalog.js';
import { worldContentRegistry } from './ContentRegistry.js';

const FALLBACK_LABELS={
 water:'Wasser',water_l:'Wasser',bottles:'0,33-l-Flaschen',bottle_033:'Neue 0,33-l-Flaschen',bottles_050:'0,50-l-Flaschen',caps:'Kronkorken',crown_cap:'Kronkorken',labels:'Etiketten 0,33 l',label_033:'Etiketten 0,33 l',labels_050:'Etiketten 0,50 l',label_050:'Etiketten 0,50 l',
 malt:'Malz',malt_kg:'Malz',hops:'Hopfen',hops_kg:'Hopfen',yeast_kg:'Hefe',barley:'Gerste',wheat:'Weizen',corn:'Mais',rapeseed:'Raps',potatoes:'Kartoffeln',straw:'Stroh',
 lager033_bottle:'Lagerbier 0,33 l',pils033_bottle:'Pils 0,33 l',beer_bulk_lager:'Lagerbier – Flüssigware',beer_bulk_pils:'Pils – Flüssigware',
 seed_wheat:'Weizensaatgut',seed_barley:'Gerstensaatgut',seed_corn:'Maissaatgut',seed_rapeseed:'Rapssaatgut',seed_potato:'Pflanzkartoffeln',fertilizer:'Dünger',diesel:'Diesel',animal_feed:'Tierfutter',
 milk:'Rohmilch',cattle:'Rinder',pigs:'Schweine',eggs:'Eier',apples:'Äpfel',pears:'Birnen',cherries:'Kirschen',
 softwood:'Nadel-Schnittholz',hardwood:'Hartholz',timber_spruce_m3:'Fichtenholz',timber_oak_m3:'Eichenholz',board_mdf_m2:'MDF-Platten',glue_kg:'Leim',fittings_set:'Beschlagsatz',table_basic:'Tisch',cabinet_basic:'Schrank'
};
function labelFor(id){const material=worldContentRegistry.get?.('materials',id),product=worldContentRegistry.get?.('products',id);return material?.label||product?.label||FALLBACK_LABELS[id]||String(id).replaceAll('_',' ');}
function producersFor(itemId){return Object.values(IndustryProfiles).filter(p=>(p.products||[]).includes(itemId)).map(p=>p.label);}
function consumersFor(itemId,currentBranch){return Object.values(IndustryProfiles).filter(p=>p.branchKey!==currentBranch&&(p.allowedItems||[]).includes(itemId)).map(p=>p.label);}
export function industryChainSummary(type){const p=IndustryProfiles[type];if(!p)return{inputs:[],outputs:[],upstream:[],downstream:[]};const inputs=(p.allowedItems||[]).map(id=>({id,label:labelFor(id),producers:producersFor(id)}));const outputs=(p.products||[]).map(id=>({id,label:labelFor(id),consumers:consumersFor(id,p.branchKey)}));return{inputs,outputs,upstream:[...new Set(inputs.flatMap(x=>x.producers))],downstream:[...new Set(outputs.flatMap(x=>x.consumers))]};}
export function chainSummaryText(type){const s=industryChainSummary(type),input=s.inputs.map(x=>x.label).join(', ')||'keine direkten Rohstoffe',output=s.outputs.map(x=>x.label).join(', ')||'Dienstleistung / Handel';return `Einkauf: ${input} → Ergebnis: ${output}`;}
export function runIndustryChainPresentationTest(){const malt=industryChainSummary('Mälzerei');if(!malt.inputs.some(x=>x.id==='barley')||!malt.outputs.some(x=>x.id==='malt'))throw new Error('Mälzerei-Lieferkette wird nicht korrekt dargestellt');const glass=industryChainSummary('Glaswerk');if(!glass.outputs.some(x=>x.id==='bottles'))throw new Error('Glaswerk zeigt Flaschen nicht als Ergebnis');return{success:true};}
