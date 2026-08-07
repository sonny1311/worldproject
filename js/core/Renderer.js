// ============================================
// Renderer.js
// WorldEngine
// Version 0.4.1
// ============================================

import { World } from "../world/World.js";
import { Terrain } from "../world/Terrain.js";

export class Renderer {

    constructor(engine) {

        this.engine = engine;

        this.world = new World(80, 50);

        this.camera = {

            x: 0,
            y: 0,
            zoom: 1,

            update() {}

        };

        this.tileSize = 32;

        this.waterAnimation = 0;

    }

    //----------------------------------------
    // Hauptfunktion
    //----------------------------------------

    draw() {

        this.waterAnimation += 0.05;

        const ctx = this.engine.ctx;
        const canvas = this.engine.canvas;

        //------------------------------------
        // Himmel
        //------------------------------------

        ctx.fillStyle = "#87CEEB";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        //------------------------------------
        // Welt
        //------------------------------------

        for(let y=0;y<this.world.height;y++){

            for(let x=0;x<this.world.width;x++){

                const parcel =
                    this.world.getParcel(x,y);

                const terrain =
                    Terrain.get(parcel.terrain);

                const px =
                    x*this.tileSize;

                const py =
                    y*this.tileSize;

                //--------------------------------
                // Boden
                //--------------------------------

                ctx.fillStyle =
                    terrain.color;

                ctx.fillRect(

                    px,
                    py,

                    this.tileSize,
                    this.tileSize

                );

                //--------------------------------
                // Details
                //--------------------------------

                switch(parcel.terrain){

                    case "grass":

                        this.drawGrass(

                            ctx,

                            x,
                            y,

                            px,
                            py

                        );

                        break;

                    case "forest":

                        this.drawForest(

                            ctx,

                            x,
                            y,

                            px,
                            py

                        );

                        break;

                    case "water":

                        this.drawWater(

                            ctx,

                            x,
                            y,

                            px,
                            py

                        );

                        break;

                    case "sand":

                        this.drawSand(

                            ctx,

                            x,
                            y,

                            px,
                            py

                        );

                        break;

                }

                //--------------------------------
                // Raster
                //--------------------------------

                ctx.strokeStyle =
                    "#00000018";

                ctx.strokeRect(

                    px,

                    py,

                    this.tileSize,

                    this.tileSize

                );
//----------------------------------------
// Auswahl
//----------------------------------------

if (
    this.engine.selection.hasSelection() &&
    this.engine.selection.selectedX === x &&
    this.engine.selection.selectedY === y
) {

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;

    ctx.strokeRect(

        px + 1,
        py + 1,

        this.tileSize - 2,
        this.tileSize - 2

    );

}

            }

        }

        //------------------------------------
        // HUD
        //------------------------------------

        this.drawHud(ctx);

    }

    //----------------------------------------
    // Gras
    //----------------------------------------

    drawGrass(ctx,x,y,px,py){

        if((x*13+y*7)%5!==0)
            return;

        ctx.fillStyle="#7ED957";

        ctx.fillRect(
            px+10,
            py+14,
            2,
            6
        );

        ctx.fillRect(
            px+16,
            py+12,
            2,
            8
        );

        ctx.fillRect(
            px+20,
            py+15,
            2,
            5
        );

    }

    //----------------------------------------
    // Wald
    //----------------------------------------

