// ============================================
// ConstructionPhasePlans.js
// WorldProject
// Allgemeine Bauphasen
// ============================================


// ============================================
// Standard-Bauphasen
//
// Die Prozentwerte beziehen sich auf die
// gesamte aktive Bauzeit.
//
// Beispiel:
// 30 Tage Bauzeit
//
// 15 % Fundament       = 4,5 Tage
// 30 % Rohbau          = 9 Tage
// 20 % Gebäudehülle    = 6 Tage
// 20 % Technik         = 6 Tage
// 15 % Innenausbau     = 4,5 Tage
//
// Gesamt = 100 %
// ============================================

export const ConstructionPhasePlans = {

    standard: [

        // ----------------------------------------
        // Phase 1
        // Fundament
        // ----------------------------------------

        {
            id: "foundation",

            name: "Fundament",

            buildTimePercent: 15,

            materials: {

                concrete: 30,

                steel: 20
            }
        },


        // ----------------------------------------
        // Phase 2
        // Rohbau
        // ----------------------------------------

        {
            id: "structure",

            name: "Rohbau",

            buildTimePercent: 30,

            materials: {

                concrete: 55,

                steel: 65,

                bricks: 75
            }
        },


        // ----------------------------------------
        // Phase 3
        // Gebäudehülle
        // ----------------------------------------

        {
            id: "buildingShell",

            name: "Gebäudehülle",

            buildTimePercent: 20,

            materials: {

                concrete: 15,

                steel: 15,

                bricks: 25,

                insulation: 80,

                glass: 100
            }
        },


        // ----------------------------------------
        // Phase 4
        // Technischer Ausbau
        // ----------------------------------------

        {
            id: "technical",

            name: "Technischer Ausbau",

            buildTimePercent: 20,

            materials: {

                cables: 100,

                insulation: 20
            }
        },


        // ----------------------------------------
        // Phase 5
        // Innenausbau
        // ----------------------------------------

        {
            id: "interior",

            name: "Innenausbau",

            buildTimePercent: 15,

            materials: {

                tiles: 100
            }
        }

    ]
};