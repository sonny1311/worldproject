// ============================================
// Building.js
// WorldProject
// Gebäude-System
// ============================================
import { BuildingTypes } from "./BuildingTypes.js";
export class Building {

    constructor(type, name = null, size = null) {
const definition =
    BuildingTypes[type];

if (!definition) {

    throw new Error(
        "Unbekannter Gebäudetyp: " + type
    );
}

if (size === null) {

    size =
        definition.minSize;
}

if (name === null) {

    name =
        definition.name;
}

        // ----------------------------------------
        // Grunddaten
        // ----------------------------------------

        this.id =
            Date.now() +
            Math.random();

        this.type = type;

        this.name = name;

        this.size = size;

        this.level = 1;


        // ----------------------------------------
        // Bauzustand
        // ----------------------------------------

        this.construction = {

            status: "finished",

            progress: 100,

            buildPercentRemaining: 0
        };


        // ----------------------------------------
        // Ausstattung
        // ----------------------------------------

        // Wichtig:
        // Ein Gebäude wird LEER gebaut.
        // Ausstattung wird später separat gekauft.

        this.equipment = [];


        // ----------------------------------------
        // Kapazität
        // ----------------------------------------

        this.capacity = {

            current: 0,

            maximum: 0
        };


        // ----------------------------------------
        // Laufende Kosten
        // ----------------------------------------

        this.monthlyCosts = {

            electricity: 0,

            water: 0,

            maintenance: 0,

            insurance: 0,

            other: 0,

            total: 0
        };


        // ----------------------------------------
        // Erweiterungen
        // ----------------------------------------

        this.expansions = [];
    }


    // ========================================
    // Ausstattung hinzufügen
    // ========================================

    addEquipment(equipment) {

        this.equipment.push(
            equipment
        );
    }


    // ========================================
    // Ausstattung entfernen
    // ========================================

    removeEquipment(equipmentId) {

        this.equipment =
            this.equipment.filter(
                equipment =>
                    equipment.id !== equipmentId
            );
    }


    // ========================================
    // Gebäude erweitern
    // ========================================

    expand(newSize) {

        if (newSize <= this.size) {

            return false;
        }

        const oldSize =
            this.size;

        this.size =
            newSize;

        this.level++;

        this.expansions.push({

            from: oldSize,

            to: newSize,

            date: new Date()
        });

        return true;
    }


    // ========================================
    // Kapazität aktualisieren
    // ========================================

    updateCapacity() {

        let totalCapacity = 0;

        for (
            const equipment
            of this.equipment
        ) {

            if (
                typeof equipment.capacity ===
                "number"
            ) {

                totalCapacity +=
                    equipment.capacity;
            }
        }

        this.capacity.current =
            totalCapacity;
    }
}