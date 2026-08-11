// ============================================
// TransportCostCalculator.js
// WorldProject
//
// Berechnet die tatsächlichen Transportkosten.
//
// Berücksichtigt:
// - Kraftstoff
// - Fahrer
// - Maut
// - Wartung / Verschleiß
// - Fahrzeugkosten
// - Be- und Entladung
// - mehrere Fahrten
// - Leer- und Lastkilometer
// ============================================

export class TransportCostCalculator {

    constructor(settings = {}) {

        // ========================================
        // Wirtschaftliche Einstellungen
        //
        // Diese Werte sind nur Startwerte.
        // Später kommen sie dynamisch aus:
        //
        // - Land
        // - Markt
        // - Kraftstoffpreis
        // - Mitarbeitervertrag
        // - Fahrzeug
        // - Mautsystem
        // ========================================

        this.settings = {

            // ------------------------------------
            // Dieselpreis je Liter
            // ------------------------------------

            dieselPricePerLiter:
                settings.dieselPricePerLiter ??
                1.65,


            // ------------------------------------
            // Durchschnittlicher Verbrauch
            // eines Standard-LKW
            //
            // Liter / 100 km
            //
            // Wird später vom konkreten
            // Fahrzeug überschrieben.
            // ------------------------------------

            defaultConsumptionPer100Km:
                settings.defaultConsumptionPer100Km ??
                30,


            // ------------------------------------
            // Fahrer-Gesamtkosten pro Stunde
            //
            // NICHT nur Nettolohn.
            //
            // Später:
            // Bruttolohn
            // + Arbeitgeberkosten
            // + Zuschläge
            // ------------------------------------

            driverCostPerHour:
                settings.driverCostPerHour ??
                28,


            // ------------------------------------
            // Durchschnittsgeschwindigkeit
            //
            // Nur Basiswert für die Planung.
            //
            // Stau usw. kommt später.
            // ------------------------------------

            averageSpeedKmH:
                settings.averageSpeedKmH ??
                65,


            // ------------------------------------
            // Maut je mautpflichtigem Kilometer
            //
            // Wird später nach:
            // Land
            // Gewicht
            // Achsen
            // Emissionsklasse
            // berechnet.
            // ------------------------------------

            tollPerKm:
                settings.tollPerKm ??
                0.30,


            // ------------------------------------
            // Wartung / Verschleiß pro km
            // ------------------------------------

            maintenancePerKm:
                settings.maintenancePerKm ??
                0.18,


            // ------------------------------------
            // Fahrzeugkosten pro km
            //
            // Finanzierung / Abschreibung /
            // Versicherung usw.
            // ------------------------------------

            vehicleCostPerKm:
                settings.vehicleCostPerKm ??
                0.25,


            // ------------------------------------
            // Be- und Entladezeit je Fahrt
            // ------------------------------------

            loadingHoursPerTrip:
                settings.loadingHoursPerTrip ??
                0.75,

            unloadingHoursPerTrip:
                settings.unloadingHoursPerTrip ??
                0.75
        };
    }


    // ========================================
    // Verbrauch des konkreten LKW bestimmen
    // ========================================

    getTruckConsumption(
        truck
    ) {

        if (
            truck &&
            truck.definition &&
            typeof truck.definition
                .consumptionPer100Km ===
                "number"
        ) {

            return (
                truck.definition
                    .consumptionPer100Km
            );
        }


        return (
            this.settings
                .defaultConsumptionPer100Km
        );
    }


    // ========================================
    // Kraftstoffmenge berechnen
    // ========================================

    calculateFuelLiters(
        totalKm,
        truck
    ) {

        const consumption =
            this.getTruckConsumption(
                truck
            );


        return (
            totalKm /
            100 *
            consumption
        );
    }


    // ========================================
    // Kraftstoffkosten
    // ========================================

    calculateFuelCost(
        totalKm,
        truck
    ) {

        const liters =
            this.calculateFuelLiters(
                totalKm,
                truck
            );


        return (
            liters *
            this.settings
                .dieselPricePerLiter
        );
    }


    // ========================================
    // Reine Fahrzeit
    // ========================================

    calculateDrivingHours(
        totalKm
    ) {

        if (
            this.settings
                .averageSpeedKmH <= 0
        ) {

            return 0;
        }


        return (
            totalKm /
            this.settings
                .averageSpeedKmH
        );
    }


    // ========================================
    // Ladezeit
    // ========================================

    calculateLoadingHours(
        trips
    ) {

        return (
            trips *
            this.settings
                .loadingHoursPerTrip
        );
    }


