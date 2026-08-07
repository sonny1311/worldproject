// ============================================
// Parcel.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Parcel {

    constructor(x, y) {

        // Position
        this.x = x;
        this.y = y;

        // Eigentum
        this.owner = null;

        // Gebäude
        this.building = null;

        // Gelände
        this.terrain = "grass";

// Höhe
this.height = 0;

        // Straße vorhanden
        this.hasRoad = false;

        // Wasser
        this.hasWater = false;

        // Strom
        this.hasPower = false;

        // Wert des Grundstücks
        this.landValue = 100;

        // Einnahmen
        this.income = 0;

        // Bewohner
        this.population = 0;

        // Besucher
        this.visitors = 0;

        // Attraktivität
        this.attractiveness = 0;

        // Nachbarfelder
        this.neighbours = [];

        // Ob bereits gekauft
        this.purchased = false;

    }

    //------------------------------------
    // Grundstück kaufen
    //------------------------------------

    buy(playerId){

        if(this.purchased){

            return false;

        }

        this.owner = playerId;

        this.purchased = true;

        return true;

    }

    //------------------------------------
    // Gebäude setzen
    //------------------------------------

    setBuilding(building){

        this.building = building;

    }

    //------------------------------------
    // Einkommen setzen
    //------------------------------------

    setIncome(value){

        this.income = value;

    }

}