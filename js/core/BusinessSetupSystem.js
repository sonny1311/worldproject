// WorldProject - Gruendungsphase eines Betriebes: Grundstueck -> Mikroausstattung -> Betrieb.
import { createStarterBuilding, equipmentFor, setupProgress } from "./IndustryCatalog.js";
import { ensureMicroBusiness } from "./MicroBusinessStarterSystem.js";
import { microEquipmentFor, microEquipmentCoverage } from "./MicroEquipmentCatalog.js";
import { generateStarterParcels, buyLand, assignLandToCompany, canBuildBusiness, grandfatherExistingBusiness } from "./LandPropertySystem.js";

export class BusinessSetupSystem {
    ensure(company){
        const hadExistingSetup=Boolean(company.buildingState||company.building_state||company.setupPhase||company.setup_phase||company.landProperty||company.landPropertyId);
        if(hadExistingSetup){
            grandfatherExistingBusiness(company);
            company.setupPhase ??= company.setup_phase ?? "empty_building";
        }else{
            ensureMicroBusiness(company);
            company.setupPhase="land_search";
            company.propertyMarket??=generateStarterParcels(company,company.regionId||company.location?.regionId||"default");
        }
        company.buildingState ??= company.building_state ?? createStarterBuilding(company);
        company.buildingState.equipment ??= [];
        return company;
    }

    isMicro(company){this.ensure(company);return company.microBusiness?.stage==="micro"&&!company.landLegacyGrandfathered;}

    progress(company){
        this.ensure(company);
        return this.isMicro(company)?microEquipmentCoverage(company):setupProgress(company);
    }

    equipmentCatalog(company){
        this.ensure(company);
        return this.isMicro(company)?microEquipmentFor(company):equipmentFor(company);
    }

    getState(company){
        this.ensure(company);
        const progress=this.progress(company),land=canBuildBusiness(company);
        return {
            phase:company.setupPhase,
            building:company.buildingState,
            progress,
            equipmentCatalog:this.equipmentCatalog(company),
            propertyMarket:company.propertyMarket||[],
            landProperty:company.landProperty||null,
            landReady:land.ok,
            landReason:land.ok?null:land.reason,
            micro:this.isMicro(company),
            canOperate:company.setupPhase==="operating"
        };
    }

    buyStarterLand(company,parcelId){
        this.ensure(company);
        const parcel=(company.propertyMarket||[]).find(x=>x.id===parcelId);
        if(!parcel)return {success:false,reason:"Grundstück wurde nicht gefunden"};
        const bought=buyLand(company,parcel,{ownerId:company.ownerId||company.playerId||company.id||company.serverCompanyId});
        if(!bought.success)return bought;
        const assigned=assignLandToCompany(company,company,parcel.id);
        if(!assigned.success)return assigned;
        company.setupPhase="land_owned";
        return {success:true,parcel:assigned.parcel,cost:parcel.price,state:this.getState(company)};
    }

    buyEquipment(company,equipmentId){
        this.ensure(company);
        const land=canBuildBusiness(company);
        if(!land.ok)return {success:false,reason:land.reason};
        const item=this.equipmentCatalog(company).find(x=>x.id===equipmentId);
        if(!item)return {success:false,reason:"Diese Ausstattung gehört nicht zu diesem Gewerbe"};
        if(company.buildingState.equipment.some(x=>(x.id||x)===item.id))return {success:false,reason:"Ausstattung bereits vorhanden"};
        if((Number(company.money)||0)<item.price)return {success:false,reason:"Nicht genug Geld"};
        company.money-=item.price;
        company.buildingState.equipment.push({...item,boughtAt:new Date().toISOString(),status:"installed"});
        const room=company.buildingState.rooms?.find(r=>r.id===item.room);
        if(room){room.equipment??=[];room.equipment.push(item.id);}
        company.setupPhase="furnishing";
        const progress=this.progress(company);
        if(progress.complete)company.setupPhase="ready";
        return {success:true,equipment:item,cost:item.price,state:this.getState(company)};
    }

    startOperations(company){
        this.ensure(company);
        const land=canBuildBusiness(company);
        if(!land.ok)return {success:false,reason:land.reason};
        const progress=this.progress(company);
        if(!progress.complete){
            const missing=progress.missing.map(x=>typeof x==="string"?x:(x.name||x.id));
            return {success:false,reason:`Mindestausstattung fehlt: ${missing.join(", ")}`,missing};
        }
        company.setupPhase="operating";
        company.buildingState.ready=true;
        return {success:true,state:this.getState(company)};
    }

    canUseEconomy(company){return this.ensure(company).setupPhase==="operating";}
}

export function runBusinessSetupTest(){
    const s=new BusinessSetupSystem();
    const c={type:"Schreinerei",money:50000};s.ensure(c);
    const before=!s.canUseEconomy(c),parcel=s.getState(c).propertyMarket[0],land=s.buyStarterLand(c,parcel.id);
    for(const e of s.getState(c).equipmentCatalog)s.buyEquipment(c,e.id);
    const ready=s.startOperations(c);
    const spent=50000-c.money;
    const success=before&&land.success&&ready.success&&s.canUseEconomy(c)&&c.buildingState.equipment.length>=4&&spent<50000&&c.money>0;
    console[success?"log":"error"](success?"✅ MIKRO-GRÜNDUNGSTEST ERFOLGREICH":"❌ MIKRO-GRÜNDUNGSTEST FEHLGESCHLAGEN",{company:c,land,ready,spent});
    return {success,company:c,land,ready,spent};
}
