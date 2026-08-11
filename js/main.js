// ============================================
// main.js
// WorldProject
// ============================================

import {
    Engine
} from "./core/Engine.js";

import {
    CompanySetup
} from "./core/CompanySetup.js";

import {
    runConstructionTransportTest
} from "./core/ConstructionTransportTest.js";

import {
    ConstructionTransportDialog
} from "./core/ConstructionTransportDialog.js";

import {
    ConstructionMaterialOrder
} from "./core/ConstructionMaterialOrder.js";

import {
    Building
} from "./core/Building.js";

import {
    BuildingTypes
} from "./core/BuildingTypes.js";

import {
    Construction
} from "./core/Construction.js";

import {
    Truck
} from "./core/Truck.js";


// ============================================
// Engine
// ============================================

const engine =
    new Engine();


// ============================================
// Unternehmen
// ============================================

engine.company = {

    name:
        "",

    industry:
        "",

    type:
        "",

    money:
        50000,

    coins:
        0,

    land: {

        size:
            100
    },

    buildings:
        []
};


// ============================================
// Unternehmensgründung
// ============================================

const companySetup =
    new CompanySetup(

        engine.company,

        company => {

            console.log(
                "Unternehmen gegründet:",
                company
            );


            // ====================================
            // Unternehmen ist jetzt erstellt
            // ====================================

            engine.company =
                company;
        }
    );


// ============================================
// Spiel starten
// ============================================

engine.start();


// ============================================
// Gründungsfenster anzeigen
// ============================================

companySetup.show();


// ============================================
// Bestehenden Transporttest starten
// ============================================

runConstructionTransportTest();


// ============================================
// SICHTBARER GIGA-DIALOGTEST
//
// Dieser Test erzeugt unabhängig vom
// Konsolentest:
//
// - Testgebäude
// - Testbaustelle
// - Testfirma
// - 80 Paletten Ziegel
// - Transportplanung
// - Giga-Empfehlung
//
// Danach erscheint unser neuer Dialog.
//
// WICHTIG:
//
// Der Test startet mit 10 Coins.
//
// Klickt der Spieler auf:
//
// "Giga für 1 Coin bestätigen"
//
// müssen danach 9 Coins übrig sein.
// ============================================

