// WorldProject - Branchenkatalog
// Bestimmt, welche Rohstoffe, Maschinen und Produkte ein Betrieb verwenden darf.

const GENERIC_STARTER = {
    branchKey:"generic",
    label:"Betrieb",
    starterBuilding:{name:"Leeres Gewerbegebäude",areaM2:240,rooms:[{id:"hall",name:"Leere Halle",areaM2:180},{id:"storage",name:"Leerer Lagerbereich",areaM2:60}]},
    equipment:[],requiredEquipment:[],allowedItems:[],products:[]
};

export const IndustryProfiles = {
    "Brauerei":{
        branchKey:"brewery",label:"Brauerei",
        starterBuilding:{name:"Leeres Brauereigebäude",areaM2:300,rooms:[{id:"production",name:"Produktionshalle",areaM2:190},{id:"storage",name:"Lager",areaM2:80},{id:"office",name:"Büro",areaM2:30}]},
        equipment:[
            {id:"brew_kettle",name:"Sudwerk",price:14500,required:true,room:"production"},
            {id:"fermenter",name:"Gär-/Lagertank",price:9500,required:true,room:"production"},
            {id:"filling_line",name:"Abfüllanlage",price:12000,required:true,room:"production"},
            {id:"cold_storage",name:"Kühltechnik",price:6500,required:false,room:"storage"}
        ],
        requiredEquipment:["brew_kettle","fermenter","filling_line"],
        allowedItems:["malt_kg","hops_kg","yeast_kg","water_l","bottle_033","crown_cap","label_033"],
        products:["lager033_bottle","pils033_bottle"],recipes:["lager033","pils033"]
    },
    "Getränkehersteller":{
        branchKey:"beverage",label:"Getränkehersteller",
        starterBuilding:{name:"Leeres Getränkegebäude",areaM2:280,rooms:[{id:"production",name:"Produktionshalle",areaM2:170},{id:"storage",name:"Lager",areaM2:80},{id:"office",name:"Büro",areaM2:30}]},
        equipment:[{id:"mixing_tank",name:"Mischtank",price:10000,required:true,room:"production"},{id:"filling_line",name:"Abfüllanlage",price:12000,required:true,room:"production"}],
        requiredEquipment:["mixing_tank","filling_line"],
        allowedItems:["water_l","bottle_033","crown_cap","label_033"],products:[],recipes:[]
    },
    "Mineralbrunnen":{
        branchKey:"beverage",label:"Mineralbrunnen",
        starterBuilding:{name:"Leeres Abfüllgebäude",areaM2:280,rooms:[{id:"production",name:"Abfüllhalle",areaM2:180},{id:"storage",name:"Lager",areaM2:100}]},
        equipment:[{id:"water_treatment",name:"Wasseraufbereitung",price:15000,required:true,room:"production"},{id:"filling_line",name:"Abfüllanlage",price:12000,required:true,room:"production"}],
        requiredEquipment:["water_treatment","filling_line"],allowedItems:["water_l","bottle_033","crown_cap","label_033"],products:[],recipes:[]
    },
    "Schreinerei":{
        branchKey:"carpentry",label:"Schreinerei",
        starterBuilding:{name:"Leere Schreinerei",areaM2:260,rooms:[{id:"workshop",name:"Werkstatt",areaM2:170},{id:"wood_storage",name:"Holzlager",areaM2:70},{id:"office",name:"Büro",areaM2:20}]},
        equipment:[
            {id:"panel_saw",name:"Formatkreissäge",price:9000,required:true,room:"workshop"},
            {id:"planer",name:"Abricht-/Dickenhobel",price:7500,required:true,room:"workshop"},
            {id:"workbench",name:"Werkbank",price:1800,required:true,room:"workshop"},
            {id:"dust_extractor",name:"Absauganlage",price:4200,required:true,room:"workshop"},
            {id:"edge_bander",name:"Kantenanleimmaschine",price:11000,required:false,room:"workshop"}
        ],
        requiredEquipment:["panel_saw","planer","workbench","dust_extractor"],
        allowedItems:["timber_spruce_m3","timber_oak_m3","board_mdf_m2","glue_kg","fittings_set"],
        products:["table_basic","cabinet_basic"],recipes:[]
    },
    "Tischlerei":null
};
IndustryProfiles["Tischlerei"]={...IndustryProfiles["Schreinerei"],label:"Tischlerei"};

const genericTypes=["Bäckerei","Metzgerei","Lebensmittelhersteller","Landwirtschaftsbetrieb","Tierhaltung","Obstbau","Maschinenbau","Metallverarbeitung","Kunststoffverarbeitung","Einzelhandel","Großhandel","Onlinehandel"];
for(const type of genericTypes) IndustryProfiles[type]={...GENERIC_STARTER,label:type,branchKey:type.toLowerCase().replaceAll(" ","_")};

export const IndustryGroups={
    "Getränke":["Brauerei","Getränkehersteller","Mineralbrunnen"],
    "Lebensmittel":["Bäckerei","Metzgerei","Lebensmittelhersteller"],
    "Landwirtschaft":["Landwirtschaftsbetrieb","Tierhaltung","Obstbau"],
    "Industrie":["Maschinenbau","Metallverarbeitung","Kunststoffverarbeitung"],
    "Handwerk":["Schreinerei","Tischlerei"],
    "Handel":["Einzelhandel","Großhandel","Onlinehandel"]
};

export function getIndustryProfile(companyOrType){
    const type=typeof companyOrType==="string"?companyOrType:companyOrType?.type||companyOrType?.company_type;
    return IndustryProfiles[type]||{...GENERIC_STARTER,label:type||"Betrieb"};
}

export function createStarterBuilding(companyOrType){
    const p=getIndustryProfile(companyOrType),base=p.starterBuilding||GENERIC_STARTER.starterBuilding;
    return {kind:"starter_shell",name:base.name,areaM2:base.areaM2,rooms:(base.rooms||[]).map(r=>({...r,equipment:[]})),equipment:[],ready:false};
}

export function allowedItem(company,itemId){
    const p=getIndustryProfile(company);
    return (p.allowedItems||[]).includes(itemId);
}

export function equipmentFor(company){ return [...(getIndustryProfile(company).equipment||[])]; }
export function requiredEquipmentFor(company){ return [...(getIndustryProfile(company).requiredEquipment||[])]; }

export function setupProgress(company){
    const required=requiredEquipmentFor(company),owned=(company?.buildingState?.equipment||company?.building_state?.equipment||[]).map(x=>typeof x==="string"?x:x.id);
    const missing=required.filter(id=>!owned.includes(id));
    return {required,owned,missing,complete:required.length>0&&missing.length===0,percent:required.length?Math.round((required.length-missing.length)/required.length*100):0};
}
