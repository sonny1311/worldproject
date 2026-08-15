// ORVUNO - Unternehmensgründung mit leerem Startgebäude
import { IndustryGroups, createStarterBuilding } from "./IndustryCatalog.js";

export class CompanySetup {
    constructor(company,onComplete){this.company=company;this.onComplete=onComplete;this.overlay=null;this.industrySelect=null;this.typeSelect=null;this.industries=IndustryGroups;this.loading=false;}

    async loadAccountOverview({fresh=true}={}){
        const api=window.worldAccounts?.authApi;
        if(!api)throw new Error("Account-API noch nicht verfügbar");
        // Beim eigentlichen Spielstart niemals blind die beim Login zwischengespeicherte Übersicht verwenden.
        // Der Betriebszustand wird frisch vom Server gelesen, damit Lager/Aufträge/Produktion garantiert
        // aus dem aktuellen game_state hydratisiert werden.
        if(!fresh&&window.worldServerAccountOverview?.companies)return window.worldServerAccountOverview;
        if(typeof api.accountOverview==="function"){
            const overview=await api.accountOverview();
            window.worldServerAccountOverview=overview;
            return overview;
        }
        const user=await api.me();
        const companies=await api.rest(`companies?user_id=eq.${encodeURIComponent(user.id)}&select=*&order=slot_no.asc`);
        let wallet={balance:0};
        try{const rows=await api.rest(`coin_wallets?user_id=eq.${encodeURIComponent(user.id)}&select=*`);if(rows?.[0])wallet=rows[0];}catch(error){console.warn("Coin-Wallet konnte nicht geladen werden",error);}
        const overview={user,companies:Array.isArray(companies)?companies:[],wallet};window.worldServerAccountOverview=overview;return overview;
    }

    async show(){
        if(this.overlay||this.loading)return;this.loading=true;
        try{
            const overview=await this.loadAccountOverview({fresh:true});
            if(overview?.companies?.length){
                const serverCompany=overview.companies.find(c=>Number(c.slot_no)===1)||overview.companies[0];
                this.hydrateCompany(serverCompany,overview.wallet);
                window.worldPlayerCompany=this.company;window.worldActiveServerCompany=serverCompany;
                const portfolio=window.worldAccounts?.businessPortfolio;if(portfolio){portfolio.companies=overview.companies;portfolio.activeCompany=this.company;}
                window.dispatchEvent(new CustomEvent("worldproject:company-loaded",{detail:{company:this.company,serverCompany,overview}}));
                if(this.onComplete)this.onComplete(this.company);
                // Einige UI-Integrationen reagieren zeitversetzt auf company-loaded. Danach noch einmal
                // aus derselben hydratisierten Instanz rendern, statt eine leere Startinstanz zu zeigen.
                for(const delay of [0,100,500])setTimeout(()=>window.worldHomeOperationsDashboard?.render?.(),delay);
                return;
            }
            this.createOverlay();this.updateTypes();document.body.appendChild(this.overlay);
        }catch(error){
            console.error("Betriebsstatus konnte nicht sicher geladen werden",error);
            setTimeout(()=>{this.loading=false;this.show();},1500);return;
        }finally{this.loading=false;}
    }

    hydrateCompany(serverCompany,wallet={}){
        const portfolio=window.worldAccounts?.businessPortfolio;
        if(portfolio?.hydrateCompany)return portfolio.hydrateCompany(this.company,serverCompany,wallet);
        this.company.serverCompanyId=serverCompany.id;this.company.slotNo=Number(serverCompany.slot_no||1);this.company.name=serverCompany.name||"";this.company.industry=serverCompany.industry||"";this.company.type=serverCompany.company_type||"";this.company.money=Number(serverCompany.game_state?.money??serverCompany.money??0);this.company.coins=Number(wallet?.balance||0);this.company.setupPhase=serverCompany.setup_phase||"empty_building";this.company.buildingState=serverCompany.building_state||createStarterBuilding(this.company);
        for(const [key,value] of Object.entries(serverCompany.game_state||{})){if(["money","coins","name","industry","type","serverCompanyId","slotNo","setupPhase","buildingState"].includes(key))continue;this.company[key]=typeof structuredClone==="function"?structuredClone(value):JSON.parse(JSON.stringify(value));}
        return this.company;
    }

