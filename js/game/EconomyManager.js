// ============================================
// EconomyManager.js
// WorldEngine
// Version 0.2.0
// ============================================

export class EconomyManager {

    constructor(world, citizenManager) {

        this.world = world;
        this.citizenManager = citizenManager;

        this.totalMoney = 0;

        this.totalSales = 0;

        this.totalTaxes = 0;

    }

    //----------------------------------------
    // Update
    //----------------------------------------

    update(delta) {

        this.totalSales = 0;

        for (const citizen of this.citizenManager.citizens) {

            this.processCitizen(citizen);

        }

    }

    //----------------------------------------
    // Bürger verarbeitet
    //----------------------------------------

    processCitizen(citizen) {

        // Hunger

        if (citizen.hunger > 70) {

            this.buyFood(citizen);

        }

    }

    //----------------------------------------
    // Lebensmittel kaufen
    //----------------------------------------

    buyFood(citizen) {

        const amount = 8 + Math.random() * 25;

        if (citizen.money < amount)
            return;

        citizen.money -= amount;

        citizen.hunger = 0;

        this.totalSales += amount;

    }

}