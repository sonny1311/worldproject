// ORVUNO - persistenter Spielstand ueber Supabase
export class SupabaseGameStateSync {
    constructor({api,intervalMs=5000,dirtyDelayMs=900}={}){
        this.api=api;this.intervalMs=intervalMs;this.dirtyDelayMs=dirtyDelayMs;this.timer=null;this.dirtyTimer=null;this.saving=false;this.retryTimer=null;this.retryAttempt=0;
        for(const event of ["worldproject:company-founded","worldproject:company-loaded","worldproject:company-switched"]){
            window.addEventListener(event,()=>{this.restoreRuntimeIfNeeded();this.start();});
        }
        window.addEventListener("world:server-balances-changed",()=>this.refreshBalances());
        for(const event of ["world:state-dirty","world:game-state-dirty"]){
            window.addEventListener(event,()=>this.scheduleBackgroundSave());
        }
        if(typeof document!=="undefined")document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){this.clearDirtyTimer();this.save().catch(e=>console.warn("Speichern beim App-/Tabwechsel fehlgeschlagen",e));}});
        window.addEventListener("pagehide",()=>{this.clearDirtyTimer();this.save().catch(()=>{});});
        window.addEventListener("online",()=>{if(this.retryAttempt>0||window.worldPlayerCompany)this.save({retry:true}).catch(()=>{});});
    }

    start(){if(this.timer)return;this.timer=setInterval(()=>this.save().catch(()=>{}),this.intervalMs);console.log("✅ SUPABASE-SPIELSTANDSYNCHRONISATION AKTIV");}
    clearDirtyTimer(){if(this.dirtyTimer){clearTimeout(this.dirtyTimer);this.dirtyTimer=null;}}
    scheduleBackgroundSave(){this.clearDirtyTimer();this.dirtyTimer=setTimeout(()=>{this.dirtyTimer=null;this.save().catch(e=>console.warn("Hintergrundspeichern fehlgeschlagen",e));},this.dirtyDelayMs);}
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

    stateWeight(state={}){
        let w=0;
        if(Array.isArray(state.customerOrders))w+=state.customerOrders.length*20;
        if(Array.isArray(state.productionQueue))w+=state.productionQueue.length*10;
        const stock=state.operationalSupplyState?.warehouseStock||{};
        for(const zone of Object.values(stock))for(const value of Object.values(zone||{}))if(Number(value)>0)w++;
        for(const bag of [state.inventory,state.finishedGoods])for(const value of Object.values(bag||{}))if(Number(value)>0)w++;
        return w;
    }

    activeServerCompany(company=window.worldPlayerCompany){
        const direct=window.worldActiveServerCompany;
        if(direct&&String(direct.id)===String(company?.serverCompanyId))return direct;
        return (window.worldServerAccountOverview?.companies||[]).find(c=>String(c?.id)===String(company?.serverCompanyId))||null;
    }

    // Die relationale Spalte companies.money ist die kanonische Geldquelle.
    // game_state.money bleibt aus Kompatibilitaetsgruenden gespiegelt, darf aber
    // einen neueren Server-/Admin-Wert niemals wieder mit einem alten Snapshot ueberschreiben.
    reconcileServerMoney(server){
        if(!server)return null;
        const columnMoney=Number(server.money);
        const stateMoney=Number(server.game_state?.money);
        const canonical=Number.isFinite(columnMoney)?columnMoney:(Number.isFinite(stateMoney)?stateMoney:0);
        if(!server.game_state||typeof server.game_state!=="object")server.game_state={};
        server.game_state.money=canonical;
        return canonical;
    }

    restoreRuntimeIfNeeded(){
        const company=window.worldPlayerCompany;if(!company?.serverCompanyId)return false;
        const server=this.activeServerCompany(company);if(!server)return false;
        const canonicalMoney=this.reconcileServerMoney(server);
        const serverState=server.game_state||{},serverWeight=this.stateWeight(serverState),runtimeWeight=this.stateWeight(company);
        if(serverWeight>0&&runtimeWeight===0){
            const portfolio=window.worldAccounts?.businessPortfolio;
            if(portfolio?.hydrateCompany){
                portfolio.hydrateCompany(company,server,window.worldServerAccountOverview?.wallet||{});
                if(Number.isFinite(canonicalMoney))company.money=canonicalMoney;
                if(window.worldEngine)window.worldEngine.company=company;
                console.warn("🛟 ORVUNO: LEERE RUNTIME AUS SERVER-SPIELSTAND WIEDERHERGESTELLT",{companyId:server.id,serverWeight});
                window.worldHomeOperationsDashboard?.render?.();
            }
        }else if(!company.__orvunoServerHydrated&&Number.isFinite(canonicalMoney)){
            // Auch bei bereits vorhandener Runtime muss der beim Laden vom Server
            // gelieferte Kontostand einmal Vorrang haben. Danach arbeitet die Runtime normal weiter.
            company.money=canonicalMoney;
        }
        company.__orvunoServerHydrated=true;company.__orvunoHydratedCompanyId=String(server.id);return true;
    }

    snapshot(){const company=window.worldPlayerCompany;if(!company)return null;const raw=this.sanitize(company)||{};for(const key of ["coins","name","industry","type","serverCompanyId","slotNo","setupPhase","buildingState","__orvunoServerHydrated","__orvunoHydratedCompanyId"])delete raw[key];raw.money=Number(company.money||0);return raw;}

    async save({retry=false}={}){
        if(this.saving||!window.worldPlayerCompany)return null;const company=window.worldPlayerCompany;
        this.restoreRuntimeIfNeeded();
        const server=this.activeServerCompany(company),serverWeight=this.stateWeight(server?.game_state||{}),runtimeWeight=this.stateWeight(company);
        if(company.serverCompanyId&&serverWeight>0&&runtimeWeight===0){
            console.error("🛑 ORVUNO SPEICHERSCHUTZ: LEERER RUNTIME-ZUSTAND WIRD NICHT AUF SERVER GESCHRIEBEN",{companyId:company.serverCompanyId,serverWeight});
            window.dispatchEvent(new CustomEvent("world:game-save-error",{detail:{message:"Speichern blockiert: geladener Betrieb war unvollständig."}}));return null;
        }
        const state=this.snapshot();if(!state)return null;this.saving=true;
        window.dispatchEvent(new CustomEvent("world:game-saving",{detail:{retry,attempt:this.retryAttempt}}));
        try{
            const result=company.serverCompanyId?await this.api.saveBusinessState(company.serverCompanyId,state):await this.api.saveGameState(state);
            if(company.serverCompanyId&&company.setupPhase&&company.buildingState)await this.api.updateBusinessSetup(company.serverCompanyId,company.setupPhase,company.buildingState);
            if(server&&company.serverCompanyId){server.game_state=this.sanitize(state)||state;server.money=Number(state.money||0);}
            this.clearRetry();window.dispatchEvent(new CustomEvent("world:game-saved",{detail:result}));return result;
        }catch(error){
            window.dispatchEvent(new CustomEvent("world:game-save-error",{detail:{message:error?.message||String(error),attempt:this.retryAttempt}}));this.scheduleRetry();throw error;
        }finally{this.saving=false;}
    }

    markDirty(){window.dispatchEvent(new CustomEvent("world:state-dirty"));}

    async refreshBalances(){
        try{
            const overview=await this.api.accountOverview();window.worldServerAccountOverview=overview;
            const active=window.worldPlayerCompany;if(active){const server=overview.companies?.find(c=>c.id===active.serverCompanyId)||overview.company;if(server){const canonical=this.reconcileServerMoney(server);active.money=Number(canonical??0);}active.coins=Number(overview.wallet?.balance||0);}
        }catch(error){console.warn("Serverguthaben konnten nicht aktualisiert werden",error);}
    }
}
