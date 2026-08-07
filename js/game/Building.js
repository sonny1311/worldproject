// ============================================
// Building.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Building {

    constructor(type, name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.type = type;
        this.name = name;

        // Standort
        this.parcel = null;
        this.branch = null;
        this.company = null;

        // Gebäude
        this.level = 1;
        this.maxLevel = 10;

        // Zustand
        this.condition = 100;
        this.cleanliness = 100;

        // Betrieb
        this.isOpen = true;
        this.openHour = 7;
        this.closeHour = 22;

        // Wirtschaft
        this.buildCost = 0;
        this.maintenance = 0;

        this.value = 0;

        // Energie
        this.powerConsumption = 0;
        this.waterConsumption = 0;

        // Personal
        this.employeeCapacity = 0;

        // Besucher
        this.customerCapacity = 0;

        // Parkplätze
        this.parkingSpaces = 0;

        // Lager
        this.storageCapacity = 0;

        // Attraktivität
        this.attractiveness = 50;

        // Erweiterungen
        this.upgrades = [];

    }

    //----------------------------------------

    levelUp(){

        if(this.level >= this.maxLevel)
            return false;

        this.level++;

        return true;

    }

    //----------------------------------------

    repair(){

        this.condition = 100;

    }

    //----------------------------------------

    clean(){

        this.cleanliness = 100;

    }

    //----------------------------------------

    addUpgrade(upgrade){

        this.upgrades.push(upgrade);

    }

}