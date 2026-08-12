// WorldProject - persistenter Spielstand ueber Supabase
export class SupabaseGameStateSync {
    constructor({api,intervalMs=30000}={}){
        this.api=api; this.intervalMs=intervalMs; this.timer=null; this.saving=false;
        window.addEventListener("worldproject:company-founded",()=>this.start());
        window.addEventListener("worldproject:company-loaded",()=>this.start());
        window.addEventListener("world:server-balances-changed",()=>this.refreshBalances());
    }

    start(){
        if(this.timer) return;
        this.timer=setInterval(()=>this.save().catch(()=>{}),this.intervalMs);
        console.log("✅ SUPABASE-SPIELSTANDSYNCHRONISATION AKTIV");
    }

    sanitize(value,seen=new WeakSet()){
        if(value===null || ["string","number","boolean"].includes(typeof value)) return value;
        if(typeof value!=="object") return undefined;
        if(seen.has(value)) return undefined;
        seen.add(value);
        if(Array.isArray(value)) return value.map(v=>this.sanitize(v,seen)).filter(v=>v!==undefined);
        const out={};
        for(const [k,v] of Object.entries(value)){
            if(typeof v==="function") continue;
            if(["market","transportSystem","gigaTransportService","constructionManagers"].includes(k)) continue;
            const clean=this.sanitize(v,seen); if(clean!==undefined) out[k]=clean;
        }
        return out;
    }

    snapshot(){
        const company=window.worldPlayerCompany; if(!company) return null;
        const raw=this.sanitize(company)||{};
        delete raw.money; delete raw.coins; delete raw.name; delete raw.industry; delete raw.type; delete raw.serverCompanyId;
        return raw;
    }

    async save(){
        if(this.saving || !window.worldPlayerCompany) return null;
        const state=this.snapshot(); if(!state) return null;
        this.saving=true;
        try{ const result=await this.api.saveGameState(state); window.dispatchEvent(new CustomEvent("world:game-saved",{detail:result})); return result; }
        finally{ this.saving=false; }
    }

    async refreshBalances(){
        try{
            const overview=await this.api.accountOverview();
            window.worldServerAccountOverview=overview;
            if(window.worldPlayerCompany){
                if(overview.company) window.worldPlayerCompany.money=Number(overview.company.money||0);
                window.worldPlayerCompany.coins=Number(overview.wallet?.balance||0);
            }
        }catch(error){ console.warn("Serverguthaben konnten nicht aktualisiert werden",error); }
    }
}
