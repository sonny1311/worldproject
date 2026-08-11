// ============================================
// TruckCapacity.js
// WorldProject
// Kapazitätsberechnung für LKW
//
// Berücksichtigt:
// - zulässiges Gesamtgewicht
// - Fahrzeug-Leergewicht
// - tatsächliche Nutzlast
// - Ladevolumen
// - Palettenplätze
// ============================================

export class TruckCapacity {

    constructor({

        maxGrossWeightKg,

        emptyWeightKg,

        maxVolumeM3 = null,

        maxPallets = null

    }) {

        // ----------------------------------------
        // Zulässiges Gesamtgewicht
        // ----------------------------------------

        this.maxGrossWeightKg =
            maxGrossWeightKg;


        // ----------------------------------------
        // Leergewicht
        //
        // Fahrzeug + Aufbau bzw.
        // Zugmaschine + Auflieger
        // ----------------------------------------

        this.emptyWeightKg =
            emptyWeightKg;


        // ----------------------------------------
        // Maximales Ladevolumen
        // ----------------------------------------

        this.maxVolumeM3 =
            maxVolumeM3;


        // ----------------------------------------
        // Maximale Palettenplätze
        //
        // Standard-Sattelauflieger:
        // typischerweise 33 Europaletten
        // ----------------------------------------

        this.maxPallets =
            maxPallets;
    }


    // ========================================
    // Maximale Nutzlast in kg
    // ========================================

    getMaxPayloadKg() {

        return Math.max(

            this.maxGrossWeightKg -
            this.emptyWeightKg,

            0
        );
    }


    // ========================================
    // Maximale Nutzlast in Tonnen
    // ========================================

    getMaxPayloadTons() {

        return (
            this.getMaxPayloadKg() /
            1000
        );
    }


    // ========================================
    // Tatsächliches Gesamtgewicht
    // ========================================

    getGrossWeightKg(
        cargoWeightKg
    ) {

        return (
            this.emptyWeightKg +
            cargoWeightKg
        );
    }


    // ========================================
    // Gewicht prüfen
    // ========================================

    canCarryWeight(
        cargoWeightKg
    ) {

        if (
            cargoWeightKg < 0
        ) {

            return false;
        }


        return (
            this.getGrossWeightKg(
                cargoWeightKg
            )
            <=
            this.maxGrossWeightKg
        );
    }


    // ========================================
    // Volumen prüfen
    // ========================================

    canCarryVolume(
        cargoVolumeM3
    ) {

        // Keine Volumengrenze hinterlegt

        if (
            this.maxVolumeM3 === null
        ) {

            return true;
        }


        if (
            cargoVolumeM3 < 0
        ) {

            return false;
        }


        return (
            cargoVolumeM3 <=
            this.maxVolumeM3
        );
    }


    // ========================================
    // Palettenplätze prüfen
    // ========================================

    canCarryPallets(
        palletCount
    ) {

        // Keine Palettengrenze hinterlegt

        if (
            this.maxPallets === null
        ) {

            return true;
        }


        if (
            palletCount < 0
        ) {

            return false;
        }


        return (
            palletCount <=
            this.maxPallets
        );
    }


    // ========================================
    // Gesamte Ladung prüfen
    //
    // ALLE vorhandenen Grenzen
    // müssen eingehalten werden.
    // ========================================

    canCarry({

        weightKg,

        volumeM3 = 0,

        pallets = 0

    }) {

        const weightOkay =
            this.canCarryWeight(
                weightKg
            );


        const volumeOkay =
            this.canCarryVolume(
                volumeM3
            );


        const palletsOkay =
            this.canCarryPallets(
                pallets
            );


        return (
            weightOkay &&
            volumeOkay &&
            palletsOkay
        );
    }


    // ========================================
    // Verbleibende Nutzlast
    // ========================================

    getRemainingPayloadKg(
        currentCargoWeightKg
    ) {

        return Math.max(

            this.getMaxPayloadKg() -
            currentCargoWeightKg,

            0
        );
    }


    // ========================================
    // Verbleibendes Ladevolumen
    // ========================================

    getRemainingVolumeM3(
        currentCargoVolumeM3
    ) {

        if (
            this.maxVolumeM3 === null
        ) {

            return null;
        }


        return Math.max(

            this.maxVolumeM3 -
            currentCargoVolumeM3,

            0
        );
    }


    // ========================================
    // Verbleibende Palettenplätze
    // ========================================

