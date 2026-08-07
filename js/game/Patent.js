// ============================================
// Patent.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Patent {

    constructor(id, name) {

        this.id = id;

        // Patentname
        this.name = name;

        // Beschreibung
        this.description = "";

        // Besitzer
        this.owner = null;

        // Erfinder
        this.inventor = null;

        // Zugehöriges Forschungsprojekt
        this.researchProject = null;

        // Registrierungsdatum
        this.registerDate = null;

        // Ablaufdatum
        this.expireDate = null;

        // Schutz aktiv
        this.active = true;

        // Lizenzierung
        this.licenseAllowed = true;

        // Einmaliger Lizenzpreis
        this.licensePrice = 0;

        // Laufende Lizenzgebühr (%)
        this.royaltyPercent = 0;

        // Einnahmen
        this.totalIncome = 0;

        // Lizenznehmer
        this.licensees = [];

    }

    //----------------------------------------

    addLicense(company){

        this.licensees.push(company);

    }

    //----------------------------------------

    receiveRoyalty(amount){

        this.totalIncome += amount;

    }

    //----------------------------------------

    expire(){

        this.active = false;

    }

}