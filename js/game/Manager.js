// ============================================
// Manager.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Manager {

    constructor(type, name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.type = type;
        this.name = name;

        // Firma
        this.company = null;

        // Aktiv
        this.active = true;

        // Vertragsmodell
        // monthly
        // quarterly
        // halfyear
        // yearly
        this.contract = "monthly";

        // Laufzeit
        this.contractEnd = null;

        // Kosten
        this.monthlyPrice = 0;

        this.totalPaid = 0;

        // Automatisierung
        this.aiLevel = 1;

        // Erfahrung
        this.experience = 0;

        this.level = 1;

        // Zufriedenheit
        this.satisfaction = 100;

        // Aufgaben
        this.tasks = [];

    }

    //----------------------------------------

    addTask(task){

        this.tasks.push(task);

    }

    //----------------------------------------

    gainExperience(points){

        this.experience += points;

        if(this.experience >= this.level * 100){

            this.level++;

            this.experience = 0;

        }

    }

    //----------------------------------------

    setContract(type){

        this.contract = type;

    }

}