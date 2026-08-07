// ============================================
// WorldGenerator.js
// WorldEngine
// Version 2.0.0
// ============================================

export class WorldGenerator {

    constructor(seed = Date.now()) {

        this.seed = seed;

    }

    //----------------------------------------
    // Seed-Zufall
    //----------------------------------------

    random(x, y) {

        let n =
            x * 374761393 +
            y * 668265263 +
            this.seed * 1447;

        n = (n ^ (n >> 13)) * 1274126177;

        return ((n ^ (n >> 16)) >>> 0) / 4294967295;

    }

    //----------------------------------------

    lerp(a, b, t) {

        return a + (b - a) * t;

    }

    //----------------------------------------

    smooth(t) {

        return t * t * (3 - 2 * t);

    }

    //----------------------------------------
    // Value Noise
    //----------------------------------------

    noise(x, y) {

        const ix = Math.floor(x);
        const iy = Math.floor(y);

        const fx = x - ix;
        const fy = y - iy;

        const a = this.random(ix, iy);
        const b = this.random(ix + 1, iy);
        const c = this.random(ix, iy + 1);
        const d = this.random(ix + 1, iy + 1);

        const i1 = this.lerp(a, b, this.smooth(fx));
        const i2 = this.lerp(c, d, this.smooth(fx));

        return this.lerp(i1, i2, this.smooth(fy));

    }

    //----------------------------------------
    // Mehrere Noise-Ebenen
    //----------------------------------------

    octaveNoise(x, y) {

        let value = 0;
        let amp = 1;
        let freq = 1;
        let max = 0;

        for (let i = 0; i < 5; i++) {

            value +=
                this.noise(
                    x * freq,
                    y * freq
                ) * amp;

            max += amp;

            amp *= 0.5;
            freq *= 2;

        }

        return value / max;

    }

    //----------------------------------------
    // Welt erzeugen
    //----------------------------------------

  generate(world) {

    for (let y = 0; y < world.height; y++) {

        for (let x = 0; x < world.width; x++) {

            const parcel = world.getParcel(x, y);

            const h =
                this.octaveNoise(
                    x * 0.04,
                    y * 0.04
                );

            parcel.height = h;

            if (h < 0.30) {

                parcel.terrain = "water";

            }

            else if (h < 0.36) {

                parcel.terrain = "sand";

            }

            else {

                parcel.terrain = "grass";

            }

        }

    }

    this.generateForests(world);

    this.generateBeaches(world);

    this.smooth(world);

    this.finish(world);

        //----------------------------------------
    // Wälder erzeugen
    //----------------------------------------

    generateForests(world) {

        for (let y = 0; y < world.height; y++) {

            for (let x = 0; x < world.width; x++) {

                const parcel = world.getParcel(x, y);

                if (parcel.terrain !== "grass")
                    continue;

                if (this.octaveNoise(x * 0.08 + 10, y * 0.08 + 10) > 0.62) {

                    parcel.terrain = "forest";

                }

            }

        }

    }

    //----------------------------------------

    generateBeaches(world) {

        // Platzhalter
    }

    //----------------------------------------

    smooth(world) {

        // Platzhalter
    }

    //----------------------------------------

    finish(world) {

        world.seed = this.seed;

    }

}
}