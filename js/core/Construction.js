// ============================================
// Construction.js
// WorldProject
// Allgemeines Bau-System
// ============================================

import {
    ConstructionMaterialPlans
} from "./ConstructionMaterialPlans.js";

import {
    ConstructionPhasePlans
} from "./ConstructionPhasePlans.js";


export class Construction {

    constructor(
        building,
        baseBuildDays,
        factors = {}
    ) {

        this.building =
            building;


        // ========================================
        // Grunddaten
        // ========================================

        this.baseBuildDays =
            baseBuildDays;


        // ========================================
        // Bauzeit-Faktoren
        //
        // 1.00 = keine Änderung
        // 1.20 = +20 %
        // 0.80 = -20 %
        // ========================================

        this.factors = {

            building:
                factors.building ?? 1.00,

            constructionCompany:
                factors.constructionCompany ?? 1.00,

            ground:
                factors.ground ?? 1.00,

            complexity:
                factors.complexity ?? 1.00
        };


        // ========================================
        // Tatsächliche Bauzeit
        // ========================================

        this.calculatedBuildDays =
            this.calculateBuildDays();


        // ========================================
        // Restzeit
        // ========================================

        this.remainingDays =
            this.calculatedBuildDays;


        // ========================================
        // Fortschritt
        // ========================================

        this.progress = 0;


        // ========================================
        // Zustand
        // ========================================

        this.status =
            "building";


        this.pauseReason =
            null;


        // ========================================
        // Materialien
        // ========================================

        this.materials = {

            // Gesamtbedarf des Bauprojekts

            required: {},


            // Tatsächlich auf der Baustelle
            // vorhandenes Material

            available: {},


            // Aktuell fehlendes Material

            missing: {},


            // Bereits verbrauchtes Material
            // Wird im nächsten Schritt genutzt.

            consumed: {},


            // Bereits bestellt
            // Wird später mit dem Markt verbunden.

            ordered: {},


            // Material, das momentan unterwegs ist.

            inTransit: {}
        };


        // Gesamtbedarf automatisch berechnen

        this.materials.required =
            this.calculateMaterialRequirements();


        // ========================================
        // Bauphasen
        // ========================================

        this.phases =
            this.createPhases();


        this.currentPhaseIndex =
            0;


        // ========================================
        // Beschleunigungen
        // ========================================

        this.adReductions =
            0;


        this.coinReductions =
            0;


        // ========================================
        // Zentrale Einstellungen
        // ========================================

        this.settings = {

            // Werbung:
            // -0,5 % der aktuellen Restzeit

            adReductionPercent: 0.5,


            // Coins:
            // -2 % der aktuellen Restzeit

            coinReductionPercent: 2,


            // Niemals unter 25 %
            // der berechneten Bauzeit

            minimumBuildPercent: 25,


            // Maximal 5 Werbungen
            // pro Kalendertag

            maxAdsPerDay: 5
        };


        // ========================================
        // Gebäude auf "im Bau" setzen
        // ========================================

        this.building.construction.status =
            "building";


        this.building.construction.progress =
            0;


        this.building.construction.buildPercentRemaining =
            100;


        // ========================================
        // Material der ersten Phase prüfen
        // ========================================

        this.checkCurrentPhaseMaterials();
    }


    // ========================================
    // Tatsächliche Bauzeit berechnen
    // ========================================

    calculateBuildDays() {

        let days =
            this.baseBuildDays;


        days *=
            this.factors.building;


        days *=
            this.factors.constructionCompany;


        days *=
            this.factors.ground;


        days *=
            this.factors.complexity;


        return days;
    }


    // ========================================
    // Gesamten Materialbedarf berechnen
    // ========================================

