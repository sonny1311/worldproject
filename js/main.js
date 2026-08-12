// ============================================
// main.js
// WorldProject
// ============================================

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

// ============================================
// Unternehmen
// ============================================

engine.company = {
    name: "",
    industry: "",
    type: "",
    money: 50000,
    coins: 0,
    land: { size: 100 },
    buildings: []
};

// ============================================
// Unternehmensgruendung
// ============================================

const companySetup = new CompanySetup(
    engine.company,
    company => {
        console.log("Unternehmen gegruendet:", company);
        engine.company = company;
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
// notwendig ist. Kein Transport-/Testdialog wird beim Start ausgefuehrt.

companySetup.show();
