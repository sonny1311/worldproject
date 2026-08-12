// WorldProject - harter Spielzugang: ohne aktiven Supabase-Account kein Spiel
import { AccountAuthDialog } from "./AccountAuthDialog.js";
import { AuthApiClient } from "./AuthApiClient.js";

export class GameAccessGate {
    constructor({ accountSystem, api = new AuthApiClient() } = {}) {
        this.accountSystem=accountSystem; this.api=api; this.dialog=null; this.user=null; this.backendOnline=false; this._resolver=null; this._promise=null;
    }

    async detectBackend(){ try{ await this.api.health(); this.backendOnline=true; }catch{ this.backendOnline=false; } return this.backendOnline; }

    async grant(user){
        if(!user) return false;
        if(user.status!=="active") return false;
        this.user=user; window.worldCurrentUser=user;
        try{ window.worldServerAccountOverview=await this.api.accountOverview(); }catch(error){ console.warn("Serverübersicht konnte noch nicht geladen werden",error); }
        window.dispatchEvent(new CustomEvent("world:access-granted",{detail:{user}}));
        if(this._resolver){ const resolve=this._resolver; this._resolver=null; resolve(user); }
        return true;
    }

    async restoreSession(){
        await this.detectBackend();
        if(!this.backendOnline) return null;
        try{ const user=await this.api.me(); if(user?.status==="active"){ await this.grant(user); return user; } }
        catch{}
        return null;
    }

    async ensureAccess(){
        if(this.user) return this.user;
        if(!this._promise) this._promise=new Promise(resolve=>{this._resolver=resolve;});
        const restored=await this.restoreSession(); if(restored) return restored;
        this.openRequiredLogin(); return this._promise;
    }

    openRequiredLogin(){
        if(this.dialog?.overlay) return;
        this.dialog=new AccountAuthDialog({accountSystem:this.accountSystem,api:this.api,required:true,onAuthenticated:user=>this.grant(user)});
        this.dialog.open("login");
    }

    async logout(){
        try{ await this.api.logout(); }catch{}
        this.user=null; window.worldCurrentUser=null; window.worldServerAccountOverview=null;
        window.dispatchEvent(new CustomEvent("world:access-revoked")); location.reload();
    }
}
