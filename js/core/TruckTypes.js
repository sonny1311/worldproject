// ============================================
// TruckTypes.js
// WorldProject
// Allgemeiner LKW- und Nutzfahrzeugkatalog
// ============================================

export const TruckTypes = {

    van15: {
        id: "van15",
        name: "1,5-Tonner",
        category: "lightVan",
        maxGrossWeightKg: 1500,
        emptyWeightKg: 1050,
        maxVolumeM3: 3.5,
        maxPallets: 1,
        fuelType: "diesel",
        consumptionPer100Km: 7.5,
        fuelTankCapacityLiters: 60,
        refuelTimeMinutes: 8,
        suitableFor: ["smallDeliveries", "expressDelivery"]
    },

    van30: {
        id: "van30",
        name: "3,0-Tonner",
        category: "van",
        maxGrossWeightKg: 3000,
        emptyWeightKg: 1900,
        maxVolumeM3: 11,
        maxPallets: 3,
        fuelType: "diesel",
        consumptionPer100Km: 9.5,
        fuelTankCapacityLiters: 70,
        refuelTimeMinutes: 9,
        suitableFor: ["generalCargo", "smallDeliveries", "regionalDelivery"]
    },

    van: {
        id: "van",
        name: "3,5-Tonner Transporter",
        category: "van",
        maxGrossWeightKg: 3500,
        emptyWeightKg: 2200,
        maxVolumeM3: 14,
        maxPallets: 4,
        fuelType: "diesel",
        consumptionPer100Km: 10.5,
        fuelTankCapacityLiters: 100,
        refuelTimeMinutes: 10,
        suitableFor: ["generalCargo", "smallDeliveries", "regionalDelivery"]
    },

    truck75: {
        id: "truck75",
        name: "7,5-Tonner",
        category: "rigidTruck",
        maxGrossWeightKg: 7500,
        emptyWeightKg: 4500,
        maxVolumeM3: 35,
        maxPallets: 15,
        fuelType: "diesel",
        consumptionPer100Km: 17,
        fuelTankCapacityLiters: 150,
        refuelTimeMinutes: 12,
        suitableFor: ["generalCargo", "pallets", "regionalDelivery"]
    },

    truck12: {
        id: "truck12",
        name: "12-Tonner",
        category: "rigidTruck",
        maxGrossWeightKg: 12000,
        emptyWeightKg: 6500,
        maxVolumeM3: 45,
        maxPallets: 18,
        fuelType: "diesel",
        consumptionPer100Km: 20.5,
        fuelTankCapacityLiters: 200,
        refuelTimeMinutes: 13,
        suitableFor: ["generalCargo", "pallets", "regionalDelivery"]
    },

    truck18: {
        id: "truck18",
        name: "18-Tonner",
        category: "rigidTruck",
        maxGrossWeightKg: 18000,
        emptyWeightKg: 9000,
        maxVolumeM3: 50,
        maxPallets: 20,
        fuelType: "diesel",
        consumptionPer100Km: 24,
        fuelTankCapacityLiters: 300,
        refuelTimeMinutes: 14,
        suitableFor: ["generalCargo", "pallets", "regionalDelivery"]
    },

    semi40: {
        id: "semi40",
        name: "40-Tonnen-Sattelzug",
        category: "semiTruck",
        maxGrossWeightKg: 40000,
        emptyWeightKg: 15000,
        maxVolumeM3: 90,
        maxPallets: 33,
        fuelType: "diesel",
        consumptionPer100Km: 29,
        fuelTankCapacityLiters: 1000,
        refuelTimeMinutes: 18,
        suitableFor: ["generalCargo", "pallets", "longDistance", "constructionMaterials"]
    },

    giga: {
        id: "giga",
        name: "Giga-LKW",
        category: "gigaTruck",
        maxGrossWeightKg: 40000,
        emptyWeightKg: 15000,
        maxVolumeM3: 145,
        maxPallets: 54,
        fuelType: "diesel",
        consumptionPer100Km: 34.8,
        fuelTankCapacityLiters: 1000,
        refuelTimeMinutes: 18,
        suitableFor: ["pallets", "longDistance", "constructionMaterials"]
    },

    tipper: {
        id: "tipper",
        name: "Baustellen-Kipper",
        category: "constructionTruck",
        maxGrossWeightKg: 40000,
        emptyWeightKg: 16000,
        maxVolumeM3: 20,
        maxPallets: 0,
        fuelType: "diesel",
        consumptionPer100Km: 32,
        fuelTankCapacityLiters: 500,
        refuelTimeMinutes: 16,
        suitableFor: ["bulkConstructionMaterial", "sand", "gravel"]
    },

    tanker: {
        id: "tanker",
        name: "Tank-Sattelzug",
        category: "tanker",
        maxGrossWeightKg: 40000,
        emptyWeightKg: 14000,
        maxVolumeM3: 30,
        maxPallets: 0,
        fuelType: "diesel",
        consumptionPer100Km: 30,
        fuelTankCapacityLiters: 800,
        refuelTimeMinutes: 17,
        suitableFor: ["liquids"]
    }
};