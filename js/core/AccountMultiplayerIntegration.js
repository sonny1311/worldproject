// WorldProject - Account-/Multiplayer-Integration
import { AccountSystem, runAccountSystemTest } from "./AccountSystem.js";
import { CoinMarketplaceSystem, runCoinMarketplaceTest } from "./CoinMarketplaceSystem.js";
import { GuildSystem, runGuildSystemTest } from "./GuildSystem.js";
import { AntiAbuseRiskSystem, runAntiAbuseRiskTest } from "./AntiAbuseRiskSystem.js";
import { AuthApiClient } from "./AuthApiClient.js";
import { GameAccessGate } from "./GameAccessGate.js";
import { AccountProfileDialog } from "./AccountProfileDialog.js";

export const accountSystem=new AccountSystem();
export const coinMarketplace=new CoinMarketplaceSystem();
export const guildSystem=new GuildSystem();
export const antiAbuseRiskSystem=new AntiAbuseRiskSystem();
export const authApi=new AuthApiClient();
export const gameAccessGate=new GameAccessGate({accountSystem,api:authApi});
export const accountProfileDialog=new AccountProfileDialog({api:authApi});

window.worldAccounts={accountSystem,coinMarketplace,guildSystem,antiAbuseRiskSystem,authApi,gameAccessGate,accountProfileDialog};

function mountAccountButton(){
    if(document.getElementById("world-account-button")) return;
    const button=document.createElement("button");
    button.id="world-account-button";
    button.textContent="👤 Account";
    Object.assign(button.style,{position:"fixed",left:"18px",bottom:"18px",zIndex:"11000",border:"0",borderRadius:"10px",padding:"12px 16px",fontWeight:"800",cursor:"pointer",boxShadow:"0 5px 18px rgba(0,0,0,.35)"});
    button.addEventListener("click",async()=>{
        const user=window.worldCurrentUser;
        if(user){
            try{await accountProfileDialog.open();}
            catch(error){alert(`Profil konnte nicht geöffnet werden: ${error.message}`);}
        } else gameAccessGate.openRequiredLogin();
    });
    const refresh=()=>{ const user=window.worldCurrentUser; button.textContent=user?`👤 ${user.username}`:"👤 Account"; };
    window.addEventListener("world:user-login",refresh);
    window.addEventListener("world:access-granted",refresh);
    document.body.append(button);
    refresh();
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mountAccountButton);
else mountAccountButton();

runAccountSystemTest();
runCoinMarketplaceTest();
runGuildSystemTest();
runAntiAbuseRiskTest();

console.log("✅ ACCOUNT-/MULTIPLAYER-GRUNDSYSTEM GELADEN");
console.log("🔒 SPIELZUGANG: Registrierung/Login ist Pflicht");
console.log("✅ SERVERPROFIL + COIN-WALLET VERKNÜPFT");
