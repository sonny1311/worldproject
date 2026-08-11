// ============================================
// BankSystem.js
// WorldProject
//
// Zentrale Verwaltung für:
// - Banken
// - Kreditanträge
// - aktive Kredite
// - Bonität
// - Mahnverfahren
//
// Banken werden automatisch aus
// BankDefinitions geladen.
// ============================================

import {
    CreditRating
} from "./CreditRating.js";

import {
    Loan
} from "./Loan.js";

import {
    LoanCollection
} from "./LoanCollection.js";

import {
    AIBank
} from "./AIBank.js";

import {
    BankDefinitions
} from "./BankDefinitions.js";


export class BankSystem {

    constructor(company) {

        // ========================================
        // Unternehmen
        // ========================================

        this.company =
            company;


        // ========================================
        // Bonität
        // ========================================

        this.creditRating =
            new CreditRating(
                company
            );


        // ========================================
        // Banken
        // ========================================

        this.banks =
            [];


        // ========================================
        // Kreditanträge
        // ========================================

        this.applications =
            [];


        // ========================================
        // Kredite
        // ========================================

        this.loans =
            [];


        // ========================================
        // Mahnverfahren
        // ========================================

        this.collections =
            [];


        // ========================================
        // Historie
        // ========================================

        this.history =
            [];


        // ========================================
        // Banken automatisch laden
        // ========================================

        this.loadBanksFromDefinitions();
    }


    // ========================================
    // Banken aus Definitionen laden
    // ========================================

    loadBanksFromDefinitions() {

        this.banks =
            [];


        for (
            const key
            in BankDefinitions
        ) {

            const definition =
                BankDefinitions[
                    key
                ];


            if (
                !definition
            ) {

                continue;
            }


            const bank =
                new AIBank({

                    id:
                        definition.id,

                    name:
                        definition.name,

                    type:
                        definition.type,

                    settings:
                        definition.settings
                });


            this.banks.push(
                bank
            );
        }


        return this.banks;
    }


    // ========================================
    // Bank hinzufügen
    // ========================================

    addBank(
        bank
    ) {

        if (!bank) {

            return false;
        }


        const exists =
            this.banks.some(

                item =>
                    item.id ===
                    bank.id
            );


        if (exists) {

            return false;
        }


        this.banks.push(
            bank
        );


        return true;
    }


    // ========================================
    // Bank entfernen
    // ========================================

    removeBank(
        bankId
    ) {

        const index =
            this.banks.findIndex(

                bank =>
                    bank.id ===
                    bankId
            );


        if (
            index === -1
        ) {

            return false;
        }


        this.banks.splice(
            index,
            1
        );


        return true;
    }


    // ========================================
    // Bank suchen
    // ========================================

    getBankById(
        bankId
    ) {

        return (

            this.banks.find(

                bank =>
                    bank.id ===
                    bankId

            ) ?? null
        );
    }


    // ========================================
    // Banken nach Finanzierungszweck
    // filtern
    // ========================================

    getBanksForPurpose(
        purposeId
    ) {

        return this.banks.filter(

            bank =>
                bank.supportsPurpose(
                    purposeId
                )
        );
    }


    // ========================================
    // Bonität aktualisieren
    // ========================================

    updateCreditRating() {

        return (
            this.creditRating
                .calculate()
        );
    }


    // ========================================
    // Kreditantrag stellen
    //
    // Antrag selbst verändert Bonität NICHT.
    // ========================================

    applyForLoan({

        bankId,

        requestedAmount,

        requestedTermMonths = 60,

        purpose = "workingCapital",

        collateral = [],

        totalInvestmentValue = null,

        availableEquity = null

    }) {

        const bank =
            this.getBankById(
                bankId
            );


        if (!bank) {

            return {

                success:
                    false,

                reason:
                    "Bank nicht gefunden"
            };
        }


        // ----------------------------------------
        // Bonität aktuell berechnen
        // ----------------------------------------

        this.updateCreditRating();


        // ----------------------------------------
        // Antrag durch Bank prüfen
        // ----------------------------------------

        const decision =
            bank.evaluateApplication({

                company:
                    this.company,

                creditRating:
                    this.creditRating,

                requestedAmount,

                requestedTermMonths,

                purpose,

                collateral,

                totalInvestmentValue,

                availableEquity
            });


        // ----------------------------------------
        // Antrag speichern
        // ----------------------------------------

        const application = {

            id:
                Date.now() +
                Math.random(),

            bankId:
                bank.id,

            bankName:
                bank.name,

            requestedAmount,

            requestedTermMonths,

            purpose,

            collateral,

            totalInvestmentValue,

            availableEquity,

            decision,

            createdAt:
                new Date(),

            accepted:
                false,

            rejectedByPlayer:
                false
        };


        this.applications.push(
            application
        );


        this.history.push({

            type:
                "loan_application",

            date:
                new Date(),

            applicationId:
                application.id,

            bankId:
                bank.id,

            decision:
                decision.decision
        });


        return {

            success:
                true,

            application,

            decision
        };
    }


