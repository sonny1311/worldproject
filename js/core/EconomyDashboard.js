// WorldProject - sichtbare Wirtschaftsspiel-Oberfläche
import { UnifiedOperationsOverviewSystem } from "./UnifiedOperationsOverviewSystem.js";
import { i18n } from "./InternationalizationSystem.js";

export class EconomyDashboard {
    constructor({controller,company,parent=document.body}={}){this.controller=controller;this.company=company;this.parent=parent;this.overlay=null;this.operationsOverview=new UnifiedOperationsOverviewSystem({companyProvider:()=>this.company});}
    el(tag,text=null){const e=document.createElement(tag);if(text!==null)e.textContent=text;return e;}
    money(v){return Number(v||0).toLocaleString(i18n.locale,{minimumFractionDigits:2,maximumFractionDigits:2});}
    amount(v){return Number(v||0).toLocaleString(i18n.locale,{maximumFractionDigits:2});}
    label(id){const materialAliases={malt_kg:"malt",hops_kg:"hops",yeast_kg:"yeast",water_l:"water",bottle_033:"bottles",crown_cap:"caps",label_033:"labels"};const materialId=materialAliases[id]||id,translated=i18n.materialLabel(materialId);if(translated!==`materials.${materialId}`)return translated;return({lager033_bottle:"Lagerbier 0,33 l",pils033_bottle:"Pils 0,33 l",lager033:"Lagerbier",pils:"Pils",timber_spruce_m3:"Fichtenholz",timber_oak_m3:"Eichenholz",board_mdf_m2:"MDF-Platten",glue_kg:"Holzleim",fittings_set:"Beschlagsatz"})[id]||id;}
    productionStatus(status){const key=`status.production.${status||"queued"}`,text=i18n.t(key);return text===key?String(status||""):text;}
    validTimestamp(value){if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;const direct=Number(value);if(Number.isFinite(direct)&&direct>0)return direct;const parsed=Date.parse(value);return Number.isFinite(parsed)&&parsed>0?parsed:null;}
    remaining(value){const ts=this.validTimestamp(value);if(!ts)return i18n.t("time.unknown");const ms=Math.max(0,ts-Date.now());if(ms<=0)return i18n.t("time.arrived");const mins=Math.ceil(ms/60000),h=Math.floor(mins/60),m=mins%60;return`${h?`${h} Std. `:""}${m} Min.`;}
    open(){if(this.overlay)return;const overlay=this.el("div");Object.assign(overlay.style,{position:"fixed",inset:0,zIndex:12000,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});const panel=this.el("div");Object.assign(panel.style,{width:"min(1320px,97vw)",maxHeight:"94vh",overflow:"auto",background:"#1d232b",color:"#fff",borderRadius:"14px",padding:"22px",fontFamily:"Arial,sans-serif",boxShadow:"0 20px 70px rgba(0,0,0,.5)"});overlay.append(panel);this.overlay=overlay;this.parent.append(overlay);this.render(panel);}
    close(){this.overlay?.remove();this.overlay=null;}
    card(title){const c=this.el("div");Object.assign(c.style,{background:"rgba(255,255,255,.075)",borderRadius:"10px",padding:"16px",minWidth:"260px",flex:"1"});const h=this.el("div",title);Object.assign(h.style,{fontWeight:700,marginBottom:"10px",fontSize:"17px"});c.append(h);return c;}
    button(text,onClick){const b=this.el("button",text);Object.assign(b.style,{border:0,borderRadius:"8px",padding:"9px 11px",cursor:"pointer",fontWeight:700,margin:"4px",background:"#fff",color:"#111"});b.addEventListener("click",onClick);return b;}
    stockRow(name,value,unit=""){const row=this.el("div");Object.assign(row.style,{display:"flex",justifyContent:"space-between",gap:"16px",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.08)"});row.append(this.el("span",name),this.el("strong",`${this.amount(value)}${unit?" "+unit:""}`));return row;}
    small(text){const e=this.el("div",text);Object.assign(e.style,{fontSize:"12px",opacity:.78,margin:"3px 0"});return e;}
    anchorCard(card,id){card.id=id;return card;}
    jumpTo(id){const target=this.overlay?.querySelector?.(`#${id}`);if(target){target.scrollIntoView({behavior:"smooth",block:"center"});const old=target.style.outline;target.style.outline="2px solid #ffd54a";setTimeout(()=>target.style.outline=old,1400);}}

    focusOperationalDialog(section="buy"){
        const dialog=window.worldOperationalSupplyChainDialog,overlay=dialog?.overlay;
        if(!overlay)return;
        const wanted={buy:"Rohstoffe einkaufen",deliveries:"Laufende Lieferungen",production:"Produktionsplanung"}[section]||"Rohstoffe einkaufen";
        const title={buy:"📦 Einkauf",deliveries:"🚚 Lieferungen & Transporte",production:"🏗️ Produktion"}[section]||"📦 Einkauf";
        const h2=overlay.querySelector("h2");if(h2)h2.textContent=title;
        overlay.querySelectorAll("section").forEach(sec=>{const h3=sec.querySelector("h3");sec.style.display=h3?.textContent?.includes(wanted)?"":"none";});
    }
    async openOperationalSupplyChain(section="buy"){
        const company=window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||this.company;
        if(window.worldEconomyGameplay)window.worldEconomyGameplay.company=company;
        if(!window.worldOperationalSupplyChainDialog){
            const {OperationalSupplyChainDialog}=await import("./OperationalSupplyChainDialog.js");
            window.worldOperationalSupplyChainDialog=new OperationalSupplyChainDialog({companyProvider:()=>window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null,parent:document.body});
        }
        const dialog=window.worldOperationalSupplyChainDialog;
        if(dialog.overlay){dialog.close();}
        await dialog.open();
        this.focusOperationalDialog(section);
        requestAnimationFrame(()=>this.focusOperationalDialog(section));
    }

    header(panel){const head=this.el("div");Object.assign(head.style,{display:"flex",justifyContent:"space-between",gap:"10px",alignItems:"center"});const title=this.el("div",`🏭 ${this.company.name||"WorldProject"} · Betrieb ${this.company.slotNo||1} · ${this.company.type||""}`);Object.assign(title.style,{fontSize:"24px",fontWeight:800});head.append(title,this.button("✕",()=>this.close()));panel.append(head);}
    renderSetup(panel){const state=this.controller.getSetupState(this.company),progress=state.progress;const info=this.card("🛠️ Gründungsphase – Gebäude einrichten");info.append(this.el("div",`${state.building.name} · ${state.building.areaM2||0} m²`));info.append(this.small("Der Betrieb ist noch nicht eröffnet. Lieferanten, Produktion und Kundenaufträge werden erst nach der Mindestausstattung freigeschaltet."));info.append(this.el("div",`Fortschritt: ${progress.percent} % · Phase: ${state.phase}`));panel.append(info);}
    renderSuppliers(grid){const profile=this.controller.getIndustryProfile(this.company),suppliers=this.anchorCard(this.card(i18n.t("operations.supply_title")),"dashboard-deliveries"),items=profile.allowedItems||[];if(!items.length){suppliers.append(this.el("div","Für diese Branche wird der Lieferantenkatalog noch ergänzt."));grid.append(suppliers);return;}suppliers.append(this.small("Rohstoffe und Verpackungsmaterial bestellen."),this.button("Einkauf öffnen",()=>this.openOperationalSupplyChain("buy")));const openOrders=this.operationsOverview.openDeliveries();if(openOrders.length)suppliers.append(this.el("strong",`${openOrders.length} offene Lieferung${openOrders.length===1?"":"en"}`),this.button("Lieferungen anzeigen",()=>this.openOperationalSupplyChain("deliveries")));else suppliers.append(this.small("Keine offenen Lieferungen."));grid.append(suppliers);}

    render(panel){
        this.controller.processTime(this.company,new Date());panel.innerHTML="";this.header(panel);
        if(this.company.setupPhase&&this.company.setupPhase!=="operating"){this.renderSetup(panel);return;}
        this.controller.ensureCustomerOrders(this.company);
        const storage=this.controller.getStorageStatus(this.company),mission=this.controller.missions.getActiveMission(this.company),report=this.controller.getReport(this.company,168),operationCounters=this.operationsOverview.counters();
        const summary=this.el("div");Object.assign(summary.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"10px",margin:"18px 0"});for(const[t,v]of[["💶 Firmenkonto",`${this.money(this.company.money)} €`],["🪙 Coins",`${this.company.coins||0}`],["🚚 Fuhrpark",`${this.company.vehicles?.length||0} Fahrzeuge`],["🏬 Lager",`${this.amount(storage.used)} / ${this.amount(storage.capacity)}`],["📈 Wochengewinn",`${this.money(report.profit)} €`],["🎯 Aufgabe",mission?`${mission.deliveredAmount}/${mission.targetAmount}`:"Keine"]]){const c=this.card(t);c.append(this.el("div",v));summary.append(c);}panel.append(summary);
        const grid=this.el("div");Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(315px,1fr))",gap:"12px"});this.renderSuppliers(grid);
        const profile=this.controller.getIndustryProfile(this.company),production=this.anchorCard(this.card(i18n.t("operations.production_title")),"dashboard-production");
        if(profile.branchKey==="brewery"){production.append(this.small("Produktionsmengen, Rezepte und laufende Chargen verwalten."),this.button("Produktion öffnen",()=>this.openOperationalSupplyChain("production")));const q=this.operationsOverview.activeProduction();if(q.length){production.append(this.el("strong",`${q.length} laufende/geplante Produktion${q.length===1?"":"en"}`));q.forEach(j=>production.append(this.small(`${j.recipe?.label||this.label(j.productId||j.product||j.recipeId||"Produktion")} · ${this.productionStatus(j.status)}`)));}}else production.append(this.small("Branchenspezifische Produktionsrezepte werden noch ergänzt."));grid.append(production);
        const customerCard=this.anchorCard(this.card("📋 Kundenaufträge"),"dashboard-customer-orders"),customerOrders=this.operationsOverview.openCustomerOrders();if(!customerOrders.length)customerCard.append(this.small("Keine offenen Kundenaufträge."));for(const o of customerOrders){const qty=o.quantity||o.amount||0,done=o.deliveredQuantity||o.fulfilledQuantity||0,product=this.label(o.product||o.productId||o.itemId||"Produkt"),customer=o.customerName||o.customer?.name||o.customerId||o.customer||"Kunde";customerCard.append(this.el("strong",`${customer} · ${product}`),this.small(`${this.amount(done)} / ${this.amount(qty)} erfüllt · Status ${o.status||"offen"}`));}grid.append(customerCard);
        const fleet=this.card("🚛 Fuhrpark, Tank & Wartung");const first=this.company.vehicles?.[0];fleet.append(this.el("div",first?`${first.name} · ${first.status} · ${Math.round(first.odometerKm||0)} km · Tank ${this.amount(first.fuelLiters)} l · Zustand ${Number(first.condition||100).toFixed(1)} %`:"Noch kein Fahrzeug"));grid.append(fleet);
        const warehouse=this.card("🏬 Lager nach Bereichen"),areas=this.controller.getStorageAreas(this.company);warehouse.append(this.small(`Rohstoffe: ${this.amount(areas.raw.used)} / ${this.amount(areas.raw.capacity)}`),this.small(`Verpackung: ${this.amount(areas.packaging.used)} / ${this.amount(areas.packaging.capacity)}`),this.small(`Fertigware: ${this.amount(areas.finished.used)} / ${this.amount(areas.finished.capacity)}`));grid.append(warehouse);
        const finance=this.card("📊 Tages-/Wochenübersicht");finance.append(this.stockRow("Einnahmen 7 Tage",`${this.money(report.income)} €`),this.stockRow("Kosten 7 Tage",`${this.money(report.costs)} €`),this.stockRow("Gewinn 7 Tage",`${this.money(report.profit)} €`));const nav=this.el("div");Object.assign(nav.style,{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"10px"});nav.append(this.button(`🚚 ${operationCounters.deliveries} Lieferungen`,()=>this.openOperationalSupplyChain("deliveries")),this.button(`🏗️ ${operationCounters.production} Produktion`,()=>this.openOperationalSupplyChain("production")),this.button(`📋 ${operationCounters.customerOrders} Kundenaufträge`,()=>this.jumpTo("dashboard-customer-orders")));finance.append(nav);grid.append(finance);panel.append(grid);
    }
}
