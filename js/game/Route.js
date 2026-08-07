// ============================================
// Route.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Route {

    constructor(name = "") {

        this.id = crypto.randomUUID();

        // Allgemein
        this.name = name;

        // Fahrzeug
        this.vehicle = null;

        // Fahrer
        this.driver = null;

        // Startpunkt
        this.start = null;

        // Zielpunkte
        this.stops = [];

        // Gesamtdistanz (km)
        this.distance = 0;

        // Fahrzeit (Minuten)
        this.duration = 0;

        // Status
        this.status = "planned";

        // Abfahrt
        this.departureTime = null;

        // Ankunft
        this.arrivalTime = null;

        // Priorität
        this.priority = 1;

    }

    //------------------------------------

    addStop(location){

        this.stops.push(location);

    }

    //------------------------------------

    removeStop(index){

        this.stops.splice(index,1);

    }

    //------------------------------------

    clearStops(){

        this.stops = [];

    }

}