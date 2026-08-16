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
// Für ältere Integrationen bleibt nur die gemeinsame Company-Referenz erhalten.
const runtimeCompany = new Company();
runtimeCompany.money = 0;
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
