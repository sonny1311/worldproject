// ============================================
// WorldRenderer.js
// WorldEngine
// Version 0.2.0
// ============================================

export class WorldRenderer {

    constructor(engine, world, camera) {

        this.engine = engine;

        this.world = world;

        this.camera = camera;

    }

    //----------------------------------------
    // Welt zeichnen
    //----------------------------------------

    draw(ctx) {

        for (let y = 0; y < this.world.height; y++) {

            for (let x = 0; x < this.world.width; x++) {

                const parcel = this.world.getParcel(x, y);

                this.drawParcel(ctx, parcel);

            }

        }

    }

    //----------------------------------------
    // Grundstück zeichnen
    //----------------------------------------

    drawParcel(ctx, parcel) {

        const tileWidth = 64;
        const tileHeight = 32;

        const screenX =
            (parcel.x - parcel.y) * tileWidth / 2;

        const screenY =
            (parcel.x + parcel.y) * tileHeight / 2;

        let color = "#73c96a";

        switch (parcel.terrain) {

            case "forest":
                color = "#2e8b57";
                break;

            case "water":
                color = "#4aa8ff";
                break;

            case "field":
                color = "#d6c06c";
                break;

        }

        ctx.beginPath();

        ctx.moveTo(
            screenX,
            screenY
        );

        ctx.lineTo(
            screenX + tileWidth / 2,
            screenY + tileHeight / 2
        );

        ctx.lineTo(
            screenX,
            screenY + tileHeight
        );

        ctx.lineTo(
            screenX - tileWidth / 2,
            screenY + tileHeight / 2
        );

        ctx.closePath();

        ctx.fillStyle = color;

        ctx.fill();

        ctx.strokeStyle = "rgba(0,0,0,0.12)";

        ctx.stroke();

    }

}