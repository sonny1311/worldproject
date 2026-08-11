// ============================================
// Loan.js
// WorldProject
//
// Allgemeiner Unternehmenskredit.
//
// Aufgaben:
// - Kreditsumme auszahlen
// - monatliche Rate berechnen
// - Restschuld verwalten
// - Zinsen verbuchen
// - Zahlungen registrieren
// - verspätete / ausgefallene Zahlungen melden
// - Bonität beeinflussen
// ============================================

export class Loan {

    constructor({

        company,

        creditRating,

        bank,

        amount,

        annualInterestRate,

        termMonths,

        purpose = "business",

        collateral = []

    }) {

        // ========================================
        // ID
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Beteiligte
        // ========================================

        this.company =
            company;


        this.creditRating =
            creditRating;


        this.bank =
            bank;


        // ========================================
        // Kreditdaten
        // ========================================

        this.originalAmount =
            amount;


        this.remainingPrincipal =
            amount;


        this.annualInterestRate =
            annualInterestRate;


        this.termMonths =
            termMonths;


        this.remainingMonths =
            termMonths;


        this.purpose =
            purpose;


        this.collateral =
            collateral;


        // ========================================
        // Monatsrate
        // ========================================

        this.monthlyPayment =
            this.calculateMonthlyPayment();


        // ========================================
        // Status
        // ========================================

        this.status =
            "created";


        // created
        // active
        // completed
        // overdue
        // defaulted
        // cancelled


        // ========================================
        // Zeit
        // ========================================

        this.createdAt =
            new Date();


        this.startedAt =
            null;


        this.completedAt =
            null;


        this.nextPaymentDate =
            null;


        // ========================================
        // Zahlungshistorie
        // ========================================

        this.payments =
            [];


        this.totalPaid =
            0;


        this.totalInterestPaid =
            0;


        this.totalPrincipalPaid =
            0;


        // ========================================
        // Probleme
        // ========================================

        this.latePayments =
            0;


        this.missedPayments =
            0;
    }


    // ========================================
    // Monatsrate berechnen
    // ========================================

    calculateMonthlyPayment() {

        if (
            this.originalAmount <= 0 ||
            this.termMonths <= 0
        ) {

            return 0;
        }


        const monthlyRate =

            this.annualInterestRate /
            100 /
            12;


        if (
            monthlyRate === 0
        ) {

            return (
                this.originalAmount /
                this.termMonths
            );
        }


        const factor =
            Math.pow(

                1 + monthlyRate,

                this.termMonths
            );


        return (

            this.originalAmount *
            monthlyRate *
            factor

            /

            (
                factor - 1
            )
        );
    }


    // ========================================
    // Kredit aktivieren
    //
    // Geld wird dem Unternehmen gutgeschrieben.
    // ========================================

    activate(
        startDate = new Date()
    ) {

        if (
            this.status !==
            "created"
        ) {

            return false;
        }


        if (
            !this.company ||
            typeof this.company.money !==
            "number"
        ) {

            return false;
        }


        this.company.money +=
            this.originalAmount;


        // ----------------------------------------
        // Schulden im Unternehmen erhöhen
        // ----------------------------------------

        if (
            typeof this.company.totalDebt !==
            "number"
        ) {

            this.company.totalDebt =
                0;
        }


        this.company.totalDebt +=
            this.originalAmount;


        // ----------------------------------------
        // Monatliche Kreditbelastung erhöhen
        // ----------------------------------------

        if (
            typeof this.company.monthlyLoanPayments !==
            "number"
        ) {

            this.company.monthlyLoanPayments =
                0;
        }


        this.company.monthlyLoanPayments +=
            this.monthlyPayment;


        this.startedAt =
            new Date(
                startDate
            );


        this.nextPaymentDate =
            this.addMonths(
                this.startedAt,
                1
            );


        this.status =
            "active";


        if (
            this.creditRating &&
            this.creditRating.creditHistory
        ) {

            this.creditRating
                .creditHistory
                .activeLoans++;
        }


        return true;
    }


    // ========================================
    // Datum um Monate erhöhen
    // ========================================

    addMonths(
        date,
        months
    ) {

        const result =
            new Date(
                date
            );


        result.setMonth(
            result.getMonth() +
            months
        );


        return result;
    }


    // ========================================
    // Zinsanteil der nächsten Rate
    // ========================================

    calculateCurrentInterest() {

        const monthlyRate =

            this.annualInterestRate /
            100 /
            12;


        return (
            this.remainingPrincipal *
            monthlyRate
        );
    }


    // ========================================
    // Kreditrate zahlen
    // ========================================

