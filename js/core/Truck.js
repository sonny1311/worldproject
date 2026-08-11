// ============================================
// Truck.js
// WorldProject
// Allgemeines LKW-/Nutzfahrzeugobjekt
// ============================================

import {
    TruckTypes
} from "./TruckTypes.js";

import {
    TruckCapacity
} from "./TruckCapacity.js";


export class Truck {

    constructor(
        type,
        customData = {}
    ) {

        // ========================================
        // Fahrzeugtyp holen
        // ========================================

        const definition =
            TruckTypes[type];


        if (!definition) {

            throw new Error(
                "Unbekannter LKW-Typ: " +
                type
            );
        }


        this.definition =
            definition;


        // ========================================
        // Identität
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        this.type =
            type;


        this.name =
            customData.name ??
            definition.name;


        // ========================================
        // Fahrzeugzustand
        // ========================================

        this.status =
            "available";


        // available
        // loading
        // driving
        // waiting
        // unloading
        // maintenance


        // ========================================
        // Standort
        // ========================================

        this.location = {

            type:
                "company",

            id:
                null,

            name:
                null
        };


        // ========================================
        // Gewicht / Kapazität
        // ========================================

        this.capacity =
            new TruckCapacity({

                maxGrossWeightKg:

                    customData.maxGrossWeightKg ??
                    definition.maxGrossWeightKg,


                emptyWeightKg:

                    customData.emptyWeightKg ??
                    definition.emptyWeightKg,


                maxVolumeM3:

                    customData.maxVolumeM3 ??
                    definition.maxVolumeM3,


                maxPallets:

                    customData.maxPallets ??
                    definition.maxPallets
            });


        // ========================================
        // Aktuelle Ladung
        // ========================================

        this.cargo = {

            items: [],

            weightKg: 0,

            volumeM3: 0,

            pallets: 0
        };


        // ========================================
        // Kraftstoff / Energie
        // ========================================

        this.fuelType =
            definition.fuelType;


        this.fuel = {

            capacityLiters:
                customData.fuelCapacityLiters ??
                null,

            currentLiters:
                customData.currentFuelLiters ??
                null
        };


        // ========================================
        // Kilometer
        // ========================================

        this.odometerKm =
            customData.odometerKm ??
            0;


        // ========================================
        // Laufende Kosten
        // ========================================

        this.monthlyCosts = {

            insurance: 0,

            tax: 0,

            maintenance: 0,

            financing: 0,

            other: 0
        };


        // ========================================
        // Wartung
        // ========================================

        this.maintenance = {

            conditionPercent: 100,

            nextServiceKm: null,

            lastServiceKm: 0
        };
    }


    // ========================================
    // Nutzlast
    // ========================================

    getMaxPayloadKg() {

        return (
            this.capacity.getMaxPayloadKg()
        );
    }


    getMaxPayloadTons() {

        return (
            this.capacity.getMaxPayloadTons()
        );
    }


    // ========================================
    // Prüfen, ob Ladung passt
    // ========================================

    canLoad({

        weightKg = 0,

        volumeM3 = 0,

        pallets = 0

    }) {

        return this.capacity.canCarry({

            weightKg:
                this.cargo.weightKg +
                weightKg,

            volumeM3:
                this.cargo.volumeM3 +
                volumeM3,

            pallets:
                this.cargo.pallets +
                pallets
        });
    }


    // ========================================
    // Ladung hinzufügen
    // ========================================

    loadCargo({

        id = null,

        name = "Ladung",

        amount = 0,

        unit = null,

        weightKg = 0,

        volumeM3 = 0,

        pallets = 0

    }) {

        if (
            !this.canLoad({

                weightKg,

                volumeM3,

                pallets
            })
        ) {

            return {

                success: false,

                problems:
                    this.capacity
                        .getCapacityProblems({

                            weightKg:
                                this.cargo.weightKg +
                                weightKg,

                            volumeM3:
                                this.cargo.volumeM3 +
                                volumeM3,

                            pallets:
                                this.cargo.pallets +
                                pallets
                        })
            };
        }


        this.cargo.items.push({

            id,

            name,

            amount,

            unit,

            weightKg,

            volumeM3,

            pallets
        });


        this.cargo.weightKg +=
            weightKg;


        this.cargo.volumeM3 +=
            volumeM3;


        this.cargo.pallets +=
            pallets;


        return {

            success: true
        };
    }


    // ========================================
    // Fahrzeug entladen
    // ========================================

    unloadAll() {

        const unloadedCargo = {

            items:
                [...this.cargo.items],

            weightKg:
                this.cargo.weightKg,

            volumeM3:
                this.cargo.volumeM3,

            pallets:
                this.cargo.pallets
        };


        this.cargo = {

            items: [],

            weightKg: 0,

            volumeM3: 0,

            pallets: 0
        };


        return unloadedCargo;
    }


    // ========================================
    // Aktuelles Gesamtgewicht
    // ========================================

    getCurrentGrossWeightKg() {

        return (
            this.capacity
                .getGrossWeightKg(
                    this.cargo.weightKg
                )
        );
    }


    // ========================================
    // Auslastung nach Gewicht
    // ========================================

    getWeightUtilizationPercent() {

        const payload =
            this.getMaxPayloadKg();


        if (
            payload <= 0
        ) {

            return 0;
        }


        return Math.min(

            (
                this.cargo.weightKg /
                payload
            ) * 100,

            100
        );
    }


    // ========================================
    // Auslastung Paletten
    // ========================================

    getPalletUtilizationPercent() {

        if (
            this.capacity.maxPallets ===
            null
        ) {

            return null;
        }


        if (
            this.capacity.maxPallets <= 0
        ) {

            return 0;
        }


        return Math.min(

            (
                this.cargo.pallets /
                this.capacity.maxPallets
            ) * 100,

            100
        );
    }


    // ========================================
    // Fahrzeug verfügbar?
    // ========================================

    isAvailable() {

        return (
            this.status ===
            "available"
        );
    }


    // ========================================
    // Status setzen
    // ========================================

    setStatus(
        status
    ) {

        this.status =
            status;
    }


    // ========================================
    // Kilometer hinzufügen
    // ========================================

    addKilometers(
        kilometers
    ) {

        if (
            typeof kilometers !==
            "number"
        ) {

            return false;
        }


        if (
            kilometers <= 0
        ) {

            return false;
        }


        this.odometerKm +=
            kilometers;


        return true;
    }


    // ========================================
    // Fahrzeuginformationen
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            type:
                this.type,

            name:
                this.name,

            status:
                this.status,

            odometerKm:
                this.odometerKm,

            maxPayloadKg:
                this.getMaxPayloadKg(),

            maxPayloadTons:
                this.getMaxPayloadTons(),

            currentCargoWeightKg:
                this.cargo.weightKg,

            currentGrossWeightKg:
                this.getCurrentGrossWeightKg(),

            weightUtilizationPercent:
                this.getWeightUtilizationPercent(),

            palletUtilizationPercent:
                this.getPalletUtilizationPercent(),

            maxPallets:
                this.capacity.maxPallets,

            maxVolumeM3:
                this.capacity.maxVolumeM3
        };
    }
}