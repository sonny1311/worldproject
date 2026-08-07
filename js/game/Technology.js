// ============================================
// Technology.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Technology {

    constructor(id, name) {

        this.id = id;

        this.name = name;

        // Kategorie
        this.category = "general";

        // Beschreibung
        this.description = "";

        // Forschungskosten
        this.researchCost = 0;

        // Forschungszeit (Stunden)
        this.researchTime = 0;

        // Freigeschaltet
        this.unlocked = false;

        // Voraussetzungen
        this.requiredTechnologies = [];

        // Effekte
        this.effects = {

            logistics: 0,

            warehouse: 0,

            energy: 0,

            automation: 0,

            customerSatisfaction: 0,

            maintenance: 0,

            production: 0,

            sales: 0

        };

    }

    //----------------------------------------

    unlock(){

        this.unlocked = true;

    }

    //----------------------------------------

    addRequirement(id){

        this.requiredTechnologies.push(id);

    }

}