// ============================================
// Vehicle.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Vehicle {

    constructor(type, name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.type = type;
        this.name = name;

        // Besitzer
        this.company = null;

        // Fahrer
        this.driver = null;

        // Position
        this.position = {
            x: 0,
            y: 0
        };

        // Ziel
        this.destination = null;

        // Geschwindigkeit (km/h)
        this.speed = 80;

        // Kraftstoff
        this.fuel = 100;

        // Tankgröße
        this.fuelCapacity = 100;

        // Verbrauch (Liter / 100 km)
        this.fuelConsumption = 28;

        // Kilometerstand
        this.mileage = 0;

        // Zustand
        this.condition = 100;

        // Wartung
        this.serviceInterval = 50000;

        // Beladung
        this.load = [];

        // Maximale Nutzlast (kg)
        this.maxPayload = 24000;

        // Aktuelle Nutzlast
        this.currentPayload = 0;

        // Tour
        this.route = [];

        // Status
        this.status = "idle";

    }

    //----------------------------------------

    addCargo(item, quantity) {

        this.load.push({

            item,
            quantity

        });

    }

    //----------------------------------------

    clearCargo() {

        this.load = [];

        this.currentPayload = 0;

    }

    //----------------------------------------

    setDestination(destination) {

        this.destination = destination;

    }

}