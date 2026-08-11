// ============================================
// TruckTypes.js
// WorldProject
// Allgemeiner LKW- und Nutzfahrzeugkatalog
// ============================================

export const TruckTypes = {

    // ========================================
    // Kleiner Transporter
    // ========================================

    van: {

        id: "van",

        name: "Transporter",

        category: "van",

        maxGrossWeightKg: 3500,

        emptyWeightKg: 2200,

        maxVolumeM3: 14,

        maxPallets: 4,

        fuelType: "diesel",

        suitableFor: [
            "generalCargo",
            "smallDeliveries"
        ]
    },


    // ========================================
    // 7,5-Tonner
    // ========================================

    truck75: {

        id: "truck75",

        name: "7,5-Tonner",

        category: "rigidTruck",

        maxGrossWeightKg: 7500,

        emptyWeightKg: 4500,

        maxVolumeM3: 35,

        maxPallets: 15,

        fuelType: "diesel",

        suitableFor: [
            "generalCargo",
            "pallets",
            "regionalDelivery"
        ]
    },


    // ========================================
    // 12-Tonner
    // ========================================

    truck12: {

        id: "truck12",

        name: "12-Tonner",

        category: "rigidTruck",

        maxGrossWeightKg: 12000,

        emptyWeightKg: 6500,

        maxVolumeM3: 45,

        maxPallets: 18,

        fuelType: "diesel",

        suitableFor: [
            "generalCargo",
            "pallets",
            "regionalDelivery"
        ]
    },


    // ========================================
    // 18-Tonner
    // ========================================

    truck18: {

        id: "truck18",

        name: "18-Tonner",

        category: "rigidTruck",

        maxGrossWeightKg: 18000,

        emptyWeightKg: 9000,

        maxVolumeM3: 50,

        maxPallets: 20,

        fuelType: "diesel",

        suitableFor: [
            "generalCargo",
            "pallets",
            "regionalDelivery"
        ]
    },


    // ========================================
    // Standard-Sattelzug
    // ========================================

    semi40: {

        id: "semi40",

        name: "40-Tonnen-Sattelzug",

        category: "semiTruck",

        maxGrossWeightKg: 40000,

        // Vereinfachter Spiel-Basiswert.
        // Das konkrete Leergewicht kann später
        // je nach Zugmaschine und Auflieger
        // unterschiedlich sein.

        emptyWeightKg: 15000,

        maxVolumeM3: 90,

        maxPallets: 33,

        fuelType: "diesel",

        suitableFor: [
            "generalCargo",
            "pallets",
            "longDistance",
            "constructionMaterials"
        ]
    },


    // ========================================
    // Baustellen-Kipper
    // ========================================

    tipper: {

        id: "tipper",

        name: "Baustellen-Kipper",

        category: "constructionTruck",

        maxGrossWeightKg: 40000,

        emptyWeightKg: 16000,

        maxVolumeM3: 20,

        maxPallets: 0,

        fuelType: "diesel",

        suitableFor: [
            "bulkConstructionMaterial",
            "sand",
            "gravel"
        ]
    },


    // ========================================
    // Tank-Sattelzug
    // ========================================

    tanker: {

        id: "tanker",

        name: "Tank-Sattelzug",

        category: "tanker",

        maxGrossWeightKg: 40000,

        emptyWeightKg: 14000,

        // Bei Flüssigkeiten ist das
        // Tankvolumen entscheidend.

        maxVolumeM3: 30,

        maxPallets: 0,

        fuelType: "diesel",

        suitableFor: [
            "liquids"
        ]
    }
};