// ============================================
// engine.js
// WorldEngine
// Version 0.1.0
// ============================================

import { AssetManager } from "./assetManager.js";
import { Renderer } from "./renderer.js";
import { Input } from "./input.js";

export class Engine {

    constructor() {

        // Canvas
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Systeme
        this.assetManager = new AssetManager();
        this.input = new Input(this.canvas);

        // Renderer
        this.renderer = null;

        // Zeit
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;

    }

    // ========================================
    // Initialisierung
    // ========================================

    async initialize() {

        this.resize();

        window.addEventListener("resize", () => this.resize());

        this.renderer = new Renderer(this);

    }

    // ========================================
    // Bildschirmgröße
    // ========================================

    resize() {

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

    }

    // ========================================
    // Engine starten
    // ========================================

    start() {

        requestAnimationFrame((time) => this.loop(time));

    }

    // ========================================
    // Hauptschleife
    // ========================================

    loop(time) {

        this.deltaTime = time - this.lastTime;

        this.lastTime = time;

        if (this.deltaTime > 0) {

            this.fps = Math.round(1000 / this.deltaTime);

        }

        this.update();

        this.render();

        requestAnimationFrame((time) => this.loop(time));

    }

    // ========================================
    // Update
    // ========================================

    update() {

        // Später:
        // Kamera
        // Spieler
        // Gebäude
        // NPCs
        // Wirtschaft

    }

    // ========================================
    // Zeichnen
    // ========================================

    render() {

        this.renderer.draw();

    }

}