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
        runtimeCompany.money = Number(initialServerCompany.money ?? initialServerCompany.game_state?.money ?? runtimeCompany.money);
        runtimeCompany.coins = Number(initialOverview?.wallet?.balance || 0);
    }
    window.worldPlayerCompany = runtimeCompany;
    window.worldActiveServerCompany = initialServerCompany;
}

window.worldEngine = { company: runtimeCompany, legacyRendererDisabled: true };

const companySetup = new CompanySetup(
    runtimeCompany,
    company => {
        console.log("ORVUNO Betrieb geladen:", company);
        window.worldEngine.company = company;
        window.worldPlayerCompany = company;
        window.dispatchEvent(new CustomEvent("worldproject:company-activated",{detail:{company}}));
        window.worldHomeOperationsDashboard?.render?.();
    }
);

companySetup.show();
