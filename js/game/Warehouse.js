// ============================================
// Warehouse.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Warehouse {

    constructor(name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.name = name;

        // Besitzer
        this.company = null;

        // Standort
        this.city = null;

        this.parcel = null;

        // Lagerkapazität (kg)
        this.capacity = 100000;

        // Aktuelle Belegung
        this.usedCapacity = 0;

        // Warenbestand
        this.stock = [];

        // LKW
        this.vehicles = [];

        // Verladerampen
        this.loadingDocks = 4;

        // Mitarbeiter
        this.employees = [];

        // Eingehende Lieferungen
        this.incomingDeliveries = [];

        // Ausgehende Lieferungen
        this.outgoingDeliveries = [];

        // Automatisierung
        this.aiEnabled = true;

    }

    //----------------------------------------

    addVehicle(vehicle){

        this.vehicles.push(vehicle);

    }

    //----------------------------------------

    addEmployee(employee){

        this.employees.push(employee);

    }

    //----------------------------------------

    addStock(item){

        this.stock.push(item);

    }

    //----------------------------------------

    getFreeCapacity(){

        return this.capacity - this.usedCapacity;

    }

}