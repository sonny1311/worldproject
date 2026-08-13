// WorldProject - beliebig viele Betriebe pro Spieler, aber Expansion muss verdient werden
import { createStarterBuilding } from "./IndustryCatalog.js";
import { canExpand, expansionRequirements } from "./BusinessExpansionSystem.js";

export class BusinessPortfolioSystem {
    constructor({api}={}){this.api=api;this.companies=[];this.activeCompany=null;}

    hydrateCompany(target,serverCompany,wallet={}){
        const state=serverCompany.game_state||{};
        target.serverCompanyId=serverCompany.id;target.slotNo=Number(serverCompany.slot_no||1);target.name=serverCompany.name||"";target.industry=serverCompany.industry||"";target.type=serverCompany.company_type||"";target.money=Number(state.money??serverCompany.money??0);target.coins=Number(wallet?.balance||0);target.setupPhase=serverCompany.setup_phase||"empty_building";
        const stored=serverCompany.building_state;const hasStoredBuilding=stored&&typeof stored==="object"&&!Array.isArray(stored)&&Object.keys(stored).length>0;target.buildingState=hasStoredBuilding?stored:createStarterBuilding(target);
        for(const[key,value]of Object.entries(state)){if(["money","coins","name","industry","type","serverCompanyId","slotNo","setupPhase","buildingState"].includes(key))continue;target[key]=value;}return target;
    }
    async refresh(){const overview=await this.api.accountOverview();this.companies=overview.companies||[];window.worldServerAccountOverview=overview;return overview;}
    activate(serverCompany,target=window.worldPlayerCompany||{}){const wallet=window.worldServerAccountOverview?.wallet||{};this.hydrateCompany(target,serverCompany,wallet);this.activeCompany=target;window.worldPlayerCompany=target;window.worldActiveServerCompany=serverCompany;window.dispatchEvent(new CustomEvent("worldproject:company-switched",{detail:{company:target,serverCompany}}));return target;}
    nextFreeSlot(){const used=new Set(this.companies.map(c=>Number(c.slot_no)).filter(Number.isFinite));let slot=1;while(used.has(slot))slot++;return slot;}
    getExpansionRequirements(){return expansionRequirements(this.companies.length);}
    getExpansionStatus(sourceCompany=this.activeCompany||window.worldPlayerCompany){return canExpand({businesses:this.companies,sourceCompany,managementCapacity:Number(sourceCompany?.managementCapacity||0)});}

    async createBusiness(data={}){
        if(this.companies.length>0){const status=this.getExpansionStatus(data.sourceCompany||this.activeCompany||window.worldPlayerCompany);if(!status.allowed){const e=new Error(`Expansion noch nicht möglich: ${status.reasons.join(", ")}`);e.expansionStatus=status;throw e;}data.expansionCost=status.requirements.creationCost;}
        const slotNo=data.slotNo||this.nextFreeSlot();const result=await this.api.createBusiness({...data,slotNo});
        const starter=createStarterBuilding({type:data.companyType||data.type,industry:data.industry});await this.api.updateBusinessSetup(result.company.id,"empty_building",starter);await this.refresh();
        const company=this.companies.find(c=>c.id===result.company.id)||{...result.company,building_state:starter,setup_phase:"empty_building"};return {success:true,company};
    }
    async transferMoney(fromCompanyId,toCompanyId,amount){const result=await this.api.transferBusinessMoney(fromCompanyId,toCompanyId,amount);await this.refresh();window.dispatchEvent(new CustomEvent("world:server-balances-changed"));return result;}

    async transferGoods(fromCompanyId,toCompanyId,{product,quantity}={}){
        const q=Math.max(0,Number(quantity||0));if(!product||q<=0)throw new Error("Produkt und Menge erforderlich");if(String(fromCompanyId)===String(toCompanyId))throw new Error("Quell- und Zielbetrieb müssen verschieden sein");
        await this.refresh();const from=this.companies.find(c=>String(c.id)===String(fromCompanyId)),to=this.companies.find(c=>String(c.id)===String(toCompanyId));if(!from||!to)throw new Error("Betrieb nicht gefunden");
        const fromState=structuredClone(from.game_state||{}),toState=structuredClone(to.game_state||{});fromState.finishedGoods??={};fromState.tradeInventory??={};toState.tradeInventory??={};fromState.internalTransfers??=[];toState.internalTransfers??=[];
        const finished=Number(fromState.finishedGoods[product]||0),trade=Number(fromState.tradeInventory[product]||0);if(finished+trade<q)throw new Error("Nicht genug Ware im Quellbetrieb");let left=q;if(finished>0){const take=Math.min(left,finished);fromState.finishedGoods[product]=finished-take;left-=take;}if(left>0)fromState.tradeInventory[product]=trade-left;
        toState.tradeInventory[product]=Number(toState.tradeInventory[product]||0)+q;const transfer={id:`internal-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,fromCompanyId:from.id,toCompanyId:to.id,product,quantity:q,status:"received",createdAt:Date.now(),receivedAt:Date.now()};fromState.internalTransfers.push(transfer);toState.internalTransfers.push(transfer);
        await this.api.saveBusinessState(from.id,fromState);await this.api.saveBusinessState(to.id,toState);await this.refresh();
        const active=this.activeCompany||window.worldPlayerCompany;if(active?.serverCompanyId&&String(active.serverCompanyId)===String(from.id)){active.finishedGoods=fromState.finishedGoods;active.tradeInventory=fromState.tradeInventory;active.internalTransfers=fromState.internalTransfers;}if(active?.serverCompanyId&&String(active.serverCompanyId)===String(to.id)){active.tradeInventory=toState.tradeInventory;active.internalTransfers=toState.internalTransfers;}
        window.dispatchEvent(new CustomEvent("world:internal-goods-transferred",{detail:transfer}));return {success:true,transfer};
    }
}
