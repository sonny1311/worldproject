// WorldProject - sichtbare Wirtschaftsspiel-Oberflaeche
export class EconomyDashboard {
    constructor({ controller, company, parent = document.body } = {}) { this.controller=controller; this.company=company; this.parent=parent; this.overlay=null; }
    el(tag,text=null){ const e=document.createElement(tag); if(text!==null)e.textContent=text; return e; }
    money(v){ return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}); }
    amount(v){ return Number(v||0).toLocaleString("de-DE",{maximumFractionDigits:2}); }
    label(id){ return ({malt_kg:"Malz",hops_kg:"Hopfen",yeast_kg:"Hefe",water_l:"Wasser",bottle_033:"0,33-l-Flaschen",crown_cap:"Kronkorken",label_033:"Etiketten 0,33 l",lager033_bottle:"Lagerbier 0,33 l",pils033_bottle:"Pils 0,33 l"})[id]||id; }
    open(){ if(this.overlay)return; const overlay=this.el("div");Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"12000",background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});const panel=this.el("div");Object.assign(panel.style,{width:"min(1320px,97vw)",maxHeight:"94vh",overflow:"auto",background:"#1d232b",color:"#fff",borderRadius:"14px",padding:"22px",fontFamily:"Arial,sans-serif",boxShadow:"0 20px 70px rgba(0,0,0,.5)"});overlay.append(panel);this.overlay=overlay;this.parent.append(overlay);this.render(panel); }
    close(){ this.overlay?.remove();this.overlay=null; }
    card(title){ const c=this.el("div");Object.assign(c.style,{background:"rgba(255,255,255,.07)",borderRadius:"10px",padding:"16px",minWidth:"260px",flex:"1"});const h=this.el("div",title);Object.assign(h.style,{fontWeight:"700",marginBottom:"10px",fontSize:"17px"});c.append(h);return c; }
    button(text,onClick){ const b=this.el("button",text);Object.assign(b.style,{border:"0",borderRadius:"8px",padding:"9px 11px",cursor:"pointer",fontWeight:"700",margin:"4px",background:"#fff",color:"#111"});b.addEventListener("click",onClick);return b; }
    stockRow(name,value,unit=""){ const row=this.el("div");Object.assign(row.style,{display:"flex",justifyContent:"space-between",gap:"16px",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.08)"});row.append(this.el("span",name),this.el("strong",`${this.amount(value)}${unit?" "+unit:""}`));return row; }
    small(text){const e=this.el("div",text);Object.assign(e.style,{fontSize:"12px",opacity:".76",margin:"3px 0"});return e;}

    render(panel){
        this.controller.processTime(this.company,new Date());
        this.controller.ensureCustomerOrders(this.company);
        panel.innerHTML="";
        const head=this.el("div");Object.assign(head.style,{display:"flex",justifyContent:"space-between",gap:"10px",alignItems:"center"});const title=this.el("div",`🏭 ${this.company.name||"WorldProject Wirtschaft"}`);Object.assign(title.style,{fontSize:"24px",fontWeight:"800"});head.append(title,this.button("✕",()=>this.close()));panel.append(head);

        const storage=this.controller.getStorageStatus(this.company),mission=this.controller.missions.getActiveMission(this.company),report=this.controller.getReport(this.company,168);
        const summary=this.el("div");Object.assign(summary.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"10px",margin:"18px 0"});
        for(const [t,v] of [["💶 Firmenkonto",`${this.money(this.company.money)} €`],["🪙 Coins",`${this.company.coins||0}`],["🚚 Fuhrpark",`${this.company.vehicles?.length||0} Fahrzeuge`],["🏬 Lager",`${this.amount(storage.used)} / ${this.amount(storage.capacity)}`],["📈 Wochengewinn",`${this.money(report.profit)} €`],["🎯 Aufgabe",mission?`${mission.deliveredAmount}/${mission.targetAmount}`:"Keine"]]){const c=this.card(t);c.append(this.el("div",v));summary.append(c);}panel.append(summary);

        const grid=this.el("div");Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(315px,1fr))",gap:"12px"});

        const suppliers=this.card("📦 Lieferantenvergleich");
        const offers=this.controller.getSupplierComparison("malt_kg",55);
        offers.slice(0,3).forEach((o,i)=>{suppliers.append(this.stockRow(`${i===0?"★ ":""}${o.supplierName}`,`${this.money(o.totalCost)} €`));suppliers.append(this.small(`${this.money(o.effectiveUnitPrice)} €/kg · ${o.distanceKm} km · ${o.deliveryHours} h · Zuverlässigkeit ${(o.reliability*100).toFixed(0)} % · Qualität ${o.quality} · Rabatt ${o.discountPercent.toFixed(1)} %`));});
        suppliers.append(this.button("Rohstoffe für 1 Charge bestellen",()=>{const r=this.controller.buyRecipeInputs(this.company,"lager033",1);alert(r.success?"Bestellungen aufgegeben. Ware ist unterwegs.":r.reason);this.render(panel);}));
        suppliers.append(this.button("Marktpreise neu berechnen",()=>{this.controller.market.fluctuatePrices();this.render(panel);}));
        const openOrders=(this.company.supplierOrders||[]).filter(o=>o.status!=="delivered");openOrders.slice(-5).forEach(o=>suppliers.append(this.small(`${this.label(o.itemId)} · ${o.status} · ${o.transportMode} · ${o.amount}`)));

        const production=this.card("🍺 Produktionsplanung");
        production.append(this.small("Lagerbier 0,33 l · 1.000 Flaschen je Charge"));
        production.append(this.button("1 Charge starten",()=>{const r=this.controller.produce(this.company,"lager033",1);alert(r.success?`Produktion läuft · ${Math.round(r.order.productionMinutes)} Min.`:r.reason);this.render(panel);}));
        production.append(this.button("2 Chargen einplanen",()=>{const r=this.controller.queueProduction(this.company,"lager033",2);alert(r.success?"2 Chargen in Warteschlange.":r.reason);this.render(panel);}));
        production.append(this.button("Nächste Warteschlange starten",()=>{const r=this.controller.startNextQueued(this.company);alert(r.success?"Nächste Produktion gestartet.":r.reason);this.render(panel);}));
        const machine=this.company.productionMachines?.[0];if(machine){production.append(this.small(`${machine.name} · Stufe ${machine.upgradeLevel} · Tempo x${machine.speedMultiplier.toFixed(2)} · Zustand ${machine.condition.toFixed(1)} % · ${machine.status}`));production.append(this.button("Maschine aufrüsten",()=>{const r=this.controller.upgradeMachine(this.company,machine.id);alert(r.success?`Auf Stufe ${r.machine.upgradeLevel} verbessert.`:r.reason);this.render(panel);}));}
        (this.company.productionQueue||[]).filter(p=>p.status!=="completed").slice(0,4).forEach(p=>production.append(this.small(`${p.recipeId} · ${p.batches} Charge(n) · ${p.status}${p.completeAt?` · fertig ${new Date(p.completeAt).toLocaleString("de-DE")}`:""}`)));

        const sales=this.card("🛒 Preis, Nachfrage & Konkurrenz");
        const product="lager033_bottle",current=this.company.salesPrices?.[product]??0.95,margin=this.controller.getMargin(this.company,product,current),demand=this.controller.getDemand(this.company,product),competitors=this.controller.getCompetitors(product);
        sales.append(this.el("div",`Fertigware: ${(this.company.finishedGoods?.[product]||0).toLocaleString("de-DE")} Flaschen`));
        sales.append(this.small(`Eigener Preis ${this.money(current)} € · Stückkosten ${this.money(margin.costPerUnit)} € · Marge ${this.money(margin.marginPerUnit)} € (${margin.marginPercent.toFixed(1)} %)`));
        sales.append(this.small(`Nachfrageindex ${demand.demandIndex.toFixed(2)} · ca. ${demand.estimatedDailyUnits.toLocaleString("de-DE")} Flaschen/Tag · Konkurrenz Ø ${this.money(demand.competitorAverage)} €`));
        competitors.forEach(c=>sales.append(this.small(`${c.name}: ${this.money(c.price)} € · Marktanteil ${(c.marketShare*100).toFixed(0)} %`)));
        for(const p of [0.79,0.89,0.99,1.09])sales.append(this.button(`${p.toFixed(2)} €`,()=>{this.controller.setSalePrice(this.company,p,product);this.render(panel);}));
        sales.append(this.button("500 Flaschen Mission liefern",()=>{const r=this.controller.deliverMission(this.company,500);alert(r.success?`${r.accepted} geliefert.${r.completed?" Mission fertig + 1 Coin!":""}`:r.reason);this.render(panel);}));

        const customers=this.card("🏪 Kundenaufträge");
        const customerOrders=this.company.customerOrders.filter(o=>o.status==="open");
        customerOrders.slice(0,4).forEach(o=>{customers.append(this.stockRow(o.customer,`${o.delivered}/${o.amount}`));customers.append(this.small(`${this.money(o.unitPrice)} €/Flasche · Frist ${new Date(o.dueAt).toLocaleString("de-DE")}`));customers.append(this.button("500 liefern",()=>{const r=this.controller.deliverCustomerOrder(this.company,o.id,500);alert(r.success?`${r.accepted} geliefert · Umsatz ${this.money(r.revenue)} €`:r.reason);this.render(panel);}));});
        customers.append(this.button("Neuen Kundenauftrag erzeugen",()=>{this.controller.createCustomerOrder(this.company,{amount:1000+Math.floor(Math.random()*2000),unitPrice:0.90+Math.random()*0.18,dueHours:72});this.render(panel);}));

        const fleet=this.card("🚛 Fuhrpark, Tank & Wartung");
        const firstVehicle=this.company.vehicles?.[0];fleet.append(this.el("div",firstVehicle?`${firstVehicle.name} · ${firstVehicle.status} · ${Math.round(firstVehicle.odometerKm||0)} km · Tank ${this.amount(firstVehicle.fuelLiters)} l · Zustand ${Number(firstVehicle.condition||100).toFixed(1)} %`:"Noch kein Fahrzeug"));
        fleet.append(this.button("18-Tonner kaufen (35.000 €)",()=>{const r=this.controller.buyVehicle(this.company,"truck18",35000);alert(r.success?"18-Tonner gekauft.":r.reason);this.render(panel);}));
        if(firstVehicle){fleet.append(this.button("200-km-Testfahrt",()=>{const r=this.controller.applyTripCosts(this.company,firstVehicle,200);alert(r.success?`Betriebskosten ${this.money(r.totalOperatingCost)} €`:r.reason);this.render(panel);}));fleet.append(this.button("Wartung 1.200 €",()=>{const r=this.controller.serviceVehicle(this.company,firstVehicle);alert(r.success?"Fahrzeug gewartet.":r.reason);this.render(panel);}));}

        const warehouse=this.card("🏬 Lager nach Bereichen");
        const areas=this.controller.getStorageAreas(this.company);warehouse.append(this.small(`Rohstoffe: ${this.amount(areas.raw.used)} / ${this.amount(areas.raw.capacity)}`));warehouse.append(this.small(`Verpackung: ${this.amount(areas.packaging.used)} / ${this.amount(areas.packaging.capacity)}`));warehouse.append(this.small(`Fertigware: ${this.amount(areas.finished.used)} / ${this.amount(areas.finished.capacity)}`));
        Object.entries(this.company.inventory||{}).forEach(([id,v])=>warehouse.append(this.stockRow(this.label(id),v)));Object.entries(this.company.finishedGoods||{}).forEach(([id,v])=>warehouse.append(this.stockRow(this.label(id),v,id.includes("bottle")?"Flaschen":"")));
        warehouse.append(this.button("Lager +10.000 (5.000 €)",()=>{const r=this.controller.expandStorage(this.company);alert(r.success?`Neue Gesamtkapazität ${this.amount(r.capacity)}`:r.reason);this.render(panel);}));

        const finance=this.card("📊 Tages-/Wochenübersicht");
        finance.append(this.stockRow("Einnahmen 7 Tage",`${this.money(report.income)} €`));finance.append(this.stockRow("Kosten 7 Tage",`${this.money(report.costs)} €`));finance.append(this.stockRow("Gewinn 7 Tage",`${this.money(report.profit)} €`));finance.append(this.small(`${report.openSupplierOrders} offene Lieferungen · ${report.queuedProduction} Produktionen · ${report.openCustomerOrders} Kundenaufträge`));
        finance.append(this.button("24 Std. vorspulen (Test)",()=>{const r=this.controller.fastForward(this.company,24);alert(`${r.deliveries.length} Lieferungen angekommen · ${r.productions.length} Produktionen fertig.`);this.render(panel);}));

        const coins=this.card("🪙 Coins & Server-Unterstützung");
        coins.append(this.small("Coins können erspielt werden (z. B. Missionen/Tagesaktivität) und später optional gekauft werden. Der Echtgeld-Checkout ist noch NICHT angeschlossen."));
        coins.append(this.button("Tages-Coin abholen",()=>{const r=this.controller.claimDailyCoin(this.company);alert(r.success?`+${r.coinsAwarded} Coin · Guthaben ${r.balance}`:r.reason);this.render(panel);}));
        this.controller.getCoinStoreCatalog().forEach(p=>coins.append(this.small(`${p.label} · vorgesehen ${this.money(p.priceEUR)} €`)));
        coins.append(this.small("Bestehende Coin-Nutzung: Giga-/Spezialtransporte. Weitere faire Komfortfunktionen können später ergänzt werden."));

        grid.append(suppliers,production,sales,customers,fleet,warehouse,finance,coins);panel.append(grid);
    }
}
