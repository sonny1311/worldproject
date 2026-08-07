// ============================================
// Upgrade.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Upgrade {

    constructor(id, name) {

        this.id = id;

        this.name = name;

        // Kategorie
        this.category = "general";

        // Beschreibung
        this.description = "";

        // Kosten
        this.price = 0;

        // Bauzeit (Stunden)
        this.buildTime = 0;

        // Benötigtes Gebäudelevel
        this.requiredLevel = 1;

        // Benötigte Upgrades
        this.requiredUpgrades = [];

        // Aktiv
        this.enabled = true;

        // Wirtschaft
        this.effects = {

            sales: 0,
            profit: 0,
            customers: 0,
            reputation: 0,
            attractiveness: 0,

            employeeCapacity: 0,
            storageCapacity: 0,
            parkingSpaces: 0,

            powerConsumption: 0,
            waterConsumption: 0

        };

    }

    //------------------------------------

    addRequirement(upgradeId){

        this.requiredUpgrades.push(upgradeId);

    }

}