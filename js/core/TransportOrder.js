// ============================================
// TransportOrder.js
// WorldProject
//
// Allgemeiner Transportauftrag
//
// Verbindet:
// - Ware
// - Lieferant
// - Empfänger
// - Fahrzeug
// - Entfernung
// - Fahrten
// - Transportkosten
// ============================================

import {
    CargoTypes
} from "./CargoTypes.js";


export class TransportOrder {

   constructor({

    cargoType,

    amount,

    truck = null,

    supplier = null,

    destination = null,

    distanceKm = 0,

    company = null

}) {
        // ========================================
        // ID
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Ladungsart
        // ========================================

        this.cargoType =
            cargoType;


        this.cargoDefinition =
            CargoTypes[
                cargoType
            ];


        if (
            !this.cargoDefinition
        ) {

            throw new Error(
                "Unbekannte Ladungsart: " +
                cargoType
            );
        }


        // ========================================
        // Menge
        // ========================================

        this.amount =
            amount;


        // ========================================
        // Lieferant
        // ========================================

        this.supplier =
            supplier;


        // ========================================
        // Ziel
        // ========================================

        this.destination =
            destination;


        // ========================================
        // Entfernung EINFACH
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
// Unternehmen
//
// Wird für Coin-/Giga-Transportservice
// benötigt.
// ========================================

this.company =
    company;

        // ========================================
        // Status
        // ========================================

        this.status =
            "planned";


        // planned
        // waiting_for_truck
        // loading
        // driving
        // unloading
        // completed
        // delayed


        // ========================================
        // Ladungsdaten berechnen
        // ========================================

        this.cargo =
            this.calculateCargo();


        // ========================================
        // Anzahl benötigter Fahrten
        // ========================================

        this.requiredTrips =
            this.calculateRequiredTrips();


        // ========================================
        // Kosten
        // ========================================

        this.costs = {

            fuel:
                0,

            driver:
                0,

            toll:
                0,

            maintenance:
                0,

            vehicle:
                0,

            loading:
                0,

            unloading:
                0,

            other:
                0,

            total:
                0
        };


        // ========================================
        // Zeit
        // ========================================

        this.time = {

            estimatedHours:
                0,

            actualHours:
                0,

            delayHours:
                0
        };
    }


    // ========================================
    // Ladungsdaten berechnen
    // ========================================

    calculateCargo() {

        const definition =
            this.cargoDefinition;


        // ----------------------------------------
        // Gewicht
        // ----------------------------------------

        const weightKg =
            this.amount *
            (
                definition.weightKgPerUnit ??
                0
            );


        // ----------------------------------------
        // Volumen
        // ----------------------------------------

        const volumeM3 =
            this.amount *
            (
                definition.volumeM3PerUnit ??
                0
            );


        // ----------------------------------------
        // Paletten
        // ----------------------------------------

        let pallets =
            0;


        if (
            definition.palletized ===
            true
        ) {

            const unitsPerPallet =
                definition.unitsPerPallet ??
                1;


            pallets =
                Math.ceil(
                    this.amount /
                    unitsPerPallet
                );
        }


        return {

            weightKg,

            volumeM3,

            pallets
        };
    }


    // ========================================
    // Fahrzeug für Ladung geeignet?
    // ========================================

    isTruckSuitable() {

        if (
            !this.truck
        ) {

            return false;
        }


        const allowed =
            this.cargoDefinition
                .allowedVehicleCategories;


        if (
            !Array.isArray(
                allowed
            )
        ) {

            return true;
        }


        return allowed.includes(
            this.truck.definition.category
        );
    }


    // ========================================
    // Benötigte Fahrten berechnen
    // ========================================

    calculateRequiredTrips() {

        if (
            !this.truck
        ) {

            return null;
        }


        if (
            !this.isTruckSuitable()
        ) {

            return null;
        }


        return (
            this.truck.capacity
                .calculateRequiredTrips({

                    totalWeightKg:
                        this.cargo.weightKg,

                    totalVolumeM3:
                        this.cargo.volumeM3,

                    totalPallets:
                        this.cargo.pallets
                })
        );
    }


