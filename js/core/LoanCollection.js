// ============================================
// LoanCollection.js
// WorldProject
//
// Mahn- und Inkassoverfahren für Kredite.
//
// Ablauf:
//
// Rate nicht bezahlt
// ↓
// 1. Mahnung
// ↓
// Zahlungsfrist
// ↓
// 2. Mahnung
// ↓
// Zahlungsfrist
// ↓
// Kündigungsandrohung
// ↓
// letzte Zahlungsfrist
// ↓
// Kreditkündigung
// ↓
// Sicherheitenverwertung
//
// WICHTIG:
// Sicherheiten werden NIEMALS unmittelbar
// nach einer ausgefallenen Rate eingezogen.
// ============================================

export class LoanCollection {

    constructor({

        loan,

        settings = {}

    }) {

        // ========================================
        // Kredit
        // ========================================

        this.loan =
            loan;


        // ========================================
        // Einstellungen
        // ========================================

        this.settings = {

            // 1. Mahnung:
            // Zahlungsfrist in Spieltagen

            firstReminderDays:
                settings.firstReminderDays ??
                7,


            // 2. Mahnung

            secondReminderDays:
                settings.secondReminderDays ??
                7,


            // Letzte Frist nach
            // Kündigungsandrohung

            terminationWarningDays:
                settings.terminationWarningDays ??
                10,


            // Mahnkosten

            firstReminderFee:
                settings.firstReminderFee ??
                15,

            secondReminderFee:
                settings.secondReminderFee ??
                35,

            terminationWarningFee:
                settings.terminationWarningFee ??
                75,


            // Verzugszins p.a.

            defaultInterestRate:
                settings.defaultInterestRate ??
                5,


            // Sicherheitswert bei Verwertung.
            //
            // Marktwert wird nicht garantiert
            // vollständig erzielt.

            collateralRecoveryPercent:
                settings.collateralRecoveryPercent ??
                80
        };


        // ========================================
        // Status
        // ========================================

        this.status =
            "inactive";


        // inactive
        // reminder_1
        // reminder_2
        // termination_warning
        // terminated
        // collateral_enforcement
        // resolved
        // closed


        // ========================================
        // Mahnstufe
        // ========================================

        this.stage =
            0;


        // ========================================
        // Offene Zusatzkosten
        // ========================================

        this.fees =
            0;


        this.defaultInterest =
            0;


        // ========================================
        // Termine
        // ========================================

        this.startedAt =
            null;


        this.lastActionAt =
            null;


        this.deadline =
            null;


        this.terminatedAt =
            null;


        this.resolvedAt =
            null;


        // ========================================
        // Historie
        // ========================================

        this.history =
            [];


        // ========================================
        // Sicherheiten
        // ========================================

        this.enforcedCollateral =
            [];


        this.totalCollateralRecovery =
            0;
    }


    // ========================================
    // Tage addieren
    // ========================================

    addDays(
        date,
        days
    ) {

        const result =
            new Date(
                date
            );


        result.setDate(
            result.getDate() +
            days
        );


        return result;
    }


    // ========================================
    // Ereignis protokollieren
    // ========================================

    addHistory(
        type,
        date,
        details = {}
    ) {

        this.history.push({

            type,

            date:
                new Date(
                    date
                ),

            ...details
        });
    }


    // ========================================
    // Mahnverfahren starten
    // ========================================

    start(
        date = new Date()
    ) {

        if (
            !this.loan
        ) {

            return false;
        }


        if (
            this.status !==
            "inactive"
        ) {

            return false;
        }


        this.startedAt =
            new Date(
                date
            );


        return this.issueFirstReminder(
            date
        );
    }


    // ========================================
    // Erste Mahnung
    // ========================================

    issueFirstReminder(
        date = new Date()
    ) {

        this.stage =
            1;


        this.status =
            "reminder_1";


        this.fees +=
            this.settings
                .firstReminderFee;


        this.lastActionAt =
            new Date(
                date
            );


        this.deadline =
            this.addDays(

                date,

                this.settings
                    .firstReminderDays
            );


        this.addHistory(

            "first_reminder",

            date,

            {
                fee:
                    this.settings
                        .firstReminderFee,

                deadline:
                    this.deadline
            }
        );


        return true;
    }


