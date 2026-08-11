// ============================================
// TransportTiming.js
// WorldProject
//
// Berechnet geplante Fahr- und Lieferzeiten.
//
// Später erweiterbar um:
// - Stau
// - Straßensperrungen
// - Wetter
// - Lenk-/Ruhezeiten
// - Grenzwartezeiten
// - Be-/Entladeverzögerungen
// ============================================

export class TransportTiming {

    constructor(settings = {}) {

        this.settings = {

            // ------------------------------------
            // Durchschnittsgeschwindigkeit
            // für die grobe Planung
            // ------------------------------------

            averageSpeedKmH:
                settings.averageSpeedKmH ??
                65,


            // ------------------------------------
            // Beladezeit je Fahrt
            // ------------------------------------

            loadingHoursPerTrip:
                settings.loadingHoursPerTrip ??
                0.75,


            // ------------------------------------
            // Entladezeit je Fahrt
            // ------------------------------------

            unloadingHoursPerTrip:
                settings.unloadingHoursPerTrip ??
                0.75
        };
    }


    // ========================================
    // Reine Fahrzeit berechnen
    // ========================================

    calculateDrivingHours(
        distanceKm
    ) {

        if (
            distanceKm <= 0
        ) {

            return 0;
        }


        if (
            this.settings.averageSpeedKmH <= 0
        ) {

            return 0;
        }


        return (
            distanceKm /
            this.settings.averageSpeedKmH
        );
    }


    // ========================================
    // Gesamte geplante Zeit
    //
    // distanceKm = einfache Strecke
    //
    // Bei mehreren Fahrten:
    // Hin + Rückfahrt je Fahrt
    // ========================================

    calculateTotalHours({

        distanceKm,

        trips = 1

    }) {

        if (
            trips <= 0
        ) {

            return 0;
        }


        const totalDrivingKm =
            distanceKm *
            2 *
            trips;


        const drivingHours =
            this.calculateDrivingHours(
                totalDrivingKm
            );


        const loadingHours =
            trips *
            this.settings
                .loadingHoursPerTrip;


        const unloadingHours =
            trips *
            this.settings
                .unloadingHoursPerTrip;


        return (
            drivingHours +
            loadingHours +
            unloadingHours
        );
    }


    // ========================================
    // Ankunftszeit berechnen
    // ========================================

    calculateArrivalDate({

        startDate = new Date(),

        distanceKm,

        trips = 1

    }) {

        const totalHours =
            this.calculateTotalHours({

                distanceKm,

                trips
            });


        const arrival =
            new Date(
                startDate.getTime() +
                totalHours *
                60 *
                60 *
                1000
            );


        return arrival;
    }


    // ========================================
    // Verzögerung hinzufügen
    // ========================================

    addDelay(

        arrivalDate,

        delayHours

    ) {

        if (
            !arrivalDate
        ) {

            return null;
        }


        if (
            delayHours <= 0
        ) {

            return new Date(
                arrivalDate
            );
        }


        return new Date(

            arrivalDate.getTime() +

            delayHours *
            60 *
            60 *
            1000
        );
    }


    // ========================================
    // Restzeit bis Ankunft
    // ========================================

    getRemainingHours(
        arrivalDate
    ) {

        if (
            !arrivalDate
        ) {

            return 0;
        }


        const remainingMs =

            arrivalDate.getTime() -

            Date.now();


        if (
            remainingMs <= 0
        ) {

            return 0;
        }


        return (
            remainingMs /
            (
                60 *
                60 *
                1000
            )
        );
    }


    // ========================================
    // Lieferung angekommen?
    // ========================================

    hasArrived(
        arrivalDate
    ) {

        if (
            !arrivalDate
        ) {

            return false;
        }


        return (
            Date.now() >=
            arrivalDate.getTime()
        );
    }


    // ========================================
    // Restzeit als Text
    // ========================================

    getRemainingTimeText(
        arrivalDate
    ) {

        const totalMinutes =
            Math.ceil(

                this.getRemainingHours(
                    arrivalDate
                ) *
                60
            );


        if (
            totalMinutes <= 0
        ) {

            return "Angekommen";
        }


        const hours =
            Math.floor(
                totalMinutes /
                60
            );


        const minutes =
            totalMinutes %
            60;


        return (
            hours +
            " Std. " +
            minutes +
            " Min."
        );
    }
}