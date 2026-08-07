// ============================================
// District.js
// WorldEngine
// Version 0.2.0
// ============================================

export class District {

    constructor(name) {

        this.id = crypto.randomUUID();

        // Allgemein
        this.name = name;

        // Zugehörige Stadt
        this.city = null;

        // Typ
        this.type = "residential";

        // Bevölkerung
        this.population = 0;

        // Kaufkraft (0-200)
        this.buyingPower = 100;

        // Grundstückswert
        this.landValue = 100;

        // Sicherheit
        this.safety = 100;

        // Sauberkeit
        this.cleanliness = 100;

        // Verkehr
        this.traffic = 50;

        // Tourismus
        this.tourism = 0;

        // Attraktivität
        this.attractiveness = 50;

        // Gebäude
        this.buildings = [];

        // Grundstücke
        this.parcels = [];

        // Firmen
        this.companies = [];

    }

    //------------------------------------

    addParcel(parcel){

        this.parcels.push(parcel);

    }

    //------------------------------------

    addBuilding(building){

        this.buildings.push(building);

    }

    //------------------------------------

    addCompany(company){

        this.companies.push(company);

    }

}