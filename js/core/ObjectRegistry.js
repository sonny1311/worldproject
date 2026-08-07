// ============================================
// ObjectRegistry.js
// WorldEngine
// Version 0.3.0
// ============================================

export class ObjectRegistry {

    constructor() {

        // Alle Objekte nach ID
        this.objects = new Map();

        // Nach Typ gruppiert
        this.types = new Map();

    }

    //----------------------------------------
    // Registrieren
    //----------------------------------------

    register(object) {

        if (!object || !object.id)
            return false;

        this.objects.set(object.id, object);

        const type = object.constructor.name;

        if (!this.types.has(type)) {

            this.types.set(type, new Map());

        }

        this.types
            .get(type)
            .set(object.id, object);

        return true;

    }

    //----------------------------------------
    // Entfernen
    //----------------------------------------

    unregister(id) {

        const object = this.objects.get(id);

        if (!object)
            return false;

        const type = object.constructor.name;

        if (this.types.has(type)) {

            this.types
                .get(type)
                .delete(id);

        }

        this.objects.delete(id);

        return true;

    }

    //----------------------------------------
    // Nach ID suchen
    //----------------------------------------

    get(id) {

        return this.objects.get(id) || null;

    }

    //----------------------------------------
    // Nach Typ
    //----------------------------------------

    getByType(type) {

        if (!this.types.has(type))
            return [];

        return Array.from(

            this.types
                .get(type)
                .values()

        );

    }

    //----------------------------------------
    // Existiert?
    //----------------------------------------

    exists(id) {

        return this.objects.has(id);

    }

    //----------------------------------------
    // Anzahl
    //----------------------------------------

    count() {

        return this.objects.size;

    }

    //----------------------------------------
    // Leeren
    //----------------------------------------

    clear() {

        this.objects.clear();

        this.types.clear();

    }

}