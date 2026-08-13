// WorldProject - generische Einkaufs-/Lager-/Produktionsoberflaeche
import { suppliersForCompany,recipesForCompany,quoteSupplier,SupplyOrderSystem,SupplierContractSystem,WarehouseSystem,ProductionPlanner } from "./OperationalSupplyChainSystem.js";
import { worldContentRegistry } from "./ContentRegistry.js";
import { i18n } from "./InternationalizationSystem.js";

export class OperationalSupplyChainDialog{
 constructor({companyProvider=()=>window.worldPlayerCompany,parent=document.body}={}){
  this.companyProvider=companyProvider;this.parent=parent;this.overlay=null;
  this.contracts=new SupplierContractSystem();this.orders=new SupplyOrderSystem({contracts:this.contracts});
  this.warehouse=new WarehouseSystem();this.planner=new ProductionPlanner({warehouse:this.warehouse,machines:[]});
  this.timer=null;this.loadedCompanyId=null;
 }
 el(tag,text=""){const e=document.createElement(tag);if(text!==null)e.textContent=text;return e;}
 btn(text,fn){const b=this.el("button",text);Object.assign(b.style,{padding:"7px 10px",margin:"3px",cursor:"pointer",borderRadius:"7px",border:"1px solid #bbb"});b.onclick=fn;return b;}
 clone(value){return typeof structuredClone==="function"?structuredClone(value):JSON.parse(JSON.stringify(value));}
 money(v){return Number(v||0).toLocaleString(i18n.locale,{minimumFractionDigits:2,maximumFractionDigits:2})+" €";}
 number(v,max=3){return Number(v||0).toLocaleString(i18n.locale,{maximumFractionDigits:max});}
 materialMeta(id){return worldContentRegistry.get("materials",id)||{id,label:i18n.materialLabel(id),unit:"Einheit"};}
 validTimestamp(value){if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;const direct=Number(value);if(Number.isFinite(direct)&&direct>0)return direct;const parsed=Date.parse(value);return Number.isFinite(parsed)&&parsed>0?parsed:null;}
 remaining(eta,now=Date.now()){const timestamp=this.validTimestamp(eta);if(!timestamp)return i18n.t("time.unknown");const ms=Math.max(0,timestamp-now);if(ms<=0)return i18n.t("time.arrived");const min=Math.ceil(ms/60000),d=Math.floor(min/1440),h=Math.floor((min%1440)/60),m=min%60;return[d?`${d} T`:"",h?`${h} Std`:"",`${m} Min`].filter(Boolean).join(" ");}
 arrivalLabel(eta){const timestamp=this.validTimestamp(eta);return timestamp?new Date(timestamp).toLocaleString(i18n.locale):i18n.t("time.unknown");}
 orderStatus(status){return i18n.t(`status.order.${status}`);}
 productionStatus(status){return i18n.t(`status.production.${status}`);}
 storageLabel(zone){const translated=i18n.t(`storage.${zone}`);return translated===`storage.${zone}`?zone:translated;}
 stateCompanyId(c){return c?.serverCompanyId||c?.id||null;}
 requiresBrewMaster(recipe){return recipe?.productionStage==="brewing";}
 hasActiveBrewMaster(company){const employees=company?.workforceState?.employees||company?.workforceOperationsState?.employees||company?.employees||[];return employees.some(e=>e&&e.active!==false&&e.jobId==="brew_master");}
 staffingAllows(company,recipe){return !this.requiresBrewMaster(recipe)||this.hasActiveBrewMaster(company);}
 stockFor(material){const zone=this.warehouse.zoneFor(material);return Number(this.warehouse.stock?.[zone]?.[material]||0);}

