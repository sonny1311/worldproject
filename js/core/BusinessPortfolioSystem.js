// WorldProject - beliebig viele Betriebe pro Spieler, aber Expansion muss verdient werden
import { createStarterBuilding } from "./IndustryCatalog.js";
import { canExpand, expansionRequirements } from "./BusinessExpansionSystem.js";

export class BusinessPortfolioSystem {
    constructor({api}={}){this.api=api;this.companies=[];this.activeCompany=null;}

    hydrateCompany(target,serverCompany,wallet={}){
        target.serverCompanyId=serverCompany.id;target.slotNo=Number(serverCompany.slot_no||1);target.name=serverCompany.name||"";target.industry=serverCompany.industry||"";target.type=serverCompany.company_type||"";target.money=Number(serverCompany.money||0);target.coins=Number(wallet?.balance||0);target.setupPhase=serverCompany.setup_phase||"empty_building";
        const stored=serverCompany.building_state;target.buildingState=stored?.rooms?.length?stored:createStarterBuilding(target);
        const state=serverCompany.game_state||{};for(const[key,value]of Object.entries(state)){if(["money","coins","name","industry","type","serverCompanyId","slotNo","setupPhase","buildingState"].includes(key))continue;target[key]=value;}return target;
    }
    async refresh(){const overview=await this.api.accountOverview();this.companies=overview.companies||[];window.worldServerAccountOverview=overview;return overview;}
    activate(serverCompany,target=window.worldPlayerCompany||{}){const wallet=window.worldServerAccountOverview?.wallet||{};this.hydrateCompany(target,serverCompany,wallet);this.activeCompany=target;window.worldPlayerCompany=target;window.worldActiveServerCompany=serverCompany;window.dispatchEvent(new CustomEvent("worldproject:company-switched",{detail:{company:target,serverCompany}}));return target;}
    nextFreeSlot(){const used=new Set(this.companies.map(c=>Number(c.slot_no)).filter(Number.isFinite));let slot=1;while(used.has(slot))slot++;return slot;}
    getExpansionRequirements(){return expansionRequirements(this.companies.length);}
    getExpansionStatus(sourceCompany=this.activeCompany||window.worldPlayerCompany){return canExpand({businesses:this.companies,sourceCompany,managementCapacity:Number(sourceCompany?.managementCapacity||0)});}

    async createBusiness(data={}){
        // Der erste Betrieb bleibt der Einstieg. Jeder weitere muss wirtschaftlich und organisatorisch verdient werden.
        if(this.companies.length>0){const status=this.getExpansionStatus(data.sourceCompany||this.activeCompany||window.worldPlayerCompany);if(!status.allowed){const e=new Error(`Expansion noch nicht möglich: ${status.reasons.join(", ")}`);e.expansionStatus=status;throw e;}data.expansionCost=status.requirements.creationCost;}
        const slotNo=data.slotNo||this.nextFreeSlot();const result=await this.api.createBusiness({...data,slotNo});
        const starter=createStarterBuilding({type:data.companyType||data.type,industry:data.industry});await this.api.updateBusinessSetup(result.company.id,"empty_building",starter);await this.refresh();
        const company=this.companies.find(c=>c.id===result.company.id)||{...result.company,building_state:starter,setup_phase:"empty_building"};return {success:true,company};
    }
    async transferMoney(fromCompanyId,toCompanyId,amount){const result=await this.api.transferBusinessMoney(fromCompanyId,toCompanyId,amount);await this.refresh();window.dispatchEvent(new CustomEvent("world:server-balances-changed"));return result;}
}
