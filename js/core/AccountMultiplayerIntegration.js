// WorldProject - Account-/Multiplayer-Integration
import { AccountSystem, runAccountSystemTest } from "./AccountSystem.js";
import { CoinMarketplaceSystem, runCoinMarketplaceTest } from "./CoinMarketplaceSystem.js";
import { GuildSystem, runGuildSystemTest } from "./GuildSystem.js";
import { AntiAbuseRiskSystem, runAntiAbuseRiskTest } from "./AntiAbuseRiskSystem.js";
import { AccountAuthDialog } from "./AccountAuthDialog.js";
import { AuthApiClient } from "./AuthApiClient.js";

export const accountSystem=new AccountSystem();
export const coinMarketplace=new CoinMarketplaceSystem();
export const guildSystem=new GuildSystem();
export const antiAbuseRiskSystem=new AntiAbuseRiskSystem();
export const authApi=new AuthApiClient();
export const authDialog=new AccountAuthDialog({accountSystem,api:authApi});

window.worldAccounts={
    accountSystem,
    coinMarketplace,
    guildSystem,
    antiAbuseRiskSystem,
    authApi,
    authDialog
};

function mountAccountButton(){
    if(document.getElementById("world-account-button")) return;
    const button=document.createElement("button");
    button.id="world-account-button";
    button.textContent="👤 Anmelden / Registrieren";
    Object.assign(button.style,{position:"fixed",left:"18px",bottom:"18px",zIndex:"11000",border:"0",borderRadius:"10px",padding:"12px 16px",fontWeight:"800",cursor:"pointer",boxShadow:"0 5px 18px rgba(0,0,0,.35)"});
    button.addEventListener("click",()=>authDialog.open("login"));
    window.addEventListener("world:user-login",event=>{
        const user=event.detail?.user;
        if(user) button.textContent=`👤 ${user.username}`;
    });
    document.body.append(button);
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mountAccountButton);
else mountAccountButton();

runAccountSystemTest();
runCoinMarketplaceTest();
runGuildSystemTest();
runAntiAbuseRiskTest();

console.log("✅ ACCOUNT-/MULTIPLAYER-GRUNDSYSTEM GELADEN");
console.log("✅ REGISTRIERUNGS-/LOGIN-OBERFLÄCHE GELADEN");
