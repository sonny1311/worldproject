// WorldProject - lesbare Lieferketten fuer Gewerbeauswahl und Betriebsuebersicht.
import { IndustryProfiles } from './IndustryCatalog.js';
import { worldContentRegistry } from './ContentRegistry.js';

const FALLBACK_LABELS={water:'Wasser',bottles:'0,33-l-Flaschen',bottles_050:'0,50-l-Flaschen',caps:'Kronkorken',labels:'Etiketten 0,33 l',labels_050:'Etiketten 0,50 l',malt:'Malz',hops:'Hopfen',barley:'Gerste',wheat:'Weizen',softwood:'Nadel-Schnittholz',hardwood:'Hartholz',animal_feed:'Tierfutter'};
function labelFor(id){const material=worldContentRegistry.get?.('materials',id),product=worldContentRegistry.get?.('products',id);return material?.label||product?.label||FALLBACK_LABELS[id]||String(id).replaceAll('_',' ');}
function producersFor(itemId){return Object.values(IndustryProfiles).filter(p=>(p.products||[]).includes(itemId)).map(p=>p.label);}
function consumersFor(itemId,currentBranch){return Object.values(IndustryProfiles).filter(p=>p.branchKey!==currentBranch&&(p.allowedItems||[]).includes(itemId)).map(p=>p.label);}
export function industryChainSummary(type){const p=IndustryProfiles[type];if(!p)return{inputs:[],outputs:[],upstream:[],downstream:[]};const inputs=(p.allowedItems||[]).map(id=>({id,label:labelFor(id),producers:producersFor(id)}));const outputs=(p.products||[]).map(id=>({id,label:labelFor(id),consumers:consumersFor(id,p.branchKey)}));return{inputs,outputs,upstream:[...new Set(inputs.flatMap(x=>x.producers))],downstream:[...new Set(outputs.flatMap(x=>x.consumers))]};}
export function chainSummaryText(type){const s=industryChainSummary(type),input=s.inputs.map(x=>x.label).join(', ')||'keine direkten Rohstoffe',output=s.outputs.map(x=>x.label).join(', ')||'Dienstleistung / Handel';return `Einkauf: ${input} → Ergebnis: ${output}`;}
export function runIndustryChainPresentationTest(){const malt=industryChainSummary('Mälzerei');if(!malt.inputs.some(x=>x.id==='barley')||!malt.outputs.some(x=>x.id==='malt'))throw new Error('Mälzerei-Lieferkette wird nicht korrekt dargestellt');const glass=industryChainSummary('Glaswerk');if(!glass.outputs.some(x=>x.id==='bottles'))throw new Error('Glaswerk zeigt Flaschen nicht als Ergebnis');return{success:true};}
