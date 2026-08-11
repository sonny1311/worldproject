// ============================================
// ManagerTypes.js
// WorldProject
// Manager-Katalog
// ============================================

export const ManagerTypes = {

    // ----------------------------------------
    // Einkauf
    // ----------------------------------------

    purchasingManager: {

        id: "purchasingManager",

        name: "Einkaufsleiter",

        areas: [
            "purchasing"
        ],

        effects: {

            purchasePriceReductionPercent: 5,

            supplierConditionsPercent: 3
        }
    },


    // ----------------------------------------
    // Warenverwaltung
    // ----------------------------------------

    goodsManager: {

        id: "goodsManager",

        name: "Warenmanager",

        areas: [
            "inventory",
            "warehouse"
        ],

        effects: {

            inventoryEfficiencyPercent: 5,

            storageLossReductionPercent: 5
        }
    },


    // ----------------------------------------
    // Verkauf
    // ----------------------------------------

    salesManager: {

        id: "salesManager",

        name: "Verkaufsleiter",

        areas: [
            "sales"
        ],

        effects: {

            salesPerformancePercent: 5
        }
    },


    // ----------------------------------------
    // Personal
    // ----------------------------------------

    personnelManager: {

        id: "personnelManager",

        name: "Personalmanager",

        areas: [
            "personnel"
        ],

        effects: {

            personnelEfficiencyPercent: 5
        }
    },


    // ----------------------------------------
    // Bau
    // ----------------------------------------

    constructionManager: {

        id: "constructionManager",

        name: "Bauleiter",

        areas: [
            "construction"
        ],

        effects: {

            buildTimeReductionPercent: 5
        }
    },


    // ----------------------------------------
    // Produktion
    // ----------------------------------------

    productionManager: {

        id: "productionManager",

        name: "Produktionsleiter",

        areas: [
            "production"
        ],

        effects: {

            productionEfficiencyPercent: 5
        }
    },


    // ----------------------------------------
    // Logistik
    // ----------------------------------------

    logisticsManager: {

        id: "logisticsManager",

        name: "Logistikleiter",

        areas: [
            "logistics"
        ],

        effects: {

            logisticsEfficiencyPercent: 5
        }
    },


    // ----------------------------------------
    // Immobilien
    // ----------------------------------------

    propertyManager: {

        id: "propertyManager",

        name: "Immobilienmanager",

        areas: [
            "property"
        ],

        effects: {

            rentalEfficiencyPercent: 5,

            vacancyReductionPercent: 5
        }
    }

};
