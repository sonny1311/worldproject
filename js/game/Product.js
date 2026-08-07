// ============================================
// Product.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Product {

    constructor(id, name) {

        this.id = id;
        this.name = name;

        // Hersteller
        this.manufacturer = "";

        // Kategorie
        this.category = "Sonstiges";

        // Marke (fiktiv)
        this.brand = "";

        // Verpackung
        this.packageType = "Stück";

        // Gewicht (Gramm)
        this.weight = 0;

        // Volumen (ml)
        this.volume = 0;

        // Haltbarkeit (Tage)
        this.shelfLife = -1;

        // Einkaufspreis
        this.purchasePrice = 0;

        // Verkaufspreis
        this.salePrice = 0;

        // UVP
        this.recommendedPrice = 0;

        // Beliebtheit
        this.popularity = 50;

        // Qualität
        this.quality = 50;

        // Regionale Ware
        this.regional = false;

        // Bio
        this.organic = false;

        // Premiumprodukt
        this.premium = false;

        // Saisonartikel
        this.seasonal = false;

        // Mehrwertsteuer
        this.taxRate = 7;

        // Aktiv
        this.active = true;

    }

    //----------------------------------------

    setPurchasePrice(price){

        this.purchasePrice = price;

    }

    //----------------------------------------

    setSalePrice(price){

        this.salePrice = price;

    }

    //----------------------------------------

    getProfit(){

        return this.salePrice - this.purchasePrice;

    }

    //----------------------------------------

    getMargin(){

        if(this.purchasePrice <= 0)
            return 0;

        return ((this.salePrice - this.purchasePrice)
            / this.purchasePrice) * 100;

    }

}