    // ========================================
    // Zweite Mahnung
    // ========================================

    issueSecondReminder(
        date = new Date()
    ) {

        this.stage =
            2;


        this.status =
            "reminder_2";


        this.fees +=
            this.settings
                .secondReminderFee;


        this.lastActionAt =
            new Date(
                date
            );


        this.deadline =
            this.addDays(

                date,

                this.settings
                    .secondReminderDays
            );


        this.addHistory(

            "second_reminder",

            date,

            {
                fee:
                    this.settings
                        .secondReminderFee,

                deadline:
                    this.deadline
            }
        );


        return true;
    }


    // ========================================
    // Kündigungsandrohung
    // ========================================

    issueTerminationWarning(
        date = new Date()
    ) {

        this.stage =
            3;


        this.status =
            "termination_warning";


        this.fees +=
            this.settings
                .terminationWarningFee;


        this.lastActionAt =
            new Date(
                date
            );


        this.deadline =
            this.addDays(

                date,

                this.settings
                    .terminationWarningDays
            );


        this.addHistory(

            "termination_warning",

            date,

            {
                fee:
                    this.settings
                        .terminationWarningFee,

                deadline:
                    this.deadline
            }
        );


        return true;
    }


    // ========================================
    // Verzugszinsen berechnen
    //
    // Hier zunächst täglich auf die
    // aktuelle Restschuld.
    // ========================================

    calculateDailyDefaultInterest() {

        if (
            !this.loan
        ) {

            return 0;
        }


        const principal =
            this.loan
                .remainingPrincipal ??
            0;


        if (
            principal <= 0
        ) {

            return 0;
        }


        const annualRate =

            this.settings
                .defaultInterestRate /
            100;


        return (

            principal *
            annualRate /
            365
        );
    }


    // ========================================
    // Einen Tag Verzugszins buchen
    // ========================================

    bookDailyDefaultInterest(
        date = new Date()
    ) {

        if (
            this.status ===
            "inactive" ||
            this.status ===
            "resolved" ||
            this.status ===
            "closed"
        ) {

            return 0;
        }


        const interest =
            this.calculateDailyDefaultInterest();


        this.defaultInterest +=
            interest;


        this.addHistory(

            "default_interest",

            date,

            {
                amount:
                    interest
            }
        );


        return interest;
    }


    // ========================================
    // Gesamter offener Betrag
    //
    // Restschuld
    // + Mahnkosten
    // + Verzugszinsen
    // ========================================

    getOutstandingAmount() {

        const principal =

            this.loan
                ?.remainingPrincipal ??

            0;


        return (

            principal +
            this.fees +
            this.defaultInterest
        );
    }


    // ========================================
    // Ist Frist abgelaufen?
    // ========================================

    isDeadlineExpired(
        currentDate = new Date()
    ) {

        if (
            !this.deadline
        ) {

            return false;
        }


        return (

            currentDate.getTime() >=
            this.deadline.getTime()
        );
    }


    // ========================================
    // Kredit kündigen
    //
    // WICHTIG:
    // Noch keine Sicherheit einziehen.
    // ========================================

    terminateLoan(
        date = new Date()
    ) {

        if (
            this.status !==
            "termination_warning"
        ) {

            return false;
        }


        this.stage =
            4;


        this.status =
            "terminated";


        this.terminatedAt =
            new Date(
                date
            );


        this.deadline =
            null;


        if (
            this.loan
        ) {

            this.loan.status =
                "defaulted";
        }


        this.addHistory(

            "loan_terminated",

            date,

            {
                outstandingAmount:
                    this.getOutstandingAmount()
            }
        );


        return true;
    }


    // ========================================
    // Mahnverfahren aktualisieren
    //
    // Wird später vom Spiel-Tick aufgerufen.
    // ========================================

