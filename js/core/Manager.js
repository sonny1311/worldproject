// ============================================
// Manager.js
// WorldProject
// Allgemeines Manager-System
// ============================================
import { ManagerTypes } from "./ManagerTypes.js";
export class Manager {

   constructor(
    type,
    level = 1,
    durationHours = 24,
    coinCost = 20
) {

    const definition =
        ManagerTypes[type];

    if (!definition) {

        throw new Error(
            "Unbekannter Managertyp: " + type
        );
    }

    this.definition =
        definition;

    this.type =
        type;

    this.name =
        definition.name;

    this.level =
        level;

    this.durationHours =
        durationHours;

    this.coinCost =
        coinCost;

    this.startedAt =
        new Date();

    this.expiresAt =
        new Date(
            this.startedAt.getTime() +
            durationHours * 60 * 60 * 1000
        );

    this.effects =
        {
            ...definition.effects
        };

    this.status =
        "active";

    this.id =
        Date.now() +
        Math.random();
}

        // ----------------------------------------
        // Grunddaten
        // ----------------------------------------

        this.id =
            Date.now() +
            Math.random();

        this.type = type;

        this.name = name;

        this.level = level;


        // ----------------------------------------
        // Vertrag
        // ----------------------------------------

        this.durationHours =
            durationHours;

        this.coinCost =
            coinCost;


        // ----------------------------------------
        // Zeit
        // ----------------------------------------

        this.startedAt =
            new Date();

        this.expiresAt =
            new Date(
                this.startedAt.getTime() +
                durationHours * 60 * 60 * 1000
            );


        // ----------------------------------------
        // Wirkung
        // ----------------------------------------

        this.effects = effects;


        // ----------------------------------------
        // Status
        // ----------------------------------------

        this.status = "active";
    }


    // ========================================
    // Prüfen, ob Manager noch aktiv ist
    // ========================================

    isActive() {

        if (
            this.status !== "active"
        ) {

            return false;
        }


        if (
            Date.now() >=
            this.expiresAt.getTime()
        ) {

            this.status = "expired";

            return false;
        }


        return true;
    }


    // ========================================
    // Verbleibende Zeit
    // ========================================

    getRemainingHours() {

        if (!this.isActive()) {

            return 0;
        }


        const remaining =
            this.expiresAt.getTime() -
            Date.now();


        return (
            remaining /
            (60 * 60 * 1000)
        );
    }


    // ========================================
    // Verbleibende Zeit als Text
    // ========================================

    getRemainingTimeText() {

        if (!this.isActive()) {

            return "Abgelaufen";
        }


        const totalMinutes =
            Math.ceil(
                this.getRemainingHours() * 60
            );


        const hours =
            Math.floor(
                totalMinutes / 60
            );


        const minutes =
            totalMinutes % 60;


        return (
            hours +
            " Std. " +
            minutes +
            " Min."
        );
    }


    // ========================================
    // Manager vorzeitig beenden
    // ========================================

    cancel() {

        this.status = "cancelled";
    }


    // ========================================
    // Effekt abfragen
    // ========================================

    getEffect(name) {

        if (!this.isActive()) {

            return 0;
        }


        return this.effects[name] ?? 0;
    }
}