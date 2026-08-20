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
let canonicalPlayerCompany = window.worldPlayerCompany || null;

function serverCompanies() {
    return Array.isArray(window.worldServerAccountOverview?.companies)
        ? window.worldServerAccountOverview.companies
        : (Array.isArray(initialOverview?.companies) ? initialOverview.companies : []);
}

function serverCompanyFor(company) {
    const id = company?.serverCompanyId ?? company?.id;
    if (id != null) {
        const found = serverCompanies().find(c => String(c.id) === String(id));
        if (found) return found;
    }
    return window.worldActiveServerCompany || initialServerCompany || null;
}

function matchingServerCompany(company) {
    return serverCompanyFor(company);
}

function installMoneyResetTrace(company) {
    if (!company || moneyTraceInstalled.has(company)) return company;
    const descriptor = Object.getOwnPropertyDescriptor(company, "money");
    if (descriptor && descriptor.configurable === false) return company;

    let value = Number(company.money);
    if (!Number.isFinite(value)) value = 0;

    Object.defineProperty(company, "money", {
        configurable: true,
        enumerable: true,
        get() { return value; },
        set(nextValue) {
            const next = Number(nextValue);
            const normalized = Number.isFinite(next) ? next : 0;
            const previous = value;
            const server = matchingServerCompany(company);
            const serverMoney = Number(server?.money ?? server?.game_state?.money);
            const sameCompany = !server?.id || !company?.serverCompanyId || String(server.id) === String(company.serverCompanyId);

            if (normalized === 0 && previous > 0 && sameCompany && Number.isFinite(serverMoney) && serverMoney > 0) {
                console.error("🚨 ORVUNO: UNGÜLTIGER 0-EUR-RESET BLOCKIERT", {
                    companyId: company.serverCompanyId,
                    previous,
                    attempted: normalized,
                    serverMoney,
                    stack: new Error("ORVUNO invalid money reset trace").stack
                });
                return;
            }
            value = normalized;
        }
    });

    moneyTraceInstalled.add(company);
    return company;
}

// Harte Laufzeitgrenze: Nach erfolgreichem Server-Load darf keine alte Demo-/Fallback-
// Company die echte Spielerfirma mehr als worldPlayerCompany ersetzen. Echte Firmenwechsel
// bleiben erlaubt, sofern die Ziel-ID in der aktuellen Supabase-Uebersicht existiert.
function installCanonicalPlayerCompanyLock() {
    const descriptor = Object.getOwnPropertyDescriptor(window, "worldPlayerCompany");
    if (descriptor?.get?.__orvunoCanonicalLock) return;

    const getter = function() { return canonicalPlayerCompany; };
    getter.__orvunoCanonicalLock = true;

    Object.defineProperty(window, "worldPlayerCompany", {
        configurable: true,
        enumerable: true,
        get: getter,
        set(next) {
            if (!next) return;
            const current = canonicalPlayerCompany;
            const known = serverCompanyFor(next);
            const nextId = next?.serverCompanyId ?? next?.id ?? null;
            const isKnownServerCompany = nextId != null && serverCompanies().some(c => String(c.id) === String(nextId));
            const hasCanonicalServerCompany = Boolean(current?.serverCompanyId && serverCompanies().some(c => String(c.id) === String(current.serverCompanyId)));

            if (hasCanonicalServerCompany && !isKnownServerCompany && next !== current) {
                console.error("🚨 ORVUNO: ALTE/FALSCHE RUNTIME-COMPANY BLOCKIERT", {
                    activeCompanyId: current?.serverCompanyId,
                    rejectedCompanyId: nextId,
                    rejectedMoney: Number(next?.money),
                    stack: new Error("ORVUNO invalid company replacement").stack
                });
                return;
            }

            if (known && isKnownServerCompany) {
                const serverMoney = Number(known.money ?? known.game_state?.money);
                if ((!Number.isFinite(Number(next.money)) || Number(next.money) === 0) && Number.isFinite(serverMoney) && serverMoney > 0) {
                    next.money = serverMoney;
                    next.moneyRevision = Number(known.money_revision ?? known.game_state?.moneyRevision ?? next.moneyRevision ?? 0);
                }
            }

            installMoneyResetTrace(next);
            canonicalPlayerCompany = next;
        }
    });
}

installCanonicalPlayerCompanyLock();

function bindCanonicalCompany(company, serverCompany = null) {
    if (!company) return null;
    installMoneyResetTrace(company);
    window.worldPlayerCompany = company;
    const active = window.worldPlayerCompany || company;
    if (window.worldEngine) window.worldEngine.company = active;
    if (window.worldEconomyGameplay) window.worldEconomyGameplay.company = active;
    if (portfolio) portfolio.activeCompany = active;
    if (serverCompany) window.worldActiveServerCompany = serverCompany;
    return active;
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

window.worldEngine = { company: window.worldPlayerCompany || runtimeCompany, legacyRendererDisabled: true };
bindCanonicalCompany(window.worldPlayerCompany || runtimeCompany, initialServerCompany);

for (const eventName of [
    "worldproject:company-loaded",
    "worldproject:company-activated",
    "worldproject:company-switched",
    "world:active-business-changed"
]) {
    window.addEventListener(eventName, event => {
        const requested = event?.detail?.company || window.worldPlayerCompany || runtimeCompany;
        const serverCompany = event?.detail?.serverCompany || serverCompanyFor(requested);
        bindCanonicalCompany(requested, serverCompany);
    });
}

function guardInitialServerBalance() {
    const company = window.worldPlayerCompany || window.worldEngine?.company || runtimeCompany;
    const server = matchingServerCompany(company);
    const serverMoney = Number(server?.money ?? server?.game_state?.money ?? initialServerMoney);
    if (!company || !server || !Number.isFinite(serverMoney)) return false;

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
        const active = bindCanonicalCompany(company, serverCompany);
        guardInitialServerBalance();
        console.log("ORVUNO Betrieb geladen:", active);
        window.dispatchEvent(new CustomEvent("worldproject:company-activated",{detail:{company:active,serverCompany}}));
        window.worldHomeOperationsDashboard?.render?.();
    }
);

companySetup.show();

for (const delay of [0, 100, 300, 750, 1500, 3000, 5000, 8000, 12000, 15000, 20000]) {
    setTimeout(() => {
        guardInitialServerBalance();
        const active = window.worldPlayerCompany || runtimeCompany;
        bindCanonicalCompany(active, serverCompanyFor(active));
    }, delay);
}
