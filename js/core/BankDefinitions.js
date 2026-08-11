// ============================================
// BankDefinitions.js
// WorldProject
//
// Definitionen verschiedener KI-Banken.
//
// Jede Bank hat eigene:
// - Risikobereitschaft
// - Mindestbonität
// - Zinspolitik
// - maximale Kreditsumme
// - Laufzeiten
// - Anforderungen an Sicherheiten
// ============================================

export const BankDefinitions = {


    // ========================================
    // REGIONALBANK
    //
    // Geeignet für:
    // - kleine Unternehmen
    // - junge Unternehmen
    // - regionale Betriebe
    //
    // Vorteile:
    // - niedrigere Einstiegshürde
    // - kleinere Kredite möglich
    //
    // Nachteile:
    // - geringeres maximales Kreditvolumen
    // ========================================

    regionalBank: {

        id:
            "regional_bank",

        name:
            "Regionalbank",

        type:
            "regional",

        settings: {

            minimumCreditScore:
                380,

            minimumLoanAmount:
                2500,

            maximumLoanAmount:
                750000,

            baseInterestRate:
                5.5,

            minimumInterestRate:
                3.0,

            maximumInterestRate:
                16.0,

            minimumTermMonths:
                12,

            maximumTermMonths:
                96,

            maximumDebtServiceRatio:
                0.38,

            maximumDebtRatio:
                0.82,

            collateralValuePercent:
                75
        }
    },


    // ========================================
    // GESCHÄFTSBANK
    //
    // Klassische Bank für etablierte Firmen.
    //
    // Vorteile:
    // - große Kredite
    // - gute Zinsen bei guter Bonität
    //
    // Nachteile:
    // - strengere Bonitätsprüfung
    // ========================================

    businessBank: {

        id:
            "business_bank",

        name:
            "Geschäftsbank",

        type:
            "business",

        settings: {

            minimumCreditScore:
                500,

            minimumLoanAmount:
                10000,

            maximumLoanAmount:
                5000000,

            baseInterestRate:
                4.5,

            minimumInterestRate:
                2.3,

            maximumInterestRate:
                13.0,

            minimumTermMonths:
                12,

            maximumTermMonths:
                144,

            maximumDebtServiceRatio:
                0.35,

            maximumDebtRatio:
                0.75,

            collateralValuePercent:
                70
        }
    },


    // ========================================
    // PREMIUMBANK
    //
    // Für sehr gute Unternehmen.
    //
    // Vorteile:
    // - sehr günstige Zinsen
    // - hohe Finanzierungssummen
    //
    // Nachteile:
    // - hohe Bonitätsanforderungen
    // ========================================

    premiumBank: {

        id:
            "premium_bank",

        name:
            "Premium Wirtschaftsbank",

        type:
            "premium",

        settings: {

            minimumCreditScore:
                700,

            minimumLoanAmount:
                50000,

            maximumLoanAmount:
                15000000,

            baseInterestRate:
                3.2,

            minimumInterestRate:
                1.8,

            maximumInterestRate:
                9.0,

            minimumTermMonths:
                24,

            maximumTermMonths:
                180,

            maximumDebtServiceRatio:
                0.32,

            maximumDebtRatio:
                0.65,

            collateralValuePercent:
                80
        }
    },


    // ========================================
    // RISIKOBANK
    //
    // Für schwächere Bonität.
    //
    // Vorteile:
    // - finanziert auch riskantere Firmen
    //
    // Nachteile:
    // - hohe Zinsen
    // - geringere Laufzeiten
    // - hohe Sicherheitenanforderungen
    // ========================================

    riskBank: {

        id:
            "risk_bank",

        name:
            "Unternehmer Direktfinanzierung",

        type:
            "risk",

        settings: {

            minimumCreditScore:
                280,

            minimumLoanAmount:
                5000,

            maximumLoanAmount:
                1000000,

            baseInterestRate:
                11.0,

            minimumInterestRate:
                7.0,

            maximumInterestRate:
                22.0,

            minimumTermMonths:
                12,

            maximumTermMonths:
                72,

            maximumDebtServiceRatio:
                0.45,

            maximumDebtRatio:
                0.90,

            collateralValuePercent:
                60
        }
    },


    // ========================================
    // IMMOBILIENBANK
    //
    // Spezialisiert auf:
    // - Wohnhäuser
    // - Gewerbeimmobilien
    // - Grundstücke
    //
    // Immobilien dienen typischerweise
    // als Sicherheit.
    // ========================================

    propertyBank: {

        id:
            "property_bank",

        name:
            "Immobilien- und Grundstücksbank",

        type:
            "property",

        settings: {

            minimumCreditScore:
                480,

            minimumLoanAmount:
                25000,

            maximumLoanAmount:
                10000000,

            baseInterestRate:
                4.0,

            minimumInterestRate:
                2.2,

            maximumInterestRate:
                12.0,

            minimumTermMonths:
                36,

            maximumTermMonths:
                240,

            maximumDebtServiceRatio:
                0.38,

            maximumDebtRatio:
                0.80,

            collateralValuePercent:
                85
        }
    },


    // ========================================
    // FAHRZEUGBANK
    //
    // Spezialisiert auf:
    // - LKW
    // - Transporter
    // - Nutzfahrzeuge
    // - Fuhrparkfinanzierung
    // ========================================

    vehicleBank: {

        id:
            "vehicle_bank",

        name:
            "Fuhrpark Finanz",

        type:
            "vehicle",

        settings: {

            minimumCreditScore:
                420,

            minimumLoanAmount:
                10000,

            maximumLoanAmount:
                2000000,

            baseInterestRate:
                5.0,

            minimumInterestRate:
                2.8,

            maximumInterestRate:
                15.0,

            minimumTermMonths:
                12,

            maximumTermMonths:
                84,

            maximumDebtServiceRatio:
                0.40,

            maximumDebtRatio:
                0.82,

            collateralValuePercent:
                78
        }
    },


    // ========================================
    // MASCHINENBANK
    //
    // Spezialisiert auf:
    // - Produktionsanlagen
    // - Maschinen
    // - Betriebsausstattung
    // ========================================

    equipmentBank: {

        id:
            "equipment_bank",

        name:
            "Industrie- und Maschinenfinanz",

        type:
            "equipment",

        settings: {

            minimumCreditScore:
                450,

            minimumLoanAmount:
                15000,

            maximumLoanAmount:
                4000000,

            baseInterestRate:
                4.8,

            minimumInterestRate:
                2.6,

            maximumInterestRate:
                14.0,

            minimumTermMonths:
                12,

            maximumTermMonths:
                120,

            maximumDebtServiceRatio:
                0.38,

            maximumDebtRatio:
                0.80,

            collateralValuePercent:
                75
        }
    }
};