function runGigaDialogTest() {

    console.log(
        "======================================"
    );

    console.log(
        "SICHTBARER GIGA-DIALOGTEST"
    );

    console.log(
        "======================================"
    );


    // ========================================
    // Gebäudetyp auswählen
    // ========================================

    const buildingType =
        Object.keys(
            BuildingTypes
        )[0];


    if (
        !buildingType
    ) {

        console.error(
            "❌ Giga-Dialogtest: Kein Gebäudetyp vorhanden."
        );

        return;
    }


    // ========================================
    // Testgebäude
    // ========================================

    const building =
        new Building(

            buildingType,

            "Giga-Dialog-Testgebäude",

            100
        );


    // ========================================
    // Testbaustelle
    // ========================================

    const construction =
        new Construction(

            building,

            30
        );


    // ========================================
    // Testfirma
    //
    // Bewusst 10 Coins.
    // ========================================

    const testCompany = {

        name:
            "Giga Dialog Testfirma",

        money:
            50000,

        coins:
            10,

        gigaTransportService:
            null
    };


    // ========================================
    // Test-LKW
    // ========================================

    const truck =
        new Truck(

            "semi40",

            {

                name:
                    "Test 40-Tonner"
            }
        );


    // ========================================
    // Testbestellung
    //
    // 24.000 Ziegel
    // = 80 Paletten
    //
    // Gewicht:
    // 20.000 kg
    //
    // Erwartete Optimierung:
    //
    // 54 Paletten Giga
    // +
    // 26 Paletten normal
    //
    // = 2 Fahrten
    //
    // statt 3 normaler Fahrten.
    // ========================================

    const proposal = {

        purchases: [

            {

                materialId:
                    "bricks",

                name:
                    "Testziegel",

                orderAmount:
                    24000,

                unit:
                    "Stück",

                supplierId:
                    "test-supplier",

                supplierName:
                    "Testlieferant",

                distanceKm:
                    100,

                pricePerUnit:
                    0.50,

                materialCost:
                    12000,

                transportCost:
                    0,

                weightKg:
                    20000,

                offer: {

                    availableAmount:
                        24000
                }
            }
        ]
    };


    // ========================================
    // Bestellung erzeugen
    // ========================================

    const order =
        new ConstructionMaterialOrder({

            construction,

            company:
                testCompany,

            proposal
        });


    console.log(
        "Dialog-Testbestellung:",
        order
    );


    // ========================================
    // Material reservieren
    // ========================================

    const reservation =
        order.reserveMaterials();


    if (
        !reservation.success
    ) {

        console.error(
            "❌ Giga-Dialogtest: Reservierung fehlgeschlagen.",
            reservation
        );

        return;
    }


    console.log(
        "✅ Dialogtest: Material reserviert",
        reservation
    );


    // ========================================
    // Transport planen
    // ========================================

    const planning =
        order.createTransportJobs(
            truck
        );


    if (
        !planning.success
    ) {

        console.error(
            "❌ Giga-Dialogtest: Transportplanung fehlgeschlagen.",
            planning
        );

        return;
    }


    console.log(
        "✅ Dialogtest: Transport geplant",
        planning
    );


    // ========================================
    // Prüfen, ob Giga erkannt wurde
    // ========================================

    if (
        planning.gigaTrips <=
        0
    ) {

        console.error(
            "❌ Giga-Dialogtest: Keine Giga-Fahrt geplant.",
            planning
        );

        return;
    }


    console.log(
        "✅ Giga erkannt:",
        planning.gigaTrips,
        "Giga +",
        planning.normalTrips,
        "normal"
    );


    console.log(
        "Coins vor Dialog:",
        testCompany.coins
    );


    // ========================================
    // Dialog erzeugen
    // ========================================

    const dialog =
        new ConstructionTransportDialog({

            order,


            // ====================================
            // Giga erfolgreich bestätigt
            // ====================================

            onConfirmed:
                (
                    result,
                    confirmedOrder
                ) => {

                    console.log(
                        "======================================"
                    );

                    console.log(
                        "✅ GIGA VOM SPIELER BESTÄTIGT"
                    );

                    console.log(
                        "Bestätigung:",
                        result
                    );

                    console.log(
                        "Coins danach:",
                        testCompany.coins
                    );

                    console.log(
                        "Transportjobs:",
                        confirmedOrder
                            .transportJobs
                    );


                    if (
                        testCompany.coins ===
                        9
                    ) {

                        console.log(
                            "✅ COINTEST ERFOLGREICH: 10 → 9"
                        );

                    } else {

                        console.error(
                            "❌ COINTEST FEHLGESCHLAGEN. Erwartet: 9, Ist:",
                            testCompany.coins
                        );
                    }


                    console.log(
                        "======================================"
                    );
                },


            // ====================================
            // Spieler lehnt Giga ab
            // ====================================

            onNormalTransport:
                (
                    result,
                    normalOrder
                ) => {

                    console.log(
                        "======================================"
                    );

                    console.log(
                        "🚚 SPIELER WÄHLT NORMALEN TRANSPORT"
                    );

                    console.log(
                        "Ergebnis:",
                        result
                    );

                    console.log(
                        "Coins bleiben:",
                        testCompany.coins
                    );

                    console.log(
                        "Transportauftrag:",
                        normalOrder
                    );

                    console.log(
                        "======================================"
                    );
                },


            // ====================================
            // Coin-Shop
            //
            // Noch KEIN echter Echtgeldshop.
            //
            // Wir prüfen hier zunächst nur,
            // ob der Dialog korrekt das
            // 50-Coin-Angebot weitergibt.
            // ====================================

            onCoinShop:
                data => {

                    console.log(
                        "======================================"
                    );

                    console.log(
                        "🪙 COIN-SHOP ANGEFORDERT"
                    );

                    console.log(
                        "Coin-Angebot:",
                        data
                    );

                    console.log(
                        "======================================"
                    );


                    alert(
                        "Coin-Shop-Test\n\n" +

                        "Kleinstes Paket: " +

                        data.minimumPackage +

                        " Coins\n\n" +

                        "Der echte Shop wird später angeschlossen."
                    );
                },


            // ====================================
            // Dialog geschlossen
            // ====================================

            onClose:
                () => {

                    console.log(
                        "Giga-Dialog geschlossen."
                    );
                }
        });


    // ========================================
    // Dialog öffnen
    // ========================================

    const opened =
        dialog.open();


    if (
        opened
    ) {

        console.log(
            "✅ Giga-Dialog geöffnet"
        );

    } else {

        console.error(
            "❌ Giga-Dialog konnte nicht geöffnet werden"
        );
    }


    // ========================================
    // Für Tests in Browser-Konsole verfügbar
    //
    // Dadurch können wir später z.B. eingeben:
    //
    // window.gigaDialogTest.company.coins
    //
    // ========================================

    window.gigaDialogTest = {

        company:
            testCompany,

        building,

        construction,

        truck,

        order,

        planning,

        dialog
    };
}


// ============================================
// Dialogtest leicht verzögert starten
//
// Dadurch kann zuerst das normale Spiel
// und das Gründungsfenster aufgebaut werden.
// ============================================

setTimeout(
    () => {

        runGigaDialogTest();

    },
    500
);