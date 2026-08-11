// ============================================
// TransportOptimization.js
// WorldProject
//
// Transportoptimierung für Palettenware.
//
// Normaler Sattelzug:
// - max. 33 Europaletten
// - max. 40.000 kg Gesamtgewicht
//
// Giga:
// - max. 54 Europaletten
// - ebenfalls max. 40.000 kg Gesamtgewicht
// - 20 % höherer Kraftstoffverbrauch
// - Fahrer und Maut unverändert
//
// Einzelbuchung:
// - 1 Coin je tatsächlich eingesetzter
//   Giga-Fahrt
// ============================================

export class TransportOptimization {

    constructor({

        normalPalletCapacity = 33,

        gigaPalletCapacity = 54,

        normalMaxGrossWeightKg = 40000,

        normalEmptyWeightKg = 15000,

        gigaMaxGrossWeightKg = 40000,

        gigaEmptyWeightKg = 15000,

        gigaFuelMultiplier = 1.20,

        coinPerGigaTrip = 1

    } = {}) {

        this.normalPalletCapacity =
            normalPalletCapacity;

        this.gigaPalletCapacity =
            gigaPalletCapacity;


        this.normalMaxGrossWeightKg =
            normalMaxGrossWeightKg;

        this.normalEmptyWeightKg =
            normalEmptyWeightKg;


        this.gigaMaxGrossWeightKg =
            gigaMaxGrossWeightKg;

        this.gigaEmptyWeightKg =
            gigaEmptyWeightKg;


        this.gigaFuelMultiplier =
            gigaFuelMultiplier;

        this.coinPerGigaTrip =
            coinPerGigaTrip;
    }


    // ========================================
    // Normale Nutzlast
    // ========================================

    getNormalPayloadKg() {

        return Math.max(

            this.normalMaxGrossWeightKg -
            this.normalEmptyWeightKg,

            0
        );
    }


    // ========================================
    // Giga-Nutzlast
    // ========================================

    getGigaPayloadKg() {

        return Math.max(

            this.gigaMaxGrossWeightKg -
            this.gigaEmptyWeightKg,

            0
        );
    }


    // ========================================
    // Gewicht einer Palette
    //
    // Für einen Auftrag einer Materialart.
    // ========================================

    calculateWeightPerPallet({

        pallets = 0,

        totalWeightKg = 0

    } = {}) {

        if (
            pallets <= 0 ||
            totalWeightKg <= 0
        ) {

            return 0;
        }


        return (
            totalWeightKg /
            pallets
        );
    }


    // ========================================
    // Wie viele Paletten passen tatsächlich
    // auf einen Fahrzeugtyp?
    //
    // Berücksichtigt:
    // - Stellplätze
    // - Nutzlast
    // ========================================

    calculateEffectivePalletCapacity({

        maxPallets,

        payloadKg,

        weightPerPalletKg

    }) {

        if (
            maxPallets <= 0 ||
            payloadKg <= 0
        ) {

            return 0;
        }


        // Kein Gewicht bekannt:
        // nur Palettenplätze verwenden.

        if (
            weightPerPalletKg <= 0
        ) {

            return maxPallets;
        }


        const palletsByWeight =
            Math.floor(

                payloadKg /
                weightPerPalletKg
            );


        return Math.max(

            Math.min(

                maxPallets,

                palletsByWeight
            ),

            0
        );
    }


    // ========================================
    // Effektive normale Kapazität
    // ========================================

    getEffectiveNormalCapacity(
        weightPerPalletKg
    ) {

        return this
            .calculateEffectivePalletCapacity({

                maxPallets:
                    this.normalPalletCapacity,

                payloadKg:
                    this.getNormalPayloadKg(),

                weightPerPalletKg
            });
    }


    // ========================================
    // Effektive Giga-Kapazität
    // ========================================

    getEffectiveGigaCapacity(
        weightPerPalletKg
    ) {

        return this
            .calculateEffectivePalletCapacity({

                maxPallets:
                    this.gigaPalletCapacity,

                payloadKg:
                    this.getGigaPayloadKg(),

                weightPerPalletKg
            });
    }


