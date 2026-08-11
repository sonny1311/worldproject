// ============================================
// BuildingTypes.js
// WorldProject
// Allgemeiner Gebäudekatalog
// ============================================

export const BuildingTypes = {

    // ----------------------------------------
    // Betrieb / Verwaltung
    // ----------------------------------------

    administration: {

        id: "administration",

        name: "Verwaltungsgebäude",

        category: "administration",

        minSize: 50,

        baseBuildCost: 25000,

        baseBuildDays: 3,

        monthlyBaseCost: 250
    },


    // ----------------------------------------
    // Produktion
    // ----------------------------------------

    productionHall: {

        id: "productionHall",

        name: "Produktionshalle",

        category: "production",

        minSize: 100,

        baseBuildCost: 50000,

        baseBuildDays: 6,

        monthlyBaseCost: 500
    },


    // ----------------------------------------
    // Lager
    // ----------------------------------------

    warehouse: {

        id: "warehouse",

        name: "Lagerhalle",

        category: "storage",

        minSize: 100,

        baseBuildCost: 35000,

        baseBuildDays: 5,

        monthlyBaseCost: 350
    },


    // ----------------------------------------
    // Werkstatt
    // ----------------------------------------

    workshop: {

        id: "workshop",

        name: "Werkstatt",

        category: "workshop",

        minSize: 75,

        baseBuildCost: 30000,

        baseBuildDays: 4,

        monthlyBaseCost: 300
    },


    // ----------------------------------------
    // Versand / Logistik
    // ----------------------------------------

    shippingHall: {

        id: "shippingHall",

        name: "Versandhalle",

        category: "logistics",

        minSize: 100,

        baseBuildCost: 40000,

        baseBuildDays: 5,

        monthlyBaseCost: 400
    },


    // ----------------------------------------
    // Verkaufsgebäude
    // ----------------------------------------

    shop: {

        id: "shop",

        name: "Verkaufsgebäude",

        category: "retail",

        minSize: 50,

        baseBuildCost: 30000,

        baseBuildDays: 4,

        monthlyBaseCost: 300
    },


    // ----------------------------------------
    // Fahrzeugbereich
    // ----------------------------------------

    vehicleHall: {

        id: "vehicleHall",

        name: "Fahrzeughalle",

        category: "vehicle",

        minSize: 100,

        baseBuildCost: 45000,

        baseBuildDays: 5,

        monthlyBaseCost: 400
    },


    // ----------------------------------------
    // Sozial / Personal
    // ----------------------------------------

    staffBuilding: {

        id: "staffBuilding",

        name: "Personalgebäude",

        category: "staff",

        minSize: 50,

        baseBuildCost: 25000,

        baseBuildDays: 3,

        monthlyBaseCost: 250
    }

};