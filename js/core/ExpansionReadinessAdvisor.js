// WorldProject – verständliche Ausbau-Checkliste für Grundstück, Gebäude und Lager.
import { freeLandSqm, constructionMaterialNeed } from './LandConstructionExpansionSystem.js';
import { warehouseExpansionOverview } from './WarehouseConstructionExpansionSystem.js';
import { progressiveBuildingQuote, progressiveBuildingMaterialNeed } from './ProgressiveBuildingExpansionSystem.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const row=(id,label,ok,detail,action=null)=>({id,label,ok:!!ok,detail,action});
export function buildingExpansionReadiness(company,type){
 const q=progressiveBuildingQuote(company,type),materials=progressiveBuildingMaterialNeed(company,type),free=freeLandSqm(company),missing=materials.filter(x=>x.missing>0),money=n(company.money),rows=[
  row('land','Grundstücksfläche',free>=q.sqm,free>=q.sqm?`${free} m² frei`:`Nur ${free} m² frei, benötigt ${q.sqm} m²`,'expansion'),
  row('materials','Baumaterial',missing.length===0,missing.length?missing.map(x=>`${x.label}: ${x.missing} ${x.unit}`).join(' · '):'Alles auf der Baustelle vorhanden','expansion'),
  row('money','Baukosten',money>=q.cost,money>=q.cost?`${q.cost.toLocaleString('de-DE')} € verfügbar`:`${q.cost.toLocaleString('de-DE')} € benötigt`,'finance')
 ];
 return{kind:'building',type,label:q.label,stage:q.stage,allowed:rows.every(x=>x.ok),rows,nextAction:rows.find(x=>!x.ok)?.action||null,hint:!rows[0].ok?'Zuerst Grundstück erweitern, damit genug Baufläche vorhanden ist.':!rows[1].ok?'Baumaterial direkt zur Baustelle liefern lassen.':!rows[2].ok?'Erst genügend Betriebskapital erwirtschaften.':'Alle Voraussetzungen erfüllt.'};
}
export function warehouseExpansionReadiness(company){
 const o=warehouseExpansionOverview(company),q=o.next,booking=o.bookings.find(x=>x.status==='booked'),missing=o.materials.filter(x=>x.missing>0),money=n(company.money),roughCrew=Math.min(...o.crews.map(x=>n(x.dailyCost,0))),roughTotal=q.buildCost+Math.max(0,roughCrew),rows=[
  row('land','Grundstücksfläche',q.landAvailable,q.landAvailable?`${q.freeSqm} m² frei`:`Nur ${q.freeSqm} m² frei, benötigt ${q.requiredSqm} m²`,'expansion'),
  row('materials','Baumaterial',missing.length===0,missing.length?missing.map(x=>`${x.label}: ${x.missing} ${x.unit}`).join(' · '):'Alles auf der Baustelle vorhanden','expansion'),
  row('crew','Bautrupp',!!booking,booking?`${booking.label} gebucht`:'Noch keinen Bautrupp gebucht','expansion'),
  row('money','Kapital',money>=roughTotal,money>=roughTotal?'Kapital reicht voraussichtlich':'Mehr Betriebskapital erforderlich','finance')
 ];
 return{kind:'warehouse',allowed:rows.every(x=>x.ok),rows,nextAction:rows.find(x=>!x.ok)?.action||null,hint:!rows[0].ok?'Nicht genug Grundstücksfläche – zuerst Land kaufen/erweitern.':!rows[1].ok?'Zuerst Baumaterial zur Baustelle liefern lassen.':!rows[2].ok?'Einen Bautrupp buchen.':!rows[3].ok?'Erst weiteres Kapital erwirtschaften.':'Lagerausbau kann gestartet werden.'};
}
export function runExpansionReadinessAdvisorTest(){const c={type:'Brauerei',money:0,land:{totalSqm:300,expansionLevel:0,reservedSqm:0},buildingState:{rooms:[{id:'starter',sqm:280,status:'finished'}],equipment:[]},constructionSite:{materials:{},jobs:[],deliveries:[]},warehouseExpansion:{level:0,extraSlots:0,jobs:[],crewBookings:[]}};const w=warehouseExpansionReadiness(c);if(w.allowed||!w.hint.toLowerCase().includes('grundstück'))throw new Error('Flächenhinweis fehlt');return true;}
if(typeof window!=='undefined')window.worldExpansionReadinessAdvisor={building:buildingExpansionReadiness,warehouse:warehouseExpansionReadiness,runTest:runExpansionReadinessAdvisorTest};
