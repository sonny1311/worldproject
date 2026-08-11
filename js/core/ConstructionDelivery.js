// ============================================
// ConstructionDelivery.js
// WorldProject
//
// Verbindet eine Bestellung mit einer Baustelle.
//
// Aufgaben:
// - Bestellung einer Baustelle zuordnen
// - Lieferung verfolgen
// - Material erst bei Ankunft gutschreiben
// - Baustellenbestand erhöhen
// - fehlendes Material neu prüfen
// - pausierten Bau ggf. wieder starten
// ============================================

export class ConstructionDelivery {

    constructor({

        purchaseOrder,

        construction

    }) {

        // ========================================
        // ID
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Bestellung
        // ========================================

        this.purchaseOrder =
            purchaseOrder;


        // ========================================
        // Bauprojekt
        // ========================================

        this.construction =
            construction;


        // ========================================
        // Material
        // ========================================

        this.materialId =
            purchaseOrder
                ?.offer
                ?.materialId ??
            null;


        // ========================================
        // Liefermenge
        // ========================================

        this.amount =
            purchaseOrder
                ?.amount ??
            0;


        // ========================================
        // Status
        // ========================================

        this.status =
            "waiting";


        // waiting
        // in_transit
        // arrived
        // unloaded
        // completed
        // failed


        // ========================================
        // Zeitpunkte
        // ========================================

        this.createdAt =
            new Date();


        this.startedAt =
            null;


        this.arrivedAt =
            null;


        this.unloadedAt =
            null;


        // ========================================
        // Wurde Material bereits gutgeschrieben?
        //
        // Verhindert doppelte Gutschrift.
        // ========================================

        this.materialCredited =
            false;
    }


    // ========================================
    // Grundprüfung
    // ========================================

    isValid() {

        if (
            !this.purchaseOrder
        ) {

            return false;
        }


        if (
            !this.construction
        ) {

            return false;
        }


        if (
            !this.materialId
        ) {

            return false;
        }


        if (
            this.amount <= 0
        ) {

            return false;
        }


        return true;
    }


    // ========================================
    // Lieferung starten
    //
    // Bestellung muss bezahlt sein.
    // ========================================

    start() {

        if (
            !this.isValid()
        ) {

            this.status =
                "failed";


            return false;
        }


        if (
            this.purchaseOrder.status !==
            "paid"
        ) {

            return false;
        }


        // ------------------------------------
        // Transport der Bestellung starten
        // ------------------------------------

        const started =
            this.purchaseOrder
                .startTransport();


        if (!started) {

            this.status =
                "failed";


            return false;
        }


        this.status =
            "in_transit";


        this.startedAt =
            new Date();


        return true;
    }


    // ========================================
    // Lieferung ist an Baustelle angekommen
    //
    // Noch KEINE Materialgutschrift.
    //
    // Das Material befindet sich zunächst
    // am Ziel und muss entladen werden.
    // ========================================

    markArrived() {

        if (
            this.status !==
            "in_transit"
        ) {

            return false;
        }


        this.status =
            "arrived";


        this.arrivedAt =
            new Date();


        return true;
    }


    // ========================================
    // Material entladen
    //
    // ERST HIER wird das Material tatsächlich
    // der Baustelle gutgeschrieben.
    // ========================================

    unload() {

        if (
            this.status !==
            "arrived"
        ) {

            return false;
        }


        // ------------------------------------
        // Doppelte Gutschrift verhindern
        // ------------------------------------

        if (
            this.materialCredited
        ) {

            return false;
        }


        // ------------------------------------
        // Material auf Baustelle hinzufügen
        // ------------------------------------

        const added =
            this.construction
                .addMaterial(

                    this.materialId,

                    this.amount
                );


        if (!added) {

            this.status =
                "failed";


            return false;
        }


        // ------------------------------------
        // Material wurde gutgeschrieben
        // ------------------------------------

        this.materialCredited =
            true;


        this.unloadedAt =
            new Date();


        this.status =
            "unloaded";


        // ------------------------------------
        // Bestellung als geliefert markieren
        // ------------------------------------

        const delivered =
            this.purchaseOrder
                .markDelivered();


        if (!delivered) {

            this.status =
                "failed";


            return false;
        }


        // ------------------------------------
        // Fehlendes Material neu prüfen
        // ------------------------------------

        this.construction
            .updateMissingMaterials();


        // ------------------------------------
        // Falls Bau wegen Materialmangel
        // pausiert:
        //
        // prüfen, ob jetzt genug Material
        // vorhanden ist.
        // ------------------------------------

        if (
            this.construction.status ===
            "paused_material"
        ) {

            this.construction
                .resumeAfterMaterials();
        }


        this.status =
            "completed";


        return true;
    }


    // ========================================
    // Kompletter Lieferstatus
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            purchaseOrderId:
                this.purchaseOrder
                    ?.id,

            materialId:
                this.materialId,

            amount:
                this.amount,

            status:
                this.status,

            materialCredited:
                this.materialCredited,

            createdAt:
                this.createdAt,

            startedAt:
                this.startedAt,

            arrivedAt:
                this.arrivedAt,

            unloadedAt:
                this.unloadedAt,

            constructionStatus:
                this.construction
                    ?.status ??
                null
        };
    }
}