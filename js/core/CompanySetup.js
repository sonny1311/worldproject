// ============================================
// CompanySetup.js
// WorldProject
// Unternehmensgründung
// ============================================

export class CompanySetup {

    constructor(company, onComplete) {
        this.company = company;
        this.onComplete = onComplete;
        this.overlay = null;
        this.industrySelect = null;
        this.typeSelect = null;
        this.industries = {
            "Getränke": ["Brauerei","Getränkehersteller","Mineralbrunnen"],
            "Lebensmittel": ["Bäckerei","Metzgerei","Lebensmittelhersteller"],
            "Landwirtschaft": ["Landwirtschaftsbetrieb","Tierhaltung","Obstbau"],
            "Industrie": ["Maschinenbau","Metallverarbeitung","Kunststoffverarbeitung"],
            "Handel": ["Einzelhandel","Großhandel","Onlinehandel"]
        };
    }

    show() {
        if (this.overlay) return;
        this.createOverlay();
        this.updateTypes();
        document.body.appendChild(this.overlay);
    }

    createOverlay() {
        this.overlay = document.createElement("div");
        Object.assign(this.overlay.style,{position:"fixed",inset:"0",background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"1000"});

        const panel=document.createElement("div");
        Object.assign(panel.style,{width:"420px",padding:"30px",background:"#ffffff",borderRadius:"12px",boxShadow:"0 10px 40px rgba(0,0,0,0.4)",fontFamily:"Arial, sans-serif"});

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
        button.addEventListener("click",()=>{
            const name=nameInput.value.trim();
            if(!name){ alert("Bitte einen Firmennamen eingeben."); return; }
            this.company.name=name;
            this.company.industry=this.industrySelect.value;
            this.company.type=this.typeSelect.value;
            // Zentrale Referenz fuer verbundene Spielsysteme wie Wirtschaft/Fuhrpark.
            window.worldPlayerCompany=this.company;
            window.dispatchEvent(new CustomEvent("worldproject:company-founded",{detail:{company:this.company}}));
            this.close();
            if(this.onComplete) this.onComplete(this.company);
        });
        panel.appendChild(button);
        this.overlay.appendChild(panel);
    }

    updateTypes() {
        if (!this.typeSelect) return;
        this.typeSelect.innerHTML="";
        const industry=this.industrySelect.value;
        const types=this.industries[industry]||[];
        for(const type of types){ const option=document.createElement("option"); option.value=type; option.textContent=type; this.typeSelect.appendChild(option); }
    }

    close() { if(!this.overlay) return; this.overlay.remove(); this.overlay=null; }
}