// WorldProject - getrennte operative Ansichten fuer Einkauf, Lieferungen und Produktion.
// Jeder Einstieg zeigt nur den Bereich, den der Spieler angeklickt hat.
import { suppliersForCompany, recipesForCompany } from "./OperationalSupplyChainSystem.js";
import { worldContentRegistry } from "./ContentRegistry.js";
import { i18n } from "./InternationalizationSystem.js";

export class FocusedOperationsDialog {
  constructor({companyProvider=()=>window.worldPlayerCompany,parent=document.body}={}){
    this.companyProvider=companyProvider;
    this.parent=parent;
    this.overlay=null;
    this.mode=null;
  }
  el(tag,text=null){const e=document.createElement(tag);if(text!==null)e.textContent=text;return e;}
  btn(text,fn){const b=this.el("button",text);Object.assign(b.style,{padding:"9px 12px",border:0,borderRadius:"8px",cursor:"pointer",fontWeight:700,margin:"4px"});b.onclick=fn;return b;}
  card(title){const c=this.el("div");Object.assign(c.style,{border:"1px solid #d8d8d8",borderRadius:"10px",padding:"12px",margin:"9px 0",background:"#fff"});const h=this.el("strong",title);c.append(h);return c;}
  validTimestamp(value){if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;const n=Number(value);if(Number.isFinite(n)&&n>0)return n;const p=Date.parse(value);return Number.isFinite(p)&&p>0?p:null;}
  remaining(value){const ts=this.validTimestamp(value);if(!ts)return "Ankunft noch nicht berechnet";const ms=ts-Date.now();if(ms<=0)return "angekommen";const min=Math.ceil(ms/60000),d=Math.floor(min/1440),h=Math.floor((min%1440)/60),m=min%60;return[d?`${d} T`:"",h?`${h} Std.":"",`${m} Min.`].filter(Boolean).join(" ");}
  material(id){const aliases={malt_kg:"malt",hops_kg:"hops",yeast_kg:"yeast",water_l:"water",bottle_033:"bottles",crown_cap:"caps",label_033:"labels"};const key=aliases[id]||id;if(!key)return{label:"Artikel unbekannt",unit:""};const meta=worldContentRegistry.get("materials",key);if(meta)return meta;const translated=i18n.materialLabel(key);return{label:translated===`materials.${key}`?key:translated,unit:""};}
  company(){return this.companyProvider?.()||window.worldPlayerCompany||window.worldEngine?.company||null;}
  open(mode="deliveries"){
    this.close();this.mode=mode;
    const overlay=this.el("div");Object.assign(overlay.style,{position:"fixed",inset:0,zIndex:23000,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:"18px"});
    const panel=this.el("div");Object.assign(panel.style,{width:"min(1120px,96vw)",maxHeight:"92vh",overflow:"auto",background:"#f4f5f7",color:"#111",borderRadius:"14px",padding:"18px",fontFamily:"Arial,sans-serif"});overlay.append(panel);this.parent.append(overlay);this.overlay=overlay;this.render(panel);return overlay;
  }
  close(){this.overlay?.remove();this.overlay=null;}
  header(panel,title){const h=this.el("div");Object.assign(h.style,{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"});h.append(this.el("h2",title),this.btn("✕",()=>this.close()));panel.append(h);}
  render(panel){const company=this.company();if(!company){panel.append(this.el("p","Kein aktiver Betrieb."));return;}if(this.mode==="buy")return this.renderPurchasing(panel,company);if(this.mode==="production")return this.renderProduction(panel,company);return this.renderDeliveries(panel,company);}
  renderPurchasing(panel,company){
    this.header(panel,"📦 Einkauf");panel.append(this.el("p","Hier werden ausschließlich Rohstoffe und Verpackungsmaterial bestellt."));
    const suppliers=suppliersForCompany(company),materials=[...new Set(suppliers.flatMap(s=>s.materials||[]))];
    if(!materials.length)panel.append(this.el("p","Für diesen Betrieb sind noch keine Einkaufsartikel hinterlegt."));
    for(const id of materials){const meta=this.material(id),c=this.card(`${meta.label}${meta.unit?` · ${meta.unit}`:""}`),matching=suppliers.filter(s=>(s.materials||[]).includes(id));c.append(this.el("div",`${matching.length} Lieferant${matching.length===1?"":"en"} verfügbar`));for(const s of matching)c.append(this.el("div",`• ${s.label||s.id} · Qualität ${Math.round(Number(s.quality||0)*100)} % · ${Number(s.distanceKm||0)} km`));panel.append(c);}
    panel.append(this.btn("Bestellmaske öffnen",async()=>{this.close();if(!window.worldOperationalSupplyChainDialog){const {OperationalSupplyChainDialog}=await import("./OperationalSupplyChainDialog.js");window.worldOperationalSupplyChainDialog=new OperationalSupplyChainDialog({companyProvider:()=>this.company(),parent:document.body});}window.worldOperationalSupplyChainDialog.open();}));
  }
  renderDeliveries(panel,company){
    this.header(panel,"🚚 Laufende Lieferungen & Transporte");panel.append(this.el("p","Hier siehst du nur die Waren, die unterwegs oder bereits angekommen sind – inklusive Transport und Restzeit."));
    const state=company.operationalSupplyState||{},orders=[...(state.orders||[]),...(company.supplierOrders||[])];
    const open=orders.filter(o=>!["stored","cancelled","delivered"].includes(o.status));
    if(!open.length){panel.append(this.el("p","Keine offenen Lieferungen."));return;}
    const vehicles=company.vehicles||[];
    for(const o of open){const id=o.material||o.itemId,meta=this.material(id),qty=Number(o.quantity??o.amount)||0,vehicle=vehicles.find(v=>String(v.id)===String(o.vehicleId)),own=o.transportMode==="own"||!!vehicle,transport=own?(vehicle?`Eigener LKW: ${vehicle.name||vehicle.label||vehicle.id}`:"Eigener LKW"):"Lieferant / Spedition",eta=o.eta||o.plannedEta||o.arrivalAt||o.expectedAt,supplier=o.supplierName||o.supplierId||o.offerId||"Lieferant",status=o.status==="arrived"?"Angekommen":o.status==="in_transit"?"Unterwegs":"Bestellt";const c=this.card(`${supplier} · ${meta.label}`);c.append(this.el("div",`Menge: ${qty||"?"}${meta.unit?` ${meta.unit}`:""}`),this.el("div",`Transport: ${transport}`),this.el("div",`Status: ${status}`),this.el("div",`Restzeit: ${this.remaining(eta)}`));if(eta)c.append(this.el("div",`Voraussichtliche Ankunft: ${new Date(this.validTimestamp(eta)).toLocaleString(i18n.locale)}`));panel.append(c);}
  }
  renderProduction(panel,company){
    this.header(panel,"🏗️ Produktionsplanung");panel.append(this.el("p","Hier werden ausschließlich Produkte, Zielmengen und laufende/geplante Produktionen angezeigt."));
    const recipes=recipesForCompany(company),queue=company.operationalSupplyState?.productionQueue||[];
    if(queue.length){const q=this.card(`Laufende/geplante Produktionen: ${queue.length}`);for(const job of queue){const label=job.recipe?.label||job.productLabel||job.product||job.recipeId||"Produktion",qty=job.plan?.output??job.quantity??job.output??job.batches??"?",unit=job.recipe?.outputUnit||job.unit||"";q.append(this.el("div",`• ${label} · ${qty}${unit?` ${unit}`:""} · ${job.status||"geplant"}`));}panel.append(q);}
    if(!recipes.length)panel.append(this.el("p","Für diesen Betrieb sind derzeit keine Produktionsrezepte verfügbar."));else{const c=this.card("Verfügbare Produkte");for(const r of recipes)c.append(this.el("div",`• ${r.label||r.id} · frei wählbare Zielmenge`));panel.append(c);}
    panel.append(this.btn("Produktionsmaske öffnen",async()=>{this.close();if(!window.worldOperationalSupplyChainDialog){const {OperationalSupplyChainDialog}=await import("./OperationalSupplyChainDialog.js");window.worldOperationalSupplyChainDialog=new OperationalSupplyChainDialog({companyProvider:()=>this.company(),parent:document.body});}window.worldOperationalSupplyChainDialog.open();}));
  }
}
