// ============================================
// World.js
// WorldEngine
// Version 0.4.0
// ============================================

import { Parcel } from "./Parcel.js";
import { WorldGenerator } from "./WorldGenerator.js";

export class World {

    constructor(width = 80, height = 50) {

        this.width = width;
        this.height = height;

        this.parcels = [];

        this.generator = new WorldGenerator();

        this.create();

    }

    //----------------------------------------
    // Welt erzeugen
    //----------------------------------------

    create() {

        this.parcels = [];

        for (let y = 0; y < this.height; y++) {

            const row = [];

            for (let x = 0; x < this.width; x++) {

                row.push(new Parcel(x, y));

            }

            this.parcels.push(row);

        }

        // Terrain erzeugen
        this.generator.generate(this);

    }

    //----------------------------------------

    getParcel(x, y) {

        if (x < 0 || y < 0)
            return null;

        if (x >= this.width || y >= this.height)
            return null;

        return this.parcels[y][x];

    }

}