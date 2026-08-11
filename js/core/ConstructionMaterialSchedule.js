// ============================================
// ConstructionMaterialSchedule.js
// WorldProject
// Täglicher Materialbedarf von Bauprojekten
// ============================================

export class ConstructionMaterialSchedule {

    constructor(construction) {

        this.construction =
            construction;
    }


    // ========================================
    // Aktuelle Bauphase
    // ========================================

    getCurrentPhase() {

        return (
            this.construction.getCurrentPhase()
        );
    }


    // ========================================
    // Anzahl der verbleibenden aktiven
    // Bautage der aktuellen Phase
    // ========================================

    getRemainingPhaseDays() {

        const phase =
            this.getCurrentPhase();


        if (!phase) {

            return 0;
        }


        return Math.max(
            phase.remainingDays,
            0
        );
    }


    // ========================================
    // Noch benötigte Materialmenge
    // der aktuellen Phase
    // ========================================

    getRemainingPhaseMaterials() {

        const phase =
            this.getCurrentPhase();


        if (!phase) {

            return {};
        }


        const result =
            {};


        for (
            const materialId
            in phase.materials
        ) {

            const totalForPhase =
                phase.materials[
                    materialId
                ] ?? 0;


            const consumed =
                this.construction.materials
                    .consumed[
                        materialId
                    ] ?? 0;


            const remaining =
                totalForPhase -
                consumed;


            if (
                remaining > 0
            ) {

                result[
                    materialId
                ] =
                    remaining;
            }
        }


        return result;
    }


    // ========================================
    // Materialbedarf für den nächsten
    // aktiven Bautag berechnen
    // ========================================

    getDailyMaterialRequirement() {

        const phase =
            this.getCurrentPhase();


        if (!phase) {

            return {};
        }


        const remainingDays =
            this.getRemainingPhaseDays();


        if (
            remainingDays <= 0
        ) {

            return {};
        }


        const requirements =
            {};


        for (
            const materialId
            in phase.materials
        ) {

            const phaseAmount =
                phase.materials[
                    materialId
                ] ?? 0;


            const dailyAmount =
                phaseAmount /
                phase.totalDays;


            requirements[
                materialId
            ] =
                dailyAmount;
        }


        return requirements;
    }


    // ========================================
    // Prüfen, was für den nächsten Bautag
    // tatsächlich fehlt
    // ========================================

    getMissingForNextDay() {

        const dailyRequirement =
            this.getDailyMaterialRequirement();


        const missing =
            {};


        for (
            const materialId
            in dailyRequirement
        ) {

            const required =
                dailyRequirement[
                    materialId
                ] ?? 0;


            const available =
                this.construction.materials
                    .available[
                        materialId
                    ] ?? 0;


            if (
                available <
                required
            ) {

                missing[
                    materialId
                ] =
                    required -
                    available;
            }
        }


        return missing;
    }


    // ========================================
    // Prüfen, ob Material für den nächsten
    // Bautag vorhanden ist
    // ========================================

    canWorkNextDay() {

        return (
            Object.keys(
                this.getMissingForNextDay()
            ).length === 0
        );
    }


    // ========================================
    // Material eines aktiven Bautages
    // verbrauchen
    // ========================================

    consumeDailyMaterials() {

        const dailyRequirement =
            this.getDailyMaterialRequirement();


        if (
            Object.keys(
                dailyRequirement
            ).length === 0
        ) {

            return false;
        }


        // ------------------------------------
        // Erst vollständig prüfen
        // ------------------------------------

        for (
            const materialId
            in dailyRequirement
        ) {

            const required =
                dailyRequirement[
                    materialId
                ];


            const available =
                this.construction.materials
                    .available[
                        materialId
                    ] ?? 0;


            if (
                available <
                required
            ) {

                return false;
            }
        }


        // ------------------------------------
        // Danach tatsächlich verbrauchen
        // ------------------------------------

        for (
            const materialId
            in dailyRequirement
        ) {

            const amount =
                dailyRequirement[
                    materialId
                ];


            this.construction.materials
                .available[
                    materialId
                ] -= amount;


            if (
                !this.construction.materials
                    .consumed[
                        materialId
                    ]
            ) {

                this.construction.materials
                    .consumed[
                        materialId
                    ] = 0;
            }


            this.construction.materials
                .consumed[
                    materialId
                ] += amount;
        }


        return true;
    }


    // ========================================
    // Tagesübersicht erzeugen
    // ========================================

    getDailyReport() {

        const phase =
            this.getCurrentPhase();


        if (!phase) {

            return {

                phase:
                    null,

                required:
                    {},

                missing:
                    {},

                canWork:
                    false
            };
        }


        return {

            phase:
                phase.name,

            required:
                this.getDailyMaterialRequirement(),

            missing:
                this.getMissingForNextDay(),

            canWork:
                this.canWorkNextDay()
        };
    }
}