    // ========================================
    // Entladezeit
    // ========================================

    calculateUnloadingHours(
        trips
    ) {

        return (
            trips *
            this.settings
                .unloadingHoursPerTrip
        );
    }


    // ========================================
    // Gesamte Arbeitszeit Fahrer
    // ========================================

    calculateDriverHours(
        totalKm,
        trips
    ) {

        return (

            this.calculateDrivingHours(
                totalKm
            )

            +

            this.calculateLoadingHours(
                trips
            )

            +

            this.calculateUnloadingHours(
                trips
            )
        );
    }


    // ========================================
    // Fahrerkosten
    // ========================================

    calculateDriverCost(
        totalKm,
        trips
    ) {

        const hours =
            this.calculateDriverHours(
                totalKm,
                trips
            );


        return (
            hours *
            this.settings
                .driverCostPerHour
        );
    }


    // ========================================
    // Mautkosten
    // ========================================

    calculateTollCost(
        tollKm
    ) {

        return (
            tollKm *
            this.settings
                .tollPerKm
        );
    }


    // ========================================
    // Wartung / Verschleiß
    // ========================================

    calculateMaintenanceCost(
        totalKm
    ) {

        return (
            totalKm *
            this.settings
                .maintenancePerKm
        );
    }


    // ========================================
    // Fahrzeugkosten
    // ========================================

    calculateVehicleCost(
        totalKm
    ) {

        return (
            totalKm *
            this.settings
                .vehicleCostPerKm
        );
    }


    // ========================================
    // Gesamten Transportauftrag kalkulieren
    // ========================================

    calculate(
        transportOrder,
        options = {}
    ) {

        if (
            !transportOrder
        ) {

            return null;
        }


        const trips =
            transportOrder.requiredTrips ??
            0;


        const totalKm =
            transportOrder
                .getTotalDrivingKm();


        // ------------------------------------
        // Mautkilometer
        //
        // Standardmäßig nehmen wir zunächst
        // alle Kilometer.
        //
        // Später berechnet das Routensystem
        // exakt, welche Straßen mautpflichtig
        // sind.
        // ------------------------------------

        const tollKm =
            options.tollKm ??
            totalKm;


        // ------------------------------------
        // Kraftstoff
        // ------------------------------------

        const fuelLiters =
            this.calculateFuelLiters(
                totalKm,
                transportOrder.truck
            );


        const fuelCost =
            fuelLiters *
            this.settings
                .dieselPricePerLiter;


        // ------------------------------------
        // Fahrer
        // ------------------------------------

        const drivingHours =
            this.calculateDrivingHours(
                totalKm
            );


        const loadingHours =
            this.calculateLoadingHours(
                trips
            );


        const unloadingHours =
            this.calculateUnloadingHours(
                trips
            );


        const driverHours =

            drivingHours +

            loadingHours +

            unloadingHours;


        const driverCost =
            driverHours *
            this.settings
                .driverCostPerHour;


        // ------------------------------------
        // Maut
        // ------------------------------------

        const tollCost =
            this.calculateTollCost(
                tollKm
            );


        // ------------------------------------
        // Wartung
        // ------------------------------------

        const maintenanceCost =
            this.calculateMaintenanceCost(
                totalKm
            );


        // ------------------------------------
        // Fahrzeugkosten
        // ------------------------------------

        const vehicleCost =
            this.calculateVehicleCost(
                totalKm
            );


        // ------------------------------------
        // Be-/Entladekosten
        //
        // Externe Gebühren können später
        // vom Lieferanten / Empfänger kommen.
        // ------------------------------------

        const loadingCost =
            options.loadingCost ??
            0;


        const unloadingCost =
            options.unloadingCost ??
            0;


        const otherCost =
            options.otherCost ??
            0;


        // ------------------------------------
        // Kosten im Transportauftrag speichern
        // ------------------------------------

        transportOrder
            .calculateTransportCosts({

                fuelCost,

                driverCost,

                tollCost,

                maintenanceCost,

                vehicleCost,

                loadingCost,

                unloadingCost,

                otherCost
            });


        // ------------------------------------
        // Geschätzte Zeit speichern
        // ------------------------------------

        transportOrder.time
            .estimatedHours =
                driverHours;


        // ------------------------------------
        // Ergebnis
        // ------------------------------------

        return {

            trips,

            loadedKm:
                transportOrder
                    .getLoadedKm(),

            emptyKm:
                transportOrder
                    .getEmptyKm(),

            totalKm,

            tollKm,

            fuelLiters,

            fuelCost,

            drivingHours,

            loadingHours,

            unloadingHours,

            driverHours,

            driverCost,

            tollCost,

            maintenanceCost,

            vehicleCost,

            loadingCost,

            unloadingCost,

            otherCost,

            totalCost:
                transportOrder
                    .costs.total,

            costPerUnit:
                transportOrder
                    .getTransportCostPerUnit()
        };
    }
    // ========================================
    // Kosten einer einzelnen Fahrzeugfahrt
    //
    // Für Vergleichsrechnungen:
    //
    // - normaler Sattelzug
    // - Giga
    //
    // distanceKm =
    // einfache Entfernung zum Lieferanten.
    //
    // Für die Fahrzeugkosten wird Hin- und
    // Rückfahrt gerechnet.
    // ========================================

