// ============================================
// GigaTransportService.js
// WorldProject
//
// Premium-/Coin-Transportservice
//
// Giga-LKW:
// - bis 54 Europaletten
// - weiterhin max. 40 t Gesamtgewicht
//
// Schwerlast:
// - bis 60 t Gesamtgewicht
// - Sondergenehmigung inklusive
//
// Service:
// - Einzeltransport
// - 7 Tage
// - 4 Wochen
// - 3 Monate
// - 6 Monate
// - 12 Monate
// ============================================


export class GigaTransportService {

    constructor(company) {

        this.company =
            company;


        // ========================================
        // Aktive Servicepakete
        // ========================================

        this.activePackages = {

            giga:
                null,

            heavy:
                null
        };


        // ========================================
        // Einzeltransport
        // ========================================

        this.singleTransportCoinPrice =
            1;


        // ========================================
        // Giga-LKW
        // ========================================

        this.gigaTruck = {

            id:
                "gigaTruck",

            name:
                "Giga-LKW",

            maxGrossWeightKg:
                40000,

            maxPallets:
                54
        };


        // ========================================
        // Schwerlast-LKW
        //
        // Sondergenehmigung ist im Service
        // bereits enthalten.
        // ========================================

        this.heavyTruck = {

            id:
                "heavyTruck60",

            name:
                "60-t-Schwerlasttransport",

            maxGrossWeightKg:
                60000,

            specialPermitIncluded:
                true
        };


        // ========================================
        // Verfügbare Laufzeiten
        //
        // Coinpreise werden später anhand
        // unserer gesamten Coin-Ökonomie
        // festgelegt.
        // ========================================

        this.packageDurations = {

            week: {

                id:
                    "week",

                name:
                    "7 Tage",

                days:
                    7,

                coinPrice:
                    null
            },


            fourWeeks: {

                id:
                    "fourWeeks",

                name:
                    "4 Wochen",

                days:
                    28,

                coinPrice:
                    null
            },


            threeMonths: {

                id:
                    "threeMonths",

                name:
                    "3 Monate",

                days:
                    90,

                coinPrice:
                    null
            },


            sixMonths: {

                id:
                    "sixMonths",

                name:
                    "6 Monate",

                days:
                    180,

                coinPrice:
                    null
            },


            twelveMonths: {

                id:
                    "twelveMonths",

                name:
                    "12 Monate",

                days:
                    365,

                coinPrice:
                    null
            }
        };
    }


    // ========================================
    // Coinbestand
    // ========================================

    getCoins() {

        return (
            this.company?.coins ??
            0
        );
    }


    // ========================================
    // Coins vorhanden?
    // ========================================

    hasCoins(
        amount
    ) {

        return (
            this.getCoins() >=
            amount
        );
    }


    // ========================================
    // Coins abbuchen
    // ========================================

    spendCoins(
        amount
    ) {

        if (
            typeof amount !==
            "number" ||
            amount <= 0
        ) {

            return false;
        }


        if (
            !this.hasCoins(
                amount
            )
        ) {

            return false;
        }


        this.company.coins -=
            amount;


        return true;
    }


    // ========================================
    // Ist ein Paket aktiv?
    // ========================================

    isPackageActive(
        serviceType,
        currentDate = new Date()
    ) {

        const activePackage =
            this.activePackages[
                serviceType
            ];


        if (
            !activePackage ||
            !activePackage.expiresAt
        ) {

            return false;
        }


        return (
            new Date(
                activePackage.expiresAt
            ).getTime() >
            new Date(
                currentDate
            ).getTime()
        );
    }


    // ========================================
    // Paket aktivieren
    // ========================================

