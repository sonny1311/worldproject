// WorldProject - Account-/Multiplayer-Integration
import "../content/GameContentData.js";
import "./IndustryExtensionRegistry.js";
import { AccountSystem, runAccountSystemTest } from "./AccountSystem.js";
import { CoinMarketplaceSystem, runCoinMarketplaceTest } from "./CoinMarketplaceSystem.js";
import { GuildSystem, runGuildSystemTest } from "./GuildSystem.js";
import { AntiAbuseRiskSystem, runAntiAbuseRiskTest } from "./AntiAbuseRiskSystem.js";
import { AuthApiClient } from "./AuthApiClient.js";
import { GameAccessGate } from "./GameAccessGate.js";
import { AccountProfileDialog } from "./AccountProfileDialog.js";
import { SupabaseGameStateSync } from "./SupabaseGameStateSync.js";
import { runSupabaseSecurityTest } from "./SupabaseSecurityTest.js";
import { BusinessPortfolioSystem } from "./BusinessPortfolioSystem.js";
import { BusinessPortfolioDialog } from "./BusinessPortfolioDialog.js";
import { worldContentRegistry } from "./ContentRegistry.js";

export const accountSystem=new AccountSystem();
export const coinMarketplace=new CoinMarketplaceSystem();
export const guildSystem=new GuildSystem();
export const antiAbuseRiskSystem=new AntiAbuseRiskSystem();
export const authApi=new AuthApiClient();
export const gameAccessGate=new GameAccessGate({accountSystem,api:authApi});
export const accountProfileDialog=new AccountProfileDialog({api:authApi});
export const gameStateSync=new SupabaseGameStateSync({api:authApi});
export const businessPortfolio=new BusinessPortfolioSystem({api:authApi});
export const businessPortfolioDialog=new BusinessPortfolioDialog({portfolio:businessPortfolio});

window.worldAccounts={accountSystem,coinMarketplace,guildSystem,antiAbuseRiskSystem,authApi,gameAccessGate,accountProfileDialog,gameStateSync,businessPortfolio,businessPortfolioDialog,contentRegistry:worldContentRegistry,runSupabaseSecurityTest:()=>runSupabaseSecurityTest(authApi)};

function mountAccountButton(){
    if(document.getElementById("world-account-button"))return;
    const button=document.createElement("button");button.id="world-account-button";button.textContent="👤 Account";
    Object.assign(button.style,{position:"fixed",left:"18px",bottom:"18px",zIndex:"11000",border:"0",borderRadius:"10px",padding:"12px 16px",fontWeight:"800",cursor:"pointer",boxShadow:"0 5px 18px rgba(0,0,0,.35)"});
    button.addEventListener("click",async()=>{const user=window.worldCurrentUser;if(user){try{await accountProfileDialog.open();}catch(error){alert(`Profil konnte nicht geöffnet werden: ${error.message}`);}}else gameAccessGate.openRequiredLogin();});
    const refresh=()=>{const user=window.worldCurrentUser;button.textContent=user?`👤 ${user.username}`:"👤 Account";};window.addEventListener("world:user-login",refresh);window.addEventListener("world:access-granted",refresh);document.body.append(button);refresh();
}

function mountBusinessesButton(){
    if(document.getElementById("world-businesses-button"))return;
    const b=document.createElement("button");b.id="world-businesses-button";b.textContent="🏢 Betriebe";
    Object.assign(b.style,{position:"fixed",left:"150px",bottom:"18px",zIndex:"11000",border:"0",borderRadius:"10px",padding:"12px 16px",fontWeight:"800",cursor:"pointer",boxShadow:"0 5px 18px rgba(0,0,0,.35)"});
    b.addEventListener("click",()=>businessPortfolioDialog.open().catch(e=>alert(e.message)));document.body.append(b);
}

function mount(){mountAccountButton();mountBusinessesButton();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();

runAccountSystemTest();runCoinMarketplaceTest();runGuildSystemTest();runAntiAbuseRiskTest();
console.log("✅ ACCOUNT-/MULTIPLAYER-GRUNDSYSTEM GELADEN");
console.log("🔒 SPIELZUGANG: aktiver Supabase-Account ist Pflicht");
console.log("✅ BELIEBIG VIELE BETRIEBE + SUPABASE-SPIELSTAND VERKNÜPFT");
console.log(`✅ ERWEITERBARE CONTENT-REGISTRY GELADEN: ${worldContentRegistry.list("industries").length} Branchen registriert`);
console.log("🧪 RLS-Test nach Login: await worldAccounts.runSupabaseSecurityTest()");
