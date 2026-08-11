// ============================================
// TransportGameplayIntegration.js
// WorldProject
//
// Bindet das neue Transport-Gameplay an
// ConstructionMaterialOrder und den sichtbaren
// Transportdialog an.
// ============================================

import { ConstructionMaterialOrder } from "./ConstructionMaterialOrder.js";
import { ConstructionTransportDialog } from "./ConstructionTransportDialog.js";
import { CargoTypes } from "./CargoTypes.js";
import { TruckTypes } from "./TruckTypes.js";
import { TransportGameplaySystem } from "./TransportGameplaySystem.js";
import { TransportVehicleSelectionDialog } from "./TransportVehicleSelectionDialog.js";

const system = new TransportGameplaySystem();

function deriveCargo(order) {
    const items = Array.isArray(order?.items) ? order.items : [];

    let weightKg = 0;
    let pallets = 0;
    let volumeM3 = 0;

    for (const item of items) {
        weightKg += Number(item?.weightKg) || 0;

        const cargo = CargoTypes[item?.materialId];
        if (cargo?.palletized === true && (Number(cargo.unitsPerPallet) || 0) > 0) {
            pallets += Math.ceil((Number(item?.amount) || 0) / Number(cargo.unitsPerPallet));
        } else {
            pallets += Number(item?.pallets) || 0;
        }

        volumeM3 += Number(item?.volumeM3) || 0;
    }

    return { weightKg, pallets, volumeM3 };
}

if (ConstructionMaterialOrder.prototype.__transportGameplayIntegrated !== true) {
    ConstructionMaterialOrder.prototype.getTransportCargo = function () {
        return deriveCargo(this);
    };

    ConstructionMaterialOrder.prototype.getTransportVehicleOptions = function () {
        const cargo = deriveCargo(this);
        return system.getVehicleTypes().map(definition =>
            system.evaluateVehicle(definition.id, cargo)
        );
    };

    ConstructionMaterialOrder.prototype.recommendTransportVehicle = function () {
        return system.recommendVehicle(deriveCargo(this));
    };

    ConstructionMaterialOrder.prototype.planTransportWithVehicle = function (vehicleType) {
        return system.prepareOrder(this, {
            vehicleType,
            distanceKm: this.items?.[0]?.distanceKm ?? 0,
            cargo: deriveCargo(this)
        });
    };

    ConstructionMaterialOrder.prototype.executePlayableTransport = function (options = {}) {
        return system.executeOrder(this, {
            ...options,
            distanceKm: options.distanceKm ?? this.items?.[0]?.distanceKm ?? 0,
            cargo: options.cargo ?? deriveCargo(this)
        });
    };

    ConstructionMaterialOrder.prototype.openTransportVehicleSelection = function ({
        parent = document.body,
        onSelected = null,
        onClose = null
    } = {}) {
        const cargo = deriveCargo(this);
        const dialog = new TransportVehicleSelectionDialog({
            cargo,
            distanceKm: this.items?.[0]?.distanceKm ?? 0,
            parent,
            onSelected: data => {
                const prepared = this.planTransportWithVehicle(data.candidate.vehicleType);
                if (typeof onSelected === "function") {
                    onSelected({ ...data, prepared, order: this });
                }
            },
            onClose
        });
        dialog.open();
        return dialog;
    };

    ConstructionMaterialOrder.prototype.__transportGameplayIntegrated = true;
}

// ============================================
// Sichtbaren Button in den bestehenden
// Giga-/Transportdialog einfuegen.
// ============================================

