// WorldProject - persistenter Spielstand ueber Supabase
export class SupabaseGameStateSync {
    constructor({api,intervalMs=5000}={}){
        this.api=api;this.intervalMs=intervalMs;this.timer=null;this.saving=false;this.retryTimer=null;this.retryAttempt=0;
        for(const event of ["worldproject:company-founded","worldproject:company-loaded","worldproject:company-switched"])window.addEventListener(event,()=>this.start());
        window.addEventListener("world:server-balances-changed",()=>this.refreshBalances());
        for(const event of ["world:state-dirty","world:game-state-dirty"]){
            window.addEventListener(event,()=>this.save().catch(e=>console.warn("Sofortspeichern fehlgeschlagen",e)));
        }
        if(typeof document!=="undefined")document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")this.save().catch(e=>console.warn("Speichern beim App-/Tabwechsel fehlgeschlagen",e));});
        window.addEventListener("pagehide",()=>this.save().catch(()=>{}));
        window.addEventListener("online",()=>{if(this.retryAttempt>0||window.worldPlayerCompany)this.save({retry:true}).catch(()=>{});});
    }

    start(){if(this.timer)return;this.timer=setInterval(()=>this.save().catch(()=>{}),this.intervalMs);console.log("✅ SUPABASE-SPIELSTANDSYNCHRONISATION AKTIV");}
    scheduleRetry(){if(this.retryTimer||this.retryAttempt>=5)return;this.retryAttempt++;const delay=Math.min(60000,2000*Math.pow(2,this.retryAttempt-1));this.retryTimer=setTimeout(()=>{this.retryTimer=null;this.save({retry:true}).catch(()=>{});},delay);window.dispatchEvent(new CustomEvent("world:game-save-retry",{detail:{attempt:this.retryAttempt,delay}}));}
    clearRetry(){if(this.retryTimer){clearTimeout(this.retryTimer);this.retryTimer=null;}this.retryAttempt=0;}

    sanitize(value,seen=new WeakSet()){
        if(value===null||["string","number","boolean"].includes(typeof value))return value;
        if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;
        if(typeof value!=="object")return undefined;
        if(seen.has(value))return undefined;
        seen.add(value);
        try{
            if(Array.isArray(value))return value.map(v=>this.sanitize(v,seen)).filter(v=>v!==undefined);
            const out={};
            for(const[k,v]of Object.entries(value)){
                if(typeof v==="function")continue;
                if(["market","transportSystem","gigaTransportService","constructionManagers"].includes(k))continue;
                const clean=this.sanitize(v,seen);
                if(clean!==undefined)out[k]=clean;
            }
            return out;
        }finally{seen.delete(value);}
    }

    snapshot(){const company=window.worldPlayerCompany;if(!company)return null;const raw=this.sanitize(company)||{};for(const key of ["coins","name","industry","type","serverCompanyId","slotNo","setupPhase","buildingState"])delete raw[key];raw.money=Number(company.money||0);return raw;}

    async save({retry=false}={}){
        if(this.saving||!window.worldPlayerCompany)return null;const company=window.worldPlayerCompany,state=this.snapshot();if(!state)return null;this.saving=true;
        window.dispatchEvent(new CustomEvent("world:game-saving",{detail:{retry,attempt:this.retryAttempt}}));
        try{
            const result=company.serverCompanyId?await this.api.saveBusinessState(company.serverCompanyId,state):await this.api.saveGameState(state);
            if(company.serverCompanyId&&company.setupPhase&&company.buildingState)await this.api.updateBusinessSetup(company.serverCompanyId,company.setupPhase,company.buildingState);
            this.clearRetry();window.dispatchEvent(new CustomEvent("world:game-saved",{detail:result}));return result;
        }catch(error){
            window.dispatchEvent(new CustomEvent("world:game-save-error",{detail:{message:error?.message||String(error),attempt:this.retryAttempt}}));this.scheduleRetry();throw error;
        }finally{this.saving=false;}
    }

    markDirty(){window.dispatchEvent(new CustomEvent("world:state-dirty"));}

    async refreshBalances(){
        try{
            const overview=await this.api.accountOverview();window.worldServerAccountOverview=overview;
            const active=window.worldPlayerCompany;if(active){const server=overview.companies?.find(c=>c.id===active.serverCompanyId)||overview.company;if(server){const stored=server.game_state||{};active.money=Number(stored.money??server.money??0);}active.coins=Number(overview.wallet?.balance||0);}
        }catch(error){console.warn("Serverguthaben konnten nicht aktualisiert werden",error);}
    }
}
