// ============================================
// CreditRating.js
// WorldProject
//
// Unternehmensbonität.
//
// Bewertet unter anderem:
// - Unternehmensalter
// - Gewinn / Verlust
// - Liquidität
// - bestehende Schulden
// - Kreditbelastung
// - Eigenkapital
// - Zahlungshistorie
// - Zahlungsausfälle
//
// Ergebnis:
// Score 0 - 1000
// + Bonitätsklasse
// + Risikostufe
// ============================================

export class CreditRating {

    constructor(company) {

        this.company =
            company;


        // ========================================
        // Bonität
        // ========================================

        this.score =
            500;


        this.rating =
            "C";


        this.risk =
            "medium";


        // ========================================
        // Zahlungshistorie
        // ========================================

        this.paymentHistory = {

            paymentsOnTime:
                0,

            latePayments:
                0,

            missedPayments:
                0,

            defaults:
                0
        };


        // ========================================
        // Finanzierungshistorie
        // ========================================

        this.creditHistory = {

            completedLoans:
                0,

            activeLoans:
                0,

            rejectedApplications:
                0
        };


        // ========================================
        // Letzte Berechnung
        // ========================================

        this.lastCalculation =
            null;
    }


    // ========================================
    // Hilfsfunktion:
    // Wert auf Bereich begrenzen
    // ========================================

    clamp(
        value,
        min,
        max
    ) {

        return Math.max(
            min,
            Math.min(
                max,
                value
            )
        );
    }


    // ========================================
    // Unternehmensdaten lesen
    //
    // Falls bestimmte Werte noch nicht
    // existieren, verwenden wir 0.
    // ========================================

    getCompanyData() {

        const company =
            this.company ??
            {};


        return {

            money:
                company.money ??
                0,

            monthlyRevenue:
                company.monthlyRevenue ??
                0,

            monthlyExpenses:
                company.monthlyExpenses ??
                0,

            totalAssets:
                company.totalAssets ??
                0,

            totalDebt:
                company.totalDebt ??
                0,

            equity:
                company.equity ??
                0,

            monthlyLoanPayments:
                company.monthlyLoanPayments ??
                0,

            ageDays:
                company.ageDays ??
                0
        };
    }


    // ========================================
    // Monatsgewinn
    // ========================================

    getMonthlyProfit() {

        const data =
            this.getCompanyData();


        return (
            data.monthlyRevenue -
            data.monthlyExpenses
        );
    }


    // ========================================
    // Verschuldungsquote
    //
    // Schulden / Vermögen
    // ========================================

    getDebtRatio() {

        const data =
            this.getCompanyData();


        if (
            data.totalAssets <= 0
        ) {

            if (
                data.totalDebt > 0
            ) {

                return 1;
            }


            return 0;
        }


        return (
            data.totalDebt /
            data.totalAssets
        );
    }


    // ========================================
    // Schuldendienstquote
    //
    // Kreditraten / Umsatz
    // ========================================

    getDebtServiceRatio() {

        const data =
            this.getCompanyData();


        if (
            data.monthlyRevenue <= 0
        ) {

            if (
                data.monthlyLoanPayments > 0
            ) {

                return 1;
            }


            return 0;
        }


        return (
            data.monthlyLoanPayments /
            data.monthlyRevenue
        );
    }


    // ========================================
    // Zahlungshistorie bewerten
    // ========================================

    calculatePaymentHistoryScore() {

        let score =
            0;


        score +=
            this.paymentHistory
                .paymentsOnTime *
            2;


        score -=
            this.paymentHistory
                .latePayments *
            10;


        score -=
            this.paymentHistory
                .missedPayments *
            35;


        score -=
            this.paymentHistory
                .defaults *
            150;


        return this.clamp(
            score,
            -300,
            150
        );
    }


    // ========================================
    // Unternehmensalter bewerten
    // ========================================

    calculateAgeScore(
        ageDays
    ) {

        if (
            ageDays < 30
        ) {

            return -40;
        }


        if (
            ageDays < 180
        ) {

            return -15;
        }


        if (
            ageDays < 365
        ) {

            return 10;
        }


        if (
            ageDays < 1095
        ) {

            return 30;
        }


        return 50;
    }


    // ========================================
    // Liquidität bewerten
    // ========================================

    calculateLiquidityScore(
        money,
        monthlyExpenses
    ) {

        if (
            monthlyExpenses <= 0
        ) {

            return 20;
        }


        const monthsCovered =
            money /
            monthlyExpenses;


        if (
            monthsCovered < 0
        ) {

            return -100;
        }


        if (
            monthsCovered < 0.5
        ) {

            return -60;
        }


        if (
            monthsCovered < 1
        ) {

            return -30;
        }


        if (
            monthsCovered < 3
        ) {

            return 20;
        }


        if (
            monthsCovered < 6
        ) {

            return 50;
        }


        return 70;
    }


    // ========================================
    // Gewinn bewerten
    // ========================================