    activatePackage(
        serviceType,
        durationId,
        currentDate = new Date()
    ) {

        if (
            serviceType !== "giga" &&
            serviceType !== "heavy"
        ) {

            return {

                success:
                    false,

                reason:
                    "Unbekannter Transportservice"
            };
        }


        const packageDefinition =
            this.packageDurations[
                durationId
            ];


        if (!packageDefinition) {

            return {

                success:
                    false,

                reason:
                    "Unbekannte Laufzeit"
            };
        }


        // ========================================
        // Preise sind momentan absichtlich
        // noch nicht festgelegt.
        // ========================================

        if (
            typeof packageDefinition
                .coinPrice !==
            "number"
        ) {

            return {

                success:
                    false,

                reason:
                    "Coinpreis für dieses Paket ist noch nicht festgelegt"
            };
        }


        if (
            !this.spendCoins(
                packageDefinition.coinPrice
            )
        ) {

            return {

                success:
                    false,

                reason:
                    "Nicht genügend Coins"
            };
        }


        const startsAt =
            new Date(
                currentDate
            );


        const expiresAt =
            new Date(
                startsAt
            );


        expiresAt.setDate(

            expiresAt.getDate() +
            packageDefinition.days
        );


        this.activePackages[
            serviceType
        ] = {

            serviceType,

            durationId,

            startsAt,

            expiresAt,

            coinPrice:
                packageDefinition.coinPrice
        };


        return {

            success:
                true,

            serviceType,

            startsAt,

            expiresAt
        };
    }


    // ========================================
    // Giga grundsätzlich sinnvoll?
    //
    // Normaler Sattelzug:
    // max. 33 Europaletten
    //
    // Giga:
    // max. 54 Europaletten
    //
    // WICHTIG:
    // Gewicht muss trotzdem legal passen.
    // ========================================

    shouldOfferGiga({

        pallets = 0,

        cargoWeightKg = 0,

        gigaEmptyWeightKg = 15000

    } = {}) {

        // 33 oder weniger:
        // normaler LKW reicht.

        if (
            pallets <= 33
        ) {

            return false;
        }


        // Mehr als 54:
        // Eine einzelne Giga-Fahrt reicht
        // ebenfalls nicht.

        if (
            pallets > 54
        ) {

            return false;
        }


        const grossWeightKg =

            gigaEmptyWeightKg +
            cargoWeightKg;


        // Auch der Giga bleibt ein
        // 40-t-Fahrzeug.

        if (
            grossWeightKg >
            this.gigaTruck
                .maxGrossWeightKg
        ) {

            return false;
        }


        return true;
    }


    // ========================================
    // Schwerlast sinnvoll?
    //
    // Normal:
    // max. 40 t Gesamtgewicht
    //
    // Schwerlast:
    // max. 60 t Gesamtgewicht
    // Sondergenehmigung inklusive.
    // ========================================

    shouldOfferHeavy({

        cargoWeightKg = 0,

        heavyEmptyWeightKg = 15000

    } = {}) {

        const grossWeightKg =

            heavyEmptyWeightKg +
            cargoWeightKg;


        // Normaler 40-t-LKW reicht.

        if (
            grossWeightKg <= 40000
        ) {

            return false;
        }


        // Auch der Schwerlasttransport
        // hat seine Grenze.

        if (
            grossWeightKg >
            this.heavyTruck
                .maxGrossWeightKg
        ) {

            return false;
        }


        return true;
    }


    // ========================================
    // Passenden Spezialservice bestimmen
    // ========================================

    getRecommendedService({

        pallets = 0,

        cargoWeightKg = 0,

        gigaEmptyWeightKg = 15000,

        heavyEmptyWeightKg = 15000

    } = {}) {

        // ========================================
        // Erst Gewicht prüfen.
        //
        // Bei schwerer Ladung bringt die größere
        // Giga-Ladefläche nichts.
        // ========================================

        if (
            this.shouldOfferHeavy({

                cargoWeightKg,

                heavyEmptyWeightKg
            })
        ) {

            return {

                type:
                    "heavy",

                name:
                    this.heavyTruck.name,

                reason:
                    "Normaler 40-t-LKW überschreitet das zulässige Gesamtgewicht",

                specialPermitIncluded:
                    true
            };
        }


        // ========================================
        // Danach Paletten prüfen
        // ========================================

        if (
            this.shouldOfferGiga({

                pallets,

                cargoWeightKg,

                gigaEmptyWeightKg
            })
        ) {

            return {

                type:
                    "giga",

                name:
                    this.gigaTruck.name,

                reason:
                    "Mehr als 33 Europaletten können in einer Fahrt transportiert werden",

                maxPallets:
                    54
            };
        }


        return null;
    }