    // ========================================
    // Angebote mehrerer Banken vergleichen
    // ========================================

    compareLoanOffers({

        purpose,

        requestedAmount,

        requestedTermMonths = 60,

        collateral = [],

        totalInvestmentValue = null,

        availableEquity = null

    }) {

        const banks =
            this.getBanksForPurpose(
                purpose
            );


        const results =
            [];


        for (
            const bank
            of banks
        ) {

            const result =
                this.applyForLoan({

                    bankId:
                        bank.id,

                    requestedAmount,

                    requestedTermMonths,

                    purpose,

                    collateral,

                    totalInvestmentValue,

                    availableEquity
                });


            if (
                result.success
            ) {

                results.push(
                    result
                );
            }
        }


        // ----------------------------------------
        // Beste Angebote zuerst sortieren
        //
        // Genehmigt vor Gegenangebot vor Ablehnung.
        // Innerhalb gleicher Entscheidung:
        // niedrigerer Zins zuerst.
        // ----------------------------------------

        const priority = {

            approved:
                1,

            counter_offer:
                2,

            rejected:
                3
        };


        results.sort(

            (
                a,
                b
            ) => {

                const decisionA =
                    a.decision
                        ?.decision ??
                    "rejected";


                const decisionB =
                    b.decision
                        ?.decision ??
                    "rejected";


                const priorityA =
                    priority[
                        decisionA
                    ] ??
                    99;


                const priorityB =
                    priority[
                        decisionB
                    ] ??
                    99;


                if (
                    priorityA !==
                    priorityB
                ) {

                    return (
                        priorityA -
                        priorityB
                    );
                }


                const rateA =
                    a.decision
                        ?.interestRate ??
                    999;


                const rateB =
                    b.decision
                        ?.interestRate ??
                    999;


                return (
                    rateA -
                    rateB
                );
            }
        );


        return results;
    }


    // ========================================
    // Bankangebot annehmen
    // ========================================

    acceptLoanOffer(
        applicationId
    ) {

        const application =
            this.applications.find(

                item =>
                    item.id ===
                    applicationId
            );


        if (!application) {

            return {

                success:
                    false,

                reason:
                    "Kreditantrag nicht gefunden"
            };
        }


        if (
            application.accepted
        ) {

            return {

                success:
                    false,

                reason:
                    "Angebot wurde bereits angenommen"
            };
        }


        const decision =
            application.decision;


        if (
            decision.decision !==
            "approved" &&
            decision.decision !==
            "counter_offer"
        ) {

            return {

                success:
                    false,

                reason:
                    "Kein annehmbares Kreditangebot vorhanden"
            };
        }


        const bank =
            this.getBankById(
                application.bankId
            );


        if (!bank) {

            return {

                success:
                    false,

                reason:
                    "Bank nicht mehr verfügbar"
            };
        }


        const amount =

            decision.decision ===
            "counter_offer"

                ? decision.offeredAmount

                : decision.approvedAmount;


        const loan =
            new Loan({

                company:
                    this.company,

                creditRating:
                    this.creditRating,

                bank,

                amount,

                annualInterestRate:
                    decision.interestRate,

                termMonths:
                    decision.termMonths,

                purpose:
                    application.purpose,

                collateral:
                    application.collateral
            });


        const activated =
            loan.activate();


        if (!activated) {

            return {

                success:
                    false,

                reason:
                    "Kredit konnte nicht aktiviert werden"
            };
        }


        this.loans.push(
            loan
        );


        application.accepted =
            true;


        application.acceptedAt =
            new Date();


        this.history.push({

            type:
                "loan_activated",

            date:
                new Date(),

            applicationId:
                application.id,

            loanId:
                loan.id,

            amount
        });


        return {

            success:
                true,

            loan
        };
    }


    // ========================================
    // Angebot vom Spieler ablehnen
    //
    // KEINE Bonitätsverschlechterung.
    // ========================================

