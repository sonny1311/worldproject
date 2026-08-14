// WorldProject - haelt die alten Branchenkatalog-IDs mit der verbundenen Spielerwirtschaft konsistent.
// Operative Waren muessen zwischen Produzent und Abnehmer exakt dieselbe ID besitzen.
import { IndustryProfiles } from './IndustryCatalog.js';

const canonical={
  brewery:['malt','hops','yeast','water','bottles','bottles_050','caps','labels','labels_050','dirty_bottles','dirty_bottles_050','clean_bottles','clean_bottles_050','bottle_wash_chem'],
  beverage:['water','sugar','citric_acid','beverage_flavour','co2','bottles','bottles_050','caps','labels','labels_050'],
  bakery:['flour_wheat','baker_yeast','salt','butter','eggs','bakery_bag','water'],
  butcher:['pork','beef','spice_mix','sausage_casing','meat_packaging'],
  livestock:['animal_feed','straw','water','livestock_medicine']
};
for(const profile of Object.values(IndustryProfiles)){
  const ids=canonical[profile.branchKey];
  if(ids)profile.allowedItems=[...new Set(ids)];
}

export function runCanonicalIndustryGoodsTest(){
  const brewery=Object.values(IndustryProfiles).find(p=>p.branchKey==='brewery');
  const required=['malt','hops','bottles','caps','labels'];
  const legacy=['malt_kg','hops_kg','bottle_033','crown_cap','label_033'];
  const success=required.every(id=>brewery?.allowedItems?.includes(id))&&!legacy.some(id=>brewery?.allowedItems?.includes(id));
  if(!success)throw new Error('Brauerei-Waren-IDs sind nicht mit der Spielerwirtschaft vereinheitlicht');
  return {success,required};
}
if(typeof window!=='undefined')window.worldCanonicalIndustryGoodsTest=runCanonicalIndustryGoodsTest;