    drawForest(ctx,x,y,px,py){
                const variant = (x * 17 + y * 29) % 3;

        //------------------------------------
        // Schatten
        //------------------------------------

        ctx.fillStyle = "rgba(0,0,0,0.15)";

        ctx.beginPath();

        ctx.ellipse(

            px + 16,
            py + 22,

            8,
            4,

            0,
            0,
            Math.PI * 2

        );

        ctx.fill();

        //------------------------------------
        // Baumarten
        //------------------------------------

        switch (variant) {

            //----------------------------
            // Runde Krone
            //----------------------------

            case 0:

                ctx.fillStyle = "#2E7D32";

                ctx.beginPath();

                ctx.arc(
                    px + 16,
                    py + 13,
                    9,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                break;

            //----------------------------
            // Große Krone
            //----------------------------

            case 1:

                ctx.fillStyle = "#388E3C";

                ctx.beginPath();

                ctx.arc(
                    px + 16,
                    py + 10,
                    10,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    px + 12,
                    py + 15,
                    6,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    px + 20,
                    py + 15,
                    6,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                break;

            //----------------------------
            // Tanne
            //----------------------------

            default:

                ctx.fillStyle = "#1B5E20";

                ctx.beginPath();

                ctx.moveTo(px + 16, py + 4);
                ctx.lineTo(px + 8, py + 18);
                ctx.lineTo(px + 24, py + 18);

                ctx.closePath();

                ctx.fill();

                ctx.beginPath();

                ctx.moveTo(px + 16, py + 8);
                ctx.lineTo(px + 10, py + 22);
                ctx.lineTo(px + 22, py + 22);

                ctx.closePath();

                ctx.fill();

        }

        //------------------------------------
        // Stamm
        //------------------------------------

        ctx.fillStyle = "#6D4C41";

        ctx.fillRect(

            px + 14,
            py + 18,

            4,
            8

        );

    }

    //----------------------------------------
    // Wasser
    //----------------------------------------

    drawWater(ctx, x, y, px, py) {

        const wave = Math.sin(

            this.waterAnimation +
            (x * 0.6) +
            (y * 0.3)

        ) * 2;

        ctx.strokeStyle = "#AEEBFF";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            px + 6,
            py + 16 + wave
        );

        ctx.lineTo(
            px + 26,
            py + 16 - wave
        );

        ctx.stroke();

    }

    //----------------------------------------
    // Sand
    //----------------------------------------

    drawSand(ctx, x, y, px, py) {

        if ((x * 7 + y * 13) % 4 !== 0)
            return;

        ctx.fillStyle = "#F4E3A3";

        ctx.beginPath();

        ctx.arc(

            px + 18,
            py + 12,

            2,

            0,

            Math.PI * 2

        );

        ctx.fill();

    }
        //----------------------------------------
    // HUD
    //----------------------------------------

    drawHud(ctx) {

        // FPS glätten
        if (!this.displayFPS) {

            this.displayFPS = this.engine.fps;

        }

        this.displayFPS +=
            (this.engine.fps - this.displayFPS) * 0.08;

        //------------------------------------

        ctx.fillStyle = "rgba(0,0,0,0.35)";

        ctx.fillRect(

            10,
            10,

            230,
            180

        );

        //------------------------------------

        ctx.fillStyle = "#FFFFFF";

        ctx.font = "bold 20px Arial";

        ctx.fillText(

            "World Engine",

            20,

            35

        );

        //------------------------------------

        ctx.font = "16px Arial";

      ctx.fillText(

    this.engine.clock.getTimeString(),

    20,

    58

);

        ctx.fillText(

    "FPS: " + Math.round(this.displayFPS),

    20,

    78

);

ctx.font = "12px Arial";

ctx.fillText(

    "Engine " + this.engine.version,

    20,

    96

);

if (this.engine.selection.hasSelection()) {

    const parcel = this.engine.renderer.world.getParcel(

        this.engine.selection.selectedX,
        this.engine.selection.selectedY

    );

    ctx.font = "14px Arial";

    ctx.fillText(

        "Feld: " +
        this.engine.selection.selectedX +
        " / " +
        this.engine.selection.selectedY,

        20,
        122

    );

    ctx.fillText(

        "Terrain: " + parcel.terrain,

        20,
        142

    );

    ctx.fillText(

        "Höhe: " + parcel.height.toFixed(2),

        20,
        162

    );

}
}
}