    // ========================================
    // Gesamtkilometer berechnen
    //
    // Standard:
    // Hin- und Rückfahrt.
    //
    // Beispiel:
    // Lieferant 100 km entfernt
    // 3 Fahrten
    //
    // 100 × 2 × 3
    // = 600 Fahrzeug-km
    // ========================================

    getTotalDrivingKm() {

        if (
            this.requiredTrips ===
            null
        ) {

            return 0;
        }


        return (
            this.distanceKm *
            2 *
            this.requiredTrips
        );
    }


    // ========================================
    // Beladene Kilometer
    // ========================================

    getLoadedKm() {

        if (
            this.requiredTrips ===
            null
        ) {

            return 0;
        }


        return (
            this.distanceKm *
            this.requiredTrips
        );
    }


    // ========================================
    // Leer-Kilometer
    // ========================================

    getEmptyKm() {

        if (
            this.requiredTrips ===
            null
        ) {

            return 0;
        }


        return (
            this.distanceKm *
            this.requiredTrips
        );
    }


    // ========================================
    // Transportkosten berechnen
    //
    // Noch KEINE fest verdrahteten Preise.
    //
    // Die Kostenwerte kommen später aus:
    //
    // - Dieselpreis
    // - Verbrauch des LKW
    // - Fahrerlohn
    // - Maut
    // - Fahrzeugkosten
    // - Wartung
    // - Be-/Entladung
    //
    // Dadurch können Preise später
    // dynamisch schwanken.
    // ========================================

    calculateTransportCosts({

        fuelCost = 0,

        driverCost = 0,

        tollCost = 0,

        maintenanceCost = 0,

        vehicleCost = 0,

        loadingCost = 0,

        unloadingCost = 0,

        otherCost = 0

    } = {}) {

        this.costs.fuel =
            Math.max(
                fuelCost,
                0
            );


        this.costs.driver =
            Math.max(
                driverCost,
                0
            );


        this.costs.toll =
            Math.max(
                tollCost,
                0
            );


        this.costs.maintenance =
            Math.max(
                maintenanceCost,
                0
            );


        this.costs.vehicle =
            Math.max(
                vehicleCost,
                0
            );


        this.costs.loading =
            Math.max(
                loadingCost,
                0
            );


        this.costs.unloading =
            Math.max(
                unloadingCost,
                0
            );


        this.costs.other =
            Math.max(
                otherCost,
                0
            );


        this.costs.total =

            this.costs.fuel +

            this.costs.driver +

            this.costs.toll +

            this.costs.maintenance +

            this.costs.vehicle +

            this.costs.loading +

            this.costs.unloading +

            this.costs.other;


        return this.costs;
    }


    // ========================================
    // Kosten pro transportierter Einheit
    // ========================================

    getTransportCostPerUnit() {

        if (
            this.amount <= 0
        ) {

            return 0;
        }


        return (
            this.costs.total /
            this.amount
        );
    }


    // ========================================
    // Transportauftrag gültig?
    // ========================================

