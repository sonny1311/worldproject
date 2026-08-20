// ============================================
// main.js
// ORVUNO – Betriebsruntime ohne alte Weltkarte
// ============================================

import "./content/ContentBootstrap.js";
import "./core/CanonicalIndustryGoodsIntegration.js";
import "./core/OperationalInventoryBridge.js";
import "./core/CurrencyPresentationBridge.js";
import "./core/SharedBusinessFinanceUIIntegration.js";
import "./core/CoinStoreVisualPolishIntegration.js";
import { Company } from "./core/Company.js";
import { CompanySetup } from "./core/CompanySetup.js";

// Wenn diese Stelle erreicht wird, wurden auch die statischen Runtime-Imports erfolgreich ausgewertet.
// Ab jetzt darf ein spaeterer UI-Fehler nicht mehr als Bootfehler das ganze Spiel ueberdecken.
window.orvunoBootComplete=true;
window.dispatchEvent(new CustomEvent("orvuno:boot-complete"));

// Die frühere Canvas-/Karten-Engine wird nicht mehr gestartet.
// Die bereits vom Account-Gate geladene Supabase-Firma wird sofort in dieselbe
// Runtime-Instanz hydratisiert. So kann kein spaeter erzeugter Leerzustand den
// echten Server-Kontostand kurzfristig oder dauerhaft mit 0 EUR ueberschreiben.
const runtimeCompany = new Company();
const initialOverview = window.worldServerAccountOverview || null;
const initialServerCompany = initialOverview?.companies?.find(c => c.is_primary)
    || initialOverview?.companies?.find(c => Number(c.slot_no) === 1)
    || initialOverview?.companies?.[0]
    || null;
const portfolio = window.worldAccounts?.businessPortfolio;
const initialServerMoney = Number(initialServerCompany?.money ?? initialServerCompany?.game_state?.money);

if (initialServerCompany) {
    if (portfolio?.hydrateCompany) {
        portfolio.hydrateCompany(runtimeCompany, initialServerCompany, initialOverview?.wallet || {});
        portfolio.companies = initialOverview?.companies || [];
        portfolio.activeCompany = runtimeCompany;
    } else {
        runtimeCompany.serverCompanyId = initialServerCompany.id;
        runtimeCompany.slotNo = Number(initialServerCompany.slot_no || 1);
        runtimeCompany.name = initialServerCompany.name || "";
        runtimeCompany.industry = initialServerCompany.industry || "";
        runtimeCompany.type = initialServerCompany.company_type || "";
        runtimeCompany.money = Number.isFinite(initialServerMoney) ? initialServerMoney : runtimeCompany.money;
        runtimeCompany.coins = Number(initialOverview?.wallet?.balance || 0);
    }
    window.worldPlayerCompany = runtimeCompany;
    window.worldActiveServerCompany = initialServerCompany;
}

window.worldEngine = { company: runtimeCompany, legacyRendererDisabled: true };

// Einige alte Integrationen laufen noch kurz nach main.js an. Falls eine davon in dieser
// Startphase die bereits korrekt geladene Firma wieder auf 0 EUR setzt, stellen wir nur
// diesen eindeutig falschen Startwert aus dem bereits geladenen Supabase-Snapshot wieder her.
// Der Guard endet nach wenigen Sekunden und greift danach nicht in normale Spieltransaktionen ein.
function guardInitialServerBalance() {
    if (!initialServerCompany || !Number.isFinite(initialServerMoney) || initialServerMoney <= 0) return false;
    const company = window.worldPlayerCompany || window.worldEngine?.company || runtimeCompany;
    if (!company) return false;
    const current = Number(company.money);
    if (!Number.isFinite(current) || current === 0) {
        company.money = initialServerMoney;
        if (window.worldEngine) window.worldEngine.company = company;
        if (portfolio) portfolio.activeCompany = company;
        window.worldHomeOperationsDashboard?.render?.();
        console.warn("🛡️ ORVUNO: FEHLERHAFTEN 0-EUR-STARTWERT AUS SUPABASE KORRIGIERT", {
            companyId: initialServerCompany.id,
            money: initialServerMoney
        });
        return true;
    }
    return false;
}

const companySetup = new CompanySetup(
    runtimeCompany,
    company => {
        console.log("ORVUNO Betrieb geladen:", company);
        window.worldEngine.company = company;
        window.worldPlayerCompany = company;
        guardInitialServerBalance();
        window.dispatchEvent(new CustomEvent("worldproject:company-activated",{detail:{company}}));
        window.worldHomeOperationsDashboard?.render?.();
    }
);

companySetup.show();

for (const delay of [0, 100, 300, 750, 1500, 3000, 5000]) {
    setTimeout(guardInitialServerBalance, delay);
}
