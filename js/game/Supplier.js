// ============================================
// Supplier.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Supplier {

    constructor(name) {

        this.id = crypto.randomUUID();

        // Name
        this.name = name;

        // Kategorie
        this.category = "General";

        // Standort
        this.city = "";
        this.country = "Deutschland";

        // Bewertung
        this.rating = 5.0;

        // Lieferqualität
        this.quality = 80;

        // Liefergeschwindigkeit
        this.deliverySpeed = 80;

        // Zuverlässigkeit
        this.reliability = 90;

        // Preise
        this.priceLevel = 100;

        // Sortiment
        this.products = [];

        // Mindestbestellwert
        this.minimumOrderValue = 0;

        // Versandkosten
        this.shippingCosts = 0;

        // Kostenloser Versand ab
        this.freeShippingFrom = 0;

        // Lieferzeit
        this.deliveryDays = 2;

        // Eigene LKW vorhanden
        this.hasOwnFleet = true;

        // Reputation
        this.reputation = 50;

        // Aktiv
        this.active = true;

    }

    //----------------------------------------

    addProduct(product){

        this.products.push(product);

    }

    //----------------------------------------

    removeProduct(productId){

        this.products = this.products.filter(

            product => product.id !== productId

        );

    }

    //----------------------------------------

    getProduct(productId){

        return this.products.find(

            product => product.id === productId

        );

    }

}