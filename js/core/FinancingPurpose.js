// ============================================
// FinancingPurpose.js
// WorldProject
//
// Allgemeine Finanzierungszwecke.
//
// Legt fest:
// - wofür Kredite genutzt werden
// - welche Banktypen geeignet sind
// - ob Eigenkapital erforderlich ist
// - typische Mindest-Eigenkapitalquote
// ============================================

export const FinancingPurpose = {


    // ========================================
    // BETRIEBSMITTEL
    // ========================================

    workingCapital: {

        id:
            "workingCapital",

        name:
            "Betriebsmittelkredit",

        category:
            "business",

        suitableBankTypes: [

            "regional",

            "business",

            "risk",

            "premium"
        ],

        requiresCollateral:
            false,

        minimumEquityPercent:
            0
    },


    // ========================================
    // GEBÄUDE
    // ========================================

    building: {

        id:
            "building",

        name:
            "Gebäudefinanzierung",

        category:
            "property",

        suitableBankTypes: [

            "regional",

            "business",

            "property",

            "premium",

            "risk"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            15
    },


    // ========================================
    // GRUNDSTÜCK
    // ========================================

    land: {

        id:
            "land",

        name:
            "Grundstücksfinanzierung",

        category:
            "property",

        suitableBankTypes: [

            "property",

            "business",

            "premium",

            "regional"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            20
    },


    // ========================================
    // WOHNIMMOBILIE
    // ========================================

    residentialProperty: {

        id:
            "residentialProperty",

        name:
            "Wohnimmobilienfinanzierung",

        category:
            "property",

        suitableBankTypes: [

            "property",

            "business",

            "premium",

            "regional"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            20
    },


    // ========================================
    // GEWERBEIMMOBILIE
    // ========================================

    commercialProperty: {

        id:
            "commercialProperty",

        name:
            "Gewerbeimmobilienfinanzierung",

        category:
            "property",

        suitableBankTypes: [

            "property",

            "business",

            "premium",

            "regional",

            "risk"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            20
    },


    // ========================================
    // LKW / NUTZFAHRZEUG
    // ========================================

    truck: {

        id:
            "truck",

        name:
            "LKW-Finanzierung",

        category:
            "vehicle",

        suitableBankTypes: [

            "vehicle",

            "business",

            "regional",

            "premium",

            "risk"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            10
    },


    // ========================================
    // TRANSPORTER
    // ========================================

    van: {

        id:
            "van",

        name:
            "Transporter-Finanzierung",

        category:
            "vehicle",

        suitableBankTypes: [

            "vehicle",

            "business",

            "regional",

            "risk"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            10
    },


    // ========================================
    // MASCHINEN / PRODUKTIONSANLAGEN
    // ========================================

    machinery: {

        id:
            "machinery",

        name:
            "Maschinenfinanzierung",

        category:
            "equipment",

        suitableBankTypes: [

            "equipment",

            "business",

            "regional",

            "premium",

            "risk"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            15
    },


    // ========================================
    // BETRIEBSAUSSTATTUNG
    // ========================================

    equipment: {

        id:
            "equipment",

        name:
            "Betriebsausstattung",

        category:
            "equipment",

        suitableBankTypes: [

            "equipment",

            "business",

            "regional",

            "risk"
        ],

        requiresCollateral:
            false,

        minimumEquityPercent:
            10
    },


    // ========================================
    // LAGERBESTAND / WARENEINKAUF
    // ========================================

    inventory: {

        id:
            "inventory",

        name:
            "Waren- und Lagerfinanzierung",

        category:
            "business",

        suitableBankTypes: [

            "regional",

            "business",

            "risk",

            "premium"
        ],

        requiresCollateral:
            false,

        minimumEquityPercent:
            0
    },


    // ========================================
    // BAUPROJEKT
    // ========================================

    constructionProject: {

        id:
            "constructionProject",

        name:
            "Bauprojektfinanzierung",

        category:
            "construction",

        suitableBankTypes: [

            "property",

            "business",

            "regional",

            "premium",

            "risk"
        ],

        requiresCollateral:
            true,

        minimumEquityPercent:
            15
    },


    // ========================================
    // UNTERNEHMENSERWEITERUNG
    // ========================================

    expansion: {

        id:
            "expansion",

        name:
            "Unternehmenserweiterung",

        category:
            "business",

        suitableBankTypes: [

            "business",

            "regional",

            "premium",

            "risk"
        ],

        requiresCollateral:
            false,

        minimumEquityPercent:
            10
    },


    // ========================================
    // FREIE FINANZIERUNG
    //
    // Teurer / restriktiver.
    // ========================================

    freePurpose: {

        id:
            "freePurpose",

        name:
            "Freie Unternehmensfinanzierung",

        category:
            "business",

        suitableBankTypes: [

            "regional",

            "business",

            "risk"
        ],

        requiresCollateral:
            false,

        minimumEquityPercent:
            0
    }
};