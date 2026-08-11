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


import(
    "./main.js"
);
