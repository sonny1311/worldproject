// ============================================
// TransportGameplaySystem.js
// WorldProject
//
// Zentrale Spiel-Logik fuer Transportauftraege:
// - Fahrzeugklassen pruefen
// - Fahrzeug empfehlen
// - Fahrtenanzahl berechnen
// - Tankstopps und Tankzeit beruecksichtigen
// - Transportdauer / Ankunft berechnen
// - Kosten fuer Kraftstoff, Fahrer, Maut,
//   Wartung und Fahrzeug berechnen
// - spielbaren Statusablauf erzeugen
// ============================================

import { TruckTypes } from "./TruckTypes.js";
import { Truck } from "./Truck.js";
import { VehicleFuelPlanner } from "./VehicleFuelPlanner.js";

export class TransportGameplaySystem {
    constructor({
        averageSpeedKmH = 65,
        loadingMinutesPerTrip = 45,
        unloadingMinutesPerTrip = 45,
        dieselPricePerLiter = 1.65,
        driverCostPerHour = 28,
        tollPerKm = 0.30,
        maintenancePerKm = 0.18,
        vehicleCostPerKm = 0.25
    } = {}) {
        this.averageSpeedKmH = averageSpeedKmH;
        this.loadingMinutesPerTrip = loadingMinutesPerTrip;
        this.unloadingMinutesPerTrip = unloadingMinutesPerTrip;
        this.dieselPricePerLiter = dieselPricePerLiter;
        this.driverCostPerHour = driverCostPerHour;
        this.tollPerKm = tollPerKm;
        this.maintenancePerKm = maintenancePerKm;
        this.vehicleCostPerKm = vehicleCostPerKm;
        this.fuelPlanner = new VehicleFuelPlanner();
    }

    getVehicleTypes({ includeSpecial = false } = {}) {
        const allowed = includeSpecial
            ? Object.keys(TruckTypes)
            : ["van15", "van30", "van", "truck75", "truck12", "truck18", "semi40"];

        return allowed.map(type => TruckTypes[type]).filter(Boolean);
    }

    getPayloadKg(definition) {
        if (!definition) return 0;
        return Math.max(
            (Number(definition.maxGrossWeightKg) || 0) -
            (Number(definition.emptyWeightKg) || 0),
            0
        );
    }

    evaluateVehicle(vehicleType, cargo = {}) {
        const definition = TruckTypes[vehicleType];
        if (!definition) {
            return { success: false, vehicleType, reason: "Unbekannter Fahrzeugtyp" };
        }

        const totalWeightKg = Math.max(Number(cargo.weightKg) || 0, 0);
        const totalPallets = Math.max(Math.ceil(Number(cargo.pallets) || 0), 0);
        const totalVolumeM3 = Math.max(Number(cargo.volumeM3) || 0, 0);
        const payloadKg = this.getPayloadKg(definition);
        const maxPallets = Number(definition.maxPallets) || 0;
        const maxVolumeM3 = Number(definition.maxVolumeM3) || 0;

        const tripsByWeight = totalWeightKg > 0 && payloadKg > 0
            ? Math.ceil(totalWeightKg / payloadKg)
            : 1;
        const tripsByPallets = totalPallets > 0 && maxPallets > 0
            ? Math.ceil(totalPallets / maxPallets)
            : (totalPallets > 0 ? Infinity : 1);
        const tripsByVolume = totalVolumeM3 > 0 && maxVolumeM3 > 0
            ? Math.ceil(totalVolumeM3 / maxVolumeM3)
            : (totalVolumeM3 > 0 ? Infinity : 1);

        const trips = Math.max(tripsByWeight, tripsByPallets, tripsByVolume, 1);
        const suitable = Number.isFinite(trips);

        return {
            success: true,
            suitable,
            vehicleType,
            vehicleName: definition.name,
            payloadKg,
            maxPallets,
            maxVolumeM3,
            consumptionPer100Km: definition.consumptionPer100Km,
            tankCapacityLiters: definition.fuelTankCapacityLiters,
            trips,
            tripsByWeight,
            tripsByPallets,
            tripsByVolume,
            cargo: {
                weightKg: totalWeightKg,
                pallets: totalPallets,
                volumeM3: totalVolumeM3
            }
        };
    }

