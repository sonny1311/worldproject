// ============================================
// Brand.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Brand {

    constructor(name) {

        this.id = crypto.randomUUID();

        // Name
        this.name = name;

        // Besitzer
        this.company = null;

        // Bekanntheit
        this.awareness = 0;

        // Vertrauen
        this.trust = 50;

        // Qualität
        this.quality = 50;

        // Beliebtheit
        this.popularity = 50;

        // Marktanteil
        this.marketShare = 0;

        // Werbung
        this.advertising = 0;

        // Image
        this.image = 50;

        // Produkte
        this.products = [];

        // Kundenbewertungen
        this.rating = 5.0;

        // Anzahl Bewertungen
        this.reviewCount = 0;

    }

    //--------------------------------------

    addProduct(product){

        this.products.push(product);

    }

    //--------------------------------------

    increaseAwareness(value){

        this.awareness += value;

        if(this.awareness > 100)
            this.awareness = 100;

    }

    //--------------------------------------

    improveImage(value){

        this.image += value;

        if(this.image > 100)
            this.image = 100;

    }

    //--------------------------------------

    improveTrust(value){

        this.trust += value;

        if(this.trust > 100)
            this.trust = 100;

    }

}