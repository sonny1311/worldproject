// ============================================
// SaveManager.js
// WorldEngine
// Version 0.3.0
// ============================================

export class SaveManager {

    constructor(engine) {

        this.engine = engine;

        this.version = "0.3.0";

        this.saveName = "WorldEngine";

        this.autoSave = true;

        this.autoSaveInterval = 300000;

    }

    //----------------------------------------
    // Spiel speichern
    //----------------------------------------

    save() {

        const saveData = this.createSaveObject();

        const json = JSON.stringify(saveData);

        localStorage.setItem(

            this.saveName,

            json

        );

        return true;

    }

    //----------------------------------------
    // Spiel laden
    //----------------------------------------

    load() {

        const json = localStorage.getItem(

            this.saveName

        );

        if(json === null)
            return null;

        return JSON.parse(json);

    }

    //----------------------------------------
    // Spiel löschen
    //----------------------------------------

    delete() {

        localStorage.removeItem(

            this.saveName

        );

    }

    //----------------------------------------
    // Save erstellen
    //----------------------------------------

    createSaveObject() {

        return {

            version: this.version,

            created: Date.now(),

            player: this.serializePlayer(),

            world: this.serializeWorld(),

            companies: this.serializeCompanies(),

            statistics: this.serializeStatistics()

        };

    }

    //----------------------------------------
    // Spieler
    //----------------------------------------

    serializePlayer() {

        return {};

    }

    //----------------------------------------
    // Welt
    //----------------------------------------

    serializeWorld() {

        return {};

    }

    //----------------------------------------
    // Firmen
    //----------------------------------------

    serializeCompanies() {

        return [];

    }

    //----------------------------------------
    // Statistik
    //----------------------------------------

    serializeStatistics() {

        return {};

    }

}