    recommendVehicle(cargo = {}, options = {}) {
        const candidates = this.getVehicleTypes(options)
            .map(def => this.evaluateVehicle(def.id, cargo))
            .filter(result => result.success && result.suitable);

        if (candidates.length === 0) {
            return { success: false, reason: "Kein geeignetes Fahrzeug gefunden", candidates: [] };
        }

        candidates.sort((a, b) => {
            if (a.trips !== b.trips) return a.trips - b.trips;
            return a.payloadKg - b.payloadKg;
        });

        return {
            success: true,
            recommended: candidates[0],
            candidates
        };
    }

    createTripPlan({
        vehicleType,
        distanceKm = 0,
        cargo = {},
        departureTime = new Date()
    } = {}) {
        const evaluation = this.evaluateVehicle(vehicleType, cargo);
        if (!evaluation.success || !evaluation.suitable) return evaluation;

        const oneWayKm = Math.max(Number(distanceKm) || 0, 0);
        const roundTripKm = oneWayKm * 2;
        const totalDrivingKm = roundTripKm * evaluation.trips;

        const fuelPlan = this.fuelPlanner.calculate({
            vehicleType,
            distanceKm: totalDrivingKm
        });
        if (!fuelPlan.success) return fuelPlan;

        const drivingHours = this.averageSpeedKmH > 0
            ? totalDrivingKm / this.averageSpeedKmH
            : 0;
        const loadingHours = evaluation.trips * this.loadingMinutesPerTrip / 60;
        const unloadingHours = evaluation.trips * this.unloadingMinutesPerTrip / 60;
        const refuelHours = fuelPlan.refuelTimeHours;
        const driverHours = drivingHours + loadingHours + unloadingHours + refuelHours;
        const totalHours = driverHours;

        const fuelCost = fuelPlan.fuelNeededLiters * this.dieselPricePerLiter;
        const driverCost = driverHours * this.driverCostPerHour;
        const tollCost = totalDrivingKm * this.tollPerKm;
        const maintenanceCost = totalDrivingKm * this.maintenancePerKm;
        const vehicleCost = totalDrivingKm * this.vehicleCostPerKm;
        const totalCost = fuelCost + driverCost + tollCost + maintenanceCost + vehicleCost;

        const departure = new Date(departureTime);
        const arrival = new Date(departure.getTime() + totalHours * 3600000);

        return {
            success: true,
            vehicleType,
            vehicleName: evaluation.vehicleName,
            trips: evaluation.trips,
            distanceKm: oneWayKm,
            roundTripKm,
            totalDrivingKm,
            drivingHours,
            loadingHours,
            unloadingHours,
            refuelStops: fuelPlan.refuelStops,
            refuelTimeHours: refuelHours,
            refuelTimeMinutes: refuelHours * 60,
            fuelNeededLiters: fuelPlan.fuelNeededLiters,
            tankCapacityLiters: fuelPlan.tankCapacityLiters,
            rangeKm: fuelPlan.rangeKm,
            driverHours,
            fuelCost,
            driverCost,
            tollCost,
            maintenanceCost,
            vehicleCost,
            totalCost,
            totalHours,
            departureTime: departure,
            arrivalTime: arrival,
            evaluation,
            fuelPlan
        };
    }

