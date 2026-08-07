// ============================================
// Branch.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Branch {

    constructor(company, parcel) {

        this.id = crypto.randomUUID();

        // Firma
        this.company = company;

        // Standort
        this.parcel = parcel;

        // Name
        this.name = "";

        // Personal
        this.employees = [];

        // Lager
        this.stock = [];

        // Kassen
        this.cashRegisters = 2;

        // Parkplätze
        this.parkingSpaces = 20;

        // Kunden
        this.customersToday = 0;
        this.customersWaiting = 0;

        // Umsatz
        this.salesToday = 0;
        this.salesMonth = 0;

        // Gewinn
        this.profitToday = 0;
        this.profitMonth = 0;

        // Bewertungen
        this.rating = 5.0;
        this.reviewCount = 0;

        // Öffnungszeiten
        this.openHour = 7;
        this.closeHour = 22;

        // KI
        this.aiEnabled = true;

        // Manager
        this.managers = [];

    }

    //----------------------------------------

    addEmployee(employee){

        employee.branch = this;

        this.employees.push(employee);

    }

    //----------------------------------------

    addSale(amount){

        this.salesToday += amount;

        this.salesMonth += amount;

        this.customersToday++;

    }

    //----------------------------------------

    addManager(manager){

        this.managers.push(manager);

    }

}