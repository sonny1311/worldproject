// ============================================
// ResearchProject.js
// WorldEngine
// Version 0.2.0
// ============================================

export class ResearchProject {

    constructor(id, name) {

        this.id = id;

        this.name = name;

        // Beschreibung
        this.description = "";

        // Kategorie
        this.category = "general";

        // Forschung

        this.progress = 0;

        this.durationDays = 30;

        this.remainingDays = 30;

        this.completed = false;

        // Kosten

        this.cost = 0;

        this.monthlyCost = 0;

        // Personal

        this.scientists = 0;

        this.requiredScientists = 5;

        // Voraussetzungen

        this.requiredProjects = [];

        // Ergebnis

        this.unlocks = [];

        // Patent

        this.hasPatent = false;

        this.patentYears = 10;

        // Kooperationen

        this.university = null;

        this.researchCenter = null;

    }

    //----------------------------------------

    updateOneDay(){

        if(this.completed)
            return;

        this.progress +=

            100 / this.durationDays;

        this.remainingDays--;

        if(this.progress >= 100){

            this.progress = 100;

            this.completed = true;

        }

    }

    //----------------------------------------

    addRequirement(id){

        this.requiredProjects.push(id);

    }

    //----------------------------------------

    addUnlock(unlock){

        this.unlocks.push(unlock);

    }

}