 normalizeOrder(order){
  const o={...(order||{})};let createdAt=this.validTimestamp(o.createdAt||o.orderedAt),plannedEta=this.validTimestamp(o.plannedEta||o.arrivalAt||o.expectedAt),eta=this.validTimestamp(o.eta||o.arrivalAt||o.expectedAt);
  const deliveryHours=Number(o.quote?.deliveryHours??o.deliveryHours);
  if(!plannedEta&&createdAt&&Number.isFinite(deliveryHours)&&deliveryHours>=0)plannedEta=createdAt+deliveryHours*3600000;
  if(!eta)eta=plannedEta;if(createdAt)o.createdAt=createdAt;if(plannedEta)o.plannedEta=plannedEta;if(eta)o.eta=eta;else delete o.eta;return o;
 }
 legacyMaterialId(id){const map={malt_kg:"malt",hops_kg:"hops",yeast_kg:"yeast",water_l:"water",bottle_033:"bottles",crown_cap:"caps",label_033:"labels"};return map[id]||id;}
 migrateLegacyOrders(company,current=[]){
  const result=[...current],seen=new Set(result.map(o=>String(o.legacyId??o.id)));
  for(const legacy of company?.supplierOrders||[]){
   const legacyId=String(legacy.id??`${legacy.offerId||"legacy"}:${legacy.itemId||legacy.material||"item"}:${this.validTimestamp(legacy.orderedAt)||0}`);if(seen.has(legacyId))continue;
   const rawStatus=legacy.status||"ordered",status=rawStatus==="delivered"?"stored":rawStatus==="waiting_storage"?"arrived":rawStatus,material=this.legacyMaterialId(legacy.itemId||legacy.material),quantity=Number(legacy.amount??legacy.quantity)||0,createdAt=this.validTimestamp(legacy.orderedAt||legacy.createdAt)||Date.now(),eta=this.validTimestamp(legacy.arrivalAt||legacy.eta||legacy.expectedAt);
   result.push(this.normalizeOrder({id:`legacy:${legacyId}`,legacyId,supplierId:legacy.supplierId||legacy.offerId||legacy.supplierName||"legacy_supplier",supplierName:legacy.supplierName||null,material,quantity,status,createdAt,eta,plannedEta:eta,transportMode:legacy.transportMode||"supplier",vehicleId:legacy.vehicleId??null,paidCost:Number(legacy.totalCost??legacy.paidCost)||0,legacySource:"supplierOrders"}));seen.add(legacyId);
  }return result;
 }
 ensureMachines(company){
  const state=company?.workforceState?.machines||company?.workforceOperationsState?.machines||company?.machines||[];
  const machines=state.filter(m=>m&&m.status!=="sold").map(m=>{const def=worldContentRegistry.get("machines",m.type)||{};const catalogCapacity=Number(def.capacity||0);if(!(Number(m.capacity)>0)&&catalogCapacity>0)m.capacity=catalogCapacity;if(!m.capacityUnit&&def.capacityUnit)m.capacityUnit=def.capacityUnit;if(!m.label&&def.label)m.label=def.label;return{...m,busy:false,capacity:Number(m.capacity||catalogCapacity||0)};});
  for(const job of this.planner.queue){if(job.status!=="running")continue;let machine=machines.find(m=>job.machine?.id!=null&&String(m.id)===String(job.machine.id));if(!machine)machine=machines.find(m=>m.type===job.recipe?.machineType&&!m.busy);if(machine){machine.busy=true;job.machine=machine;}}
  this.planner.machines=machines;
 }
 loadState(company){
  const id=this.stateCompanyId(company);if(!id||this.loadedCompanyId===id)return;const s=company.operationalSupplyState||{};
  this.contracts.contracts=this.clone(s.contracts||[]);this.contracts.seq=Number(s.contractSeq||Math.max(0,...this.contracts.contracts.map(x=>Number(x.id)||0))+1);
  this.orders.orders=this.migrateLegacyOrders(company,this.clone(s.orders||[]).map(o=>this.normalizeOrder(o)));this.orders.seq=Number(s.orderSeq||Math.max(0,...this.orders.orders.map(x=>Number(x.id)||0))+1);
  if(s.warehouseStock)this.warehouse.stock=this.clone(s.warehouseStock);if(s.baseCapacities)this.warehouse.baseCapacities={...s.baseCapacities};
  this.planner.queue=this.clone(s.productionQueue||[]);this.planner.seq=Number(s.productionSeq||Math.max(0,...this.planner.queue.map(x=>Number(x.id)||0))+1);this.loadedCompanyId=id;this.saveState(company);
 }
 saveState(company){
  if(!company)return;company.operationalSupplyState={contracts:this.clone(this.contracts.contracts),contractSeq:this.contracts.seq,orders:this.clone(this.orders.orders),orderSeq:this.orders.seq,warehouseStock:this.clone(this.warehouse.stock),baseCapacities:{...this.warehouse.baseCapacities},productionQueue:this.planner.queue.map(j=>({...this.clone(j),machine:j.machine?{id:j.machine.id,type:j.machine.type,label:j.machine.label,busy:j.machine.busy}:null})),productionSeq:this.planner.seq,updatedAt:Date.now()};
  window.dispatchEvent(new CustomEvent("world:game-state-dirty",{detail:{reason:"operational-supply-chain"}}));
 }
 async open(){if(this.overlay)return;const o=this.el("div");Object.assign(o.style,{position:"fixed",inset:0,zIndex:22000,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:"15px"});const p=this.el("div");Object.assign(p.style,{width:"min(1180px,97vw)",maxHeight:"94vh",overflow:"auto",background:"#fff",color:"#111",borderRadius:"14px",padding:"18px",fontFamily:"Arial,sans-serif"});o.append(p);this.parent.append(o);this.overlay=o;this.render(p);this.timer=setInterval(()=>{if(this.overlay)this.render(p);},30000);}
 close(){const company=this.companyProvider();this.saveState(company);if(this.timer)clearInterval(this.timer);this.timer=null;this.overlay?.remove();this.overlay=null;}

