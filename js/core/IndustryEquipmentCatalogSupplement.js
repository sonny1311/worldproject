// WorldProject – ergänzt fehlende, kaufbare Betriebsausstattung im bestehenden IndustryCatalog.
// Keine zweite Maschinenquelle: die Einträge werden direkt dem zentralen Branchenprofil hinzugefügt.
import { IndustryProfiles } from './IndustryCatalog.js';

function addEquipment(type,item){
  const profile=IndustryProfiles[type];
  if(!profile)return false;
  profile.equipment??=[];
  if(profile.equipment.some(x=>x?.id===item.id))return false;
  profile.equipment.push({...item});
  if(item.required!==false){
    profile.requiredEquipment??=[];
    if(!profile.requiredEquipment.includes(item.id))profile.requiredEquipment.push(item.id);
  }
  return true;
}

addEquipment('Brauerei',{id:'micro_bottle_washer',name:'Kleine Flaschenwaschanlage',price:1800,required:false,requiredLevel:1,room:'production',capacity:250,capacityUnit:'Flaschen/h',description:'Kleine Anlage für Rücklaufflaschen. Reinigt gebrauchte 0,33-l- und 0,50-l-Flaschen für die erneute Abfüllung.'});
addEquipment('Brauerei',{id:'bottle_washer',name:'Flaschenwaschanlage',price:8500,required:false,requiredLevel:5,room:'production',capacity:1000,capacityUnit:'Flaschen/h',description:'Professionelle Flaschenreinigung für größere Mehrwegmengen.'});

export function runIndustryEquipmentCatalogSupplementTest(){
  const items=IndustryProfiles.Brauerei?.equipment||[],ids=items.map(x=>x.id);
  if(!ids.includes('micro_bottle_washer')||!ids.includes('bottle_washer'))throw new Error('Flaschenwaschanlagen fehlen im Brauerei-Maschinenkatalog');
  if(items.find(x=>x.id==='micro_bottle_washer')?.requiredLevel!==1||items.find(x=>x.id==='bottle_washer')?.requiredLevel!==5)throw new Error('Freischaltstufen der Flaschenwaschanlagen sind fehlerhaft');
  return true;
}

if(typeof window!=='undefined')window.runIndustryEquipmentCatalogSupplementTest=runIndustryEquipmentCatalogSupplementTest;
