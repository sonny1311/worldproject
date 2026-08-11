// ============================================
// AIBank.js
// WorldProject
//
// KI-Bank für Unternehmensfinanzierungen.
//
// Prüft:
// - Bonität
// - Finanzierungszweck
// - passenden Banktyp
// - Eigenkapital
// - Sicherheiten
// - monatliche Tragfähigkeit
// - bestehende Verschuldung
//
// WICHTIG:
// Kreditanfragen und Ablehnungen verändern
// die Bonität NICHT.
// ============================================

import {
    FinancingPurpose
} from "./FinancingPurpose.js";


export class AIBank {

    constructor({

        id = "bank_standard",

        name = "World Business Bank",

        type = "standard",

        settings = {}

    } = {}) {

        // ========================================
        // Bankdaten
        // ========================================

        this.id =
            id;


        this.name =
            name;


        this.type =
            type;


        // ========================================
        // Bankregeln
        // ========================================

        this.settings = {

            minimumCreditScore:
                settings.minimumCreditScore ??
                400,


            minimumLoanAmount:
                settings.minimumLoanAmount ??
                5000,


            maximumLoanAmount:
                settings.maximumLoanAmount ??
                5000000,


            baseInterestRate:
                settings.baseInterestRate ??
                5.0,


            minimumInterestRate:
                settings.minimumInterestRate ??
                2.5,


            maximumInterestRate:
                settings.maximumInterestRate ??
                18.0,


            minimumTermMonths:
                settings.minimumTermMonths ??
                12,


            maximumTermMonths:
                settings.maximumTermMonths ??
                120,


            maximumDebtServiceRatio:
                settings.maximumDebtServiceRatio ??
                0.35,


            maximumDebtRatio:
                settings.maximumDebtRatio ??
                0.80,


            collateralValuePercent:
                settings.collateralValuePercent ??
                70
        };


        // ========================================
        // Statistik
        // ========================================

        this.statistics = {

            applications:
                0,

            approved:
                0,

            rejected:
                0,

            counterOffers:
                0
        };
    }


    // ========================================
    // Wert begrenzen
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
    // Finanzierungszweck holen
    // ========================================

    getPurposeDefinition(
        purposeId
    ) {

        return (
            FinancingPurpose[
                purposeId
            ] ?? null
        );
    }


    // ========================================
    // Prüfen, ob Bank für Zweck geeignet ist
    // ========================================

    supportsPurpose(
        purposeId
    ) {

        const purpose =
            this.getPurposeDefinition(
                purposeId
            );


        if (!purpose) {

            return false;
        }


        if (
            !Array.isArray(
                purpose.suitableBankTypes
            )
        ) {

            return false;
        }


        return (
            purpose
                .suitableBankTypes
                .includes(
                    this.type
                )
        );
    }


    // ========================================
    // Monatsrate berechnen
    // ========================================

    calculateMonthlyPayment({

        amount,

        annualInterestRate,

        termMonths

    }) {

        if (
            amount <= 0 ||
            termMonths <= 0
        ) {

            return 0;
        }


        const monthlyRate =

            annualInterestRate /
            100 /
            12;


        if (
            monthlyRate === 0
        ) {

            return (
                amount /
                termMonths
            );
        }


        const factor =
            Math.pow(

                1 + monthlyRate,

                termMonths
            );


        return (

            amount *
            monthlyRate *
            factor

            /

            (
                factor - 1
            )
        );
    }


    // ========================================
    // Zinssatz anhand Bonität
    // ========================================

    calculateInterestRate(
        creditScore
    ) {

        let riskPremium =
            0;


        if (
            creditScore >= 900
        ) {

            riskPremium =
                -2.0;
        }

        else if (
            creditScore >= 800
        ) {

            riskPremium =
                -1.5;
        }

        else if (
            creditScore >= 700
        ) {

            riskPremium =
                -0.5;
        }

        else if (
            creditScore >= 600
        ) {

            riskPremium =
                1.0;
        }

        else if (
            creditScore >= 500
        ) {

            riskPremium =
                3.0;
        }

        else if (
            creditScore >= 400
        ) {

            riskPremium =
                6.0;
        }

        else {

            riskPremium =
                12.0;
        }


        return this.clamp(

            this.settings
                .baseInterestRate +
            riskPremium,

            this.settings
                .minimumInterestRate,

            this.settings
                .maximumInterestRate
        );
    }


