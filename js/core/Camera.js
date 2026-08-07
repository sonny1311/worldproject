// ============================================
// Camera.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Camera {

    constructor(engine) {

        this.engine = engine;

        // Position
        this.x = 0;
        this.y = 0;

        // Zielposition
        this.targetX = 0;
        this.targetY = 0;

        // Zoom
        this.zoom = 1;
        this.targetZoom = 1;

        this.minZoom = 0.35;
        this.maxZoom = 4.0;

        // Geschwindigkeit
        this.moveSpeed = 0.15;
        this.zoomSpeed = 0.15;

    }

    //----------------------------------------

    update() {

        this.x += (this.targetX - this.x) * this.moveSpeed;
        this.y += (this.targetY - this.y) * this.moveSpeed;

        this.zoom +=
            (this.targetZoom - this.zoom) * this.zoomSpeed;

    }

    //----------------------------------------

    move(dx, dy) {

        this.targetX += dx;

        this.targetY += dy;

    }

    //----------------------------------------

    setZoom(value) {

        this.targetZoom = Math.max(

            this.minZoom,

            Math.min(

                this.maxZoom,

                value

            )

        );

    }

}export class Camera {}