// WorldProject - manueller Integrations-/RLS-Test fuer einen eingeloggten Spieler
export async function runSupabaseSecurityTest(api){
    console.log("======================================");
    console.log("SUPABASE ACCOUNT-/RLS-TEST");
    console.log("======================================");
    const result={health:false,me:false,overview:false,walletTamperBlocked:false};
    try{await api.health();result.health=true;console.log("✅ Supabase erreichbar");}catch(e){console.error("❌ Supabase nicht erreichbar",e);return result;}
    try{const user=await api.me();result.me=!!user;console.log("✅ Account geladen",user);}catch(e){console.error("❌ Kein gueltiger Login",e);return result;}
    try{const overview=await api.accountOverview();result.overview=!!overview;console.log("✅ Eigenes Profil/Wallet/Firma lesbar",overview);}catch(e){console.error("❌ Eigene Daten nicht lesbar",e);}
    try{
        await api.rest("coin_wallets",{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({balance:999999999})});
        console.error("❌ SICHERHEITSFEHLER: Wallet konnte direkt manipuliert werden");
    }catch(e){result.walletTamperBlocked=true;console.log("✅ Direkte Wallet-Manipulation blockiert");}
    console.log(result.walletTamperBlocked&&result.overview?"✅ SUPABASE ACCOUNT-/RLS-TEST ERFOLGREICH":"⚠️ SUPABASE TEST NICHT VOLLSTAENDIG");
    return result;
}
