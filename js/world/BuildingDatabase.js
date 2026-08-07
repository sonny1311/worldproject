// ============================================
// BuildingDatabase.js
// WorldEngine
// Version 0.2.0
// ============================================

export class BuildingDatabase {

    constructor() {

        this.buildings = [];

        this.loadDefaults();

    }

    loadDefaults() {

        this.buildings = [

            {
                id: "house_01",
                name: "Kleines Haus",

                level: 1,

                families: 1,

                income: 1,

                buildTime: 60,

                price: 100,

                next: "house_02"
            },

            {
                id: "house_02",
                name: "2 Familienhaus",

                level: 2,

                families: 2,

                income: 2.3,

                buildTime: 120,

                price: 500,

                next: "house_03"
            },

            {
                id: "house_03",
                name: "3 Familienhaus",

                level: 3,

                families: 3,

                income: 3.8,

                buildTime: 180,

                price: 1200,

                next: "house_04"
            }

        ];

    }

    get(id) {

        return this.buildings.find(

            building => building.id === id

        );

    }

    getAll() {

        return this.buildings;

    }

}