 renderPurchase(panel,company,suppliers){
  const buyBox=this.el("section");buyBox.append(this.el("h3","Rohstoffe & Verpackung einkaufen"));const materialIds=[...new Set(suppliers.flatMap(s=>s.materials||[]))];if(!materialIds.length)buyBox.append(this.el("p","Für diese Branche sind noch keine Einkaufsartikel hinterlegt."));
  for(const materialId of materialIds){
   const meta=this.materialMeta(materialId),block=this.el("div");Object.assign(block.style,{border:"1px solid #d7d7d7",borderRadius:"10px",padding:"11px",margin:"10px 0"});
   const title=this.el("strong",`${meta.label} · Lager: ${this.number(this.stockFor(materialId))} ${meta.unit}`),controls=this.el("div");Object.assign(controls.style,{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap",margin:"8px 0"});
   const label=this.el("label",`Bestellmenge (${meta.unit})`),qty=this.el("input");qty.type="number";qty.min="0.001";qty.step="any";qty.value=meta.unit==="Stk"?"1000":"50";Object.assign(qty.style,{width:"120px",padding:"6px"});controls.append(label,qty);block.append(title,controls);
   const offers=this.el("div");const renderOffers=()=>{offers.innerHTML="";for(const s of suppliers.filter(x=>(x.materials||[]).includes(materialId))){let q;try{q=quoteSupplier(s,materialId,Number(qty.value)||0);}catch(e){continue;}const row=this.el("div");Object.assign(row.style,{display:"grid",gridTemplateColumns:"minmax(180px,1.4fr) repeat(5,minmax(95px,1fr)) auto",gap:"8px",alignItems:"center",padding:"8px",borderTop:"1px solid #eee"});row.append(this.el("strong",s.label||s.id),this.el("span",`${this.money(q.unitPrice)}/${meta.unit}`),this.el("span",`Qualität ${Math.round(q.quality*100)} %`),this.el("span",`${q.distanceKm} km`),this.el("span",`ca. ${q.deliveryHours} Std.`),this.el("strong",this.money(q.totalCost)),this.btn("Kaufen",()=>{try{const amount=Number(qty.value)||0,freshQuote=quoteSupplier(s,materialId,amount),balance=Number(company.money||0);if(balance+1e-9<freshQuote.totalCost)throw new Error(i18n.t("economy.insufficient_funds",{required:this.money(freshQuote.totalCost),available:this.money(balance)}));const order=this.orders.createOrder({company,supplier:s,material:materialId,quantity:amount});order.paidCost=Number(freshQuote.totalCost||0);company.money=balance-order.paidCost;this.saveState(company);this.render(panel);}catch(e){alert(e.message);}}));offers.append(row);}};qty.oninput=renderOffers;renderOffers();block.append(offers);buyBox.append(block);
  }panel.append(buyBox);
 }
 renderDeliveries(panel,company,suppliers){
  const openOrders=this.orders.orders.filter(o=>!["stored","cancelled"].includes(o.status)),orderBox=this.el("section");orderBox.append(this.el("h3",`Laufende Lieferungen (${openOrders.length})`));if(!openOrders.length)orderBox.append(this.el("p","Keine offenen Lieferungen."));
  for(const o of openOrders){const normalized=this.normalizeOrder(o);Object.assign(o,normalized);const meta=this.materialMeta(o.material),supplier=suppliers.find(s=>s.id===o.supplierId),row=this.el("div");Object.assign(row.style,{border:"1px solid #e1e1e1",borderRadius:"8px",padding:"9px",margin:"6px 0"});row.append(this.el("strong",`${supplier?.label||o.supplierName||o.supplierId} · ${meta.label} · ${this.number(o.quantity)} ${meta.unit}`),this.el("div",`${this.orderStatus(o.status)} · Restzeit ${this.remaining(o.eta)} · Ankunft ${this.arrivalLabel(o.eta)}`));if(o.status==="arrived")row.append(this.btn("Wareneingang / Einlagern",()=>{try{this.warehouse.receive(o);this.saveState(company);this.render(panel);}catch(e){alert(e.message);}}));orderBox.append(row);}panel.append(orderBox);
 }
 renderWarehouse(panel){
  const wh=this.el("section");wh.append(this.el("h3","Lagerbestand"));
  for(const[z,v]of Object.entries(this.warehouse.overview())){const zone=this.el("div");Object.assign(zone.style,{border:"1px solid #ddd",borderRadius:"8px",padding:"9px",margin:"6px 0"});zone.append(this.el("strong",`${this.storageLabel(z)}: ${this.number(v.used)} / ${this.number(v.capacity)} belegt`));const entries=Object.entries(v.stock||{}).filter(([,q])=>Number(q)>0);if(!entries.length)zone.append(this.el("div","Leer"));for(const[id,q]of entries){const m=this.materialMeta(id);zone.append(this.el("div",`${m.label}: ${this.number(q)} ${m.unit}`));}wh.append(zone);}panel.append(wh);
 }

 productionRequirements(row,plan){
  let old=row.querySelector(".requirements");if(old)old.remove();const box=this.el("div");box.className="requirements";Object.assign(box.style,{marginTop:"10px",borderTop:"1px solid #ddd",paddingTop:"8px"});
  box.append(this.el("strong","Benötigt für diese Menge:"));
  for(const[id,requiredRaw]of Object.entries(plan.requirements||{})){
   const required=Number(requiredRaw)||0,have=this.stockFor(id),missing=Math.max(0,required-have),meta=this.materialMeta(id),line=this.el("div");Object.assign(line.style,{display:"grid",gridTemplateColumns:"minmax(180px,1fr) repeat(3,minmax(90px,auto))",gap:"10px",padding:"4px 0"});
   line.append(this.el("span",meta.label),this.el("span",`Bedarf: ${this.number(required)} ${meta.unit}`),this.el("span",`Lager: ${this.number(have)} ${meta.unit}`),this.el("strong",missing>0?`FEHLT: ${this.number(missing)} ${meta.unit}`:"✓ vorhanden"));if(missing>0)line.style.background="rgba(255,0,0,.06)";box.append(line);
  }row.append(box);
 }
 renderProductionCard(parent,r,company,recipes,panel){
  const outputUnit=r.outputUnit||r.unit||"Einheit",bottleSize=Number(r.bottleSizeLiters||0),isBottling=r.productionStage==="bottling"&&bottleSize>0,isBrewing=r.productionStage==="brewing",row=this.el("div");Object.assign(row.style,{border:"1px solid #d8d8d8",borderRadius:"10px",padding:"12px",margin:"10px 0",background:"#fafafa"});
  const title=this.el("h4",r.label||r.id);Object.assign(title.style,{margin:"0 0 8px"});row.append(title);
  const controls=this.el("div");Object.assign(controls.style,{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"});const desired=this.el("input");desired.type="number";desired.min=isBottling?String(bottleSize):"0.1";desired.step="any";desired.value=isBrewing?"100":isBottling?"100":String(Number(r.output||1));Object.assign(desired.style,{width:"110px",padding:"7px",fontSize:"16px"});
  const inputLabel=isBrewing||isBottling?"Gewünschte Menge (Liter):":"Gewünschte Menge:";controls.append(this.el("strong",inputLabel),desired);
  if(isBrewing||isBottling)for(const preset of [50,100,250,500,1000])controls.append(this.btn(`${preset} l`,()=>{desired.value=String(preset);refresh();}));row.append(controls);
  const info=this.el("div");Object.assign(info.style,{marginTop:"8px",fontWeight:700});row.append(info);
  const requested=()=>Math.max(0,Number(desired.value)||0),makePlan=()=>isBottling?this.planner.planForVolume(r,requested()):this.planner.planForOutput(r,requested());
  const refresh=()=>{let plan;try{plan=makePlan();}catch(e){info.textContent=e.message;return;}const staffingReady=this.staffingAllows(company,r),materialsReady=!Object.keys(plan.missing||{}).length,machineReady=!!plan.machineAvailable;let amountText=isBottling?`${this.number(requested())} Liter = ${plan.bottleCount} Flaschen`:`${this.number(requested())} ${isBrewing?"Liter":outputUnit}`;info.textContent=`${amountText} · Dauer ca. ${Math.round(plan.durationMinutes)} min · Produktionskosten ca. ${this.money(plan.estimatedCost)}`;this.productionRequirements(row,plan);let status=row.querySelector(".production-ready");if(status)status.remove();status=this.el("div");status.className="production-ready";Object.assign(status.style,{marginTop:"9px",padding:"8px",borderRadius:"7px",fontWeight:700,background:materialsReady&&machineReady&&staffingReady?"rgba(0,150,0,.10)":"rgba(220,130,0,.12)"});const reasons=[];if(!materialsReady)reasons.push("Rohstoffe/Verpackung fehlen");if(!machineReady)reasons.push("Maschine fehlt oder ist belegt");if(!staffingReady)reasons.push("Braumeister fehlt");status.textContent=reasons.length?`Noch nicht startbereit: ${reasons.join(" · ")}`:"✓ Alles vorhanden – Produktion kann gestartet werden";row.append(status);};
  desired.oninput=refresh;const queueBtn=this.btn("Produktion einplanen",()=>{try{if(isBottling)this.planner.queueForVolume(r,requested());else this.planner.queueForOutput(r,requested());this.ensureMachines(company);this.saveState(company);this.render(panel);}catch(e){alert(e.message);}});Object.assign(queueBtn.style,{marginTop:"10px",padding:"9px 13px"});row.append(queueBtn);refresh();parent.append(row);
 }
 renderProduction(panel,company,recipes){
  const prod=this.el("section");prod.append(this.el("h3","Produktionsplanung"),this.el("p","Menge in Litern eingeben. Darunter siehst du sofort den exakten Bedarf, deinen Lagerbestand und was noch fehlt."));
  if(!recipes.length){prod.append(this.el("p","Für diese Branche sind noch keine Rezepte hinterlegt."));panel.append(prod);return;}
  const groups=[{title:"🍺 Getränk brauen",items:recipes.filter(r=>r.productionStage==="brewing")},{title:"🍾 Abfüllen",items:recipes.filter(r=>r.productionStage==="bottling")},{title:"Weitere Produktion",items:recipes.filter(r=>!["brewing","bottling"].includes(r.productionStage))}];
  for(const g of groups){if(!g.items.length)continue;const section=this.el("div");section.append(this.el("h3",g.title));for(const r of g.items)this.renderProductionCard(section,r,company,recipes,panel);prod.append(section);}panel.append(prod);
 }
 renderQueue(panel,company,recipes){
  const queue=this.el("section"),activeQueue=this.planner.queue.filter(j=>!["finished","cancelled"].includes(j.status));queue.append(this.el("h3",`Produktionswarteschlange (${activeQueue.length})`));
  if(!activeQueue.length)queue.append(this.el("p","Keine Produktion eingeplant."));
  for(const j of this.planner.queue){if(["finished","cancelled"].includes(j.status))continue;const output=j.plan?.output??0,unit=j.recipe?.outputUnit||j.recipe?.unit||"Einheit",remaining=j.status==="running"?this.remaining(j.finishAt):"-",productLabel=j.recipe?.label||worldContentRegistry.get("products",j.recipe?.product)?.label||j.recipe?.product||"Produkt",row=this.el("div",`#${j.id} · ${productLabel} · ${this.number(output)} ${unit} · ${this.productionStatus(j.status)} · Restzeit ${remaining}`);Object.assign(row.style,{border:"1px solid #ddd",padding:"8px",margin:"5px 0",borderRadius:"7px"});if(j.status==="queued")row.append(this.btn(i18n.t("production.start_planned"),()=>{if(!this.staffingAllows(company,j.recipe)){alert(i18n.t("production.brew_master_required"));return;}const started=this.planner.startQueued(j.id);if(!started){alert(i18n.t("production.cannot_start"));return;}this.ensureMachines(company);this.saveState(company);this.render(panel);}),this.btn(i18n.t("production.delete_planned"),()=>{if(this.planner.cancel(j.id)){this.ensureMachines(company);this.saveState(company);this.render(panel);}}));if(j.status==="running")row.append(this.btn(i18n.t("production.pause"),()=>{this.planner.pause(j.id);this.ensureMachines(company);this.saveState(company);this.render(panel);}));if(j.status==="paused")row.append(this.btn(i18n.t("production.resume"),()=>{if(!this.staffingAllows(company,j.recipe)){alert(i18n.t("production.brew_master_required"));return;}this.planner.resume(j.id);this.ensureMachines(company);this.saveState(company);this.render(panel);}));queue.append(row);}panel.append(queue);
 }

 render(panel){
  const company=this.companyProvider();panel.innerHTML="";const head=this.el("div");Object.assign(head.style,{display:"flex",justifyContent:"space-between",alignItems:"center"});head.append(this.el("h2","📦 Einkauf · Lager · Produktion"),this.btn("✕",()=>this.close()));panel.append(head);if(!company){panel.append(this.el("p","Kein aktiver Betrieb."));return;}
  this.loadState(company);const suppliers=suppliersForCompany(company),recipes=recipesForCompany(company);this.ensureMachines(company);this.orders.advance(Date.now());this.planner.advance(Date.now());panel.append(this.el("p",`${company.name||"Betrieb"} · ${suppliers.length} passende Lieferanten · ${recipes.length} Produktionsrezepte`));
  this.renderPurchase(panel,company,suppliers);this.renderDeliveries(panel,company,suppliers);this.renderWarehouse(panel);this.renderProduction(panel,company,recipes);this.renderQueue(panel,company,recipes);this.saveState(company);
 }
}