    update(
        currentDate = new Date()
    ) {

        if (
            this.status ===
            "inactive" ||
            this.status ===
            "resolved" ||
            this.status ===
            "closed"
        ) {

            return;
        }


        // ------------------------------------
        // Frist noch nicht abgelaufen
        // ------------------------------------

        if (
            !this.isDeadlineExpired(
                currentDate
            )
        ) {

            return;
        }


        // ------------------------------------
        // Stufe 1 -> Stufe 2
        // ------------------------------------

        if (
            this.status ===
            "reminder_1"
        ) {

            this.issueSecondReminder(
                currentDate
            );


            return;
        }


        // ------------------------------------
        // Stufe 2 -> Kündigungsandrohung
        // ------------------------------------

        if (
            this.status ===
            "reminder_2"
        ) {

            this.issueTerminationWarning(
                currentDate
            );


            return;
        }


        // ------------------------------------
        // Letzte Frist vorbei
        // ------------------------------------

        if (
            this.status ===
            "termination_warning"
        ) {

            this.terminateLoan(
                currentDate
            );
        }
    }


    // ========================================
    // Spieler bezahlt während Mahnverfahren
    //
    // Wir erlauben die vollständige Heilung,
    // solange noch nicht verwertet wurde.
    // ========================================

    settleArrears(
        date = new Date()
    ) {

        if (
            !this.loan ||
            !this.loan.company
        ) {

            return {

                success:
                    false,

                reason:
                    "Unternehmenskonto nicht verfügbar"
            };
        }


        if (
            this.status ===
            "collateral_enforcement" ||
            this.status ===
            "closed"
        ) {

            return {

                success:
                    false,

                reason:
                    "Verwertung bereits eingeleitet"
            };
        }


        // ------------------------------------
        // Hier zunächst:
        //
        // offene Monatsrate
        // + Mahnkosten
        // + Verzugszinsen
        // ------------------------------------

        const regularPayment =

            Math.min(

                this.loan.monthlyPayment,

                this.loan
                    .remainingPrincipal +

                this.loan
                    .calculateCurrentInterest()
            );


        const amountDue =

            regularPayment +
            this.fees +
            this.defaultInterest;


        if (
            this.loan.company.money <
            amountDue
        ) {

            return {

                success:
                    false,

                reason:
                    "Nicht genügend Liquidität",

                required:
                    amountDue,

                available:
                    this.loan.company.money
            };
        }


        // ========================================
        // Mahnkosten + Verzugszinsen abbuchen
        // ========================================

        const additionalCosts =

            this.fees +
            this.defaultInterest;


        this.loan.company.money -=
            additionalCosts;


        // ========================================
        // Reguläre Rate über Loan buchen
        // ========================================

        // Damit Loan.makePayment nicht wegen
        // status "defaulted" blockiert, setzen
        // wir bei noch heilbarem Verfahren
        // zunächst overdue.

        this.loan.status =
            "overdue";


        const paymentResult =
            this.loan.makePayment(
                date
            );


        if (
            !paymentResult.success
        ) {

            // Zusatzkosten zurückgeben,
            // falls reguläre Zahlung scheitert.

            this.loan.company.money +=
                additionalCosts;


            return paymentResult;
        }


        // ========================================
        // Verfahren erledigt
        // ========================================

        this.status =
            "resolved";


        this.resolvedAt =
            new Date(
                date
            );


        this.deadline =
            null;


        this.addHistory(

            "arrears_settled",

            date,

            {
                additionalCosts,
                regularPayment
            }
        );


        this.fees =
            0;


        this.defaultInterest =
            0;


        return {

            success:
                true,

            additionalCosts,

            payment:
                paymentResult,

            status:
                this.status
        };
    }


    // ========================================
    // Sicherheitenverwertung starten
    //
    // NUR nach Kreditkündigung.
    // ========================================

