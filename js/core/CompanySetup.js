// ============================================
// CompanySetup.js
// WorldProject
// Unternehmensgründung + Supabase-Persistenz
// ============================================

export class CompanySetup {
    constructor(company,onComplete){
        this.company=company; this.onComplete=onComplete; this.overlay=null; this.industrySelect=null; this.typeSelect=null;
        this.industries={
            "Getränke":["Brauerei","Getränkehersteller","Mineralbrunnen"],
            "Lebensmittel":["Bäckerei","Metzgerei","Lebensmittelhersteller"],
            "Landwirtschaft":["Landwirtschaftsbetrieb","Tierhaltung","Obstbau"],
            "Industrie":["Maschinenbau","Metallverarbeitung","Kunststoffverarbeitung"],
            "Handel":["Einzelhandel","Großhandel","Onlinehandel"]
        };
    }

    async show(){
        if(this.overlay) return;
        try{
            const overview=window.worldServerAccountOverview || await window.worldAccounts?.authApi?.accountOverview?.();
            if(overview?.company){
                this.hydrateCompany(overview.company,overview.wallet);
                window.worldPlayerCompany=this.company;
                window.dispatchEvent(new CustomEvent("worldproject:company-loaded",{detail:{company:this.company,serverCompany:overview.company}}));
                if(this.onComplete) this.onComplete(this.company);
                return;
            }
        }catch(error){ console.warn("Bestehende Firma konnte noch nicht geladen werden",error); }
        this.createOverlay(); this.updateTypes(); document.body.appendChild(this.overlay);
    }

    hydrateCompany(serverCompany,wallet){
        this.company.serverCompanyId=serverCompany.id;
        this.company.name=serverCompany.name||"";
        this.company.industry=serverCompany.industry||"";
        this.company.type=serverCompany.company_type||"";
        this.company.money=Number(serverCompany.money||0);
        this.company.coins=Number(wallet?.balance||0);
        const state=serverCompany.game_state||{};
        for(const [key,value] of Object.entries(state)){
            if(["money","coins","name","industry","type","serverCompanyId"].includes(key)) continue;
            this.company[key]=value;
        }
    }

    createOverlay(){
        this.overlay=document.createElement("div");
        Object.assign(this.overlay.style,{position:"fixed",inset:"0",background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"1000"});
        const panel=document.createElement("div"); Object.assign(panel.style,{width:"420px",padding:"30px",background:"#ffffff",borderRadius:"12px",boxShadow:"0 10px 40px rgba(0,0,0,0.4)",fontFamily:"Arial, sans-serif"});
        const title=document.createElement("h1"); title.textContent="Unternehmen gründen"; title.style.marginTop="0"; panel.appendChild(title);
        const nameLabel=document.createElement("label"); nameLabel.textContent="Firmenname"; nameLabel.style.display="block"; nameLabel.style.marginTop="20px"; panel.appendChild(nameLabel);
        const nameInput=document.createElement("input"); nameInput.type="text"; nameInput.placeholder="z. B. NADENA"; Object.assign(nameInput.style,{width:"100%",boxSizing:"border-box",padding:"10px",marginTop:"6px",fontSize:"16px"}); panel.appendChild(nameInput);
        const industryLabel=document.createElement("label"); industryLabel.textContent="Branche"; industryLabel.style.display="block"; industryLabel.style.marginTop="20px"; panel.appendChild(industryLabel);
        this.industrySelect=document.createElement("select"); Object.assign(this.industrySelect.style,{width:"100%",padding:"10px",marginTop:"6px"});
        for(const industry of Object.keys(this.industries)){ const option=document.createElement("option"); option.value=industry; option.textContent=industry; this.industrySelect.appendChild(option); }
        this.industrySelect.addEventListener("change",()=>this.updateTypes()); panel.appendChild(this.industrySelect);
        const typeLabel=document.createElement("label"); typeLabel.textContent="Gewerbe"; typeLabel.style.display="block"; typeLabel.style.marginTop="20px"; panel.appendChild(typeLabel);
        this.typeSelect=document.createElement("select"); Object.assign(this.typeSelect.style,{width:"100%",padding:"10px",marginTop:"6px"}); panel.appendChild(this.typeSelect);
        const button=document.createElement("button"); button.textContent="Unternehmen gründen"; Object.assign(button.style,{width:"100%",padding:"12px",marginTop:"30px",fontSize:"16px",cursor:"pointer"});
        button.addEventListener("click",async()=>{
            const name=nameInput.value.trim(); if(!name){ alert("Bitte einen Firmennamen eingeben."); return; }
            button.disabled=true;
            try{
                const result=await window.worldAccounts.authApi.ensureCompany({name,industry:this.industrySelect.value,companyType:this.typeSelect.value});
                this.hydrateCompany(result.company,{balance:window.worldServerAccountOverview?.wallet?.balance||0});
                window.worldServerAccountOverview=await window.worldAccounts.authApi.accountOverview();
                window.worldPlayerCompany=this.company;
                window.dispatchEvent(new CustomEvent("worldproject:company-founded",{detail:{company:this.company,serverCompany:result.company}}));
                this.close(); if(this.onComplete) this.onComplete(this.company);
            }catch(error){ alert(`Firma konnte nicht gespeichert werden: ${error.message}`); button.disabled=false; }
        });
        panel.appendChild(button); this.overlay.appendChild(panel);
    }

    updateTypes(){
        if(!this.typeSelect) return; this.typeSelect.innerHTML=""; const types=this.industries[this.industrySelect.value]||[];
        for(const type of types){ const option=document.createElement("option"); option.value=type; option.textContent=type; this.typeSelect.appendChild(option); }
    }

    close(){ if(!this.overlay) return; this.overlay.remove(); this.overlay=null; }
}