    // ========================================
    // Sicherheitenwert
    // ========================================

    calculateCollateralValue(
        collateral = []
    ) {

        if (
            !Array.isArray(
                collateral
            )
        ) {

            return 0;
        }


        let marketValue =
            0;


        for (
            const asset
            of collateral
        ) {

            if (!asset) {

                continue;
            }


            const value =
                asset.marketValue ??
                0;


            if (
                value > 0
            ) {

                marketValue +=
                    value;
            }
        }


        return (

            marketValue *

            (
                this.settings
                    .collateralValuePercent /
                100
            )
        );
    }


    // ========================================
    // Erforderliches Eigenkapital
    // ========================================

    calculateRequiredEquity({

        totalInvestmentValue,

        purpose

    }) {

        if (
            !purpose
        ) {

            return 0;
        }


        const percent =
            purpose
                .minimumEquityPercent ??
            0;


        return (

            totalInvestmentValue *

            (
                percent /
                100
            )
        );
    }


    // ========================================
    // Tragbare Kredithöhe
    // ========================================

    calculateMaximumAffordableLoan({

        company,

        creditRating,

        termMonths,

        annualInterestRate

    }) {

        const revenue =
            company.monthlyRevenue ??
            0;


        const existingPayments =
            company.monthlyLoanPayments ??
            0;


        const maximumTotalPayment =

            revenue *

            this.settings
                .maximumDebtServiceRatio;


        const availablePayment =

            Math.max(

                maximumTotalPayment -
                existingPayments,

                0
            );


        if (
            availablePayment <= 0
        ) {

            return 0;
        }


        const monthlyRate =

            annualInterestRate /
            100 /
            12;


        if (
            monthlyRate === 0
        ) {

            return (
                availablePayment *
                termMonths
            );
        }


        const factor =

            (
                1 -
                Math.pow(
                    1 + monthlyRate,
                    -termMonths
                )
            )

            /

            monthlyRate;


        let maximumLoan =

            availablePayment *
            factor;


        // ========================================
        // Bonitätsfaktor
        // ========================================

        const score =
            creditRating.score;


        let creditFactor =
            1;


        if (
            score >= 800
        ) {

            creditFactor =
                1.10;
        }

        else if (
            score >= 700
        ) {

            creditFactor =
                1.00;
        }

        else if (
            score >= 600
        ) {

            creditFactor =
                0.90;
        }

        else if (
            score >= 500
        ) {

            creditFactor =
                0.75;
        }

        else {

            creditFactor =
                0.50;
        }


        maximumLoan *=
            creditFactor;


        return Math.max(
            maximumLoan,
            0
        );
    }


    // ========================================
    // Kreditantrag prüfen
    // ========================================

