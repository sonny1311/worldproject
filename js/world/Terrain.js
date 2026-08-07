// ============================================
// Terrain.js
// WorldEngine
// Version 0.4.0
// ============================================

export class Terrain {

    static TYPES = {

        grass: {

            id: "grass",

            name: "Gras",

            color: "#5FAF4A",

            buildable: true,

            speed: 1.0

        },

        forest: {

            id: "forest",

            name: "Wald",

            color: "#2E7D32",

            buildable: false,

            speed: 0.7

        },

        sand: {

            id: "sand",

            name: "Sand",

            color: "#D9C87C",

            buildable: true,

            speed: 0.8

        },

        water: {

            id: "water",

            name: "Wasser",

            color: "#4A90E2",

            buildable: false,

            speed: 0.0

        }

    };

    //----------------------------------------

    static get(id){

        return this.TYPES[id] || this.TYPES.grass;

    }

}