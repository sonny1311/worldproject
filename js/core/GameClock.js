// ============================================
// GameClock.js
// WorldEngine
// Version 1.0.0
// ============================================

export class GameClock {

    constructor() {

        // 08:00 Uhr Start
        this.minutes = 8 * 60;

        // Spielgeschwindigkeit
        this.speed = 10;

    }

    //----------------------------------------

    update(delta) {

        this.minutes += delta * this.speed;

        if (this.minutes >= 1440) {

            this.minutes -= 1440;

        }

    }

    //----------------------------------------

    getHour() {

        return Math.floor(this.minutes / 60);

    }

    //----------------------------------------

    getMinute() {

        return Math.floor(this.minutes % 60);

    }

    //----------------------------------------

    getTimeString() {

        const h = String(this.getHour()).padStart(2, "0");
        const m = String(this.getMinute()).padStart(2, "0");

        return h + ":" + m;

    }

}