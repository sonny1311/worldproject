// ============================================
// WorldGenerator.js
// WorldEngine
// Version 3.0.0
// ============================================

export class WorldGenerator {

    constructor(seed = 123456) {

        this.seed = seed;

        // ========================================
        // Einstellungen
        // ========================================

        this.settings = {

            // Größe der Kontinente
            continentScale: 0.030,

            // Anteil Wasser
            waterLevel: 0.30,

            // Strandbereich
            beachLevel: 0.47,

            // Hügel
            hillLevel: 0.27,

            // Berge
            mountainLevel: 0.32,

            // Wald
            forestLevel: 0.63

        };

    }

    //----------------------------------------
    // Zufall aus Seed
    //----------------------------------------

    random(x, y) {

        let n =
            x * 374761393 +
            y * 668265263 +
            this.seed * 1447;

        n =
            (n ^ (n >> 13)) *
            1274126177;

        return (
            ((n ^ (n >> 16)) >>> 0)
            / 4294967295
        );

    }

    //----------------------------------------
    // Interpolation
    //----------------------------------------

    lerp(a, b, t) {

        return a + (b - a) * t;

    }

    //----------------------------------------
    // Glättung
    //----------------------------------------

    smooth(t) {

        return t * t * (3 - 2 * t);

    }

    //----------------------------------------
    // Value Noise
    //----------------------------------------

    noise(x, y) {

        const ix =
            Math.floor(x);

        const iy =
            Math.floor(y);

        const fx =
            x - ix;

        const fy =
            y - iy;

        const a =
            this.random(ix, iy);

        const b =
            this.random(ix + 1, iy);

        const c =
            this.random(ix, iy + 1);

        const d =
            this.random(ix + 1, iy + 1);

        const i1 =
            this.lerp(
                a,
                b,
                this.smooth(fx)
            );

        const i2 =
            this.lerp(
                c,
                d,
                this.smooth(fx)
            );

        return this.lerp(
            i1,
            i2,
            this.smooth(fy)
        );

    }

    //----------------------------------------
    // Mehrere Noise-Ebenen
    //----------------------------------------

    octaveNoise(x, y) {

        let value = 0;

        let amplitude = 1;

        let frequency = 1;

        let maximum = 0;

        for (let i = 0; i < 5; i++) {

            value +=
                this.noise(
                    x * frequency,
                    y * frequency
                ) * amplitude;

            maximum += amplitude;

            amplitude *= 0.5;

            frequency *= 2;

        }

        return value / maximum;

    }

    //----------------------------------------
    // Kontinentkarte
    //----------------------------------------

    getContinent(x, y) {

        const n =
            this.octaveNoise(
                x * this.settings.continentScale,
                y * this.settings.continentScale
            );

        // Abstand vom Mittelpunkt
        const centerX = 40;
        const centerY = 25;

        const dx = x - centerX;
        const dy = y - centerY;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        // Weltmitte bevorzugen
        const shape =
            1 -
            distance / 50;

        return (
            n * 0.65 +
            shape * 0.35
        );

    }

    //----------------------------------------
    // Höhenkarte
    //----------------------------------------

    getHeight(x, y) {

        const large =
            this.octaveNoise(
                x * 0.025,
                y * 0.025
            );

        const detail =
            this.octaveNoise(
                x * 0.08 + 100,
                y * 0.08 + 100
            );

        return (
            large * 0.75 +
            detail * 0.25
        );

    }

    //----------------------------------------
    // Terrain bestimmen
    //----------------------------------------

    getTerrain(x, y, continent, height) {

        //------------------------------------
        // Wasser
        //------------------------------------

        if (
            continent <
            this.settings.waterLevel
        ) {

            return "water";

        }

        //------------------------------------
        // Strand
        //------------------------------------

        if (
            continent <
            this.settings.beachLevel
        ) {

            return "sand";

        }

        //------------------------------------
        // Berge
        //------------------------------------

  if (height >= this.settings.mountainLevel) {

    const mountainNoise =
        this.octaveNoise(
            x * 0.10 + 500,
            y * 0.10 + 500
        );

    if (mountainNoise > 0.25) {
        return "mountain";
    }

    return "hill";
}

        //------------------------------------
        // Hügel
        //------------------------------------

       if (height >= this.settings.hillLevel) {

    const hillNoise =
        this.octaveNoise(
            x * 0.12 + 300,
            y * 0.12 + 300
        );

    if (hillNoise > 0.27) {
        return "hill";
    }

    return "grass";
}

        //------------------------------------
        // Gras
        //------------------------------------

        return "grass";

    }

    //----------------------------------------
    // Welt erzeugen
    //----------------------------------------

    generate(world) {
let minHeight = 1;
let maxHeight = 0;
let hillCount = 0;
        for (
            let y = 0;
            y < world.height;
            y++
        ) {

            for (
                let x = 0;
                x < world.width;
                x++
            ) {

                const parcel =
                    world.getParcel(x, y);

                //--------------------------------
                // Kontinent
                //--------------------------------

                const continent =
                    this.getContinent(x, y);

                //--------------------------------
                // Höhe
                //--------------------------------

                const height =
                    this.getHeight(x, y);
if (height < minHeight) {
    minHeight = height;
}

if (height > maxHeight) {
    maxHeight = height;
}
if (x === 40 && y === 25) {
    console.log("Testhöhe:", height);
}

                //--------------------------------
                // Speichern
                //--------------------------------

                parcel.height =
                    height;

                //--------------------------------
                // Terrain
                //--------------------------------

                parcel.terrain =
                    this.getTerrain(
    x,
    y,
    continent,
    height
);
if (parcel.terrain === "hill") {
    hillCount++;
}

            }

        }

        //------------------------------------
        // Wälder
        //------------------------------------

     console.log("Höhenbereich:", minHeight, "bis", maxHeight); 
console.log("Hügel:", hillCount); 
 this.generateForests(world);

        //------------------------------------
        // Abschluss
        //------------------------------------

        this.finish(world);

    }

    //----------------------------------------
    // Wälder
    //----------------------------------------

    generateForests(world) {

        for (
            let y = 0;
            y < world.height;
            y++
        ) {

            for (
                let x = 0;
                x < world.width;
                x++
            ) {

                const parcel =
                    world.getParcel(x, y);

                // Nur Gras kann Wald werden
                if (
                    parcel.terrain !== "grass"
                ) {

                    continue;

                }

                const moisture =
                    this.octaveNoise(
                        x * 0.07 + 200,
                        y * 0.07 + 200
                    );

                if (
                    moisture >
                    this.settings.forestLevel
                ) {

                    parcel.terrain =
                        "forest";

                }

            }

        }

    }

    //----------------------------------------
    // Abschluss
    //----------------------------------------

    finish(world) {

        world.seed =
            this.seed;

    }

}