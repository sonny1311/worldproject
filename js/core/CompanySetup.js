// WorldProject - Unternehmensgründung mit leerem Startgebäude
import { IndustryGroups, createStarterBuilding } from "./IndustryCatalog.js";

export class CompanySetup {
    constructor(company,onComplete){this.company=company;this.onComplete=onComplete;this.overlay=null;this.industrySelect=null;this.typeSelect=null;this.industries=IndustryGroups;}

    async show(){
        if(this.overlay)return;
        try{
            const overview=window.worldServerAccountOverview||await window.worldAccounts?.authApi?.accountOverview?.();
            if(overview?.companies?.length){
                window.worldServerAccountOverview=overview;
                const serverCompany=overview.companies.find(c=>Number(c.slot_no)===1)||overview.companies[0];
                this.hydrateCompany(serverCompany,overview.wallet);
                window.worldPlayerCompany=this.company;window.worldActiveServerCompany=serverCompany;
                window.dispatchEvent(new CustomEvent("worldproject:company-loaded",{detail:{company:this.company,serverCompany}}));
                if(this.onComplete)this.onComplete(this.company);return;
            }
        }catch(error){console.warn("Bestehender Betrieb konnte noch nicht geladen werden",error);}
        this.createOverlay();this.updateTypes();document.body.appendChild(this.overlay);
    }

    hydrateCompany(serverCompany,wallet={}){
        const portfolio=window.worldAccounts?.businessPortfolio;
        if(portfolio?.hydrateCompany)return portfolio.hydrateCompany(this.company,serverCompany,wallet);
        this.company.serverCompanyId=serverCompany.id;this.company.slotNo=Number(serverCompany.slot_no||1);this.company.name=serverCompany.name||"";this.company.industry=serverCompany.industry||"";this.company.type=serverCompany.company_type||"";this.company.money=Number(serverCompany.money||0);this.company.coins=Number(wallet?.balance||0);this.company.setupPhase=serverCompany.setup_phase||"empty_building";this.company.buildingState=serverCompany.building_state||createStarterBuilding(this.company);return this.company;
    }

    createOverlay(){
        this.overlay=document.createElement("div");Object.assign(this.overlay.style,{position:"fixed",inset:"0",background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"1000"});
        const panel=document.createElement("div");Object.assign(panel.style,{width:"470px",padding:"30px",background:"#fff",borderRadius:"12px",boxShadow:"0 10px 40px rgba(0,0,0,.4)",fontFamily:"Arial,sans-serif"});
        const title=document.createElement("h1");title.textContent="Ersten Betrieb gründen";title.style.marginTop="0";panel.appendChild(title);
        const info=document.createElement("div");info.textContent="Du startest mit einem leeren Gebäude. Maschinen, Einrichtung und Rohstoffe musst du danach selbst kaufen.";Object.assign(info.style,{padding:"10px",background:"#eef3f8",borderRadius:"8px",marginBottom:"14px"});panel.appendChild(info);
        const nameInput=document.createElement("input");nameInput.type="text";nameInput.placeholder="Firmenname";Object.assign(nameInput.style,{width:"100%",boxSizing:"border-box",padding:"10px",margin:"7px 0",fontSize:"16px"});panel.appendChild(nameInput);
        this.industrySelect=document.createElement("select");Object.assign(this.industrySelect.style,{width:"100%",padding:"10px",margin:"7px 0"});for(const industry of Object.keys(this.industries)){const o=document.createElement("option");o.value=industry;o.textContent=industry;this.industrySelect.appendChild(o);}this.industrySelect.addEventListener("change",()=>this.updateTypes());panel.appendChild(this.industrySelect);
        this.typeSelect=document.createElement("select");Object.assign(this.typeSelect.style,{width:"100%",padding:"10px",margin:"7px 0"});panel.appendChild(this.typeSelect);
        const button=document.createElement("button");button.textContent="Betrieb gründen";Object.assign(button.style,{width:"100%",padding:"12px",marginTop:"20px",fontSize:"16px",cursor:"pointer"});
        button.addEventListener("click",async()=>{
            const name=nameInput.value.trim();if(!name){alert("Bitte einen Firmennamen eingeben.");return;}button.disabled=true;
            try{
                const api=window.worldAccounts.authApi;
                const result=await api.createBusiness({name,industry:this.industrySelect.value,companyType:this.typeSelect.value,slotNo:1});
                this.hydrateCompany(result.company,{balance:window.worldServerAccountOverview?.wallet?.balance||0});
                this.company.setupPhase="empty_building";this.company.buildingState=createStarterBuilding(this.company);
                await api.updateBusinessSetup(result.company.id,this.company.setupPhase,this.company.buildingState);
                window.worldServerAccountOverview=await api.accountOverview();window.worldPlayerCompany=this.company;window.worldActiveServerCompany=result.company;
                window.dispatchEvent(new CustomEvent("worldproject:company-founded",{detail:{company:this.company,serverCompany:result.company}}));this.close();if(this.onComplete)this.onComplete(this.company);
            }catch(error){alert(`Betrieb konnte nicht gespeichert werden: ${error.message}`);button.disabled=false;}
        });
        panel.appendChild(button);this.overlay.appendChild(panel);
    }

    updateTypes(){if(!this.typeSelect)return;this.typeSelect.innerHTML="";for(const type of this.industries[this.industrySelect.value]||[]){const o=document.createElement("option");o.value=type;o.textContent=type;this.typeSelect.appendChild(o);}}
    close(){if(!this.overlay)return;this.overlay.remove();this.overlay=null;}
}
