// WorldProject - beliebig viele Betriebe pro Spieler, aber Expansion muss verdient werden
import { createStarterBuilding } from "./IndustryCatalog.js";
import { canExpand, expansionRequirements } from "./BusinessExpansionSystem.js";
import { propertyOffer } from "./BusinessLocationSystem.js";

const CORE_RUNTIME_KEYS=new Set(["money","coins","name","industry","type","serverCompanyId","slotNo","setupPhase","buildingState"]);
export class BusinessPortfolioSystem {
    constructor({api}={}){this.api=api;this.companies=[];this.activeCompany=null;this.hydratedStateKeys=new Set();this.lastFinanceEvents=[];}

    hydrateCompany(target,serverCompany,wallet={}){
        // Dieselbe Runtime-Instanz wird absichtlich weiterverwendet, damit bestehende UI-Referenzen gueltig bleiben.
        // Vor dem Firmenwechsel muessen aber alle dynamischen Felder des vorherigen Betriebs verschwinden.
        for(const key of this.hydratedStateKeys)if(!CORE_RUNTIME_KEYS.has(key))delete target[key];
        this.hydratedStateKeys.clear();
        const state=serverCompany.game_state||{};
        // companies.money ist die kanonische Geldquelle. game_state.money ist nur noch ein Kompatibilitaetsspiegel.
        target.serverCompanyId=serverCompany.id;target.slotNo=Number(serverCompany.slot_no||1);target.name=serverCompany.name||"";target.industry=serverCompany.industry||"";target.type=serverCompany.company_type||"";target.money=Number(serverCompany.money??state.money??0);target.coins=Number(wallet?.balance||0);target.setupPhase=serverCompany.setup_phase||"empty_building";
        const stored=serverCompany.building_state;const hasStoredBuilding=stored&&typeof stored==="object"&&!Array.isArray(stored)&&Object.keys(stored).length>0;target.buildingState=hasStoredBuilding?structuredClone(stored):createStarterBuilding(target);
        for(const[key,value]of Object.entries(state)){if(CORE_RUNTIME_KEYS.has(key))continue;target[key]=typeof structuredClone==="function"?structuredClone(value):value;this.hydratedStateKeys.add(key);}return target;
    }
    async refresh(){
        let finance={events:[]};try{if(this.api?.processBusinessFinances)finance=await this.api.processBusinessFinances();}catch(error){console.warn("Laufende Betriebsfinanzen konnten nicht verarbeitet werden",error);}
        const overview=await this.api.accountOverview();this.companies=overview.companies||[];this.lastFinanceEvents=Array.isArray(finance?.events)?finance.events:[];window.worldServerAccountOverview=overview;
        const activeId=this.activeCompany?.serverCompanyId||window.worldPlayerCompany?.serverCompanyId;if(activeId&&!this.companies.some(c=>String(c.id)===String(activeId))&&this.companies.length){const primary=this.companies.find(c=>c.is_primary)||this.companies[0];this.activate(primary,window.worldPlayerCompany||this.activeCompany||{});}
        if(this.lastFinanceEvents.length&&typeof window!=="undefined")window.dispatchEvent(new CustomEvent("world:business-finance-events",{detail:{events:this.lastFinanceEvents}}));return overview;
    }
    activate(serverCompany,target=window.worldPlayerCompany||{}){
        const previousId=target?.serverCompanyId??null,wallet=window.worldServerAccountOverview?.wallet||{};this.hydrateCompany(target,serverCompany,wallet);this.activeCompany=target;window.worldPlayerCompany=target;window.worldActiveServerCompany=serverCompany;if(window.worldEngine)window.worldEngine.company=target;
        const detail={company:target,serverCompany,previousCompanyId:previousId,companyId:serverCompany.id,slotNo:Number(serverCompany.slot_no||1)};
        window.dispatchEvent(new CustomEvent("worldproject:company-switched",{detail}));window.dispatchEvent(new CustomEvent("worldproject:company-activated",{detail}));window.dispatchEvent(new CustomEvent("world:active-business-changed",{detail}));return target;
    }
    nextFreeSlot(){const used=new Set(this.companies.map(c=>Number(c.slot_no)).filter(Number.isFinite));let slot=1;while(used.has(slot))slot++;return slot;}
    getExpansionRequirements(){return expansionRequirements(this.companies.length);}
    getExpansionStatus(sourceCompany=this.activeCompany||window.worldPlayerCompany){return canExpand({businesses:this.companies,sourceCompany,managementCapacity:Number(sourceCompany?.managementCapacity||0)});}

    async createBusiness(data={}){
        const hasExisting=this.companies.length>0,sourceCompany=data.sourceCompany||this.activeCompany||window.worldPlayerCompany;
        const locationClass=data.locationClass||"smallTown",propertyMode=data.propertyMode==="buy"?"buy":"rent",propertySizeLevel=Math.max(1,Number(data.propertySizeLevel||1));
        const offer=propertyOffer(locationClass,propertyMode,propertySizeLevel);data.propertyUpfront=offer.upfront;data.propertyMonthly=offer.monthly;data.propertySizeLevel=propertySizeLevel;
        if(hasExisting){const status=this.getExpansionStatus(sourceCompany);if(!status.allowed){const e=new Error(`Expansion noch nicht möglich: ${status.reasons.join(", ")}`);e.expansionStatus=status;throw e;}if(Number(sourceCompany?.money||0)<offer.upfront)throw new Error(`Nicht genug Spielgeld für die ${propertyMode==="buy"?"Immobilie":"Miet-Startkosten"}: benötigt ${Number(offer.upfront).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})} €`);}
        const slotNo=data.slotNo||this.nextFreeSlot();
        const result=hasExisting
            ?await this.api.createPaidBusiness({...data,slotNo,sourceCompany,sourceCompanyId:sourceCompany?.serverCompanyId||sourceCompany?.id})
            :await this.api.createBusiness({...data,slotNo});
        const starter=createStarterBuilding({type:data.companyType||data.type,industry:data.industry});await this.api.updateBusinessSetup(result.company.id,"empty_building",starter);const overview=await this.refresh();
        if(hasExisting&&sourceCompany?.serverCompanyId){const freshSource=overview.companies?.find(c=>String(c.id)===String(sourceCompany.serverCompanyId));if(freshSource)sourceCompany.money=Number(freshSource.money??freshSource.game_state?.money??sourceCompany.money??0);window.dispatchEvent(new CustomEvent("world:server-balances-changed",{detail:{reason:"business-property",propertyUpfront:offer.upfront,propertyMonthly:offer.monthly,propertyMode,locationClass}}));}
        const company=this.companies.find(c=>c.id===result.company.id)||{...result.company,building_state:starter,setup_phase:"empty_building"};return {success:true,company,creationCost:offer.upfront,propertyOffer:offer};
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