    calculateVehicleTripCost({

        distanceKm = 0,

        consumptionPer100Km =
            this.settings
                .defaultConsumptionPer100Km,

        tollPerKm =
            this.settings
                .tollPerKm,

        driverCostPerHour =
            this.settings
                .driverCostPerHour,

        maintenancePerKm =
            this.settings
                .maintenancePerKm,

        vehicleCostPerKm =
            this.settings
                .vehicleCostPerKm,

        loadingHours =
            this.settings
                .loadingHoursPerTrip,

        unloadingHours =
            this.settings
                .unloadingHoursPerTrip

    } = {}) {

        // ====================================
        // Einfache Entfernung absichern
        // ====================================

        const oneWayKm =
            Math.max(
                Number(
                    distanceKm
                ) || 0,
                0
            );


        // ====================================
        // Hin- und Rückfahrt
        // ====================================

        const totalKm =
            oneWayKm *
            2;


        // ====================================
        // Kraftstoff
        // ====================================

        const fuelLiters =

            totalKm /
            100 *

            Math.max(
                Number(
                    consumptionPer100Km
                ) || 0,
                0
            );


        const fuelCost =

            fuelLiters *

            this.settings
                .dieselPricePerLiter;


        // ====================================
        // Fahrzeit
        // ====================================

        const drivingHours =
            this.settings
                .averageSpeedKmH > 0

                ? (
                    totalKm /
                    this.settings
                        .averageSpeedKmH
                )

                : 0;


        // ====================================
        // Fahrerzeit
        // ====================================

        const driverHours =

            drivingHours

            +

            Math.max(
                Number(
                    loadingHours
                ) || 0,
                0
            )

            +

            Math.max(
                Number(
                    unloadingHours
                ) || 0,
                0
            );


        // ====================================
        // Fahrerkosten
        // ====================================

        const driverCost =

            driverHours *

            Math.max(
                Number(
                    driverCostPerHour
                ) || 0,
                0
            );


        // ====================================
        // Maut
        // ====================================

        const tollCost =

            totalKm *

            Math.max(
                Number(
                    tollPerKm
                ) || 0,
                0
            );


        // ====================================
        // Wartung / Verschleiß
        // ====================================

        const maintenanceCost =

            totalKm *

            Math.max(
                Number(
                    maintenancePerKm
                ) || 0,
                0
            );


        // ====================================
        // Fahrzeugkosten
        // ====================================

        const vehicleCost =

            totalKm *

            Math.max(
                Number(
                    vehicleCostPerKm
                ) || 0,
                0
            );


        // ====================================
        // Gesamtkosten
        // ====================================

        const totalCost =

            fuelCost

            +

            driverCost

            +

            tollCost

            +

            maintenanceCost

            +

            vehicleCost;


        // ====================================
        // Ergebnis
        // ====================================

        return {

            oneWayKm,

            totalKm,

            consumptionPer100Km,

            fuelLiters,

            fuelCost,

            drivingHours,

            driverHours,

            driverCost,

            tollCost,

            maintenanceCost,

            vehicleCost,

            totalCost
        };
    }


    // ========================================
    // NORMAL gegen GIGA vergleichen
    //
    // Unsere Spielregel:
    //
    // NORMAL:
    // Standardverbrauch
    //
    // GIGA:
    // 20 % höherer Kraftstoffverbrauch
    //
    // KEINE zusätzlichen Kosten für:
    //
    // - Fahrer
    // - Maut
    //
    // nur weil es ein Giga ist.
    //
    // Beispiel:
    //
    // 80 Paletten:
    //
    // Normal:
    // 3 Sattelzüge
    //
    // Giga:
    // 1 Giga
    // + 1 Sattelzug
    //
    // Coinbedarf:
    // 1
    // ========================================