    createOverlay(){
        this.overlay=document.createElement("div");Object.assign(this.overlay.style,{position:"fixed",inset:"0",background:"radial-gradient(circle at 50% 15%,#17263d,#03070c 72%)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"19000",padding:"22px",fontFamily:"Arial,sans-serif"});
        const panel=document.createElement("div");Object.assign(panel.style,{width:"min(620px,94vw)",padding:"34px",background:"#101a2b",color:"#f8fafc",border:"1px solid #394457",borderRadius:"18px",boxShadow:"0 24px 80px rgba(0,0,0,.55)"});
        const brand=document.createElement("div");brand.textContent="ORVUNO";Object.assign(brand.style,{color:"#f4bd43",fontWeight:"900",letterSpacing:"3px",fontSize:"15px",marginBottom:"8px"});panel.appendChild(brand);
        const title=document.createElement("h1");title.textContent="Deinen ersten Betrieb gründen";Object.assign(title.style,{margin:"0 0 10px",fontSize:"30px"});panel.appendChild(title);
        const info=document.createElement("div");info.innerHTML="Du startest bewusst klein: <b>leeres Startgebäude, begrenztes Kapital und keine fertige Produktion.</b><br><br>Nach der Gründung führst du deinen Betrieb Schritt für Schritt durch Einrichtung, Maschinenkauf, Personal, Rohstoffe und die erste Produktion.";Object.assign(info.style,{padding:"14px",background:"#172235",border:"1px solid #334155",borderRadius:"10px",marginBottom:"20px",lineHeight:"1.5",color:"#dce3ed"});panel.appendChild(info);
        const label=(text)=>{const l=document.createElement("div");l.textContent=text;Object.assign(l.style,{fontWeight:"800",margin:"12px 0 5px"});return l;};
        const nameInput=document.createElement("input");nameInput.type="text";nameInput.placeholder="z. B. ORVUNO Brauerei GmbH";Object.assign(nameInput.style,{width:"100%",boxSizing:"border-box",padding:"12px",background:"#0b1320",color:"#fff",border:"1px solid #475569",borderRadius:"9px",fontSize:"16px"});panel.append(label("Firmenname"),nameInput);
        this.industrySelect=document.createElement("select");Object.assign(this.industrySelect.style,{width:"100%",padding:"12px",background:"#0b1320",color:"#fff",border:"1px solid #475569",borderRadius:"9px",fontSize:"15px"});for(const industry of Object.keys(this.industries)){const o=document.createElement("option");o.value=industry;o.textContent=industry;this.industrySelect.appendChild(o);}this.industrySelect.addEventListener("change",()=>this.updateTypes());panel.append(label("Branche"),this.industrySelect);
        this.typeSelect=document.createElement("select");Object.assign(this.typeSelect.style,{width:"100%",padding:"12px",background:"#0b1320",color:"#fff",border:"1px solid #475569",borderRadius:"9px",fontSize:"15px"});panel.append(label("Gewerbe"),this.typeSelect);
        const tip=document.createElement("div");tip.textContent="Tipp: Wähle das Gewerbe, das du wirklich spielen möchtest. Weitere Betriebe kannst du später als Teil deines Konzerns gründen.";Object.assign(tip.style,{fontSize:"13px",color:"#9fb0c6",marginTop:"14px",lineHeight:"1.4"});panel.append(tip);
        const button=document.createElement("button");button.textContent="Betrieb gründen und starten";Object.assign(button.style,{width:"100%",padding:"14px",marginTop:"22px",fontSize:"16px",cursor:"pointer",border:0,borderRadius:"10px",background:"#3868ee",color:"#fff",fontWeight:"900"});
        button.addEventListener("click",async()=>{
            const name=nameInput.value.trim();if(!name){alert("Bitte einen Firmennamen eingeben.");return;}button.disabled=true;button.textContent="Betrieb wird angelegt …";
            try{
                const api=window.worldAccounts.authApi;
                const result=await api.createBusiness({name,industry:this.industrySelect.value,companyType:this.typeSelect.value,slotNo:1});
                this.hydrateCompany(result.company,{balance:window.worldServerAccountOverview?.wallet?.balance||0});
                this.company.setupPhase="empty_building";this.company.buildingState=createStarterBuilding(this.company);
                await api.updateBusinessSetup(result.company.id,this.company.setupPhase,this.company.buildingState);
                window.worldServerAccountOverview=null;const overview=await this.loadAccountOverview({fresh:true});
                window.worldPlayerCompany=this.company;window.worldActiveServerCompany=result.company;
                window.dispatchEvent(new CustomEvent("worldproject:company-founded",{detail:{company:this.company,serverCompany:result.company,overview}}));this.close();if(this.onComplete)this.onComplete(this.company);
            }catch(error){alert(`Betrieb konnte nicht gespeichert werden: ${error.message}`);button.disabled=false;button.textContent="Betrieb gründen und starten";}
        });
        panel.appendChild(button);this.overlay.appendChild(panel);
    }

    updateTypes(){if(!this.typeSelect)return;this.typeSelect.innerHTML="";for(const type of this.industries[this.industrySelect.value]||[]){const o=document.createElement("option");o.value=type;o.textContent=type;this.typeSelect.appendChild(o);}}
    close(){if(!this.overlay)return;this.overlay.remove();this.overlay=null;}
}
