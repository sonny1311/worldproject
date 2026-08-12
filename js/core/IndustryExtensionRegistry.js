// WorldProject - Erweiterungspunkt fuer neue Branchen ohne Umbau der Kernsysteme
import { IndustryProfiles, IndustryGroups } from "./IndustryCatalog.js";
import { worldContentRegistry } from "./ContentRegistry.js";

export function registerIndustry({name,group="Sonstige",profile}){
  if(!name||!profile) throw new Error("Neue Branche braucht name und profile");
  IndustryProfiles[name]={...profile};
  IndustryGroups[group]??=[];
  if(!IndustryGroups[group].includes(name)) IndustryGroups[group].push(name);
  worldContentRegistry.register("industries",name,{name,group,...profile},{overwrite:true});
  return IndustryProfiles[name];
}

export function unregisterIndustry(name){
  delete IndustryProfiles[name];
  for(const names of Object.values(IndustryGroups)){
    const i=names.indexOf(name);if(i>=0)names.splice(i,1);
  }
  worldContentRegistry.remove("industries",name);
}

export function registerExistingIndustries(){
  for(const[group,names]of Object.entries(IndustryGroups)){
    for(const name of names){
      const profile=IndustryProfiles[name];
      if(profile) worldContentRegistry.register("industries",name,{name,group,...profile},{overwrite:true});
    }
  }
}

registerExistingIndustries();
