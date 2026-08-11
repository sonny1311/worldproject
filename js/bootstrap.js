// ============================================
// bootstrap.js
// WorldProject
//
// Laedt zuerst projektweite Integrationen und
// startet danach die eigentliche main.js.
// ============================================

import "./core/TransportVehicleCostIntegration.js";
import "./core/TransportFuelTimeIntegration.js";
import "./core/TransportGameplayIntegration.js";
import "./core/CompanyEconomyIntegration.js";
import "./core/ConnectedEconomyGameplay.js";


import(
    "./main.js"
);