    calculateMaterialRequirements() {

        const buildingType =
            this.building.type;


        const plan =
            ConstructionMaterialPlans[
                buildingType
            ];


        if (!plan) {

            console.warn(
                "Kein Materialplan für Gebäudetyp:",
                buildingType
            );

            return {};
        }


        const size =
            this.building.size;


        const requirements =
            {};


        for (
            const materialId
            in plan.materialsPerSquareMeter
        ) {

            const amountPerSquareMeter =
                plan.materialsPerSquareMeter[
                    materialId
                ];


            requirements[
                materialId
            ] =
                amountPerSquareMeter *
                size;
        }


        return requirements;
    }


    // ========================================
    // Bauphasen erzeugen
    // ========================================

    createPhases() {

        const phasePlan =
            ConstructionPhasePlans.standard;


        const phases =
            [];


        for (
            const phaseDefinition
            of phasePlan
        ) {

            const phaseMaterials =
                {};


            // ------------------------------------
            // Materialbedarf dieser Phase
            // aus Gesamtbedarf berechnen
            // ------------------------------------

            for (
                const materialId
                in phaseDefinition.materials
            ) {

                const totalRequired =
                    this.materials.required[
                        materialId
                    ] ?? 0;


                const percent =
                    phaseDefinition.materials[
                        materialId
                    ];


                phaseMaterials[
                    materialId
                ] =
                    totalRequired *
                    (
                        percent /
                        100
                    );
            }


            // ------------------------------------
            // Bauzeit dieser Phase
            // ------------------------------------

            const phaseBuildDays =
                this.calculatedBuildDays *
                (
                    phaseDefinition.buildTimePercent /
                    100
                );


            phases.push({

                id:
                    phaseDefinition.id,

                name:
                    phaseDefinition.name,

                buildTimePercent:
                    phaseDefinition.buildTimePercent,

                totalDays:
                    phaseBuildDays,

                remainingDays:
                    phaseBuildDays,

                materials:
                    phaseMaterials,

                status:
                    "waiting"
            });
        }


        // Erste Phase aktivieren

        if (
            phases.length > 0
        ) {

            phases[0].status =
                "active";
        }


        return phases;
    }


    // ========================================
    // Aktuelle Phase holen
    // ========================================

    getCurrentPhase() {

        if (
            this.currentPhaseIndex < 0 ||
            this.currentPhaseIndex >=
            this.phases.length
        ) {

            return null;
        }


        return this.phases[
            this.currentPhaseIndex
        ];
    }


    // ========================================
    // Materialbedarf der aktuellen Phase
    // ========================================

    getCurrentPhaseMaterialRequirements() {

        const phase =
            this.getCurrentPhase();


        if (!phase) {

            return {};
        }


        return phase.materials;
    }


    // ========================================
    // Fehlendes Material der aktuellen Phase
    // berechnen
    // ========================================

    updateMissingMaterials() {

        this.materials.missing =
            {};


        const phase =
            this.getCurrentPhase();


        if (!phase) {

            return this.materials.missing;
        }


        for (
            const materialId
            in phase.materials
        ) {

            const requiredForPhase =
                phase.materials[
                    materialId
                ] ?? 0;


            const available =
                this.materials.available[
                    materialId
                ] ?? 0;


            if (
                available <
                requiredForPhase
            ) {

                this.materials.missing[
                    materialId
                ] =
                    requiredForPhase -
                    available;
            }
        }


        return this.materials.missing;
    }


    // ========================================
    // Prüfen, ob Material für aktuelle
    // Bauphase vorhanden ist
    // ========================================

    hasRequiredMaterials() {

        this.updateMissingMaterials();


        return (
            Object.keys(
                this.materials.missing
            ).length === 0
        );
    }


    // ========================================
    // Aktuelle Phase prüfen
    // ========================================

    checkCurrentPhaseMaterials() {

        if (
            this.status ===
            "finished"
        ) {

            return true;
        }


        if (
            this.hasRequiredMaterials()
        ) {

            return true;
        }


        this.pauseForMissingMaterials();


        return false;
    }


    // ========================================
    // Bau wegen fehlendem Material pausieren
    // ========================================