    isValid() {

        if (
            this.amount <= 0
        ) {

            return false;
        }


        if (
            !this.truck
        ) {

            return false;
        }


        if (
            !this.isTruckSuitable()
        ) {

            return false;
        }


        if (
            this.requiredTrips === null ||
            this.requiredTrips <= 0
        ) {

            return false;
        }


        return true;
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
    // Übersicht
    // ========================================
// ========================================
// Spezialtransport prüfen
//
// Normaler 40-t-Sattelzug:
// - max. 33 Europaletten
//
// Giga:
// - max. 54 Europaletten
// - weiterhin max. 40 t Gesamtgewicht
//
// Schwerlast:
// - bis 60 t Gesamtgewicht
// - Sondergenehmigung inklusive
// ========================================

evaluateSpecialTransport(
    currentDate = new Date()
) {

    const service =
        this.company
            ?.gigaTransportService;


    if (!service) {

        return {

            specialTransport:
                false,

            automatic:
                false,

            offer:
                false
        };
    }


    // ========================================
    // Leergewicht
    //
    // Wenn ein echter LKW vorhanden ist,
    // verwenden wir dessen Leergewicht.
    //
    // Sonst Basiswert 15 t.
    // ========================================

    const emptyWeightKg =

        this.truck
            ?.capacity
            ?.emptyWeightKg

        ??

        this.truck
            ?.definition
            ?.emptyWeightKg

        ??

        15000;


    return service.evaluateTransport({

        pallets:
            this.cargo.pallets,

        cargoWeightKg:
            this.cargo.weightKg,

        gigaEmptyWeightKg:
            emptyWeightKg,

        heavyEmptyWeightKg:
            emptyWeightKg

    }, currentDate);
}


// ========================================
// Spezialtransport verfügbar?
// ========================================

hasSpecialTransportOption(
    currentDate = new Date()
) {

    const result =
        this.evaluateSpecialTransport(
            currentDate
        );


    return (
        result.specialTransport ===
        true
    );
}


// ========================================
// Giga verfügbar?
// ========================================

isGigaTransportAvailable(
    currentDate = new Date()
) {

    const result =
        this.evaluateSpecialTransport(
            currentDate
        );


    return (
        result.specialTransport === true &&
        result.service?.type ===
            "giga"
    );
}


// ========================================
// Schwerlast verfügbar?
// ========================================

isHeavyTransportAvailable(
    currentDate = new Date()
) {

    const result =
        this.evaluateSpecialTransport(
            currentDate
        );


    return (
        result.specialTransport === true &&
        result.service?.type ===
            "heavy"
    );
}


// ========================================
// Spezialtransport automatisch?
//
// Wenn Zeitpaket aktiv ist,
// muss der Spieler nicht erneut gefragt
// werden.
// ========================================

shouldAutoUseSpecialTransport(
    currentDate = new Date()
) {

    const result =
        this.evaluateSpecialTransport(
            currentDate
        );


    return (
        result.specialTransport === true &&
        result.automatic === true
    );
}


// ========================================
// Einzeltransport buchen
// ========================================

bookSpecialTransport(
    currentDate = new Date()
) {

    const evaluation =
        this.evaluateSpecialTransport(
            currentDate
        );


    if (
        !evaluation.specialTransport ||
        !evaluation.service
    ) {

        return {

            success:
                false,

            reason:
                "Für diesen Auftrag ist kein Spezialtransport erforderlich"
        };
    }


    // ========================================
    // Zeitpaket bereits aktiv
    // ========================================

    if (
        evaluation.automatic
    ) {

        return {

            success:
                true,

            automatic:
                true,

            service:
                evaluation.service
        };
    }


    // ========================================
    // Kein aktives Paket:
    // Einzeltransport buchen
    // ========================================

    const service =
        this.company
            ?.gigaTransportService;


    if (!service) {

        return {

            success:
                false,

            reason:
                "Kein Giga-Transportservice vorhanden"
        };
    }


    const booking =
        service.bookSingleTransport(
            evaluation.service.type
        );


    if (!booking.success) {

        return booking;
    }


    return {

        success:
            true,

        automatic:
            false,

        service:
            evaluation.service,

        booking
    };
}
    getInfo() {

        return {

            id:
                this.id,

            cargoType:
                this.cargoType,

            cargoName:
                this.cargoDefinition.name,

            amount:
                this.amount,

            unit:
                this.cargoDefinition.unit,

            weightKg:
                this.cargo.weightKg,

            volumeM3:
                this.cargo.volumeM3,

            pallets:
                this.cargo.pallets,

            distanceKm:
                this.distanceKm,

            requiredTrips:
                this.requiredTrips,

            loadedKm:
                this.getLoadedKm(),

            emptyKm:
                this.getEmptyKm(),

            totalDrivingKm:
                this.getTotalDrivingKm(),

            transportCosts:
                this.costs.total,

            transportCostPerUnit:
                this.getTransportCostPerUnit(),

            status:
                this.status
        };
    }
}