    // ========================================
    // Kosten normale Fahrt
    // ========================================

    calculateNormalTripCost({

        fuelCost = 0,

        driverCost = 0,

        tollCost = 0,

        maintenanceCost = 0,

        vehicleCost = 0,

        loadingCost = 0,

        unloadingCost = 0,

        otherCost = 0

    } = {}) {

        return (

            fuelCost +

            driverCost +

            tollCost +

            maintenanceCost +

            vehicleCost +

            loadingCost +

            unloadingCost +

            otherCost
        );
    }


    // ========================================
    // Kosten Giga-Fahrt
    //
    // NUR Kraftstoff +20 %.
    // ========================================

    calculateGigaTripCost({

        fuelCost = 0,

        driverCost = 0,

        tollCost = 0,

        maintenanceCost = 0,

        vehicleCost = 0,

        loadingCost = 0,

        unloadingCost = 0,

        otherCost = 0

    } = {}) {

        return (

            (
                fuelCost *
                this.gigaFuelMultiplier
            )

            +

            driverCost +

            tollCost +

            maintenanceCost +

            vehicleCost +

            loadingCost +

            unloadingCost +

            otherCost
        );
    }


    // ========================================
    // Normale Fahrten berechnen
    // ========================================

    calculateNormalTrips({

        pallets,

        effectiveNormalCapacity

    }) {

        if (
            pallets <= 0 ||
            effectiveNormalCapacity <= 0
        ) {

            return 0;
        }


        return Math.ceil(

            pallets /
            effectiveNormalCapacity
        );
    }


    // ========================================
    // Kombination berechnen
    // ========================================

    calculateCombination({

        pallets,

        gigaTrips,

        effectiveNormalCapacity,

        effectiveGigaCapacity,

        costs

    }) {

        const gigaCapacity =

            gigaTrips *
            effectiveGigaCapacity;


        const remainingPallets =

            Math.max(

                pallets -
                gigaCapacity,

                0
            );


        const normalTrips =

            remainingPallets > 0

                ? Math.ceil(

                    remainingPallets /
                    effectiveNormalCapacity
                )

                : 0;


        const totalTrips =

            gigaTrips +
            normalTrips;


        const normalTripCost =

            this.calculateNormalTripCost(
                costs
            );


        const gigaTripCost =

            this.calculateGigaTripCost(
                costs
            );


        const transportCost =

            (
                normalTrips *
                normalTripCost
            )

            +

            (
                gigaTrips *
                gigaTripCost
            );


        return {

            gigaTrips,

            normalTrips,

            totalTrips,

            remainingPallets,

            transportCost,

            coinsRequired:

                gigaTrips *
                this.coinPerGigaTrip
        };
    }


    // ========================================
    // Optimieren
    // ========================================