    startCollateralEnforcement(
        date = new Date()
    ) {

        if (
            this.status !==
            "terminated"
        ) {

            return false;
        }


        this.status =
            "collateral_enforcement";


        this.addHistory(

            "collateral_enforcement_started",

            date,

            {
                outstandingAmount:
                    this.getOutstandingAmount()
            }
        );


        return true;
    }


    // ========================================
    // Einzelne Sicherheit verwerten
    //
    // asset erwartet mindestens:
    //
    // {
    //   id,
    //   name,
    //   marketValue
    // }
    //
    // Das tatsächliche Entfernen aus Fahrzeug-,
    // Gebäude- oder Maschinenbestand übernimmt
    // später das Asset-System.
    // ========================================

    enforceCollateral(
        asset,
        date = new Date()
    ) {

        if (
            this.status !==
            "collateral_enforcement"
        ) {

            return {

                success:
                    false,

                reason:
                    "Sicherheitenverwertung nicht freigegeben"
            };
        }


        if (
            !asset
        ) {

            return {

                success:
                    false,

                reason:
                    "Keine Sicherheit angegeben"
            };
        }


        // Doppelte Verwertung verhindern

        const alreadyEnforced =
            this.enforcedCollateral
                .some(

                    item =>
                        item.assetId ===
                        asset.id
                );


        if (
            alreadyEnforced
        ) {

            return {

                success:
                    false,

                reason:
                    "Sicherheit wurde bereits verwertet"
            };
        }


        const marketValue =
            Math.max(

                asset.marketValue ??
                0,

                0
            );


        const recoveryValue =

            marketValue *

            (
                this.settings
                    .collateralRecoveryPercent /
                100
            );


        this.totalCollateralRecovery +=
            recoveryValue;


        this.enforcedCollateral.push({

            assetId:
                asset.id,

            name:
                asset.name ??
                "Sicherheit",

            marketValue,

            recoveryValue,

            enforcedAt:
                new Date(
                    date
                )
        });


        this.addHistory(

            "collateral_enforced",

            date,

            {
                assetId:
                    asset.id,

                assetName:
                    asset.name,

                marketValue,

                recoveryValue
            }
        );


        // ------------------------------------
        // Restschuld reduzieren
        // ------------------------------------

        if (
            this.loan
        ) {

            this.loan.remainingPrincipal =
                Math.max(

                    this.loan.remainingPrincipal -
                    recoveryValue,

                    0
                );


            if (
                this.loan.company &&
                typeof this.loan.company.totalDebt ===
                "number"
            ) {

                this.loan.company.totalDebt =
                    Math.max(

                        this.loan.company.totalDebt -
                        recoveryValue,

                        0
                    );
            }
        }


        // ------------------------------------
        // Alles gedeckt?
        // ------------------------------------

        if (
            this.getOutstandingAmount() <=
            0.01
        ) {

            this.closeAfterEnforcement(
                date
            );
        }


        return {

            success:
                true,

            assetId:
                asset.id,

            recoveryValue,

            remainingDebt:
                this.getOutstandingAmount()
        };
    }


    // ========================================
    // Verfahren nach Verwertung schließen
    // ========================================

    closeAfterEnforcement(
        date = new Date()
    ) {

        this.status =
            "closed";


        this.resolvedAt =
            new Date(
                date
            );


        this.addHistory(

            "collection_closed",

            date,

            {
                remainingDebt:
                    this.getOutstandingAmount(),

                totalCollateralRecovery:
                    this.totalCollateralRecovery
            }
        );


        return true;
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            loanId:
                this.loan
                    ?.id ??
                null,

            status:
                this.status,

            stage:
                this.stage,

            fees:
                this.fees,

            defaultInterest:
                this.defaultInterest,

            outstandingAmount:
                this.getOutstandingAmount(),

            deadline:
                this.deadline,

            startedAt:
                this.startedAt,

            terminatedAt:
                this.terminatedAt,

            totalCollateralRecovery:
                this.totalCollateralRecovery,

            enforcedCollateral:
                this.enforcedCollateral,

            history:
                this.history
        };
    }
}