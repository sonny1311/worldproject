// WorldProject - beliebig viele Betriebe pro Spieler
import { createStarterBuilding } from "./IndustryCatalog.js";

export class BusinessPortfolioSystem {
    constructor({api}={}){this.api=api;this.companies=[];this.activeCompany=null;}

    hydrateCompany(target,serverCompany,wallet={}){
        target.serverCompanyId=serverCompany.id;
        target.slotNo=Number(serverCompany.slot_no||1);
        target.name=serverCompany.name||"";
        target.industry=serverCompany.industry||"";
        target.type=serverCompany.company_type||"";
        target.money=Number(serverCompany.money||0);
        target.coins=Number(wallet?.balance||0);
        target.setupPhase=serverCompany.setup_phase||"empty_building";
        const stored=serverCompany.building_state;
        target.buildingState=stored?.rooms?.length ? stored : createStarterBuilding(target);
        const state=serverCompany.game_state||{};
        for(const[key,value]of Object.entries(state)){
            if(["money","coins","name","industry","type","serverCompanyId","slotNo","setupPhase","buildingState"].includes(key))continue;
            target[key]=value;
        }
        return target;
    }

    async refresh(){const overview=await this.api.accountOverview();this.companies=overview.companies||[];window.worldServerAccountOverview=overview;return overview;}

    activate(serverCompany,target=window.worldPlayerCompany||{}){
        const wallet=window.worldServerAccountOverview?.wallet||{};
        this.hydrateCompany(target,serverCompany,wallet);
        this.activeCompany=target;
        window.worldPlayerCompany=target;
        window.worldActiveServerCompany=serverCompany;
        window.dispatchEvent(new CustomEvent("worldproject:company-switched",{detail:{company:target,serverCompany}}));
        return target;
    }

    nextFreeSlot(){
        const used=new Set(this.companies.map(c=>Number(c.slot_no)).filter(Number.isFinite));
        let slot=1;
        while(used.has(slot))slot++;
        return slot;
    }

    async createBusiness(data={}){
        const slotNo=data.slotNo||this.nextFreeSlot();
        const result=await this.api.createBusiness({...data,slotNo});
        const starter=createStarterBuilding({type:data.companyType||data.type,industry:data.industry});
        await this.api.updateBusinessSetup(result.company.id,"empty_building",starter);
        await this.refresh();
        const company=this.companies.find(c=>c.id===result.company.id)||{...result.company,building_state:starter,setup_phase:"empty_building"};
        return {success:true,company};
    }

    async transferMoney(fromCompanyId,toCompanyId,amount){const result=await this.api.transferBusinessMoney(fromCompanyId,toCompanyId,amount);await this.refresh();window.dispatchEvent(new CustomEvent("world:server-balances-changed"));return result;}
}
