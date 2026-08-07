// ============================================
// Recipe.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Recipe {

    constructor(id, name) {

        this.id = id;

        // Allgemein
        this.name = name;
        this.description = "";

        // Besitzer
        this.company = null;

        // Produkt
        this.product = null;

        // Zutaten
        this.ingredients = [];

        // Herstellungskosten
        this.productionCost = 0;

        // Produktionszeit (Minuten)
        this.productionTime = 0;

        // Qualität (0-100)
        this.quality = 50;

        // Geschmack (0-100)
        this.taste = 50;

        // Nachhaltigkeit (0-100)
        this.sustainability = 50;

        // Bekanntheit
        this.popularity = 0;

        // Patentiert
        this.patented = false;

        // Geheimrezept
        this.secretRecipe = false;

        // Version
        this.version = 1;

    }

    //----------------------------------------

    addIngredient(product, quantity){

        this.ingredients.push({

            product,
            quantity

        });

    }

    //----------------------------------------

    improveQuality(value){

        this.quality = Math.min(
            100,
            this.quality + value
        );

    }

    //----------------------------------------

    improveTaste(value){

        this.taste = Math.min(
            100,
            this.taste + value
        );

    }

    //----------------------------------------

    nextVersion(){

        this.version++;

    }

}