    createStatusTimeline(plan) {
        if (!plan?.success) return [];

        const steps = [];
        let minute = 0;

        steps.push({ status: "loading", minute });
        minute += plan.loadingHours * 60;
        steps.push({ status: "driving", minute });

        if (plan.refuelStops > 0) {
            const drivingMinutes = plan.drivingHours * 60;
            const segment = drivingMinutes / (plan.refuelStops + 1);
            for (let i = 1; i <= plan.refuelStops; i++) {
                steps.push({ status: "refueling", minute: minute + segment * i });
            }
        }

        minute += plan.drivingHours * 60 + plan.refuelTimeHours * 60;
        steps.push({ status: "unloading", minute });
        minute += plan.unloadingHours * 60;
        steps.push({ status: "delivered", minute });

        return steps.sort((a, b) => a.minute - b.minute);
    }

    prepareOrder(order, { vehicleType = null, distanceKm = null, cargo = null } = {}) {
        if (!order) return { success: false, reason: "Transportauftrag fehlt" };

        const derivedCargo = cargo ?? {
            weightKg: order.totalWeightKg ?? 0,
            pallets: Array.isArray(order.items)
                ? order.items.reduce((sum, item) => sum + (item?.gigaOptimization?.pallets ?? 0), 0)
                : 0,
            volumeM3: 0
        };

        const recommendation = this.recommendVehicle(derivedCargo);
        const selectedType = vehicleType ?? recommendation?.recommended?.vehicleType;
        if (!selectedType) return recommendation;

        const definition = TruckTypes[selectedType];
        const resolvedDistance = distanceKm ?? order.items?.[0]?.distanceKm ?? 0;
        const truck = new Truck(selectedType, {
            name: `Transportfahrzeug ${definition?.name ?? selectedType}`,
            fuelCapacityLiters: definition?.fuelTankCapacityLiters ?? null,
            currentFuelLiters: definition?.fuelTankCapacityLiters ?? null
        });

        const plan = this.createTripPlan({
            vehicleType: selectedType,
            distanceKm: resolvedDistance,
            cargo: derivedCargo,
            departureTime: new Date()
        });
        if (!plan.success) return plan;

        order.selectedVehicleType = selectedType;
        order.selectedTruck = truck;
        order.transportRecommendation = recommendation;
        order.transportTripPlan = plan;
        order.transportTimeline = this.createStatusTimeline(plan);
        order.transportStatus = "planned";
        order.transportCost = plan.totalCost;
        order.transportCosts = {
            fuel: plan.fuelCost,
            driver: plan.driverCost,
            toll: plan.tollCost,
            maintenance: plan.maintenanceCost,
            vehicle: plan.vehicleCost,
            total: plan.totalCost
        };

        return {
            success: true,
            order,
            truck,
            recommendation,
            plan,
            timeline: order.transportTimeline
        };
    }

    async executeOrder(order, {
        vehicleType = null,
        distanceKm = null,
        cargo = null,
        timeScaleMsPerGameMinute = 0,
        onStatus = null
    } = {}) {
        const prepared = this.prepareOrder(order, { vehicleType, distanceKm, cargo });
        if (!prepared.success) return prepared;

        const truck = prepared.truck;
        const timeline = prepared.timeline;
        truck.setStatus("loading");

        let previousMinute = 0;
        for (const step of timeline) {
            const waitMinutes = Math.max(step.minute - previousMinute, 0);
            if (timeScaleMsPerGameMinute > 0 && waitMinutes > 0) {
                await new Promise(resolve => setTimeout(resolve, waitMinutes * timeScaleMsPerGameMinute));
            }

            order.transportStatus = step.status;
            order.status = step.status === "delivered"
                ? "delivered"
                : (step.status === "driving" || step.status === "refueling" ? "in_transit" : order.status);
            truck.setStatus(step.status === "delivered" ? "available" : step.status);

            if (typeof onStatus === "function") {
                onStatus({ ...step, order, truck, plan: prepared.plan });
            }
            previousMinute = step.minute;
        }

        order.deliveredWeightKg = order.totalWeightKg ?? order.deliveredWeightKg ?? 0;
        order.completedAt = new Date();
        truck.setStatus("available");

        return {
            success: true,
            delivered: true,
            order,
            truck,
            plan: prepared.plan,
            timeline
        };
    }
}
