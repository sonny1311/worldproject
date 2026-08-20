// ============================================
// main.js
// ORVUNO – eine einzige kanonische Betriebsruntime
// ============================================

import "./content/ContentBootstrap.js";
import "./core/CanonicalIndustryGoodsIntegration.js";
import "./core/OperationalInventoryBridge.js";
import "./core/CurrencyPresentationBridge.js";
import "./core/SharedBusinessFinanceUIIntegration.js";
import "./core/CoinStoreVisualPolishIntegration.js";
import { Company } from "./core/Company.js";
import { CompanySetup } from "./core/CompanySetup.js";

window.orvunoBootComplete = true;
window.dispatchEvent(new CustomEvent("orvuno:boot-complete"));

const runtimeCompany = new Company();
const portfolio = window.worldAccounts?.businessPortfolio;
const initialOverview = window.worldServerAccountOverview || null;
const initialServerCompany = initialOverview?.companies?.find(c => c.is_primary)
    || initialOverview?.companies?.find(c => Number(c.slot_no) === 1)
    || initialOverview?.companies?.[0]
    || null;

window.worldCanonicalRuntimeCompany = runtimeCompany;

function companies() {
    return Array.isArray(window.worldServerAccountOverview?.companies)
        ? window.worldServerAccountOverview.companies
        : (Array.isArray(initialOverview?.companies) ? initialOverview.companies : []);
}

function serverCompanyFor(value = null) {
    const id = value?.serverCompanyId ?? value?.id ?? window.worldActiveServerCompany?.id ?? null;
    if (id != null) {
        const found = companies().find(c => String(c.id) === String(id));
        if (found) return found;
    }
    return window.worldActiveServerCompany || initialServerCompany || companies()[0] || null;
}

function hydrateCanonical(serverCompany) {
    if (!serverCompany) return runtimeCompany;
    const wallet = window.worldServerAccountOverview?.wallet || initialOverview?.wallet || {};

    if (portfolio?.hydrateCompany) {
        portfolio.hydrateCompany(runtimeCompany, serverCompany, wallet);
    } else {
        const state = serverCompany.game_state || {};
        runtimeCompany.serverCompanyId = serverCompany.id;
        runtimeCompany.slotNo = Number(serverCompany.slot_no || 1);
        runtimeCompany.name = serverCompany.name || "";
        runtimeCompany.industry = serverCompany.industry || "";
        runtimeCompany.type = serverCompany.company_type || "";
        runtimeCompany.money = Number(serverCompany.money ?? state.money ?? 0);
        runtimeCompany.moneyRevision = Number(serverCompany.money_revision ?? state.moneyRevision ?? 0);
        runtimeCompany.coins = Number(wallet?.balance || 0);
        runtimeCompany.setupPhase = serverCompany.setup_phase || runtimeCompany.setupPhase;
        runtimeCompany.buildingState = serverCompany.building_state || runtimeCompany.buildingState;
    }

    const serverMoney = Number(serverCompany.money ?? serverCompany.game_state?.money);
    if (Number.isFinite(serverMoney)) runtimeCompany.money = serverMoney;
    runtimeCompany.moneyRevision = Number(
        serverCompany.money_revision
        ?? serverCompany.game_state?.moneyRevision
        ?? runtimeCompany.moneyRevision
        ?? 0
    );

    window.worldActiveServerCompany = serverCompany;
    return runtimeCompany;
}

function bindCanonical(serverCompany = null) {
    const server = serverCompany || serverCompanyFor(runtimeCompany);
    if (server) hydrateCanonical(server);

    // Ab hier existiert fuer das Live-Spiel genau EINE Company-Instanz.
    window.worldPlayerCompany = runtimeCompany;
    if (!window.worldEngine) window.worldEngine = { legacyRendererDisabled: true };
    window.worldEngine.company = runtimeCompany;
    if (window.worldEconomyGameplay) window.worldEconomyGameplay.company = runtimeCompany;
    if (portfolio) portfolio.activeCompany = runtimeCompany;
    return runtimeCompany;
}

window.worldGetCanonicalCompany = () => {
    const server = serverCompanyFor(runtimeCompany);
    if (server) {
        const serverMoney = Number(server.money ?? server.game_state?.money);
        const currentId = runtimeCompany.serverCompanyId;
        if (String(currentId ?? "") !== String(server.id ?? "")) {
            hydrateCanonical(server);
        } else if (Number.isFinite(serverMoney) && Number(runtimeCompany.money) === 0 && serverMoney > 0) {
            runtimeCompany.money = serverMoney;
            runtimeCompany.moneyRevision = Number(server.money_revision ?? server.game_state?.moneyRevision ?? runtimeCompany.moneyRevision ?? 0);
        }
    }
    return runtimeCompany;
};

if (initialServerCompany) bindCanonical(initialServerCompany);
else bindCanonical();

// Egal welches Altmodul ein Company-Objekt in ein Ereignis steckt: Im Live-Spiel wird
// niemals dieses fremde Objekt uebernommen. Nur seine Server-ID bestimmt, welcher Betrieb
// in DIE eine kanonische runtimeCompany hydriert wird.
for (const eventName of [
    "worldproject:company-loaded",
    "worldproject:company-activated",
    "worldproject:company-switched",
    "world:active-business-changed"
]) {
    window.addEventListener(eventName, event => {
        const requested = event?.detail?.serverCompany || serverCompanyFor(event?.detail?.company);
        bindCanonical(requested);
        window.worldHomeOperationsDashboard?.render?.();
    });
}

const companySetup = new CompanySetup(runtimeCompany, company => {
    const server = serverCompanyFor(company);
    bindCanonical(server);
    console.log("ORVUNO Betrieb geladen:", runtimeCompany);
    window.dispatchEvent(new CustomEvent("worldproject:company-activated", {
        detail: { company: runtimeCompany, serverCompany: server }
    }));
    window.worldHomeOperationsDashboard?.render?.();
});

companySetup.show();

// Einige Altintegrationen rendern spaeter erneut. Vor diesen typischen Start-/Refresh-
// Zeitpunkten werden alle Live-Referenzen nochmals auf dieselbe kanonische Instanz gesetzt.
for (const delay of [0, 100, 300, 750, 1500, 3000, 5000, 8000, 12000, 15000, 20000, 30000]) {
    setTimeout(() => {
        const server = serverCompanyFor(runtimeCompany);
        if (server) {
            const serverMoney = Number(server.money ?? server.game_state?.money);
            if (Number(runtimeCompany.money) === 0 && Number.isFinite(serverMoney) && serverMoney > 0) {
                runtimeCompany.money = serverMoney;
                runtimeCompany.moneyRevision = Number(server.money_revision ?? server.game_state?.moneyRevision ?? runtimeCompany.moneyRevision ?? 0);
            }
        }
        window.worldPlayerCompany = runtimeCompany;
        if (window.worldEngine) window.worldEngine.company = runtimeCompany;
        if (window.worldEconomyGameplay) window.worldEconomyGameplay.company = runtimeCompany;
        if (portfolio) portfolio.activeCompany = runtimeCompany;
        window.worldHomeOperationsDashboard?.render?.();
    }, delay);
}
