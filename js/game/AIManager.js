// ============================================
// AIManager.js
// WorldEngine
// Version 0.2.0
// ============================================

export class AIManager {

    constructor(company) {

        this.company = company;

        // Aktiv
        this.enabled = true;

        // Automatisierungsstufe
        // 0 = Aus
        // 1 = Vorschläge
        // 2 = Teilautomatisch
        // 3 = Vollautomatisch
        this.level = 1;

        // Manager
        this.managers = {

            purchasing: false,
            logistics: false,
            warehouse: false,
            personnel: false,
            pricing: false,
            marketing: false,
            maintenance: false,
            production: false,
            research: false,
            finance: false

        };

        // Nachrichten
        this.messages = [];

        // Empfehlungen
        this.recommendations = [];

    }

    //----------------------------------------
    // Tägliches Update
    //----------------------------------------

    updateDay() {

        if (!this.enabled)
            return;

        this.messages = [];
        this.recommendations = [];

        this.checkWarehouse();

        this.checkEmployees();

        this.checkMaintenance();

        this.checkResearch();

        this.checkFinances();

    }

    //----------------------------------------

    checkWarehouse() {

        if (!this.managers.warehouse)
            return;

        this.addMessage(
            "📦 Lagerbestände wurden überprüft."
        );

    }

    //----------------------------------------

    checkEmployees() {

        if (!this.managers.personnel)
            return;

        this.addMessage(
            "👨‍💼 Personal wurde analysiert."
        );

    }

    //----------------------------------------

    checkMaintenance() {

        if (!this.managers.maintenance)
            return;

        this.addMessage(
            "🔧 Wartungsbedarf wurde geprüft."
        );

    }

    //----------------------------------------

    checkResearch() {

        if (!this.managers.research)
            return;

        this.addMessage(
            "🧪 Neue Forschungsprojekte analysiert."
        );

    }

    //----------------------------------------

    checkFinances() {

        if (!this.managers.finance)
            return;

        this.addMessage(
            "💰 Finanzlage ausgewertet."
        );

    }

    //----------------------------------------

    addMessage(text) {

        this.messages.push({

            time: new Date(),

            text: text

        });

    }

    //----------------------------------------

    addRecommendation(title, description) {

        this.recommendations.push({

            title,

            description

        });

    }

}