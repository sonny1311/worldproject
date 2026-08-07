// ============================================
// Company.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Company {

    constructor(type, name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.type = type;
        this.name = name;

        // Besitzer
        this.owner = null;

        // Geld
        this.balance = 100000;

        // Ruf
        this.reputation = 50;

        // Kunden
        this.customersToday = 0;
        this.customersTotal = 0;

        // Umsatz
        this.salesToday = 0;
        this.salesMonth = 0;
        this.salesTotal = 0;

        // Gewinn
        this.profitToday = 0;
        this.profitMonth = 0;

        // Mitarbeiter
        this.employees = [];

        // Gebäude
        this.buildings = [];

        // Lager
        this.stock = [];

        // Angebote
        this.offers = [];

        // Bewertungen
        this.reviews = [];

        // Automatisierung
        this.aiEnabled = true;

    }

    //------------------------------------

    addEmployee(employee){

        this.employees.push(employee);

    }

    //------------------------------------

    addBuilding(building){

        this.buildings.push(building);

    }

    //------------------------------------

    addSale(amount){

        this.salesToday += amount;
        this.salesMonth += amount;
        this.salesTotal += amount;

        this.balance += amount;

    }

}