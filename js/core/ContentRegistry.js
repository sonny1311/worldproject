// WorldProject - zentrale erweiterbare Inhalts-Registry
// Neue Branchen, Rohstoffe, Maschinen, Produkte, Rezepte, Lieferanten usw. werden hier registriert,
// ohne Kernsysteme anpassen zu muessen.

export class ContentRegistry {
  constructor(){
    this.collections=new Map();
  }

  ensure(type){
    if(!this.collections.has(type)) this.collections.set(type,new Map());
    return this.collections.get(type);
  }

  register(type,id,data,{overwrite=false}={}){
    if(!type||!id) throw new Error("ContentRegistry: type und id sind Pflicht");
    const col=this.ensure(type);
    if(col.has(id)&&!overwrite) throw new Error(`ContentRegistry: ${type}/${id} existiert bereits`);
    const record=Object.freeze({id,...data});
    col.set(id,record);
    return record;
  }

  registerMany(type,records=[],options={}){
    return records.map(r=>this.register(type,r.id,r,options));
  }

  get(type,id){return this.ensure(type).get(id)||null;}
  has(type,id){return this.ensure(type).has(id);}
  list(type,{filter=null}={}){
    const arr=[...this.ensure(type).values()];
    return typeof filter==="function"?arr.filter(filter):arr;
  }
  ids(type){return [...this.ensure(type).keys()];}
  remove(type,id){return this.ensure(type).delete(id);}
  clear(type){if(type)this.ensure(type).clear();else this.collections.clear();}
  snapshot(){return Object.fromEntries([...this.collections.entries()].map(([k,v])=>[k,[...v.values()]]));}
}

export const worldContentRegistry=new ContentRegistry();

// Erweiterungspunkt fuer spaetere Mods, Admin-Inhalte oder neue Branchenmodule.
export function registerWorldContent(bundle={}){
  for(const[type,records]of Object.entries(bundle)){
    for(const record of records||[]) worldContentRegistry.register(type,record.id,record,{overwrite:true});
  }
  return worldContentRegistry;
}

if(typeof window!=="undefined") window.worldContentRegistry=worldContentRegistry;
