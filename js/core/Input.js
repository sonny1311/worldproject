// ============================================
// Input.js
// WorldEngine
// Version 0.3.0
// ============================================

export class Input {

    constructor(engine) {

        this.engine = engine;

        this.keys = {};

        this.mouse = {

            x: 0,
            y: 0,

            left: false,
            middle: false,
            right: false,

            wheel: 0,
click: false,

        };

        this.initialize();

    }

    //----------------------------------------

    initialize() {

        const canvas = this.engine.canvas;

        window.addEventListener("keydown", (e) => {

            this.keys[e.code] = true;

        });

        window.addEventListener("keyup", (e) => {

            this.keys[e.code] = false;

        });

        canvas.addEventListener("mousemove", (e) => {

            const rect = canvas.getBoundingClientRect();

            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;

        });

        canvas.addEventListener("mousedown", (e) => {

            switch (e.button) {

                case 0:
    this.mouse.left = true;
    this.mouse.click = true;
    break;

                case 1:
                    this.mouse.middle = true;
                    break;

                case 2:
                    this.mouse.right = true;
                    break;

            }

        });

        window.addEventListener("mouseup", (e) => {

            switch (e.button) {

                case 0:
                    this.mouse.left = false;
                    break;

                case 1:
                    this.mouse.middle = false;
                    break;

                case 2:
                    this.mouse.right = false;
                    break;

            }

        });

        canvas.addEventListener("wheel", (e) => {

            this.mouse.wheel = e.deltaY;

        });

        canvas.addEventListener("contextmenu", (e) => {

            e.preventDefault();

        });

    }

    //----------------------------------------

    isKeyDown(key) {

        return this.keys[key] === true;

    }
//----------------------------------------

consumeClick() {

    const clicked = this.mouse.click;

    this.mouse.click = false;

    return clicked;

}
}