// ============================================
// DataManager.js
// WorldEngine
// Version 0.3.0
// ============================================

export class DataManager {

    constructor() {

        this.data = new Map();

    }

    //----------------------------------------
    // JSON laden
    //----------------------------------------

    async load(name, path) {

        const response = await fetch(path);

        if(!response.ok){

            throw new Error(

                "Datei konnte nicht geladen werden: " +

                path

            );

        }

        const json = await response.json();

        this.data.set(name, json);

        return json;

    }

    //----------------------------------------
    // Daten abrufen
    //----------------------------------------

    get(name){

        return this.data.get(name);

    }

    //----------------------------------------
    // Einzelnen Eintrag holen
    //----------------------------------------

    getById(name,id){

        const list = this.data.get(name);

        if(!list)
            return null;

        return list.find(

            item => item.id === id

        ) || null;

    }

    //----------------------------------------
    // Existiert?

    has(name){

        return this.data.has(name);

    }

    //----------------------------------------
    // Entfernen

    remove(name){

        this.data.delete(name);

    }

    //----------------------------------------
    // Alles löschen

    clear(){

        this.data.clear();

    }

}