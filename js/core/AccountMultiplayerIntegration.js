// WorldProject - Account-/Multiplayer-Integration
import { AccountSystem, runAccountSystemTest } from "./AccountSystem.js";
import { CoinMarketplaceSystem, runCoinMarketplaceTest } from "./CoinMarketplaceSystem.js";
import { GuildSystem, runGuildSystemTest } from "./GuildSystem.js";
import { AntiAbuseRiskSystem, runAntiAbuseRiskTest } from "./AntiAbuseRiskSystem.js";

export const accountSystem=new AccountSystem();
export const coinMarketplace=new CoinMarketplaceSystem();
export const guildSystem=new GuildSystem();
export const antiAbuseRiskSystem=new AntiAbuseRiskSystem();

window.worldAccounts={
    accountSystem,
    coinMarketplace,
    guildSystem,
    antiAbuseRiskSystem
};

runAccountSystemTest();
runCoinMarketplaceTest();
runGuildSystemTest();
runAntiAbuseRiskTest();

console.log("✅ ACCOUNT-/MULTIPLAYER-GRUNDSYSTEM GELADEN");
