// ============================================
// CitizenManager.js
// WorldEngine
// Version 0.2.0
// ============================================

export class CitizenManager {

    constructor(world) {

        this.world = world;

        this.citizens = [];

    }

    //----------------------------------------
    // Bürger erzeugen
    //----------------------------------------

    createCitizen(data = {}) {

        const citizen = {

            id: crypto.randomUUID(),

            firstName: data.firstName || "Max",

            lastName: data.lastName || "Mustermann",

            age: data.age || 18,

            money: data.money || 1000,

            happiness: 100,

            energy: 100,

            hunger: 0,

            home: null,

            work: null,

            vehicle: null,

            shoppingList: [],

            inventory: [],

            position: {

                x: 0,

                y: 0

            }

        };

        this.citizens.push(citizen);

        return citizen;

    }

    //----------------------------------------
    // Update
    //----------------------------------------

    update() {

        for (const citizen of this.citizens) {

            citizen.hunger += 0.01;

            citizen.energy -= 0.005;

            if (citizen.hunger > 100)
                citizen.hunger = 100;

            if (citizen.energy < 0)
                citizen.energy = 0;

        }

    }

}