    pauseForMissingMaterials() {

        this.status =
            "paused_material";


        this.pauseReason =
            "Baumaterial fehlt";


        this.building.construction.status =
            "paused_material";


        const phase =
            this.getCurrentPhase();


        if (phase) {

            phase.status =
                "paused_material";
        }
    }


    // ========================================
    // Nach Materiallieferung fortsetzen
    // ========================================

    resumeAfterMaterials() {

        this.updateMissingMaterials();


        if (
            Object.keys(
                this.materials.missing
            ).length > 0
        ) {

            return false;
        }


        this.status =
            "building";


        this.pauseReason =
            null;


        this.building.construction.status =
            "building";


        const phase =
            this.getCurrentPhase();


        if (phase) {

            phase.status =
                "active";
        }


        return true;
    }


    // ========================================
    // Material auf Baustelle hinzufügen
    // ========================================

    addMaterial(
        materialId,
        amount
    ) {

        if (
            typeof amount !==
            "number"
        ) {

            return false;
        }


        if (
            amount <= 0
        ) {

            return false;
        }


        if (
            !this.materials.available[
                materialId
            ]
        ) {

            this.materials.available[
                materialId
            ] = 0;
        }


        this.materials.available[
            materialId
        ] += amount;


        // Fehlendes Material neu prüfen

        this.updateMissingMaterials();


        // Falls der Bau wegen Material
        // pausiert war, automatisch prüfen,
        // ob weitergebaut werden kann.

        if (
            this.status ===
            "paused_material"
        ) {

            this.resumeAfterMaterials();
        }


        return true;
    }


    // ========================================
    // Mindestrestzeit berechnen
    // ========================================

    getMinimumRemainingDays() {

        return (
            this.calculatedBuildDays *
            (
                this.settings.minimumBuildPercent /
                100
            )
        );
    }


    // ========================================
    // Prüfen, ob Beschleunigung möglich ist
    // ========================================

    canUseAcceleration() {

        if (
            this.status !==
            "building"
        ) {

            return false;
        }


        if (
            !this.hasRequiredMaterials()
        ) {

            this.pauseForMissingMaterials();

            return false;
        }


        return true;
    }


    // ========================================
    // Werbung verwenden
    // ========================================

    useAdvertisement() {

        if (
            !this.canUseAcceleration()
        ) {

            return false;
        }


        if (
            this.adReductions >=
            this.settings.maxAdsPerDay
        ) {

            return false;
        }


        const minimum =
            this.getMinimumRemainingDays();


        const reduction =
            this.remainingDays *
            (
                this.settings.adReductionPercent /
                100
            );


        const newRemaining =
            this.remainingDays -
            reduction;


        this.remainingDays =
            Math.max(
                newRemaining,
                minimum
            );


        this.adReductions++;


        this.updateProgress();


        return true;
    }


    // ========================================
    // Coins verwenden
    // ========================================

    useCoins() {

        if (
            !this.canUseAcceleration()
        ) {

            return false;
        }


        const minimum =
            this.getMinimumRemainingDays();


        const reduction =
            this.remainingDays *
            (
                this.settings.coinReductionPercent /
                100
            );


        const newRemaining =
            this.remainingDays -
            reduction;


        this.remainingDays =
            Math.max(
                newRemaining,
                minimum
            );


        this.coinReductions++;


        this.updateProgress();


        return true;
    }


    // ========================================
    // Bauzeit aktualisieren
    // ========================================

    update(days) {

        // ------------------------------------
        // Nur aktiver Bau darf Zeit verbrauchen
        // ------------------------------------

        if (
            this.status !==
            "building"
        ) {

            return;
        }


        // ------------------------------------
        // Material prüfen
        // ------------------------------------

        if (
            !this.checkCurrentPhaseMaterials()
        ) {

            return;
        }


        const phase =
            this.getCurrentPhase();


        if (!phase) {

            return;
        }


        // ------------------------------------
        // Bauzeit dieser Phase reduzieren
        // ------------------------------------

        phase.remainingDays -=
            days;


        this.remainingDays -=
            days;


        // ------------------------------------
        // Phase abgeschlossen
        // ------------------------------------

        if (
            phase.remainingDays <= 0
        ) {

            phase.remainingDays =
                0;


            phase.status =
                "finished";


            this.finishCurrentPhase();
        }


        // ------------------------------------
        // Gesamtprojekt fertig?
        // ------------------------------------

        if (
            this.remainingDays <= 0 ||
            this.currentPhaseIndex >=
            this.phases.length
        ) {

            this.finishConstruction();

            return;
        }


        this.updateProgress();
    }


