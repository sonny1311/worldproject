// WorldProject - Gruendungsphase eines Betriebes
import { createStarterBuilding, equipmentFor, setupProgress } from "./IndustryCatalog.js";

export class BusinessSetupSystem {
    ensure(company){
        company.setupPhase ??= company.setup_phase ?? "empty_building";
        company.buildingState ??= company.building_state ?? createStarterBuilding(company);
        company.buildingState.equipment ??= [];
        return company;
    }

    getState(company){
        this.ensure(company);
        const progress=setupProgress(company);
        return {phase:company.setupPhase,building:company.buildingState,progress,equipmentCatalog:equipmentFor(company),canOperate:company.setupPhase==="operating"};
    }

    buyEquipment(company,equipmentId){
        this.ensure(company);
        const item=equipmentFor(company).find(x=>x.id===equipmentId);
        if(!item)return {success:false,reason:"Diese Ausstattung gehört nicht zu diesem Gewerbe"};
        if(company.buildingState.equipment.some(x=>(x.id||x)===item.id))return {success:false,reason:"Ausstattung bereits vorhanden"};
        if((Number(company.money)||0)<item.price)return {success:false,reason:"Nicht genug Geld"};
        company.money-=item.price;
        company.buildingState.equipment.push({...item,boughtAt:new Date().toISOString(),status:"installed"});
        const room=company.buildingState.rooms?.find(r=>r.id===item.room);
        if(room){room.equipment??=[];room.equipment.push(item.id);}
        company.setupPhase="furnishing";
        const progress=setupProgress(company);
        if(progress.complete)company.setupPhase="ready";
        return {success:true,equipment:item,cost:item.price,state:this.getState(company)};
    }

    startOperations(company){
        this.ensure(company);
        const progress=setupProgress(company);
        if(!progress.complete)return {success:false,reason:`Mindestausstattung fehlt: ${progress.missing.join(", ")}`,missing:progress.missing};
        company.setupPhase="operating";
        company.buildingState.ready=true;
        return {success:true,state:this.getState(company)};
    }

    canUseEconomy(company){return this.ensure(company).setupPhase==="operating";}
}

export function runBusinessSetupTest(){
    const s=new BusinessSetupSystem();
    const c={type:"Schreinerei",money:50000};s.ensure(c);
    const before=!s.canUseEconomy(c);
    for(const e of s.getState(c).equipmentCatalog.filter(x=>x.required))s.buyEquipment(c,e.id);
    const ready=s.startOperations(c);
    const success=before&&ready.success&&s.canUseEconomy(c)&&c.buildingState.equipment.length>=4;
    console[success?"log":"error"](success?"✅ BETRIEBS-GRÜNDUNGSTEST ERFOLGREICH":"❌ BETRIEBS-GRÜNDUNGSTEST FEHLGESCHLAGEN",{company:c,ready});
    return {success,company:c};
}
