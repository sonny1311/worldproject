// ============================================
// SupplierOffer.js
// WorldProject
//
// Allgemeines Lieferantenangebot
//
// Enthält:
// - Ware / Material
// - Menge
// - Warenpreis
// - Lieferant
// - Entfernung
// - Verfügbarkeit
// - Transport
// - Gesamtkosten frei Ziel
// ============================================

import {
    TransportOrder
} from "./TransportOrder.js";

import {
    TransportCostCalculator
} from "./TransportCostCalculator.js";


export class SupplierOffer {

    constructor({

        materialId,

        supplier,

        unitPrice,

        availableAmount,

        distanceKm,

        truck = null,

        destination = null,

        availableFrom = null

    }) {

        // ========================================
        // ID
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Material / Ware
        // ========================================

        this.materialId =
            materialId;


        // ========================================
        // Lieferant
        // ========================================

        this.supplier =
            supplier;


        // ========================================
        // Preis pro Einheit
        // ========================================

        this.unitPrice =
            Math.max(
                unitPrice,
                0
            );


        // ========================================
        // Verfügbare Menge
        // ========================================

        this.availableAmount =
            Math.max(
                availableAmount,
                0
            );


        // ========================================
        // Entfernung einfach
        // ========================================

        this.distanceKm =
            Math.max(
                distanceKm,
                0
            );


        // ========================================
        // Fahrzeug
        // ========================================

        this.truck =
            truck;


        // ========================================
        // Ziel
        // ========================================

        this.destination =
            destination;


        // ========================================
        // Verfügbarkeit
        // ========================================

        this.availableFrom =
            availableFrom;


        // ========================================
        // Letzte Kalkulation
        // ========================================

        this.lastCalculation =
            null;
    }


    // ========================================
    // Prüfen, ob gewünschte Menge
    // verfügbar ist
    // ========================================

    hasAmount(
        amount
    ) {

        if (
            amount <= 0
        ) {

            return false;
        }


        return (
            this.availableAmount >=
            amount
        );
    }


    // ========================================
    // Warenwert berechnen
    // ========================================

    calculateGoodsCost(
        amount
    ) {

        if (
            amount <= 0
        ) {

            return 0;
        }


        return (
            amount *
            this.unitPrice
        );
    }


    // ========================================
    // Transportauftrag erzeugen
    // ========================================

    createTransportOrder(
        amount
    ) {

        if (
            !this.truck
        ) {

            return null;
        }


        return new TransportOrder({

            cargoType:
                this.materialId,

            amount,

            truck:
                this.truck,

            supplier:
                this.supplier,

            destination:
                this.destination,

            distanceKm:
                this.distanceKm
        });
    }


    // ========================================
    // Komplettes Angebot kalkulieren
    //
    // Warenwert
    // + Transport
    // = tatsächliche Kosten am Ziel
    // ========================================

    calculateTotalOffer(
        amount,
        transportSettings = {},
        transportOptions = {}
    ) {

        if (
            amount <= 0
        ) {

            return {

                success: false,

                reason:
                    "Ungültige Menge"
            };
        }


        // ------------------------------------
        // Verfügbarkeit prüfen
        // ------------------------------------

        if (
            !this.hasAmount(
                amount
            )
        ) {

            return {

                success: false,

                reason:
                    "Gewünschte Menge nicht vollständig verfügbar",

                requestedAmount:
                    amount,

                availableAmount:
                    this.availableAmount
            };
        }


        // ------------------------------------
        // Warenwert
        // ------------------------------------

        const goodsCost =
            this.calculateGoodsCost(
                amount
            );


        // ------------------------------------
        // Transportauftrag
        // ------------------------------------

        const transportOrder =
            this.createTransportOrder(
                amount
            );


        if (
            !transportOrder
        ) {

            return {

                success: false,

                reason:
                    "Kein Fahrzeug zugewiesen"
            };
        }


        // ------------------------------------
        // Fahrzeug geeignet?
        // ------------------------------------

        if (
            !transportOrder.isValid()
        ) {

            return {

                success: false,

                reason:
                    "Fahrzeug für diesen Transport ungeeignet",

                transportOrder
            };
        }


        // ------------------------------------
        // Transportkosten berechnen
        // ------------------------------------

        const calculator =
            new TransportCostCalculator(
                transportSettings
            );


        const transport =
            calculator.calculate(
                transportOrder,
                transportOptions
            );


        if (
            !transport
        ) {

            return {

                success: false,

                reason:
                    "Transport konnte nicht kalkuliert werden"
            };
        }


        // ------------------------------------
        // Gesamtkosten
        // ------------------------------------

        const totalCost =
            goodsCost +
            transport.totalCost;


        // ------------------------------------
        // Tatsächlicher Preis je Einheit
        // frei Ziel
        // ------------------------------------

        const deliveredUnitCost =
            totalCost /
            amount;


        // ------------------------------------
        // Ergebnis
        // ------------------------------------

        const result = {

            success:
                true,

            materialId:
                this.materialId,

            supplier:
                this.supplier,

            amount,

            unitPrice:
                this.unitPrice,

            goodsCost,

            distanceKm:
                this.distanceKm,

            requiredTrips:
                transport.trips,

            totalDrivingKm:
                transport.totalKm,

            fuelLiters:
                transport.fuelLiters,

            transportCost:
                transport.totalCost,

            totalCost,

            deliveredUnitCost,

            estimatedTransportHours:
                transport.driverHours,

            availableFrom:
                this.availableFrom,

            transportOrder
        };


        this.lastCalculation =
            result;


        return result;
    }


    // ========================================
    // Preisunterschied zum reinen
    // Einkaufspreis durch Transport
    // ========================================

    getTransportMarkupPercent() {

        if (
            !this.lastCalculation
        ) {

            return null;
        }


        const goodsCost =
            this.lastCalculation
                .goodsCost;


        const transportCost =
            this.lastCalculation
                .transportCost;


        if (
            goodsCost <= 0
        ) {

            return 0;
        }


        return (
            transportCost /
            goodsCost *
            100
        );
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            materialId:
                this.materialId,

            supplier:
                this.supplier,

            unitPrice:
                this.unitPrice,

            availableAmount:
                this.availableAmount,

            distanceKm:
                this.distanceKm,

            availableFrom:
                this.availableFrom,

            lastCalculation:
                this.lastCalculation
        };
    }
}