    makePayment(
        paymentDate = new Date()
    ) {

        if (
            this.status !==
            "active" &&
            this.status !==
            "overdue"
        ) {

            return {

                success:
                    false,

                reason:
                    "Kredit ist nicht zahlungsfähig aktiv"
            };
        }


        if (
            !this.company ||
            typeof this.company.money !==
            "number"
        ) {

            return {

                success:
                    false,

                reason:
                    "Unternehmenskonto nicht verfügbar"
            };
        }


        // ========================================
        // Letzte Rate eventuell kleiner
        // ========================================

        const interest =
            this.calculateCurrentInterest();


        let payment =
            this.monthlyPayment;


        const maximumFinalPayment =
            this.remainingPrincipal +
            interest;


        if (
            payment >
            maximumFinalPayment
        ) {

            payment =
                maximumFinalPayment;
        }


        // ========================================
        // Geld vorhanden?
        // ========================================

        if (
            this.company.money <
            payment
        ) {

            this.registerMissedPayment(
                paymentDate
            );


            return {

                success:
                    false,

                reason:
                    "Nicht genügend Liquidität für Kreditrate",

                required:
                    payment,

                available:
                    this.company.money
            };
        }


        // ========================================
        // Zahlung buchen
        // ========================================

        this.company.money -=
            payment;


        const principalPart =
            Math.max(

                payment -
                interest,

                0
            );


        this.remainingPrincipal -=
            principalPart;


        this.remainingPrincipal =
            Math.max(
                this.remainingPrincipal,
                0
            );


        this.totalPaid +=
            payment;


        this.totalInterestPaid +=
            interest;


        this.totalPrincipalPaid +=
            principalPart;


        this.remainingMonths =
            Math.max(

                this.remainingMonths - 1,

                0
            );


        // ----------------------------------------
        // Unternehmensschuld reduzieren
        // ----------------------------------------

        if (
            typeof this.company.totalDebt ===
            "number"
        ) {

            this.company.totalDebt =
                Math.max(

                    this.company.totalDebt -
                    principalPart,

                    0
                );
        }


        // ========================================
        // Pünktlich oder verspätet?
        // ========================================

        let onTime =
            true;


        if (
            this.nextPaymentDate &&
            paymentDate.getTime() >
            this.nextPaymentDate.getTime()
        ) {

            onTime =
                false;
        }


        this.payments.push({

            date:
                new Date(
                    paymentDate
                ),

            amount:
                payment,

            interest,

            principal:
                principalPart,

            onTime
        });


        // ========================================
        // Bonität aktualisieren
        // ========================================

        if (
            this.creditRating
        ) {

            if (
                onTime
            ) {

                this.creditRating
                    .registerOnTimePayment();
            }

            else {

                this.latePayments++;


                this.creditRating
                    .registerLatePayment();
            }
        }


        // ========================================
        // Kredit fertig?
        // ========================================

        if (
            this.remainingPrincipal <=
            0.01
        ) {

            this.complete(
                paymentDate
            );


            return {

                success:
                    true,

                completed:
                    true,

                payment
            };
        }


        // ========================================
        // Nächster Zahlungstermin
        // ========================================

        this.nextPaymentDate =
            this.addMonths(

                this.nextPaymentDate ??
                paymentDate,

                1
            );


        this.status =
            "active";


        return {

            success:
                true,

            completed:
                false,

            payment,

            interest,

            principal:
                principalPart,

            remainingPrincipal:
                this.remainingPrincipal,

            nextPaymentDate:
                this.nextPaymentDate
        };
    }


    // ========================================
    // Rate ausgefallen
    // ========================================

    registerMissedPayment(
        date = new Date()
    ) {

        this.missedPayments++;


        this.status =
            "overdue";


        this.payments.push({

            date:
                new Date(
                    date
                ),

            amount:
                0,

            interest:
                0,

            principal:
                0,

            onTime:
                false,

            missed:
                true
        });


        if (
            this.creditRating
        ) {

            this.creditRating
                .registerMissedPayment();
        }


        // ========================================
        // Mehrere ausgefallene Raten
        // können Kreditausfall auslösen.
        // ========================================

        if (
            this.missedPayments >= 3
        ) {

            this.defaultLoan(
                date
            );
        }


        return true;
    }


    // ========================================
    // Kreditausfall
    // ========================================

    defaultLoan(
        date = new Date()
    ) {

        if (
            this.status ===
            "completed"
        ) {

            return false;
        }


        this.status =
            "defaulted";


        if (
            this.creditRating
        ) {

            this.creditRating
                .registerDefault();
        }


        return true;
    }


    // ========================================
    // Kredit vollständig abschließen
    // ========================================

    complete(
        date = new Date()
    ) {

        this.remainingPrincipal =
            0;


        this.remainingMonths =
            0;


        this.status =
            "completed";


        this.completedAt =
            new Date(
                date
            );


        // ----------------------------------------
        // Monatliche Kreditbelastung reduzieren
        // ----------------------------------------

        if (
            this.company &&
            typeof this.company.monthlyLoanPayments ===
            "number"
        ) {

            this.company.monthlyLoanPayments =
                Math.max(

                    this.company.monthlyLoanPayments -
                    this.monthlyPayment,

                    0
                );
        }


        // ----------------------------------------
        // Bonität / Historie
        // ----------------------------------------

        if (
            this.creditRating
        ) {

            if (
                this.creditRating
                    .creditHistory
            ) {

                this.creditRating
                    .creditHistory
                    .activeLoans =
                        Math.max(

                            this.creditRating
                                .creditHistory
                                .activeLoans -
                            1,

                            0
                        );
            }


            this.creditRating
                .registerCompletedLoan();
        }


        return true;
    }


    // ========================================
    // Ist Rate fällig?
    // ========================================

    isPaymentDue(
        currentDate = new Date()
    ) {

        if (
            this.status !==
            "active" &&
            this.status !==
            "overdue"
        ) {

            return false;
        }


        if (
            !this.nextPaymentDate
        ) {

            return false;
        }


        return (
            currentDate.getTime() >=
            this.nextPaymentDate.getTime()
        );
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            bank:
                this.bank
                    ?.name ??
                null,

            originalAmount:
                this.originalAmount,

            remainingPrincipal:
                this.remainingPrincipal,

            annualInterestRate:
                this.annualInterestRate,

            monthlyPayment:
                this.monthlyPayment,

            termMonths:
                this.termMonths,

            remainingMonths:
                this.remainingMonths,

            status:
                this.status,

            purpose:
                this.purpose,

            totalPaid:
                this.totalPaid,

            totalInterestPaid:
                this.totalInterestPaid,

            totalPrincipalPaid:
                this.totalPrincipalPaid,

            nextPaymentDate:
                this.nextPaymentDate,

            latePayments:
                this.latePayments,

            missedPayments:
                this.missedPayments,

            collateral:
                this.collateral
        };
    }
}