if (ConstructionTransportDialog.prototype.__vehicleSelectionButtonIntegrated !== true) {
    const originalCreateTransportSummary =
        ConstructionTransportDialog.prototype.createTransportSummary;

    if (typeof originalCreateTransportSummary === "function") {
        ConstructionTransportDialog.prototype.createTransportSummary = function () {
            const wrapper = originalCreateTransportSummary.call(this);

            if (!wrapper || !this.order?.openTransportVehicleSelection) {
                return wrapper;
            }

            const recommendation = this.order.recommendTransportVehicle?.();
            const recommendedName = recommendation?.recommended?.vehicleName ?? "Fahrzeug";

            const selectionBox = document.createElement("div");
            Object.assign(selectionBox.style, {
                marginTop: "18px",
                padding: "16px",
                borderRadius: "9px",
                background: "rgba(255,255,255,0.07)"
            });

            const title = document.createElement("div");
            title.textContent = "🚚 Fahrzeugauswahl";
            Object.assign(title.style, {
                fontWeight: "700",
                marginBottom: "8px"
            });

            const info = document.createElement("div");
            info.textContent = `Empfohlen: ${recommendedName}`;
            Object.assign(info.style, {
                fontSize: "13px",
                opacity: "0.8",
                marginBottom: "10px"
            });

            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Fahrzeug selbst wählen";
            Object.assign(button.style, {
                width: "100%",
                padding: "11px 14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "700"
            });

            button.addEventListener("click", () => {
                this.order.openTransportVehicleSelection({
                    parent: document.body,
                    onSelected: ({ candidate, plan }) => {
                        console.log("✅ TRANSPORTFAHRZEUG GEWÄHLT", {
                            vehicle: candidate.vehicleName,
                            vehicleType: candidate.vehicleType,
                            trips: plan.trips,
                            refuelStops: plan.refuelStops,
                            arrivalTime: plan.arrivalTime,
                            totalHours: plan.totalHours
                        });
                    }
                });
            });

            selectionBox.append(title, info, button);
            wrapper.append(selectionBox);
            return wrapper;
        };
    }

    ConstructionTransportDialog.prototype.__vehicleSelectionButtonIntegrated = true;
}

export function runTransportGameplayIntegrationTest() {
    const smallCargo = {
        weightKg: 350,
        pallets: 1,
        volumeM3: 2
    };

    const mediumCargo = {
        weightKg: 2400,
        pallets: 10,
        volumeM3: 22
    };

    const largeCargo = {
        weightKg: 20000,
        pallets: 80,
        volumeM3: 60
    };

    const smallRecommendation = system.recommendVehicle(smallCargo);
    const mediumRecommendation = system.recommendVehicle(mediumCargo);
    const largeRecommendation = system.recommendVehicle(largeCargo);

    const longTrip = system.createTripPlan({
        vehicleType: "truck18",
        distanceKm: 1200,
        cargo: { weightKg: 8000, pallets: 18, volumeM3: 40 },
        departureTime: new Date("2026-08-11T08:00:00")
    });

    const timeline = system.createStatusTimeline(longTrip);

    const expectedArrivalMs =
        new Date("2026-08-11T08:00:00").getTime() +
        longTrip.totalHours * 3600000;

    const success =
        smallRecommendation.success === true &&
        smallRecommendation.recommended.vehicleType === "van15" &&
        mediumRecommendation.success === true &&
        largeRecommendation.success === true &&
        largeRecommendation.recommended.vehicleType === "semi40" &&
        largeRecommendation.recommended.trips === 3 &&
        longTrip.success === true &&
        longTrip.refuelStops >= 1 &&
        longTrip.arrivalTime.getTime() === expectedArrivalMs &&
        timeline.some(step => step.status === "loading") &&
        timeline.some(step => step.status === "driving") &&
        timeline.some(step => step.status === "refueling") &&
        timeline.some(step => step.status === "unloading") &&
        timeline.some(step => step.status === "delivered") &&
        TruckTypes.semi40.consumptionPer100Km === 29;

    if (success) {
        console.log("✅ TRANSPORT-GAMEPLAY-TEST ERFOLGREICH", {
            small: smallRecommendation.recommended,
            medium: mediumRecommendation.recommended,
            large: largeRecommendation.recommended,
            longTrip,
            timeline
        });
    } else {
        console.error("❌ TRANSPORT-GAMEPLAY-TEST FEHLGESCHLAGEN", {
            smallRecommendation,
            mediumRecommendation,
            largeRecommendation,
            longTrip,
            timeline
        });
    }

    return {
        success,
        smallRecommendation,
        mediumRecommendation,
        largeRecommendation,
        longTrip,
        timeline
    };
}

runTransportGameplayIntegrationTest();
