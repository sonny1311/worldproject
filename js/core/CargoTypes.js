// ============================================
// CargoTypes.js
// WorldProject
//
// Transporteigenschaften verschiedener
// Ladungs- und Baustoffarten
// ============================================

export const CargoTypes = {


    // ========================================
    // BETON
    //
    // Beton wird nicht einfach auf einen
    // normalen Sattelauflieger geladen.
    //
    // Später unterscheiden wir zusätzlich
    // zwischen:
    // - Transportbeton
    // - Betonfertigteilen
    //
    // Für das Baustellensystem behandeln wir
    // normalen Beton zunächst als Spezialladung.
// ========================================

    concrete: {

        id: "concrete",

        name: "Beton",

        category: "construction",

        transportType:
            "special",

        unit:
            "t",

        weightKgPerUnit:
            1000,

        palletized:
            false,

        allowedVehicleCategories: [

            "constructionTruck"
        ]
    },


    // ========================================
    // STAHL
    // ========================================

    steel: {

        id: "steel",

        name: "Stahl",

        category:
            "construction",

        transportType:
            "heavy",

        unit:
            "t",

        weightKgPerUnit:
            1000,

        palletized:
            false,

        allowedVehicleCategories: [

            "semiTruck",

            "constructionTruck"
        ]
    },


    // ========================================
    // ZIEGEL
    //
    // Ziegel werden palettiert transportiert.
    //
    // Die genaue Stückzahl je Palette können
    // wir später je Produkt definieren.
    // ========================================

    bricks: {

        id: "bricks",

        name: "Ziegel",

        category:
            "construction",

        transportType:
            "pallet",

        unit:
            "Stück",

        weightKgPerUnit:
            3,

        palletized:
            true,

        unitsPerPallet:
            300,

        allowedVehicleCategories: [

            "rigidTruck",

            "semiTruck"
        ]
    },


    // ========================================
    // HOLZ
    // ========================================

    wood: {

        id: "wood",

        name: "Holz",

        category:
            "construction",

        transportType:
            "bulk",

        unit:
            "m³",

        // Vereinfachter Basiswert.
        // Später kann Holzart berücksichtigt
        // werden.

        weightKgPerUnit:
            550,

        palletized:
            false,

        allowedVehicleCategories: [

            "rigidTruck",

            "semiTruck"
        ]
    },


    // ========================================
    // DÄMMMATERIAL
    // ========================================

    insulation: {

        id: "insulation",

        name: "Dämmmaterial",

        category:
            "construction",

        transportType:
            "pallet",

        unit:
            "m²",

        // Sehr leicht, benötigt dafür
        // relativ viel Ladevolumen.

        weightKgPerUnit:
            4,

        volumeM3PerUnit:
            0.08,

        palletized:
            true,

        unitsPerPallet:
            20,

        allowedVehicleCategories: [

            "rigidTruck",

            "semiTruck"
        ]
    },


    // ========================================
    // KABEL
    // ========================================

    cables: {

        id: "cables",

        name: "Kabel",

        category:
            "construction",

        transportType:
            "pallet",

        unit:
            "m",

        weightKgPerUnit:
            0.5,

        palletized:
            true,

        unitsPerPallet:
            1000,

        allowedVehicleCategories: [

            "van",

            "rigidTruck",

            "semiTruck"
        ]
    },


    // ========================================
    // GLAS
    // ========================================

    glass: {

        id: "glass",

        name: "Glas",

        category:
            "construction",

        transportType:
            "special",

        unit:
            "m²",

        weightKgPerUnit:
            25,

        palletized:
            false,

        allowedVehicleCategories: [

            "rigidTruck",

            "semiTruck"
        ]
    },


    // ========================================
    // FLIESEN
    // ========================================

    tiles: {

        id: "tiles",

        name: "Fliesen",

        category:
            "construction",

        transportType:
            "pallet",

        unit:
            "m²",

        weightKgPerUnit:
            22,

        palletized:
            true,

        unitsPerPallet:
            40,

        allowedVehicleCategories: [

            "rigidTruck",

            "semiTruck"
        ]
    },


    // ========================================
    // ASPHALT
    // ========================================

    asphalt: {

        id: "asphalt",

        name: "Asphalt",

        category:
            "construction",

        transportType:
            "bulk",

        unit:
            "t",

        weightKgPerUnit:
            1000,

        palletized:
            false,

        allowedVehicleCategories: [

            "constructionTruck"
        ]
    }
};