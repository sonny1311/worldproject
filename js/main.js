// ============================================
// main.js
// WorldProject
// ============================================

import "./content/ContentBootstrap.js";
import "./core/CanonicalIndustryGoodsIntegration.js";
import "./core/OperationalInventoryBridge.js";
import "./core/CurrencyPresentationBridge.js";
import { Engine } from "./core/Engine.js";
import { CompanySetup } from "./core/CompanySetup.js";

// WICHTIG:
// Transport-/Giga-Dialogtests werden hier NICHT automatisch importiert
// oder gestartet. Solche Dialoge duerfen nur durch eine konkrete
// Spieleraktion bzw. einen echten Transportvorgang geoeffnet werden.

// ============================================
// Engine
// ============================================

const engine = new Engine();

// Die Engine erzeugt bereits die zentrale Company-Instanz. Diese darf beim
// Seitenstart nicht durch ein neues 50.000-EUR-Startobjekt ersetzt werden:
// vorhandene Server-/Spielstandsdaten werden von CompanySetup in genau diese
// Instanz hydriert und bleiben damit die gemeinsame Quelle fuer alle Ansichten.
// Bis die Serverdaten geladen sind, ist 0 der sichere neutrale Runtime-Wert;
// echtes Start-/Firmenkapital kommt ausschliesslich aus dem Server-Spielstand.
engine.company.money = 0;
window.worldEngine = engine;

// ============================================
// Unternehmensgruendung / Spielstand laden
// ============================================

const companySetup = new CompanySetup(
    engine.company,
    company => {
        console.log("Unternehmen geladen:", company);
        engine.company = company;
        window.worldPlayerCompany = company;
        window.dispatchEvent(new CustomEvent("worldproject:company-activated",{detail:{company}}));
    }
);

// ============================================
// Spiel starten
// ============================================

engine.start();

// ============================================
// Gruendungspruefung
// ============================================
// CompanySetup entscheidet selbst, ob tatsaechlich noch eine Gruendung
// notwendig ist. Bei bestehendem Betrieb wird zuerst der gespeicherte
// Serverzustand hydriert. Kein Transport-/Testdialog wird beim Start
// ausgefuehrt.

companySetup.show();