    getRemainingPallets(
        currentPalletCount
    ) {

        if (
            this.maxPallets === null
        ) {

            return null;
        }


        return Math.max(

            this.maxPallets -
            currentPalletCount,

            0
        );
    }


    // ========================================
    // Fahrten nach Gewicht berechnen
    // ========================================

    calculateTripsByWeight(
        totalCargoWeightKg
    ) {

        const payload =
            this.getMaxPayloadKg();


        if (
            payload <= 0
        ) {

            return null;
        }


        if (
            totalCargoWeightKg <= 0
        ) {

            return 0;
        }


        return Math.ceil(

            totalCargoWeightKg /
            payload
        );
    }


    // ========================================
    // Fahrten nach Palettenzahl berechnen
    // ========================================

    calculateTripsByPallets(
        totalPallets
    ) {

        if (
            totalPallets <= 0
        ) {

            return 0;
        }


        if (
            this.maxPallets === null ||
            this.maxPallets <= 0
        ) {

            return null;
        }


        return Math.ceil(

            totalPallets /
            this.maxPallets
        );
    }


    // ========================================
    // Fahrten nach Volumen berechnen
    // ========================================

    calculateTripsByVolume(
        totalVolumeM3
    ) {

        if (
            totalVolumeM3 <= 0
        ) {

            return 0;
        }


        if (
            this.maxVolumeM3 === null ||
            this.maxVolumeM3 <= 0
        ) {

            return null;
        }


        return Math.ceil(

            totalVolumeM3 /
            this.maxVolumeM3
        );
    }


    // ========================================
    // Tatsächlich benötigte Fahrten
    //
    // Es gilt immer die Grenze,
    // die zuerst erreicht wird.
    //
    // Beispiel:
    //
    // Gewicht: 1 Fahrt
    // Paletten: 2 Fahrten
    //
    // Ergebnis: 2 Fahrten
    // ========================================

    calculateRequiredTrips({

        totalWeightKg = 0,

        totalVolumeM3 = 0,

        totalPallets = 0

    }) {

        const tripValues =
            [];


        // Gewicht

        const weightTrips =
            this.calculateTripsByWeight(
                totalWeightKg
            );


        if (
            weightTrips !== null
        ) {

            tripValues.push(
                weightTrips
            );
        }


        // Volumen

        if (
            this.maxVolumeM3 !== null
        ) {

            const volumeTrips =
                this.calculateTripsByVolume(
                    totalVolumeM3
                );


            if (
                volumeTrips !== null
            ) {

                tripValues.push(
                    volumeTrips
                );
            }
        }


        // Paletten

        if (
            this.maxPallets !== null
        ) {

            const palletTrips =
                this.calculateTripsByPallets(
                    totalPallets
                );


            if (
                palletTrips !== null
            ) {

                tripValues.push(
                    palletTrips
                );
            }
        }


        if (
            tripValues.length === 0
        ) {

            return 0;
        }


        return Math.max(
            ...tripValues
        );
    }


    // ========================================
    // Überladung in kg
    // ========================================

    getOverloadKg(
        cargoWeightKg
    ) {

        const grossWeight =
            this.getGrossWeightKg(
                cargoWeightKg
            );


        return Math.max(

            grossWeight -
            this.maxGrossWeightKg,

            0
        );
    }


    // ========================================
    // Grund der Kapazitätsüberschreitung
    // ========================================

    getCapacityProblems({

        weightKg = 0,

        volumeM3 = 0,

        pallets = 0

    }) {

        const problems =
            [];


        if (
            !this.canCarryWeight(
                weightKg
            )
        ) {

            problems.push(
                "Zulässiges Gesamtgewicht überschritten"
            );
        }


        if (
            !this.canCarryVolume(
                volumeM3
            )
        ) {

            problems.push(
                "Ladevolumen überschritten"
            );
        }


        if (
            !this.canCarryPallets(
                pallets
            )
        ) {

            problems.push(
                "Palettenplätze überschritten"
            );
        }


        return problems;
    }


    // ========================================
    // Kapazitätsinformationen
    // ========================================

    getCapacityInfo() {

        return {

            maxGrossWeightKg:
                this.maxGrossWeightKg,

            emptyWeightKg:
                this.emptyWeightKg,

            maxPayloadKg:
                this.getMaxPayloadKg(),

            maxPayloadTons:
                this.getMaxPayloadTons(),

            maxVolumeM3:
                this.maxVolumeM3,

            maxPallets:
                this.maxPallets
        };
    }
}