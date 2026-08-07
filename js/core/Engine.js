// ============================================
// Engine.js
// WorldEngine
// Version 0.3.0
// ============================================

import { Config } from "./Config.js";
import { Renderer } from "./Renderer.js";
import { Input } from "./Input.js";
import { GameClock } from "./GameClock.js";
import { AssetManager } from "../utils/AssetManager.js";

export class Engine {

    constructor() {

        // Version
        this.version = Config.VERSION;

        // Canvas
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Systeme
        this.input = new Input(this);
        this.assets = new AssetManager();
        this.clock = new GameClock();

        // Renderer
        this.renderer = new Renderer(this);

        // Zeit
        this.lastTime = 0;
        this.delta = 0;
        this.fps = 0;

        // Größe
        this.resize();

        window.addEventListener("resize", () => {

            this.resize();

        });

    }

    //----------------------------------------

    resize() {

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

    }

    //----------------------------------------

    start() {

        requestAnimationFrame(
            this.loop.bind(this)
        );

    }

    //----------------------------------------

    loop(time) {

        this.delta = time - this.lastTime;

        this.lastTime = time;

        if (this.delta > 0) {

            this.fps = Math.round(
                1000 / this.delta
            );

        }

        this.update();

        this.render();

        requestAnimationFrame(
            this.loop.bind(this)
        );

    }

    //----------------------------------------

    update() {

        // Spieluhr aktualisieren
        this.clock.update(this.delta / 1000);

        // Kamera
        this.renderer.camera.update();

    }

    //----------------------------------------

    render() {

        this.renderer.draw();

    }

}