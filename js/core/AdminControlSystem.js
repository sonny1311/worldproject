// WorldProject - zentrale Admin-Grundstruktur
// Noch keine sichtbare Admin-UI. Diese Schicht definiert bewusst die
// Verwaltungsbereiche, damit Balancing, Spielerpruefung und Weltsteuerung
// spaeter nicht ueber verstreute Debug-Schalter erfolgen.

export const AdminSections = Object.freeze({
  OVERVIEW: "overview",
  PLAYERS: "players",
  COMPANIES: "companies",
  ECONOMY: "economy",
  MARKET: "market",
  PRODUCTS: "products",
  SUPPLIERS: "suppliers",
  PRODUCTION: "production",
  TRANSPORT: "transport",
  PREMIUM: "premium",
  COINS: "coins",
  AWARDS: "awards",
  LANGUAGES: "languages",
  NPC: "npc",
  SYSTEM: "system",
  AUDIT: "audit"
});

export class AdminControlSystem {
  constructor(){
    this.settings={
      marketFeeRate:0.005,
      npcLiquidityEnabled:true,
      npcMinDelayMinutes:60,
      npcMaxDelayMinutes:2880,
      premiumEnabled:true,
      maintenanceMode:false
    };
    this.auditLog=[];
  }

  requireAdmin(actor){
    if(!actor || !["admin","owner"].includes(actor.role)) throw new Error("Admin-Berechtigung erforderlich");
  }

  getSettings(actor){
    this.requireAdmin(actor);
    return structuredClone ? structuredClone(this.settings) : JSON.parse(JSON.stringify(this.settings));
  }

  updateSetting(actor,key,value){
    this.requireAdmin(actor);
    if(!(key in this.settings)) throw new Error(`Unbekannte Admin-Einstellung: ${key}`);
    const before=this.settings[key];
    this.settings[key]=value;
    this.log(actor,"setting_changed",{key,before,after:value});
    return {success:true,key,value};
  }

  log(actor,action,details={}){
    const entry={id:Date.now()+Math.random(),at:new Date().toISOString(),actorId:actor?.id||null,actorName:actor?.username||actor?.name||"admin",action,details};
    this.auditLog.push(entry);
    return entry;
  }

  audit(actor,{limit=200}={}){
    this.requireAdmin(actor);
    return this.auditLog.slice(-Math.max(1,Number(limit)||200)).reverse();
  }
}