    calculateProfitScore(
        profit,
        revenue
    ) {

        if (
            revenue <= 0
        ) {

            return -30;
        }


        const margin =
            profit /
            revenue;


        if (
            margin < -0.10
        ) {

            return -100;
        }


        if (
            margin < 0
        ) {

            return -50;
        }


        if (
            margin < 0.05
        ) {

            return 10;
        }


        if (
            margin < 0.15
        ) {

            return 40;
        }


        if (
            margin < 0.25
        ) {

            return 70;
        }


        return 90;
    }


    // ========================================
    // Verschuldung bewerten
    // ========================================

    calculateDebtScore(
        debtRatio
    ) {

        if (
            debtRatio <= 0.20
        ) {

            return 90;
        }


        if (
            debtRatio <= 0.40
        ) {

            return 60;
        }


        if (
            debtRatio <= 0.60
        ) {

            return 20;
        }


        if (
            debtRatio <= 0.80
        ) {

            return -40;
        }


        return -100;
    }


    // ========================================
    // Kreditratenbelastung bewerten
    // ========================================

    calculateDebtServiceScore(
        ratio
    ) {

        if (
            ratio <= 0.10
        ) {

            return 70;
        }


        if (
            ratio <= 0.20
        ) {

            return 40;
        }


        if (
            ratio <= 0.30
        ) {

            return 10;
        }


        if (
            ratio <= 0.40
        ) {

            return -40;
        }


        return -100;
    }


    // ========================================
    // Gesamtscore berechnen
    // ========================================

    calculate() {

        const data =
            this.getCompanyData();


        const profit =
            this.getMonthlyProfit();


        const debtRatio =
            this.getDebtRatio();


        const debtServiceRatio =
            this.getDebtServiceRatio();


        const components = {

            paymentHistory:
                this.calculatePaymentHistoryScore(),

            companyAge:
                this.calculateAgeScore(
                    data.ageDays
                ),

            liquidity:
                this.calculateLiquidityScore(
                    data.money,
                    data.monthlyExpenses
                ),

            profitability:
                this.calculateProfitScore(
                    profit,
                    data.monthlyRevenue
                ),

            debt:
                this.calculateDebtScore(
                    debtRatio
                ),

            debtService:
                this.calculateDebtServiceScore(
                    debtServiceRatio
                )
        };


        // ========================================
        // Basisscore
        // ========================================

        let score =
            500;


        for (
            const value
            of Object.values(
                components
            )
        ) {

            score +=
                value;
        }


        // ========================================
        // Score begrenzen
        // ========================================

        this.score =
            Math.round(

                this.clamp(
                    score,
                    0,
                    1000
                )
            );


        // ========================================
        // Rating bestimmen
        // ========================================

        this.updateRating();


        // ========================================
        // Ergebnis speichern
        // ========================================

        this.lastCalculation = {

            score:
                this.score,

            rating:
                this.rating,

            risk:
                this.risk,

            monthlyProfit:
                profit,

            debtRatio,

            debtServiceRatio,

            components,

            calculatedAt:
                new Date()
        };


        return (
            this.lastCalculation
        );
    }


    // ========================================
    // Bonitätsklasse bestimmen
    // ========================================

    updateRating() {

        if (
            this.score >= 900
        ) {

            this.rating =
                "AAA";

            this.risk =
                "very_low";

            return;
        }


        if (
            this.score >= 800
        ) {

            this.rating =
                "AA";

            this.risk =
                "very_low";

            return;
        }


        if (
            this.score >= 700
        ) {

            this.rating =
                "A";

            this.risk =
                "low";

            return;
        }


        if (
            this.score >= 600
        ) {

            this.rating =
                "BBB";

            this.risk =
                "moderate";

            return;
        }


        if (
            this.score >= 500
        ) {

            this.rating =
                "BB";

            this.risk =
                "medium";

            return;
        }


        if (
            this.score >= 400
        ) {

            this.rating =
                "B";

            this.risk =
                "high";

            return;
        }


        if (
            this.score >= 300
        ) {

            this.rating =
                "CCC";

            this.risk =
                "very_high";

            return;
        }


        if (
            this.score >= 200
        ) {

            this.rating =
                "CC";

            this.risk =
                "critical";

            return;
        }


        this.rating =
            "D";

        this.risk =
            "default";
    }


    // ========================================
    // Pünktliche Zahlung registrieren
    // ========================================

    registerOnTimePayment() {

        this.paymentHistory
            .paymentsOnTime++;

        return this.calculate();
    }


    // ========================================
    // Verspätete Zahlung
    // ========================================

    registerLatePayment() {

        this.paymentHistory
            .latePayments++;

        return this.calculate();
    }


    // ========================================
    // Ausgefallene Rate
    // ========================================

    registerMissedPayment() {

        this.paymentHistory
            .missedPayments++;

        return this.calculate();
    }


    // ========================================
    // Kreditausfall
    // ========================================

    registerDefault() {

        this.paymentHistory
            .defaults++;

        return this.calculate();
    }


    // ========================================
    // Kredit vollständig zurückgezahlt
    // ========================================

    registerCompletedLoan() {

        this.creditHistory
            .completedLoans++;

        return this.calculate();
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            score:
                this.score,

            rating:
                this.rating,

            risk:
                this.risk,

            paymentHistory:
                this.paymentHistory,

            creditHistory:
                this.creditHistory,

            lastCalculation:
                this.lastCalculation
        };
    }
}