// WorldProject - sichtbare Wirtschaftsspiel-Oberfläche
export class EconomyDashboard {
    constructor({controller,company,parent=document.body}={}){this.controller=controller;this.company=company;this.parent=parent;this.overlay=null;}
    el(tag,text=null){const e=document.createElement(tag);if(text!==null)e.textContent=text;return e;}
    money(v){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});}
    amount(v){return Number(v||0).toLocaleString("de-DE",{maximumFractionDigits:2});}
    label(id){return({malt_kg:"Malz",hops_kg:"Hopfen",yeast_kg:"Hefe",water_l:"Wasser",bottle_033:"0,33-l-Flaschen",crown_cap:"Kronkorken",label_033:"Etiketten 0,33 l",lager033_bottle:"Lagerbier 0,33 l",pils033_bottle:"Pils 0,33 l",timber_spruce_m3:"Fichtenholz",timber_oak_m3:"Eichenholz",board_mdf_m2:"MDF-Platten",glue_kg:"Holzleim",fittings_set:"Beschlagsatz"})[id]||id;}
    open(){if(this.overlay)return;const overlay=this.el("div");Object.assign(overlay.style,{position:"fixed",inset:0,zIndex:12000,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});const panel=this.el("div");Object.assign(panel.style,{width:"min(1320px,97vw)",maxHeight:"94vh",overflow:"auto",background:"#1d232b",color:"#fff",borderRadius:"14px",padding:"22px",fontFamily:"Arial,sans-serif",boxShadow:"0 20px 70px rgba(0,0,0,.5)"});overlay.append(panel);this.overlay=overlay;this.parent.append(overlay);this.render(panel);}
    close(){this.overlay?.remove();this.overlay=null;}
    card(title){const c=this.el("div");Object.assign(c.style,{background:"rgba(255,255,255,.075)",borderRadius:"10px",padding:"16px",minWidth:"260px",flex:"1"});const h=this.el("div",title);Object.assign(h.style,{fontWeight:700,marginBottom:"10px",fontSize:"17px"});c.append(h);return c;}
    button(text,onClick){const b=this.el("button",text);Object.assign(b.style,{border:0,borderRadius:"8px",padding:"9px 11px",cursor:"pointer",fontWeight:700,margin:"4px",background:"#fff",color:"#111"});b.addEventListener("click",onClick);return b;}
    input(value="",type="text"){const i=this.el("input");i.type=type;i.value=value;Object.assign(i.style,{padding:"8px",borderRadius:"7px",border:"1px solid #aaa",margin:"4px",maxWidth:"140px"});return i;}
    stockRow(name,value,unit=""){const row=this.el("div");Object.assign(row.style,{display:"flex",justifyContent:"space-between",gap:"16px",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.08)"});row.append(this.el("span",name),this.el("strong",`${this.amount(value)}${unit?" "+unit:""}`));return row;}
    small(text){const e=this.el("div",text);Object.assign(e.style,{fontSize:"12px",opacity:.78,margin:"3px 0"});return e;}
    anchorCard(card,id){card.id=id;return card;}
    jumpTo(id){const target=this.overlay?.querySelector?.(`#${id}`);if(target){target.scrollIntoView({behavior:"smooth",block:"center"});const old=target.style.outline;target.style.outline="2px solid #ffd54a";setTimeout(()=>target.style.outline=old,1400);}}

    header(panel){const head=this.el("div");Object.assign(head.style,{display:"flex",justifyContent:"space-between",gap:"10px",alignItems:"center"});const title=this.el("div",`🏭 ${this.company.name||"WorldProject"} · Betrieb ${this.company.slotNo||1} · ${this.company.type||""}`);Object.assign(title.style,{fontSize:"24px",fontWeight:800});head.append(title,this.button("✕",()=>this.close()));panel.append(head);}

    renderSetup(panel){
        const state=this.controller.getSetupState(this.company),progress=state.progress;
        const info=this.card("🛠️ Gründungsphase – Gebäude einrichten");
        info.append(this.el("div",`${state.building.name} · ${state.building.areaM2||0} m²`));
        info.append(this.small("Der Betrieb ist noch nicht eröffnet. Lieferanten, Produktion und Kundenaufträge werden erst nach der Mindestausstattung freigeschaltet."));
        info.append(this.el("div",`Fortschritt: ${progress.percent} % · Phase: ${state.phase}`));
        (state.building.rooms||[]).forEach(r=>info.append(this.small(`${r.name}: ${r.areaM2} m² · Ausstattung ${(r.equipment||[]).length}`)));
        panel.append(info);
        const grid=this.el("div");Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:"12px",marginTop:"12px"});
        for(const item of state.equipmentCatalog){const owned=(state.building.equipment||[]).some(x=>(x.id||x)===item.id),c=this.card(`${item.required?"★ ":""}${item.name}`);c.append(this.small(`${this.money(item.price)} € · Bereich ${item.room}${item.required?" · Mindestausstattung":" · optional"}`));c.append(this.el("div",owned?"✅ Bereits installiert":"Noch nicht vorhanden"));if(!owned)c.append(this.button(`${this.money(item.price)} € kaufen & installieren`,async()=>{const r=this.controller.buySetupEquipment(this.company,item.id);alert(r.success?`${item.name} installiert.`:r.reason);if(r.success&&this.company.serverCompanyId)await window.worldAccounts?.authApi?.updateBusinessSetup?.(this.company.serverCompanyId,this.company.setupPhase,this.company.buildingState);this.render(panel);}));grid.append(c);}panel.append(grid);
        const finish=this.card("🚪 Betrieb eröffnen");finish.append(this.small(progress.complete?"Die Mindestausstattung ist vollständig.":`Es fehlt noch: ${progress.missing.join(", ")||"Mindestausstattung ist für diese Branche noch nicht definiert."}`));finish.append(this.button("Betrieb eröffnen",async()=>{const r=this.controller.startBusinessOperations(this.company);alert(r.success?"Betrieb eröffnet. Einkauf, Produktion und Aufträge sind jetzt freigeschaltet.":r.reason);if(r.success&&this.company.serverCompanyId)await window.worldAccounts?.authApi?.updateBusinessSetup?.(this.company.serverCompanyId,this.company.setupPhase,this.company.buildingState);this.render(panel);}));panel.append(finish);
    }

    renderSuppliers(grid){
        const profile=this.controller.getIndustryProfile(this.company),suppliers=this.anchorCard(this.card("📦 Lieferungen & Einkauf"),"dashboard-deliveries");
        const items=profile.allowedItems||[];
        if(!items.length){suppliers.append(this.el("div","Für diese Branche wird der Lieferantenkatalog noch ergänzt."));grid.append(suppliers);return;}
        // Alter Dropdown-Einkauf bleibt vorerst technisch erhalten, bis der neue zentrale Einkaufsdialog vollständig verdrahtet ist.
        const select=this.el("select");Object.assign(select.style,{padding:"8px",margin:"4px",maxWidth:"180px"});for(const id of items){const o=this.el("option",this.label(id));o.value=id;select.append(o);}const qty=this.input("50","number");qty.min="0.01";suppliers.append(this.el("div","Rohstoff und Menge:"),select,qty);
        const offersBox=this.el("div");suppliers.append(offersBox);
        const draw=()=>{offersBox.innerHTML="";const amount=Math.max(Number(qty.value)||1,.01),offers=this.controller.getSupplierComparison(this.company,select.value,amount);if(!offers.length){offersBox.append(this.small("Kein passendes Angebot verfügbar."));return;}offers.slice(0,6).forEach((o,i)=>{const line=this.el("div");Object.assign(line.style,{borderTop:"1px solid rgba(255,255,255,.12)",padding:"8px 0"});line.append(this.el("strong",`${i===0?"★ ":""}${o.supplierName} · gesamt ${this.money(o.totalCost)} €`),this.small(`${this.money(o.effectiveUnitPrice)} je Einheit · Bestellung ${this.amount(o.orderAmount)} · Transport ${this.money(o.transportCost)} € · ${o.distanceKm} km · ${o.deliveryHours} h · Zuverlässigkeit ${(o.reliability*100).toFixed(0)} % · Qualität ${o.quality} · Rabatt ${o.discountPercent.toFixed(1)} %`),this.button("Bei diesem Lieferanten kaufen",()=>{const r=this.controller.buyInput(this.company,select.value,amount,{offerId:o.id});alert(r.success?`Bei ${o.supplierName} bestellt · ${this.money(r.totalCost)} €.`:r.reason);this.render(this.overlay.firstChild);}));offersBox.append(line);});};select.addEventListener("change",draw);qty.addEventListener("change",draw);draw();
        suppliers.append(this.button("Marktpreise neu berechnen",()=>{this.controller.market.fluctuatePrices();draw();}));
        const openOrders=(this.company.supplierOrders||[]).filter(o=>!["delivered","stored","cancelled"].includes(o.status));
        if(openOrders.length){suppliers.append(this.el("strong",`${openOrders.length} offene Lieferung${openOrders.length===1?"":"en"}`));openOrders.forEach(o=>{const eta=o.eta||o.arrivalAt||o.expectedAt;let rest="";if(eta){const ms=Math.max(0,new Date(eta).getTime()-Date.now()),mins=Math.ceil(ms/60000),h=Math.floor(mins/60),m=mins%60;rest=ms<=0?"angekommen":`${h?`${h} Std. `:""}${m} Min.`;}suppliers.append(this.small(`${o.supplierName||"Lieferant"} · ${this.label(o.itemId||o.material)} · ${this.amount(o.amount||o.quantity)} ${o.unit||""} · ${o.status||"offen"}${rest?` · Restzeit ${rest}`:""}`));});}else suppliers.append(this.small("Keine offenen Lieferungen."));
        grid.append(suppliers);
    }

    render(panel){
        this.controller.processTime(this.company,new Date());panel.innerHTML="";this.header(panel);
        if(this.company.setupPhase&&this.company.setupPhase!=="operating"){this.renderSetup(panel);return;}
        this.controller.ensureCustomerOrders(this.company);
        const storage=this.controller.getStorageStatus(this.company),mission=this.controller.missions.getActiveMission(this.company),report=this.controller.getReport(this.company,168);
        const summary=this.el("div");Object.assign(summary.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"10px",margin:"18px 0"});for(const[t,v]of[["💶 Firmenkonto",`${this.money(this.company.money)} €`],["🪙 Coins",`${this.company.coins||0}`],["🚚 Fuhrpark",`${this.company.vehicles?.length||0} Fahrzeuge`],["🏬 Lager",`${this.amount(storage.used)} / ${this.amount(storage.capacity)}`],["📈 Wochengewinn",`${this.money(report.profit)} €`],["🎯 Aufgabe",mission?`${mission.deliveredAmount}/${mission.targetAmount}`:"Keine"]]){const c=this.card(t);c.append(this.el("div",v));summary.append(c);}panel.append(summary);
        const grid=this.el("div");Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(315px,1fr))",gap:"12px"});
        this.renderSuppliers(grid);

        const profile=this.controller.getIndustryProfile(this.company);
        const production=this.anchorCard(this.card("🏗️ Produktion"),"dashboard-production");
        if(profile.branchKey==="brewery"){
            production.append(this.small("Lagerbier 0,33 l · Produktionsmenge wird auf freie Mengeneingabe umgestellt."));
            production.append(this.button("1 Charge starten",()=>{const r=this.controller.produce(this.company,"lager033",1);alert(r.success?`Produktion läuft · ${Math.round(r.order.productionMinutes)} Min.`:r.reason);this.render(panel);}));
            production.append(this.button("2 Chargen einplanen",()=>{const r=this.controller.queueProduction(this.company,"lager033",2);alert(r.success?"2 Chargen in Warteschlange.":r.reason);this.render(panel);}));
            const machine=this.company.productionMachines?.[0];if(machine)production.append(this.small(`${machine.name} · Stufe ${machine.upgradeLevel} · Zustand ${Number(machine.condition||100).toFixed(1)} % · ${machine.status}`));
            const q=(this.company.productionQueue||[]).filter(x=>!["finished","cancelled"].includes(x.status));if(q.length){production.append(this.el("strong",`${q.length} laufende/geplante Produktion${q.length===1?"":"en"}`));q.forEach(j=>production.append(this.small(`${this.label(j.productId||j.product||j.recipeId||"Produktion")} · ${this.amount(j.quantity||j.output||j.batches||1)} · ${j.status||"geplant"}`)));}
        }else if(profile.branchKey==="carpentry")production.append(this.small("Schreinerei ist eingerichtet. Möbel-/Holzrezepte werden als nächster Produktionskatalog ergänzt."));
        else production.append(this.small("Branchenspezifische Produktionsrezepte werden noch ergänzt."));
        grid.append(production);

        const customerCard=this.anchorCard(this.card("📋 Kundenaufträge"),"dashboard-customer-orders");
        const customerOrders=(this.company.customerOrders||this.company.orders||[]).filter(o=>!["fulfilled","delivered","cancelled"].includes(o.status));
        if(!customerOrders.length)customerCard.append(this.small("Keine offenen Kundenaufträge."));
        for(const o of customerOrders){const due=o.dueAt||o.deadline||o.deliveryDueAt,qty=o.quantity||o.amount||0,done=o.deliveredQuantity||o.fulfilledQuantity||o.deliveredAmount||0,product=this.label(o.product||o.productId||o.itemId||"Produkt"),customer=o.customerName||o.customer?.name||o.customerId||"Kunde",price=o.unitPrice!=null?` · ${this.money(o.unitPrice)} €/Einheit`:"",deadline=due?` · Frist ${new Date(due).toLocaleString("de-DE")}`:"";customerCard.append(this.el("strong",`${customer} · ${product}`),this.small(`${this.amount(done)} / ${this.amount(qty)} erfüllt${price}${deadline} · Status ${o.status||"offen"}`));}
        grid.append(customerCard);

        const fleet=this.card("🚛 Fuhrpark, Tank & Wartung");const first=this.company.vehicles?.[0];fleet.append(this.el("div",first?`${first.name} · ${first.status} · ${Math.round(first.odometerKm||0)} km · Tank ${this.amount(first.fuelLiters)} l · Zustand ${Number(first.condition||100).toFixed(1)} %`:"Noch kein Fahrzeug"));fleet.append(this.button("18-Tonner kaufen (35.000 €)",()=>{const r=this.controller.buyVehicle(this.company,"truck18",35000);alert(r.success?"18-Tonner gekauft.":r.reason);this.render(panel);}));if(first)fleet.append(this.button("Wartung 1.200 €",()=>{const r=this.controller.serviceVehicle(this.company,first);alert(r.success?"Fahrzeug gewartet.":r.reason);this.render(panel);}));grid.append(fleet);

        const warehouse=this.card("🏬 Lager nach Bereichen"),areas=this.controller.getStorageAreas(this.company);warehouse.append(this.small(`Rohstoffe: ${this.amount(areas.raw.used)} / ${this.amount(areas.raw.capacity)}`),this.small(`Verpackung: ${this.amount(areas.packaging.used)} / ${this.amount(areas.packaging.capacity)}`),this.small(`Fertigware: ${this.amount(areas.finished.used)} / ${this.amount(areas.finished.capacity)}`));Object.entries(this.company.inventory||{}).forEach(([id,v])=>warehouse.append(this.stockRow(this.label(id),v)));Object.entries(this.company.finishedGoods||{}).forEach(([id,v])=>warehouse.append(this.stockRow(this.label(id),v,id.includes("bottle")?"Flaschen":"")));grid.append(warehouse);

        const finance=this.card("📊 Tages-/Wochenübersicht");finance.append(this.stockRow("Einnahmen 7 Tage",`${this.money(report.income)} €`),this.stockRow("Kosten 7 Tage",`${this.money(report.costs)} €`),this.stockRow("Gewinn 7 Tage",`${this.money(report.profit)} €`));
        const nav=this.el("div");Object.assign(nav.style,{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"10px"});
        nav.append(this.button(`🚚 ${report.openSupplierOrders} Lieferungen`,()=>this.jumpTo("dashboard-deliveries")),this.button(`🏗️ ${report.queuedProduction} Produktion`,()=>this.jumpTo("dashboard-production")),this.button(`📋 ${report.openCustomerOrders} Kundenaufträge`,()=>this.jumpTo("dashboard-customer-orders")));finance.append(nav);grid.append(finance);

        const coins=this.card("🪙 Coins");coins.append(this.small("Keine kostenlosen Tages-Coins. Coins können durch gezielte Erfolge/Missionen verdient oder später gekauft und am Spielermarkt gegen Spielgeld gehandelt werden."));this.controller.getCoinStoreCatalog().forEach(p=>coins.append(this.small(`${p.label} · vorgesehen ${this.money(p.priceEUR)} €`)));grid.append(coins);

        panel.append(grid);
    }
}