    // ========================================
    // Muss automatisch verwendet werden?
    //
    // Bei aktivem Zeitpaket:
    // Keine erneute Nachfrage.
    // ========================================

    shouldAutoUse(
        serviceType,
        currentDate = new Date()
    ) {

        return this.isPackageActive(

            serviceType,

            currentDate
        );
    }


    // ========================================
    // Einzeltransport buchen
    // ========================================

    bookSingleTransport(
        serviceType
    ) {

        if (
            serviceType !== "giga" &&
            serviceType !== "heavy"
        ) {

            return {

                success:
                    false,

                reason:
                    "Unbekannter Transportservice"
            };
        }


        if (
            !this.spendCoins(
                this.singleTransportCoinPrice
            )
        ) {

            return {

                success:
                    false,

                reason:
                    "Nicht genügend Coins"
            };
        }


        return {

            success:
                true,

            serviceType,

            coinPrice:
                this.singleTransportCoinPrice,

            singleTransport:
                true
        };
    }


    // ========================================
    // Transport prüfen
    //
    // Das ist später die zentrale Schnittstelle
    // für unser Transportsystem.
    // ========================================

    evaluateTransport(
        transportData,
        currentDate = new Date()
    ) {

        const recommendation =
            this.getRecommendedService(
                transportData
            );


        if (!recommendation) {

            return {

                specialTransport:
                    false,

                automatic:
                    false,

                offer:
                    false
            };
        }


        const automatic =
            this.shouldAutoUse(

                recommendation.type,

                currentDate
            );


        // ========================================
        // Zeitpaket aktiv:
        // automatisch verwenden.
        // ========================================

        if (automatic) {

            return {

                specialTransport:
                    true,

                automatic:
                    true,

                offer:
                    false,

                service:
                    recommendation
            };
        }


        // ========================================
        // Kein Paket:
        // Einzeltransport für Coins anbieten.
        // ========================================

        return {

            specialTransport:
                true,

            automatic:
                false,

            offer:
                true,

            singleTransportCoinPrice:
                this.singleTransportCoinPrice,

            service:
                recommendation
        };
    }

// ========================================
// Spezialtransport bestätigen
//
// WICHTIG:
// Coins werden ERST HIER abgebucht,
// also nachdem der Spieler den Transport
// ausdrücklich bestätigt hat.
//
// Bei aktivem Zeitpaket:
// - keine Coinabbuchung
// - Transport sofort freigeben
//
// Bei zu wenig Coins:
// - keine Abbuchung
// - Coin-Kaufangebot zurückgeben
// - kleinstes Kaufpaket: 50 Coins
// ========================================

confirmSpecialTransport({

    serviceType,

    numberOfTransports = 1,

    currentDate = new Date()

} = {}) {


    // ========================================
    // Transportart prüfen
    // ========================================

    if (
        serviceType !== "giga" &&
        serviceType !== "heavy"
    ) {

        return {

            success:
                false,

            confirmed:
                false,

            reason:
                "unknown_service",

            message:
                "Unbekannter Transportservice"
        };
    }


    // ========================================
    // Anzahl prüfen
    // ========================================

    if (
        !Number.isInteger(
            numberOfTransports
        ) ||
        numberOfTransports <= 0
    ) {

        return {

            success:
                false,

            confirmed:
                false,

            reason:
                "invalid_transport_count",

            message:
                "Ungültige Anzahl an Spezialtransporten"
        };
    }


    // ========================================
    // Aktives Zeitpaket prüfen
    //
    // Bei aktivem Paket entstehen für die
    // einzelnen Fahrten keine weiteren
    // Coin-Kosten.
    // ========================================

    if (
        this.isPackageActive(
            serviceType,
            currentDate
        )
    ) {

        return {

            success:
                true,

            confirmed:
                true,

            serviceType,

            numberOfTransports,

            packageActive:
                true,

            automatic:
                true,

            coinsRequired:
                0,

            coinsSpent:
                0,

            remainingCoins:
                this.getCoins(),

            coinOffer:
                null
        };
    }


    // ========================================
    // Coinbedarf berechnen
    //
    // 1 Giga = 1 Coin
    // 2 Giga = 2 Coins
    // usw.
    // ========================================

    const coinsRequired =

        numberOfTransports *
        this.singleTransportCoinPrice;


    const availableCoins =
        this.getCoins();


    // ========================================
    // Nicht genügend Coins
    //
    // WICHTIG:
    // Hier wird NICHTS abgebucht.
    //
    // Stattdessen bekommt die Oberfläche
    // alle Daten für ein Coin-Angebot.
    // ========================================

    if (
        availableCoins <
        coinsRequired
    ) {

        const missingCoins =

            coinsRequired -
            availableCoins;


        // ====================================
        // Kleinstes kaufbares Coinpaket
        // ====================================

        const minimumCoinPackage =
            50;


        // ====================================
        // Später können hier weitere Pakete
        // ergänzt werden.
        //
        // Echtgeldpreise legen wir bewusst
        // noch NICHT fest.
        // ====================================

        const coinPackages = [

            {
                coins:
                    50,

                price:
                    null
            },

            {
                coins:
                    100,

                price:
                    null
            },

            {
                coins:
                    250,

                price:
                    null
            },

            {
                coins:
                    500,

                price:
                    null
            }
        ];


        return {

            success:
                false,

            confirmed:
                false,

            reason:
                "insufficient_coins",

            message:
                "Nicht genügend Coins",


            serviceType,

            numberOfTransports,


            coinsRequired,

            availableCoins,

            missingCoins,


            // =================================
            // Coinshop anzeigen
            // =================================

            showCoinOffer:
                true,

            minimumCoinPackage,

            recommendedCoinPackage:
                minimumCoinPackage,

            coinPackages,


            // =================================
            // Spieler kann weiterhin
            // normalen Transport wählen
            // =================================

            normalTransportAvailable:
                true
        };
    }


    // ========================================
    // Genug Coins vorhanden
    //
    // JETZT wurde bestätigt.
    // Deshalb dürfen Coins abgebucht werden.
    // ========================================

    const paymentSuccessful =
        this.spendCoins(
            coinsRequired
        );


    // ========================================
    // Zusätzliche Sicherheit
    // ========================================

    if (
        !paymentSuccessful
    ) {

        return {

            success:
                false,

            confirmed:
                false,

            reason:
                "coin_payment_failed",

            message:
                "Coinabbuchung fehlgeschlagen",

            serviceType,

            numberOfTransports,

            coinsRequired,

            availableCoins:
                this.getCoins()
        };
    }


    // ========================================
    // Erfolgreich bestätigt
    // ========================================

    return {

        success:
            true,

        confirmed:
            true,

        serviceType,

        numberOfTransports,

        packageActive:
            false,

        automatic:
            false,

        coinsRequired,

        coinsSpent:
            coinsRequired,

        remainingCoins:
            this.getCoins(),

        coinOffer:
            null
    };
}
    // ========================================
    // Übersicht
    // ========================================

    getInfo(
        currentDate = new Date()
    ) {

        return {

            singleTransportCoinPrice:
                this.singleTransportCoinPrice,

            giga: {

                maxPallets:
                    this.gigaTruck
                        .maxPallets,

                maxGrossWeightKg:
                    this.gigaTruck
                        .maxGrossWeightKg,

                packageActive:
                    this.isPackageActive(
                        "giga",
                        currentDate
                    ),

                package:
                    this.activePackages
                        .giga
            },

            heavy: {

                maxGrossWeightKg:
                    this.heavyTruck
                        .maxGrossWeightKg,

                specialPermitIncluded:
                    true,

                packageActive:
                    this.isPackageActive(
                        "heavy",
                        currentDate
                    ),

                package:
                    this.activePackages
                        .heavy
            }
        };
    }
}