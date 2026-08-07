// ============================================
// Task.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Task {

    constructor(type, title) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.type = type;
        this.title = title;

        this.description = "";

        // Priorität
        // 1 = niedrig
        // 2 = normal
        // 3 = hoch
        // 4 = kritisch
        this.priority = 2;

        // Status
        // pending
        // running
        // completed
        // cancelled
        this.status = "pending";

        // Verantwortlich
        this.manager = null;

        this.employee = null;

        this.vehicle = null;

        this.building = null;

        // Zeit
        this.createdAt = new Date();

        this.startedAt = null;

        this.finishedAt = null;

        // Dauer (Minuten)
        this.duration = 0;

        // Fortschritt
        this.progress = 0;

        // Kosten
        this.cost = 0;

        // Belohnung / Nutzen
        this.reward = 0;

    }

    //----------------------------------------

    start(){

        this.status = "running";

        this.startedAt = new Date();

    }

    //----------------------------------------

    update(progress){

        this.progress = progress;

        if(this.progress >= 100){

            this.complete();

        }

    }

    //----------------------------------------

    complete(){

        this.progress = 100;

        this.status = "completed";

        this.finishedAt = new Date();

    }

    //----------------------------------------

    cancel(){

        this.status = "cancelled";

    }

}