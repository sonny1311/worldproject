// ============================================
// ProductionLine.js
// WorldEngine
// Version 0.2.0
// ============================================

export class ProductionLine {

    constructor(name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.name = name;

        // Besitzer
        this.company = null;

        // Fabrik
        this.building = null;

        // Produkt
        this.product = null;

        // Rezept
        this.recipe = null;

        // Produktionsschritte
        this.steps = [];

        // Status
        this.active = true;

        // Auslastung (%)
        this.utilization = 100;

        // Geschwindigkeit (%)
        this.speed = 100;

        // Qualität (%)
        this.quality = 100;

        // Ausschuss (%)
        this.waste = 0;

        // Mitarbeiter
        this.employees = [];

        // Roboter
        this.robots = [];

        // Warteschlange
        this.queue = [];

        // Tagesproduktion
        this.productionToday = 0;

        // Monatsproduktion
        this.productionMonth = 0;

    }

    //----------------------------------------

    addStep(step){

        this.steps.push(step);

    }

    //----------------------------------------

    addEmployee(employee){

        this.employees.push(employee);

    }

    //----------------------------------------

    addRobot(robot){

        this.robots.push(robot);

    }

    //----------------------------------------

    start(){

        this.active = true;

    }

    //----------------------------------------

    stop(){

        this.active = false;

    }

}