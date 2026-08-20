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

const runtimeCompany = new Company();
const initialOverview = window.worldServerAccountOverview || null;
const initialServerCompany = initialOverview?.companies?.find(c => c.is_primary)
    || initialOverview?.companies?.find(c => Number(c.slot_no) === 1)
    || initialOverview?.companies?.[0]
    || null;
const portfolio = window.worldAccounts?.businessPortfolio;
const initialServerMoney = Number(initialServerCompany?.money ?? initialServerCompany?.game_state?.money);

const moneyTraceInstalled = new WeakSet();

function matchingServerCompany(company) {
    return window.worldActiveServerCompany
        || window.worldServerAccountOverview?.companies?.find(c => String(c.id) === String(company?.serverCompanyId))
        || initialServerCompany
        || null;
}

// Temporärer Diagnose-/Sicherheitsanker: Ein historischer Clientpfad setzt den bereits
// korrekt aus Supabase geladenen Kontostand spaeter auf exakt 0. Dieser Setter protokolliert
// den Aufrufer und verhindert nur diesen nachweislich falschen Reset. Normale Geldbewegungen
// (z. B. 7.503.164 -> 7.485.164) bleiben vollständig erlaubt.
function installMoneyResetTrace(company) {
    if (!company || moneyTraceInstalled.has(company)) return company;
    const descriptor = Object.getOwnPropertyDescriptor(company, "money");
    if (descriptor && descriptor.configurable === false) return company;

    let value = Number(company.money);
    if (!Number.isFinite(value)) value = 0;

    Object.defineProperty(company, "money", {
        configurable: true,
        enumerable: true,
        get() {
            return value;
        },
        set(nextValue) {
            const next = Number(nextValue);
            const normalized = Number.isFinite(next) ? next : 0;
            const previous = value;
            const server = matchingServerCompany(company);
            const serverMoney = Number(server?.money ?? server?.game_state?.money);
            const sameCompany = !server?.id || !company?.serverCompanyId || String(server.id) === String(company.serverCompanyId);

            if (normalized === 0 && previous > 0 && sameCompany && Number.isFinite(serverMoney) && serverMoney > 0) {
                const trace = new Error("ORVUNO invalid money reset trace");
                console.error("🚨 ORVUNO: UNGÜLTIGER 0-EUR-RESET BLOCKIERT", {
                    companyId: company.serverCompanyId,
                    previous,
                    attempted: normalized,
                    serverMoney,
                    stack: trace.stack
                });
                return;
            }
            value = normalized;
        }
    });

    moneyTraceInstalled.add(company);
    return company;
}

// ORVUNO darf im Live-Spiel nur eine aktive Company-Instanz haben.
// Historische Integrationen benutzen unterschiedliche Globals. Diese Funktion bindet
// sie alle auf dieselbe Instanz, damit Anzeige, Ausbau, Einkauf und Autosave denselben
// Kontostand und denselben Betriebszustand verwenden.
function bindCanonicalCompany(company, serverCompany = null) {
    if (!company) return null;
    installMoneyResetTrace(company);
    window.worldPlayerCompany = company;
    if (window.worldEngine) window.worldEngine.company = company;
    if (window.worldEconomyGameplay) window.worldEconomyGameplay.company = company;
    if (portfolio) portfolio.activeCompany = company;
    if (serverCompany) window.worldActiveServerCompany = serverCompany;
    return company;
}

if (initialServerCompany) {
    if (portfolio?.hydrateCompany) {
        portfolio.hydrateCompany(runtimeCompany, initialServerCompany, initialOverview?.wallet || {});
        portfolio.companies = initialOverview?.companies || [];
    } else {
        runtimeCompany.serverCompanyId = initialServerCompany.id;
        runtimeCompany.slotNo = Number(initialServerCompany.slot_no || 1);
        runtimeCompany.name = initialServerCompany.name || "";
        runtimeCompany.industry = initialServerCompany.industry || "";
        runtimeCompany.type = initialServerCompany.company_type || "";
        runtimeCompany.money = Number.isFinite(initialServerMoney) ? initialServerMoney : runtimeCompany.money;
        runtimeCompany.coins = Number(initialOverview?.wallet?.balance || 0);
    }
    bindCanonicalCompany(runtimeCompany, initialServerCompany);
}

window.worldEngine = { company: runtimeCompany, legacyRendererDisabled: true };
bindCanonicalCompany(runtimeCompany, initialServerCompany);

// Einige Altintegrationen werden vor main.js geladen und besitzen zu diesem Zeitpunkt noch
// ihre frühere Demo-Company. Sobald ein echter Betrieb geladen/aktiviert/gewechselt wird,
// werden alle Referenzen sofort wieder auf die echte aktive Instanz vereinheitlicht.
for (const eventName of [
    "worldproject:company-loaded",
    "worldproject:company-activated",
    "worldproject:company-switched",
    "world:active-business-changed"
]) {
    window.addEventListener(eventName, event => {
        const company = event?.detail?.company || window.worldPlayerCompany || runtimeCompany;
        const serverCompany = event?.detail?.serverCompany
            || window.worldServerAccountOverview?.companies?.find(c => String(c.id) === String(company?.serverCompanyId))
            || window.worldActiveServerCompany
            || null;
        bindCanonicalCompany(company, serverCompany);
    });
}

// Startschutz: Ein bereits korrekt aus Supabase geladener Kontostand darf während der
// Initialisierung nicht durch einen historischen 0-EUR-Fallback ersetzt werden.
function guardInitialServerBalance() {
    const company = window.worldPlayerCompany || window.worldEngine?.company || runtimeCompany;
    const server = matchingServerCompany(company);
    const serverMoney = Number(server?.money ?? server?.game_state?.money ?? initialServerMoney);
    if (!company || !server || !Number.isFinite(serverMoney)) return false;

    // Während des Starts ist 0 bei gleichzeitig positivem Serverkonto eindeutig ein
    // falscher Fallback. Normale spätere Spieltransaktionen werden dadurch nicht berührt.
    const current = Number(company.money);
    if ((!Number.isFinite(current) || current === 0) && serverMoney > 0) {
        company.money = serverMoney;
        company.moneyRevision = Number(server?.money_revision ?? server?.game_state?.moneyRevision ?? company.moneyRevision ?? 0);
        bindCanonicalCompany(company, server);
        window.worldHomeOperationsDashboard?.render?.();
        console.warn("🛡️ ORVUNO: FEHLERHAFTEN 0-EUR-RUNTIMEWERT AUS SUPABASE KORRIGIERT", {
            companyId: server.id,
            money: serverMoney
        });
        return true;
    }
    return false;
}

const companySetup = new CompanySetup(
    runtimeCompany,
    company => {
        const serverCompany = matchingServerCompany(company);
        bindCanonicalCompany(company, serverCompany);
        guardInitialServerBalance();
        console.log("ORVUNO Betrieb geladen:", company);
        window.dispatchEvent(new CustomEvent("worldproject:company-activated",{detail:{company,serverCompany}}));
        window.worldHomeOperationsDashboard?.render?.();
    }
);

companySetup.show();

for (const delay of [0, 100, 300, 750, 1500, 3000, 5000, 8000, 12000]) {
    setTimeout(() => {
        guardInitialServerBalance();
        bindCanonicalCompany(window.worldPlayerCompany || runtimeCompany, window.worldActiveServerCompany || initialServerCompany);
    }, delay);
}
