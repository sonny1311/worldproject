// ============================================
// GameConfig.js
// WorldProject
// Zentrale Spieleinstellungen
// ============================================

export const GameConfig = {

    // ----------------------------------------
    // Bauzeiten
    // ----------------------------------------
    build: {

        // Werbung reduziert 0,5 % der aktuellen Restzeit
        adReductionPercent: 0.5,

        // Coins reduzieren 2 % der aktuellen Restzeit
        coinReductionPercent: 2,

        // Mindestens 25 % der ursprünglichen Bauzeit
        // müssen immer bestehen bleiben
        minimumBuildPercent: 25,

        // Maximal 5 Werbungen pro Tag
        maxAdsPerDay: 5
    },

    // ----------------------------------------
    // Startwerte
    // ----------------------------------------
    player: {

        startingMoney: 50000,

        startingCoins: 0
    }

};