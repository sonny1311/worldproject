// ============================================
// TaskManager.js
// WorldEngine
// Version 0.2.0
// ============================================

export class TaskManager {

    constructor() {

        // Alle Aufgaben
        this.tasks = [];

        // Warteschlangen
        this.pending = [];

        this.running = [];

        this.completed = [];

        this.cancelled = [];

    }

    //----------------------------------------

    addTask(task){

        this.tasks.push(task);

        this.pending.push(task);

    }

    //----------------------------------------

    startTask(task){

        task.start();

        this.pending = this.pending.filter(

            t => t.id !== task.id

        );

        this.running.push(task);

    }

    //----------------------------------------

    completeTask(task){

        task.complete();

        this.running = this.running.filter(

            t => t.id !== task.id

        );

        this.completed.push(task);

    }

    //----------------------------------------

    cancelTask(task){

        task.cancel();

        this.pending = this.pending.filter(

            t => t.id !== task.id

        );

        this.running = this.running.filter(

            t => t.id !== task.id

        );

        this.cancelled.push(task);

    }

    //----------------------------------------

    update(){

        for(const task of this.running){

            // Später:
            // Fortschritt berechnen
            // Mitarbeiter prüfen
            // Fahrzeuge prüfen
            // Gebäude prüfen

        }

    }

    //----------------------------------------

    getOpenTasks(){

        return this.pending.length;

    }

    //----------------------------------------

    getRunningTasks(){

        return this.running.length;

    }

}