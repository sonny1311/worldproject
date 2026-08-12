// WorldProject - bis zu vier Betriebe pro Spieler
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
        target.buildingState=serverCompany.building_state||createStarterBuilding(target);
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

    nextFreeSlot(){for(let i=1;i<=4;i++)if(!this.companies.some(c=>Number(c.slot_no)===i))return i;return null;}

    async createBusiness(data={}){
        if(this.companies.length>=4)throw new Error("Maximal vier Betriebe möglich");
        const slotNo=data.slotNo||this.nextFreeSlot();if(!slotNo)throw new Error("Kein freier Betriebsplatz");
        const result=await this.api.createBusiness({...data,slotNo});await this.refresh();return result;
    }

    async transferMoney(fromCompanyId,toCompanyId,amount){const result=await this.api.transferBusinessMoney(fromCompanyId,toCompanyId,amount);await this.refresh();window.dispatchEvent(new CustomEvent("world:server-balances-changed"));return result;}
}