    evaluateApplication({

        company,

        creditRating,

        requestedAmount,

        requestedTermMonths = 60,

        purpose = "workingCapital",

        collateral = [],

        totalInvestmentValue = null,

        availableEquity = null

    }) {

        this.statistics
            .applications++;


        // ========================================
        // Grunddaten prüfen
        // ========================================

        if (
            !company ||
            !creditRating
        ) {

            return this.reject(
                "Unternehmensdaten unvollständig"
            );
        }


        // ========================================
        // Finanzierungszweck prüfen
        // ========================================

        const purposeDefinition =
            this.getPurposeDefinition(
                purpose
            );


        if (!purposeDefinition) {

            return this.reject(

                "Unbekannter Finanzierungszweck",

                {
                    purpose
                }
            );
        }


        // ========================================
        // Passt Zweck zur Bank?
        // ========================================

        if (
            !this.supportsPurpose(
                purpose
            )
        ) {

            return this.reject(

                "Diese Bank bietet für diesen Finanzierungszweck keine Finanzierung an.",

                {
                    purpose:
                        purposeDefinition.name,

                    bankType:
                        this.type
                }
            );
        }


        // ========================================
        // Kreditsumme prüfen
        // ========================================

        if (
            requestedAmount <
            this.settings
                .minimumLoanAmount
        ) {

            return this.reject(
                "Finanzierungsbetrag unter Mindestgrenze"
            );
        }


        if (
            requestedAmount >
            this.settings
                .maximumLoanAmount
        ) {

            return this.reject(
                "Finanzierungsbetrag über Banklimit"
            );
        }


        // ========================================
        // Gesamtinvestition bestimmen
        //
        // Falls kein Gesamtwert angegeben wurde,
        // nehmen wir zunächst die Kreditsumme.
        // ========================================

        const investmentValue =

            totalInvestmentValue !==
            null

                ? Math.max(
                    totalInvestmentValue,
                    0
                )

                : requestedAmount;


        // ========================================
        // Eigenkapital bestimmen
        //
        // Falls nichts angegeben:
        // Firmenkonto als verfügbare Liquidität.
        // ========================================

        const equityAvailable =

            availableEquity !==
            null

                ? Math.max(
                    availableEquity,
                    0
                )

                : Math.max(
                    company.money ?? 0,
                    0
                );


        const requiredEquity =
            this.calculateRequiredEquity({

                totalInvestmentValue:
                    investmentValue,

                purpose:
                    purposeDefinition
            });


        // ========================================
        // Eigenkapital reicht nicht
        // ========================================

        if (
            equityAvailable <
            requiredEquity
        ) {

            return this.reject(

                "Eigenkapital für diese Finanzierung nicht ausreichend.",

                {
                    requiredEquity,

                    availableEquity:
                        equityAvailable,

                    minimumEquityPercent:
                        purposeDefinition
                            .minimumEquityPercent
                }
            );
        }


        // ========================================
        // Sicherheiten prüfen
        // ========================================

        const collateralValue =
            this.calculateCollateralValue(
                collateral
            );


        if (
            purposeDefinition
                .requiresCollateral ===
            true
        ) {

            if (
                !Array.isArray(
                    collateral
                ) ||
                collateral.length === 0
            ) {

                return this.reject(

                    "Für diese Finanzierung ist eine Sicherheit erforderlich.",

                    {
                        purpose:
                            purposeDefinition.name
                    }
                );
            }


            if (
                collateralValue <= 0
            ) {

                return this.reject(

                    "Angegebene Sicherheiten besitzen keinen ausreichenden verwertbaren Wert."
                );
            }
        }


        // ========================================
        // Bonität aktuell berechnen
        // ========================================

        const ratingResult =
            creditRating.calculate();


        const score =
            ratingResult.score;


        if (
            score <
            this.settings
                .minimumCreditScore
        ) {

            return this.reject(

                "Bonität für eine Finanzierung nicht ausreichend",

                {
                    score,

                    rating:
                        ratingResult.rating
                }
            );
        }


        // ========================================
        // Laufzeit
        // ========================================

        const termMonths =
            Math.round(

                this.clamp(

                    requestedTermMonths,

                    this.settings
                        .minimumTermMonths,

                    this.settings
                        .maximumTermMonths
                )
            );


        // ========================================
        // Zins
        // ========================================

        const interestRate =
            this.calculateInterestRate(
                score
            );


        // ========================================
        // Unternehmenswerte
        // ========================================

        const totalAssets =
            company.totalAssets ??
            0;


        const totalDebt =
            company.totalDebt ??
            0;


        const monthlyRevenue =
            company.monthlyRevenue ??
            0;


        const monthlyExpenses =
            company.monthlyExpenses ??
            0;


        const monthlyProfit =

            monthlyRevenue -
            monthlyExpenses;


        // ========================================
        // Verschuldungsquote
        // ========================================

        let debtRatio =
            0;


        if (
            totalAssets > 0
        ) {

            debtRatio =
                totalDebt /
                totalAssets;
        }

        else if (
            totalDebt > 0
        ) {

            debtRatio =
                1;
        }


        if (
            debtRatio >
            this.settings
                .maximumDebtRatio
        ) {

            return this.reject(

                "Bestehende Verschuldung zu hoch",

                {
                    debtRatio
                }
            );
        }


        // ========================================
        // Tragbare Kreditsumme
        // ========================================

        const affordableAmount =
            this.calculateMaximumAffordableLoan({

                company,

                creditRating,

                termMonths,

                annualInterestRate:
                    interestRate
            });


        // ========================================
        // Bankbereitschaft bestimmen
        // ========================================

        let maximumApprovedAmount =
            affordableAmount;


        // ----------------------------------------
        // Sicherheiten können den Spielraum
        // etwas erweitern.
        // ----------------------------------------

        if (
            collateralValue > 0
        ) {

            maximumApprovedAmount =
                Math.max(

                    maximumApprovedAmount,

                    Math.min(

                        collateralValue,

                        affordableAmount *
                        1.25
                    )
                );
        }


        // ========================================
        // Eigenkapital muss aus Investitionswert
        // herausgerechnet werden.
        //
        // Beispiel:
        //
        // Investition 200.000 €
        // 10 % Eigenkapital
        //
        // maximal finanzierbarer Objektanteil:
        // 180.000 €
        // ========================================

        const maximumFinancingByEquity =

            Math.max(

                investmentValue -
                requiredEquity,

                0
            );


        maximumApprovedAmount =
            Math.min(

                maximumApprovedAmount,

                maximumFinancingByEquity,

                this.settings
                    .maximumLoanAmount
            );


        // ========================================
        // Keine wirtschaftlich tragbare
        // Finanzierung
        // ========================================

        if (
            maximumApprovedAmount <
            this.settings
                .minimumLoanAmount
        ) {

            return this.reject(

                "Monatliche Belastung wirtschaftlich nicht tragbar.",

                {
                    affordableAmount,

                    collateralValue,

                    requiredEquity
                }
            );
        }


        // ========================================
        // Kreditsumme zu hoch:
        // Gegenangebot
        // ========================================

        if (
            requestedAmount >
            maximumApprovedAmount
        ) {

            const counterAmount =

                Math.floor(
                    maximumApprovedAmount /
                    100
                )

                *

                100;


            const monthlyPayment =
                this.calculateMonthlyPayment({

                    amount:
                        counterAmount,

                    annualInterestRate:
                        interestRate,

                    termMonths
                });


            this.statistics
                .counterOffers++;


            return {

                decision:
                    "counter_offer",

                approved:
                    false,

                bankId:
                    this.id,

                bankName:
                    this.name,

                purposeId:
                    purpose,

                purposeName:
                    purposeDefinition.name,

                requestedAmount,

                offeredAmount:
                    counterAmount,

                investmentValue,

                requiredEquity,

                availableEquity:
                    equityAvailable,

                termMonths,

                interestRate,

                monthlyPayment,

                creditScore:
                    score,

                creditRating:
                    ratingResult.rating,

                collateralValue,

                companyHasLoss:
                    monthlyProfit < 0,

                reason:
                    "Gewünschte Finanzierung ist zu hoch. Bank bietet eine geringere Finanzierung an.",

                affectsCreditRating:
                    false
            };
        }


        // ========================================
        // Genehmigung
        // ========================================

        const monthlyPayment =
            this.calculateMonthlyPayment({

                amount:
                    requestedAmount,

                annualInterestRate:
                    interestRate,

                termMonths
            });


        this.statistics
            .approved++;


        return {

            decision:
                "approved",

            approved:
                true,

            bankId:
                this.id,

            bankName:
                this.name,

            purposeId:
                purpose,

            purposeName:
                purposeDefinition.name,

            requestedAmount,

            approvedAmount:
                requestedAmount,

            investmentValue,

            requiredEquity,

            availableEquity:
                equityAvailable,

            termMonths,

            interestRate,

            monthlyPayment,

            totalRepayment:
                monthlyPayment *
                termMonths,

            creditScore:
                score,

            creditRating:
                ratingResult.rating,

            collateralValue,

            companyHasLoss:
                monthlyProfit < 0,

            affectsCreditRating:
                false
        };
    }


    // ========================================
    // Ablehnung
    // ========================================

    reject(
        reason,
        details = {}
    ) {

        this.statistics
            .rejected++;


        return {

            decision:
                "rejected",

            approved:
                false,

            bankId:
                this.id,

            bankName:
                this.name,

            reason,

            details,

            affectsCreditRating:
                false
        };
    }


    // ========================================
    // Bankübersicht
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            name:
                this.name,

            type:
                this.type,

            settings:
                this.settings,

            statistics:
                this.statistics
        };
    }
}