    // ========================================
    // Aktuelle Phase abschließen
    // ========================================

    finishCurrentPhase() {

        const oldPhase =
            this.getCurrentPhase();


        if (oldPhase) {

            oldPhase.status =
                "finished";
        }


        this.currentPhaseIndex++;


        // ------------------------------------
        // Keine weitere Phase
        // ------------------------------------

        if (
            this.currentPhaseIndex >=
            this.phases.length
        ) {

            return;
        }


        // ------------------------------------
        // Nächste Phase aktivieren
        // ------------------------------------

        const nextPhase =
            this.getCurrentPhase();


        nextPhase.status =
            "active";


        // Material der nächsten Phase prüfen

        this.checkCurrentPhaseMaterials();
    }


    // ========================================
    // Gesamten Bau abschließen
    // ========================================

    finishConstruction() {

        this.remainingDays =
            0;


        this.progress =
            100;


        this.status =
            "finished";


        this.pauseReason =
            null;


        this.building.construction.status =
            "finished";


        this.building.construction.progress =
            100;


        this.building.construction.buildPercentRemaining =
            0;
    }


    // ========================================
    // Fortschritt aktualisieren
    // ========================================

    updateProgress() {

        const elapsed =
            this.calculatedBuildDays -
            this.remainingDays;


        this.progress =
            (
                elapsed /
                this.calculatedBuildDays
            ) * 100;


        this.progress =
            Math.max(
                0,
                Math.min(
                    100,
                    this.progress
                )
            );


        this.building.construction.progress =
            this.progress;


        this.building.construction.buildPercentRemaining =
            (
                this.remainingDays /
                this.calculatedBuildDays
            ) * 100;
    }


    // ========================================
    // Restzeit in Stunden
    // ========================================

    getRemainingHours() {

        return (
            this.remainingDays *
            24
        );
    }


    // ========================================
    // Restzeit als Text
    // ========================================

    getRemainingTimeText() {

        const totalHours =
            Math.ceil(
                this.getRemainingHours()
            );


        const days =
            Math.floor(
                totalHours /
                24
            );


        const hours =
            totalHours %
            24;


        if (
            days > 0
        ) {

            return (
                days +
                " Tage " +
                hours +
                " Stunden"
            );
        }


        return (
            hours +
            " Stunden"
        );
    }


    // ========================================
    // Statushinweis für Oberfläche
    // ========================================

    getStatusText() {

        if (
            this.status ===
            "finished"
        ) {

            return "Bau abgeschlossen";
        }


        if (
            this.status ===
            "paused_material"
        ) {

            return (
                "Bau pausiert – " +
                this.pauseReason
            );
        }


        const phase =
            this.getCurrentPhase();


        if (phase) {

            return (
                "Bau läuft – " +
                phase.name
            );
        }


        return "Bau läuft";
    }


    // ========================================
    // Hinweis für Werbung / Coins
    // ========================================

    getAccelerationBlockedReason() {

        if (
            this.status ===
            "paused_material"
        ) {

            return (
                "Nicht verfügbar: " +
                "Der Bau ist wegen fehlender " +
                "Baumaterialien pausiert."
            );
        }


        if (
            this.status ===
            "finished"
        ) {

            return (
                "Nicht verfügbar: " +
                "Das Bauprojekt ist bereits abgeschlossen."
            );
        }


        return null;
    }


    // ========================================
    // Fertig?
    // ========================================

    isFinished() {

        return (
            this.status ===
            "finished"
        );
    }
}