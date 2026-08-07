// ============================================
// StockItem.js
// WorldEngine
// Version 0.2.0
// ============================================

export class StockItem {

    constructor(id, name) {

        this.id = id;
        this.name = name;

        // Kategorie
        this.category = "general";

        // Bestand
        this.quantity = 0;

        // Mindestbestand
        this.minimumStock = 50;

        // Maximalbestand
        this.maximumStock = 500;

        // Einkaufspreis
        this.purchasePrice = 0;

        // Verkaufspreis
        this.salePrice = 0;

        // Aktueller Einkaufspreis
        this.currentSupplierPrice = 0;

        // Lieferzeit
        this.deliveryDays = 1;

        // Verkaufte Menge
        this.soldToday = 0;
        this.soldWeek = 0;
        this.soldMonth = 0;

        // Haltbarkeit
        this.expirationDays = -1;

        // Automatische Bestellung
        this.autoOrder = true;

        // KI-Vorschlag
        this.recommendedOrder = 0;

        // Beliebtheit
        this.popularity = 50;

        // Gewinn
        this.profit = 0;

    }

    //------------------------------------------

    add(quantity){

        this.quantity += quantity;

    }

    //------------------------------------------

    remove(quantity){

        this.quantity -= quantity;

        if(this.quantity < 0)
            this.quantity = 0;

    }

    //------------------------------------------

    calculateProfit(){

        this.profit =

            this.salePrice -

            this.purchasePrice;

    }

}