    compareNormalAndGiga({

        distanceKm = 0,

        normalTrips = 0,

        gigaTrips = 0,

        optimizedNormalTrips = 0,

        coinsRequired = 0,

        normalConsumptionPer100Km =
            this.settings
                .defaultConsumptionPer100Km

    } = {}) {

        // ====================================
        // Werte absichern
        // ====================================

        const safeNormalTrips =
            Math.max(
                Math.floor(
                    Number(
                        normalTrips
                    ) || 0
                ),
                0
            );


        const safeGigaTrips =
            Math.max(
                Math.floor(
                    Number(
                        gigaTrips
                    ) || 0
                ),
                0
            );


        const safeOptimizedNormalTrips =
            Math.max(
                Math.floor(
                    Number(
                        optimizedNormalTrips
                    ) || 0
                ),
                0
            );


        const safeCoinsRequired =
            Math.max(
                Math.floor(
                    Number(
                        coinsRequired
                    ) || 0
                ),
                0
            );


        const normalConsumption =
            Math.max(
                Number(
                    normalConsumptionPer100Km
                ) || 0,
                0
            );


        // ====================================
        // Giga-Verbrauch
        //
        // FESTE SPIELREGEL:
        // +20 % gegenüber Sattelzug.
        // ====================================

        const gigaConsumption =

            normalConsumption *
            1.20;


        // ====================================
        // Eine normale Fahrt
        // ====================================

        const normalTrip =
            this.calculateVehicleTripCost({

                distanceKm,

                consumptionPer100Km:
                    normalConsumption
            });


        // ====================================
        // Eine Giga-Fahrt
        //
        // Fahrer / Maut / Verschleiß /
        // Fahrzeugwerte bleiben momentan
        // identisch zum normalen Sattelzug.
        //
        // Nur Dieselverbrauch +20 %.
        // ====================================

        const gigaTrip =
            this.calculateVehicleTripCost({

                distanceKm,

                consumptionPer100Km:
                    gigaConsumption
            });


        // ====================================
        // Kosten ohne Giga
        // ====================================

        const normalTotalCost =

            normalTrip.totalCost *

            safeNormalTrips;


        // ====================================
        // Kosten mit Giga
        // ====================================

        const optimizedNormalCost =

            normalTrip.totalCost *

            safeOptimizedNormalTrips;


        const gigaTotalCost =

            gigaTrip.totalCost *

            safeGigaTrips;


        const optimizedTotalCost =

            optimizedNormalCost

            +

            gigaTotalCost;


        // ====================================
        // Ersparnis
        // ====================================

        const savings =

            normalTotalCost -

            optimizedTotalCost;


        const savingsPercent =

            normalTotalCost > 0

                ? (
                    savings /
                    normalTotalCost *
                    100
                )

                : 0;


        // ====================================
        // Eingesparte Fahrten
        // ====================================

        const optimizedTrips =

            safeGigaTrips +

            safeOptimizedNormalTrips;


        const savedTrips =

            Math.max(

                safeNormalTrips -
                optimizedTrips,

                0
            );


        // ====================================
        // Ergebnis
        // ====================================

        return {

            recommended:
                savings > 0 &&
                safeGigaTrips > 0,


            distanceKm,


            // =================================
            // Normal
            // =================================

            normal: {

                trips:
                    safeNormalTrips,

                consumptionPer100Km:
                    normalConsumption,

                costPerTrip:
                    normalTrip.totalCost,

                totalCost:
                    normalTotalCost,

                tripDetails:
                    normalTrip
            },


            // =================================
            // Optimiert
            // =================================

            optimized: {

                gigaTrips:
                    safeGigaTrips,

                normalTrips:
                    safeOptimizedNormalTrips,

                totalTrips:
                    optimizedTrips,

                gigaConsumptionPer100Km:
                    gigaConsumption,

                normalCost:
                    optimizedNormalCost,

                gigaCost:
                    gigaTotalCost,

                totalCost:
                    optimizedTotalCost,

                normalTripDetails:
                    normalTrip,

                gigaTripDetails:
                    gigaTrip
            },


            // =================================
            // Vorteil
            // =================================

            savedTrips,

            savings,

            savingsPercent,


            // =================================
            // Coin
            // =================================

            coinsRequired:
                safeCoinsRequired
        };
    }


    // ========================================
    // Geld formatieren
    // ========================================

    formatMoney(
        value
    ) {

        const number =
            Number(
                value
            );


        if (
            !Number.isFinite(
                number
            )
        ) {

            return "0,00";
        }


        return number.toLocaleString(
            "de-DE",
            {

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        );
    }
}