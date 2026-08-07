// ============================================
// City.js
// WorldEngine
// Version 0.2.0
// ============================================

export class City {

    constructor(name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.name = name;

        this.country = "Deutschland";

        // Bevölkerung
        this.population = 0;

        this.households = 0;

        // Wirtschaft
        this.jobs = 0;

        this.unemployment = 0;

        this.averageIncome = 2500;

        this.buyingPower = 100;

        // Tourismus
        this.tourists = 0;

        // Zufriedenheit
        this.happiness = 75;

        // Steuern
        this.taxRate = 15;

        // Grundstückspreise
        this.landValue = 100;

        // Unternehmen
        this.companies = [];

        // Stadtteile
        this.districts = [];

        // Gebäude
        this.buildings = [];

        // Straßen
        this.roads = [];

        // Einwohner
        this.citizens = [];

    }

    //----------------------------------------

    addCitizen(citizen){

        this.citizens.push(citizen);

        this.population++;

    }

    //----------------------------------------

    addCompany(company){

        this.companies.push(company);

    }

    //----------------------------------------

    addBuilding(building){

        this.buildings.push(building);

    }

}