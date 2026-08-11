// WorldProject - sichtbare Wirtschaftsspiel-Oberflaeche
export class EconomyDashboard {
    constructor({ controller, company, parent = document.body } = {}) { this.controller=controller; this.company=company; this.parent=parent; this.overlay=null; }
    el(tag,text=null){ const e=document.createElement(tag); if(text!==null)e.textContent=text; return e; }
    money(v){ return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}); }
    amount(v){ return Number(v||0).toLocaleString("de-DE",{maximumFractionDigits:2}); }
    label(id){ return ({malt_kg:"Malz",hops_kg:"Hopfen",yeast_kg:"Hefe",water_l:"Wasser",bottle_033:"0,33-l-Flaschen",crown_cap:"Kronkorken",label_033:"Etiketten 0,33 l",lager033_bottle:"Lagerbier 0,33 l"})[id]||id; }

    open(){
        if(this.overlay) return;
        const overlay=this.el("div"); Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"12000",background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});
        const panel=this.el("div"); Object.assign(panel.style,{width:"min(1180px,96vw)",maxHeight:"92vh",overflow:"auto",background:"#1d232b",color:"#fff",borderRadius:"14px",padding:"22px",fontFamily:"Arial,sans-serif",boxShadow:"0 20px 70px rgba(0,0,0,.5)"});
        overlay.append(panel); this.overlay=overlay; this.parent.append(overlay); this.render(panel);
    }
    close(){ this.overlay?.remove(); this.overlay=null; }
    card(title){ const c=this.el("div"); Object.assign(c.style,{background:"rgba(255,255,255,.07)",borderRadius:"10px",padding:"16px",minWidth:"240px",flex:"1"}); const h=this.el("div",title); Object.assign(h.style,{fontWeight:"700",marginBottom:"10px",fontSize:"17px"}); c.append(h); return c; }
    button(text,onClick){ const b=this.el("button",text); Object.assign(b.style,{border:"0",borderRadius:"8px",padding:"10px 12px",cursor:"pointer",fontWeight:"700",margin:"4px",background:"#fff",color:"#111"}); b.addEventListener("click",onClick); return b; }
    stockRow(name,value,unit=""){ const row=this.el("div"); Object.assign(row.style,{display:"flex",justifyContent:"space-between",gap:"16px",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.08)"}); row.append(this.el("span",name),this.el("strong",`${this.amount(value)}${unit?" "+unit:""}`)); return row; }

    render(panel){
        this.controller.processTime(this.company,new Date());
        panel.innerHTML="";
        const head=this.el("div"); Object.assign(head.style,{display:"flex",justifyContent:"space-between",gap:"10px",alignItems:"center"});
        const title=this.el("div",`🏭 ${this.company.name||"WorldProject Wirtschaft"}`); Object.assign(title.style,{fontSize:"24px",fontWeight:"800"});
        head.append(title,this.button("✕",()=>this.close())); panel.append(head);

        const storage=this.controller.getStorageStatus(this.company);
        const mission=this.controller.missions.getActiveMission(this.company);
        const margin=this.controller.getMargin(this.company);
        const summary=this.el("div"); Object.assign(summary.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"10px",margin:"18px 0"});
        const m=this.card("💶 Firmenkonto"); m.append(this.el("div",`${this.money(this.company.money)} €`));
        const f=this.card("🚚 Fuhrpark"); f.append(this.el("div",`${this.company.vehicles?.length||0} Fahrzeuge`));
        const st=this.card("🏬 Lager"); st.append(this.el("div",`${this.amount(storage.used)} / ${this.amount(storage.capacity)} Einheiten (${storage.percent.toFixed(1)} %)`));
        const q=this.card("🎯 Aufgabe"); q.append(this.el("div",mission?`${mission.productName}: ${mission.deliveredAmount.toLocaleString("de-DE")} / ${mission.targetAmount.toLocaleString("de-DE")}`:"Keine aktive Aufgabe"));
        summary.append(m,f,st,q); panel.append(summary);

        const grid=this.el("div"); Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:"12px"});

        const suppliers=this.card("📦 Lieferanten & Bestellungen");
        const best=this.controller.market.getBestOffer("malt_kg",55);
        suppliers.append(this.el("div",best?`Bestes Malz: ${best.supplierName} · ${this.money(best.estimatedTotalCost)} € · Bestand ${this.amount(best.availableAmount)}`:"Kein Malz-Angebot"));
        suppliers.append(this.button("Rohstoffe für 1 Charge bestellen",()=>{ const r=this.controller.buyRecipeInputs(this.company,"lager033",1); alert(r.success?"Bestellungen aufgegeben. Ware ist jetzt unterwegs.":r.reason); this.render(panel); }));
        suppliers.append(this.button("24 Std. vorspulen (Test)",()=>{ const r=this.controller.fastForward(this.company,24); alert(`${r.deliveries.length} Lieferungen angekommen, ${r.productions.length} Produktionen fertig.`); this.render(panel); }));
        suppliers.append(this.button("Marktpreise neu berechnen",()=>{ this.controller.market.fluctuatePrices(); this.render(panel); }));
        const openOrders=(this.company.supplierOrders||[]).filter(o=>o.status!=="delivered");
        if(openOrders.length){ const t=this.el("div","OFFENE LIEFERUNGEN"); Object.assign(t.style,{fontSize:"12px",fontWeight:"800",opacity:".7",marginTop:"12px"}); suppliers.append(t); openOrders.slice(-6).forEach(o=>suppliers.append(this.stockRow(`${this.label(o.itemId)} · ${o.status} · ${o.transportMode}`,o.amount))); }

        const production=this.card("🍺 Produktion");
        production.append(this.el("div","Lagerbier 0,33 l · 1.000 Flaschen pro Charge"));
        production.append(this.button("1 Charge starten",()=>{ const r=this.controller.produce(this.company,"lager033",1); alert(r.success?`Produktion gestartet. Dauer: ${r.order.productionMinutes} Minuten.`:r.reason); this.render(panel); }));
        const active=(this.company.productionQueue||[]).filter(p=>p.status==="running");
        production.append(this.el("div",active.length?`Aktive Produktion: ${active.length} · fertig ca. ${new Date(active[0].completeAt).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`:"Keine Produktion aktiv"));

        const sales=this.card("🛒 Verkauf / Deckungsbeitrag");
        const finished=this.company.finishedGoods?.lager033_bottle||0;
        sales.append(this.el("div",`Verfügbare Fertigware: ${finished.toLocaleString("de-DE")} Flaschen`));
        sales.append(this.el("div",`Stückkosten: ${this.money(margin.costPerUnit)} € · Verkauf: ${this.money(margin.salePrice)} € · Marge: ${this.money(margin.marginPerUnit)} € (${margin.marginPercent.toFixed(1)} %)`));
        sales.append(this.button("500 Flaschen liefern",()=>{ const r=this.controller.deliverMission(this.company,500); alert(r.success?`${r.accepted} Flaschen geliefert.${r.completed?" Aufgabe abgeschlossen!":""}`:r.reason); this.render(panel); }));

        const fleet=this.card("🚛 Fuhrpark, Tank & Wartung");
        const firstVehicle=this.company.vehicles?.[0];
        fleet.append(this.el("div",firstVehicle?`${firstVehicle.name} · ${firstVehicle.status} · ${Math.round(firstVehicle.odometerKm||0)} km · Tank ${this.amount(firstVehicle.fuelLiters)} l · Zustand ${Number(firstVehicle.condition||100).toFixed(1)} %` : "Noch kein Fahrzeug"));
        fleet.append(this.button("18-Tonner kaufen (35.000 €)",()=>{ const r=this.controller.buyVehicle(this.company,"truck18",35000); alert(r.success?"18-Tonner gekauft.":r.reason); this.render(panel); }));
        if(firstVehicle){
            fleet.append(this.button("200-km-Testfahrt",()=>{ const r=this.controller.applyTripCosts(this.company,firstVehicle,200); alert(r.success?`Betriebskosten ${this.money(r.totalOperatingCost)} € · Tank danach ${this.amount(r.fuelAfter)} l`:r.reason); this.render(panel); }));
            fleet.append(this.button("Wartung durchführen (1.200 €)",()=>{ const r=this.controller.serviceVehicle(this.company,firstVehicle); alert(r.success?"Fahrzeug gewartet und wieder verfügbar.":r.reason); this.render(panel); }));
        }

        const warehouse=this.card("🏬 Lagerbestand");
        const raw=this.el("div","ROHSTOFFE & VERPACKUNG"); Object.assign(raw.style,{fontSize:"12px",fontWeight:"800",opacity:".7",marginBottom:"5px"}); warehouse.append(raw);
        const inventory=Object.entries(this.company.inventory||{}); if(!inventory.length) warehouse.append(this.el("div","Noch keine Rohstoffe eingelagert.")); else inventory.forEach(([id,value])=>warehouse.append(this.stockRow(this.label(id),value)));
        const ft=this.el("div","FERTIGWARE"); Object.assign(ft.style,{fontSize:"12px",fontWeight:"800",opacity:".7",marginTop:"16px",marginBottom:"5px"}); warehouse.append(ft);
        const fg=Object.entries(this.company.finishedGoods||{}); if(!fg.length) warehouse.append(this.el("div","Noch keine Fertigware vorhanden.")); else fg.forEach(([id,value])=>warehouse.append(this.stockRow(this.label(id),value,id.includes("bottle")?"Flaschen":"")));
        warehouse.append(this.button("Lager +10.000 erweitern (5.000 €)",()=>{ const r=this.controller.expandStorage(this.company); alert(r.success?`Neue Lagerkapazität: ${this.amount(r.capacity)}`:r.reason); this.render(panel); }));

        grid.append(suppliers,production,sales,fleet,warehouse); panel.append(grid);
    }
}