    optimize({

        pallets = 0,

        totalWeightKg = 0,

        costs = {}

    } = {}) {

        if (
            pallets <= 0
        ) {

            return {

                recommended:
                    false,

                reason:
                    "Keine Paletten vorhanden"
            };
        }


        // ========================================
        // Gewicht pro Palette
        // ========================================

        const weightPerPalletKg =

            this.calculateWeightPerPallet({

                pallets,

                totalWeightKg
            });


        // ========================================
        // Tatsächliche Kapazitäten
        // ========================================

        const effectiveNormalCapacity =

            this.getEffectiveNormalCapacity(
                weightPerPalletKg
            );


        const effectiveGigaCapacity =

            this.getEffectiveGigaCapacity(
                weightPerPalletKg
            );


        if (
            effectiveNormalCapacity <= 0
        ) {

            return {

                recommended:
                    false,

                reason:
                    "Ladung ist für einen normalen Sattelzug zu schwer",

                pallets,

                totalWeightKg,

                weightPerPalletKg,

                effectiveNormalCapacity,

                effectiveGigaCapacity
            };
        }


        // ========================================
        // WICHTIG:
        //
        // Wenn Giga wegen Gewicht nicht mehr
        // Paletten transportieren kann als der
        // normale Sattelzug, bringt er keinen
        // Kapazitätsvorteil.
        // ========================================

        if (
            effectiveGigaCapacity <=
            effectiveNormalCapacity
        ) {

            return {

                recommended:
                    false,

                reason:
                    "Giga bringt bei diesem Ladungsgewicht keinen Kapazitätsvorteil",

                pallets,

                totalWeightKg,

                weightPerPalletKg,

                effectiveNormalCapacity,

                effectiveGigaCapacity
            };
        }


        // ========================================
        // Vergleich: nur normale Sattelzüge
        // ========================================

        const normalTrips =

            this.calculateNormalTrips({

                pallets,

                effectiveNormalCapacity
            });


        const normalTripCost =

            this.calculateNormalTripCost(
                costs
            );


        const normalTotalCost =

            normalTrips *
            normalTripCost;


        // ========================================
        // Maximale theoretische Giga-Anzahl
        // ========================================

        const maxGigaTrips =

            Math.ceil(

                pallets /
                effectiveGigaCapacity
            );


        let best = {

            gigaTrips:
                0,

            normalTrips,

            totalTrips:
                normalTrips,

            transportCost:
                normalTotalCost,

            coinsRequired:
                0
        };


        // ========================================
        // Alle sinnvollen Kombinationen testen
        // ========================================

        for (
            let gigaTrips = 1;
            gigaTrips <= maxGigaTrips;
            gigaTrips++
        ) {

            const combination =

                this.calculateCombination({

                    pallets,

                    gigaTrips,

                    effectiveNormalCapacity,

                    effectiveGigaCapacity,

                    costs
                });


            // ====================================
            // Giga muss Fahrten einsparen
            // ====================================

            if (
                combination.totalTrips >=
                normalTrips
            ) {

                continue;
            }


            // ====================================
            // Und Geld sparen
            // ====================================

            if (
                combination.transportCost >=
                best.transportCost
            ) {

                continue;
            }


            best =
                combination;
        }


        // ========================================
        // Ergebnis
        // ========================================

        const savings =

            Math.max(

                normalTotalCost -
                best.transportCost,

                0
            );


        const savedTrips =

            Math.max(

                normalTrips -
                best.totalTrips,

                0
            );


        const recommended =

            best.gigaTrips > 0 &&
            savings > 0 &&
            savedTrips > 0;


        return {

            recommended,

            pallets,

            totalWeightKg,

            weightPerPalletKg,

            // Kapazitäten nach Gewicht
            effectiveNormalCapacity,

            effectiveGigaCapacity,

            // Nur normale Sattelzüge
            normalTrips,

            normalTotalCost,

            // Optimierte Variante
            gigaTrips:
                best.gigaTrips,

            optimizedNormalTrips:
                best.normalTrips,

            optimizedTotalTrips:
                best.totalTrips,

            optimizedTotalCost:
                best.transportCost,

            // Vorteil
            savings,

            savedTrips,

            coinsRequired:
                best.coinsRequired
        };
    }


    // ========================================
    // Spielertext erzeugen
    // ========================================

    createRecommendationText(
        result
    ) {

        if (
            !result ||
            result.recommended !==
            true
        ) {

            return (
                result?.reason ??
                "Für diesen Auftrag ist kein Giga-Transport sinnvoll."
            );
        }


        const savings =

            Number(
                result.savings
            ).toFixed(2);


        const trips =

            result.savedTrips === 1

                ? "1 Fahrt"

                : `${result.savedTrips} Fahrten`;


        const coins =

            result.coinsRequired === 1

                ? "1 Coin"

                : `${result.coinsRequired} Coins`;


        return (

            `Giga-Transport empfohlen: ` +

            `${result.gigaTrips} Giga, ` +

            `${result.optimizedNormalTrips} normale Sattelzüge. ` +

            `${trips} weniger. ` +

            `Du sparst ${savings} € Transportkosten. ` +

            `Kosten: ${coins}.`
        );
    }
}