    rejectLoanOffer(
        applicationId
    ) {

        const application =
            this.applications.find(

                item =>
                    item.id ===
                    applicationId
            );


        if (!application) {

            return false;
        }


        if (
            application.accepted
        ) {

            return false;
        }


        application.rejectedByPlayer =
            true;


        application.rejectedAt =
            new Date();


        this.history.push({

            type:
                "loan_offer_rejected",

            date:
                new Date(),

            applicationId:
                application.id
        });


        return true;
    }


    // ========================================
    // Aktive Kredite
    // ========================================

    getActiveLoans() {

        return this.loans.filter(

            loan =>

                loan.status ===
                    "active"

                ||

                loan.status ===
                    "overdue"
        );
    }


    // ========================================
    // Kredit suchen
    // ========================================

    getLoanById(
        loanId
    ) {

        return (

            this.loans.find(

                loan =>
                    loan.id ===
                    loanId

            ) ?? null
        );
    }


    // ========================================
    // Mahnverfahren suchen
    // ========================================

    getCollectionForLoan(
        loanId
    ) {

        return (

            this.collections.find(

                collection =>
                    collection.loan
                        ?.id ===
                    loanId

            ) ?? null
        );
    }


    // ========================================
    // Mahnverfahren starten
    // ========================================

    startCollectionForLoan(
        loan,
        date = new Date()
    ) {

        if (!loan) {

            return null;
        }


        const existing =
            this.getCollectionForLoan(
                loan.id
            );


        if (
            existing &&
            existing.status !==
                "closed" &&
            existing.status !==
                "resolved"
        ) {

            return existing;
        }


        const collection =
            new LoanCollection({

                loan
            });


        const started =
            collection.start(
                date
            );


        if (!started) {

            return null;
        }


        this.collections.push(
            collection
        );


        this.history.push({

            type:
                "collection_started",

            date:
                new Date(
                    date
                ),

            loanId:
                loan.id
        });


        return collection;
    }


    // ========================================
    // Fällige Kreditraten verarbeiten
    // ========================================

    processDuePayments(
        currentDate = new Date()
    ) {

        const results =
            [];


        for (
            const loan
            of this.loans
        ) {

            if (
                !loan.isPaymentDue(
                    currentDate
                )
            ) {

                continue;
            }


            const result =
                loan.makePayment(
                    currentDate
                );


            results.push({

                loanId:
                    loan.id,

                result
            });


            if (
                !result.success
            ) {

                this.startCollectionForLoan(

                    loan,

                    currentDate
                );
            }
        }


        return results;
    }


    // ========================================
    // Mahnverfahren aktualisieren
    // ========================================

    updateCollections(
        currentDate = new Date()
    ) {

        for (
            const collection
            of this.collections
        ) {

            collection.update(
                currentDate
            );
        }
    }


    // ========================================
    // Banksystem aktualisieren
    // ========================================

    update(
        currentDate = new Date()
    ) {

        const payments =
            this.processDuePayments(
                currentDate
            );


        this.updateCollections(
            currentDate
        );


        this.updateCreditRating();


        return {

            payments,

            creditRating:
                this.creditRating
                    .getInfo()
        };
    }


    // ========================================
    // Gesamtschulden
    // ========================================

    getTotalRemainingDebt() {

        return this.loans.reduce(

            (
                total,
                loan
            ) => {

                return (

                    total +

                    (
                        loan.remainingPrincipal ??
                        0
                    )
                );

            },

            0
        );
    }


    // ========================================
    // Monatliche Kreditbelastung
    // ========================================

    getMonthlyLoanPayments() {

        return this.getActiveLoans()
            .reduce(

                (
                    total,
                    loan
                ) => {

                    return (

                        total +

                        (
                            loan.monthlyPayment ??
                            0
                        )
                    );

                },

                0
            );
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            creditRating:
                this.creditRating
                    .getInfo(),

            banks:
                this.banks.map(

                    bank =>
                        bank.getInfo()
                ),

            applications:
                this.applications,

            activeLoans:
                this.getActiveLoans()
                    .map(

                        loan =>
                            loan.getInfo()
                    ),

            totalRemainingDebt:
                this.getTotalRemainingDebt(),

            monthlyLoanPayments:
                this.getMonthlyLoanPayments(),

            collections:
                this.collections
                    .map(

                        collection =>
                            collection.getInfo()
                    )
        };
    }
}