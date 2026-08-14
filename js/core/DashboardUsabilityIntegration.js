// WorldProject - kleine UX-Korrekturen am vorhandenen EconomyDashboard.
// Kein zweiter Dialog: erweitert nur Beschriftung und Kopfzeile des bestehenden Dashboards.
import { EconomyDashboard } from "./EconomyDashboard.js";
import { worldContentRegistry } from "./ContentRegistry.js";

function contentProductLabel(id){
  if(!id)return null;
  const record=worldContentRegistry.get("products",id)||worldContentRegistry.get("product",id);
  return record?.label||record?.name||record?.title||record?.displayName||null;
}

const originalLabel=EconomyDashboard.prototype.label;
EconomyDashboard.prototype.label=function(id){
  const existing=originalLabel.call(this,id);
  if(existing&&existing!=="Artikel")return existing;
  const central=contentProductLabel(id);
  if(central)return central;
  return id?"Produkt":"Artikel";
};

const originalHeader=EconomyDashboard.prototype.header;
EconomyDashboard.prototype.header=function(panel){
  originalHeader.call(this,panel);
  const head=panel?.firstElementChild;
  if(!head)return;
  Object.assign(head.style,{position:"sticky",top:"0",zIndex:"30",background:"#1d232b",padding:"8px 0",boxShadow:"0 8px 12px rgba(29,35,43,.88)"});
  const close=[...head.querySelectorAll("button")].at(-1);
  if(close){close.setAttribute("aria-label","Fenster schließen");close.title="Fenster schließen";}
};

export function runDashboardUsabilityTest(){
  const known=worldContentRegistry.list("products").find(p=>p?.id&&(p.label||p.name||p.title||p.displayName));
  if(known&&!contentProductLabel(known.id))throw new Error("Zentrale Produktbezeichnung wird nicht aufgelöst");
  return true;
}

if(typeof window!=="undefined")window.runDashboardUsabilityTest=runDashboardUsabilityTest;
