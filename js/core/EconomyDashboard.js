// WorldProject - sichtbare Wirtschaftsspiel-Oberflaeche
export class EconomyDashboard {
    constructor({ controller, company, parent = document.body } = {}) {
        this.controller = controller;
        this.company = company;
        this.parent = parent;
        this.overlay = null;
    }

    el(tag,text=null){ const e=document.createElement(tag); if(text!==null)e.textContent=text; return e; }
    money(v){ return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}); }
    amount(v){ return Number(v||0).toLocaleString("de-DE",{maximumFractionDigits:2}); }

    label(id){
        return ({
            malt_kg:"Malz",
            hops_kg:"Hopfen",
            yeast_kg:"Hefe",
            water_l:"Wasser",
            bottle_033:"0,33-l-Flaschen",
            crown_cap:"Kronkorken",
            label_033:"Etiketten 0,33 l",
            lager033_bottle:"Lagerbier 0,33 l"
        })[id] || id;
    }

    open(){
        if(this.overlay) return;
        const overlay=this.el("div");
        Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"12000",background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});
        const panel=this.el("div");
        Object.assign(panel.style,{width:"min(1050px,96vw)",maxHeight:"92vh",overflow:"auto",background:"#1d232b",color:"#fff",borderRadius:"14px",padding:"22px",fontFamily:"Arial,sans-serif",boxShadow:"0 20px 70px rgba(0,0,0,.5)"});
        overlay.append(panel); this.overlay=overlay; this.parent.append(overlay);
        this.render(panel);
    }

    close(){ this.overlay?.remove(); this.overlay=null; }

    card(title){ const c=this.el("div"); Object.assign(c.style,{background:"rgba(255,255,255,.07)",borderRadius:"10px",padding:"16px",minWidth:"220px",flex:"1"}); const h=this.el("div",title); Object.assign(h.style,{fontWeight:"700",marginBottom:"10px",fontSize:"17px"}); c.append(h); return c; }
    button(text,onClick){ const b=this.el("button",text); Object.assign(b.style,{border:"0",borderRadius:"8px",padding:"10px 12px",cursor:"pointer",fontWeight:"700",margin:"4px",background:"#fff",color:"#111"}); b.addEventListener("click",onClick); return b; }

    stockRow(name,value,unit=""){
        const row=this.el("div");
        Object.assign(row.style,{display:"flex",justifyContent:"space-between",gap:"16px",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.08)"});
        const n=this.el("span",name);
        const v=this.el("strong",`${this.amount(value)}${unit ? " "+unit : ""}`);
        row.append(n,v);
        return row;
    }

    render(panel){
        panel.innerHTML="";
        const head=this.el("div"); Object.assign(head.style,{display:"flex",justifyContent:"space-between",gap:"10px",alignItems:"center"});
        const title=this.el("div","🏭 WorldProject Wirtschaft"); Object.assign(title.style,{fontSize:"24px",fontWeight:"800"});
        head.append(title,this.button("✕",()=>this.close())); panel.append(head);

        const summary=this.el("div"); Object.assign(summary.style,{display:"flex",gap:"10px",flexWrap:"wrap",margin:"18px 0"});
        const m=this.card("💶 Firmenkonto"); m.append(this.el("div",`${this.money(this.company.money)} €`));
        const f=this.card("🚚 Fuhrpark"); f.append(this.el("div",`${this.company.vehicles?.length||0} Fahrzeuge`));
        const mission=this.controller.missions.getActiveMission(this.company);
        const q=this.card("🎯 Aktive Aufgabe"); q.append(this.el("div",mission?`${mission.productName}: ${mission.deliveredAmount.toLocaleString("de-DE")} / ${mission.targetAmount.toLocaleString("de-DE")}`:"Keine aktive Aufgabe"));
        summary.append(m,f,q); panel.append(summary);

        const grid=this.el("div"); Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"12px"});

        const suppliers=this.card("📦 Lieferanten");
        suppliers.append(this.el("div","Bestes Malz-Angebot inklusive geschätztem Transport:"));
        const best=this.controller.market.getBestOffer("malt_kg",55);
        suppliers.append(this.el("div",best?`${best.supplierName}: ${this.money(best.estimatedTotalCost)} € / 55 kg`:"Kein Angebot"));
        suppliers.append(this.button("Rohstoffe für 1 Charge einkaufen",()=>{ const r=this.controller.buyRecipeInputs(this.company,"lager033",1); alert(r.success?"Alle fehlenden Rohstoffe wurden eingekauft und eingelagert.":r.reason); this.render(panel); }));
        suppliers.append(this.button("Marktpreise neu berechnen",()=>{ this.controller.market.fluctuatePrices(); this.render(panel); }));

        const production=this.card("🍺 Produktion");
        production.append(this.el("div","Lagerbier 0,33 l – Charge 1.000 Flaschen"));
        production.append(this.button("1 Charge produzieren",()=>{ const r=this.controller.produce(this.company,"lager033",1); alert(r.success?"1.000 Flaschen produziert.":r.reason); this.render(panel); }));

        const sales=this.card("🛒 Verkauf / Mission");
        const finished=this.company.finishedGoods?.lager033_bottle||0;
        sales.append(this.el("div",`Verfügbare Fertigware: ${finished.toLocaleString("de-DE")} Flaschen`));
        sales.append(this.button("500 Flaschen liefern",()=>{ const r=this.controller.deliverMission(this.company,500); alert(r.success?`${r.accepted} Flaschen geliefert.${r.completed?" Aufgabe abgeschlossen!":""}`:r.reason); this.render(panel); }));

        const fleet=this.card("🚛 Fuhrpark & Kosten");
        const firstVehicle=this.company.vehicles?.[0];
        fleet.append(this.el("div",firstVehicle?`${firstVehicle.name} · ${firstVehicle.status} · ${Math.round(firstVehicle.odometerKm||0)} km · Zustand ${Number(firstVehicle.condition||100).toFixed(1)} %` : "Noch kein Fahrzeug"));
        fleet.append(this.button("18-Tonner kaufen (35.000 €)",()=>{ const r=this.controller.buyVehicle(this.company,"truck18",35000); alert(r.success?"18-Tonner gekauft.":r.reason); this.render(panel); }));
        if(firstVehicle){ fleet.append(this.button("200-km-Testfahrt abrechnen",()=>{ const r=this.controller.applyTripCosts(this.company,firstVehicle,200); alert(r.success?`Betriebskosten: ${this.money(r.totalOperatingCost)} €`:r.reason); this.render(panel); })); }

        const warehouse=this.card("🏬 Lagerbestand");
        const raw=this.el("div","ROHSTOFFE & VERPACKUNG"); Object.assign(raw.style,{fontSize:"12px",fontWeight:"800",opacity:".7",marginBottom:"5px"}); warehouse.append(raw);
        const inventory=Object.entries(this.company.inventory||{});
        if(!inventory.length) warehouse.append(this.el("div","Noch keine Rohstoffe eingelagert."));
        else inventory.forEach(([id,value])=>warehouse.append(this.stockRow(this.label(id),value)));

        const finishedTitle=this.el("div","FERTIGWARE"); Object.assign(finishedTitle.style,{fontSize:"12px",fontWeight:"800",opacity:".7",marginTop:"16px",marginBottom:"5px"}); warehouse.append(finishedTitle);
        const finishedGoods=Object.entries(this.company.finishedGoods||{});
        if(!finishedGoods.length) warehouse.append(this.el("div","Noch keine Fertigware vorhanden."));
        else finishedGoods.forEach(([id,value])=>warehouse.append(this.stockRow(this.label(id),value,id.includes("bottle")?"Flaschen":"")));

        grid.append(suppliers,production,sales,fleet,warehouse); panel.append(grid);
    }
}
