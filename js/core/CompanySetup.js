// ============================================
// CompanySetup.js
// WorldProject
// Unternehmensgründung
// ============================================

export class CompanySetup {

    constructor(company, onComplete) {

        this.company = company;
        this.onComplete = onComplete;

        this.overlay = null;
        this.industrySelect = null;
        this.typeSelect = null;

        this.industries = {

            "Getränke": [
                "Brauerei",
                "Getränkehersteller",
                "Mineralbrunnen"
            ],

            "Lebensmittel": [
                "Bäckerei",
                "Metzgerei",
                "Lebensmittelhersteller"
            ],

            "Landwirtschaft": [
                "Landwirtschaftsbetrieb",
                "Tierhaltung",
                "Obstbau"
            ],

            "Industrie": [
                "Maschinenbau",
                "Metallverarbeitung",
                "Kunststoffverarbeitung"
            ],

            "Handel": [
                "Einzelhandel",
                "Großhandel",
                "Onlinehandel"
            ]

        };
    }


    //----------------------------------------
    // Gründungsfenster anzeigen
    //----------------------------------------

    show() {

        if (this.overlay) {
            return;
        }

        this.createOverlay();

        this.updateTypes();

        document.body.appendChild(
            this.overlay
        );
    }


    //----------------------------------------
    // Oberfläche erstellen
    //----------------------------------------

    createOverlay() {

        this.overlay =
            document.createElement("div");

        this.overlay.style.position = "fixed";
        this.overlay.style.inset = "0";

        this.overlay.style.background =
            "rgba(0,0,0,0.65)";

        this.overlay.style.display =
            "flex";

        this.overlay.style.alignItems =
            "center";

        this.overlay.style.justifyContent =
            "center";

        this.overlay.style.zIndex = "1000";


        //------------------------------------
        // Fenster
        //------------------------------------

        const panel =
            document.createElement("div");

        panel.style.width = "420px";

        panel.style.padding = "30px";

        panel.style.background =
            "#ffffff";

        panel.style.borderRadius =
            "12px";

        panel.style.boxShadow =
            "0 10px 40px rgba(0,0,0,0.4)";

        panel.style.fontFamily =
            "Arial, sans-serif";


        //------------------------------------
        // Überschrift
        //------------------------------------

        const title =
            document.createElement("h1");

        title.textContent =
            "Unternehmen gründen";

        title.style.marginTop = "0";

        panel.appendChild(title);


        //------------------------------------
        // Firmenname
        //------------------------------------

        const nameLabel =
            document.createElement("label");

        nameLabel.textContent =
            "Firmenname";

        nameLabel.style.display =
            "block";

        nameLabel.style.marginTop =
            "20px";

        panel.appendChild(nameLabel);


        const nameInput =
            document.createElement("input");

        nameInput.type = "text";

        nameInput.placeholder =
            "z. B. NADENA";

        nameInput.style.width =
            "100%";

        nameInput.style.boxSizing =
            "border-box";

        nameInput.style.padding =
            "10px";

        nameInput.style.marginTop =
            "6px";

        nameInput.style.fontSize =
            "16px";

        panel.appendChild(nameInput);


        //------------------------------------
        // Branche
        //------------------------------------

        const industryLabel =
            document.createElement("label");

        industryLabel.textContent =
            "Branche";

        industryLabel.style.display =
            "block";

        industryLabel.style.marginTop =
            "20px";

        panel.appendChild(industryLabel);


        this.industrySelect =
            document.createElement("select");

        this.industrySelect.style.width =
            "100%";

        this.industrySelect.style.padding =
            "10px";

        this.industrySelect.style.marginTop =
            "6px";

        for (
            const industry of
            Object.keys(this.industries)
        ) {

            const option =
                document.createElement("option");

            option.value = industry;

            option.textContent = industry;

            this.industrySelect.appendChild(
                option
            );
        }

        this.industrySelect.addEventListener(
            "change",
            () => {

                this.updateTypes();

            }
        );

        panel.appendChild(
            this.industrySelect
        );


        //------------------------------------
        // Gewerbe
        //------------------------------------

        const typeLabel =
            document.createElement("label");

        typeLabel.textContent =
            "Gewerbe";

        typeLabel.style.display =
            "block";

        typeLabel.style.marginTop =
            "20px";

        panel.appendChild(typeLabel);


        this.typeSelect =
            document.createElement("select");

        this.typeSelect.style.width =
            "100%";

        this.typeSelect.style.padding =
            "10px";

        this.typeSelect.style.marginTop =
            "6px";

        panel.appendChild(
            this.typeSelect
        );


        //------------------------------------
        // Button
        //------------------------------------

        const button =
            document.createElement("button");

        button.textContent =
            "Unternehmen gründen";

        button.style.width =
            "100%";

        button.style.padding =
            "12px";

        button.style.marginTop =
            "30px";

        button.style.fontSize =
            "16px";

        button.style.cursor =
            "pointer";

        button.addEventListener(
            "click",
            () => {

                const name =
                    nameInput.value.trim();

                if (!name) {

                    alert(
                        "Bitte einen Firmennamen eingeben."
                    );

                    return;
                }


                this.company.name =
                    name;

                this.company.industry =
                    this.industrySelect.value;

                this.company.type =
                    this.typeSelect.value;


                this.close();


                if (this.onComplete) {

                    this.onComplete(
                        this.company
                    );
                }

            }
        );

        panel.appendChild(button);


        //------------------------------------
        // Panel einfügen
        //------------------------------------

        this.overlay.appendChild(panel);
    }


    //----------------------------------------
    // Gewerbe aktualisieren
    //----------------------------------------

    updateTypes() {

        if (!this.typeSelect) {
            return;
        }

        this.typeSelect.innerHTML = "";

        const industry =
            this.industrySelect.value;

        const types =
            this.industries[industry] || [];


        for (const type of types) {

            const option =
                document.createElement("option");

            option.value = type;

            option.textContent = type;

            this.typeSelect.appendChild(
                option
            );
        }
    }


    //----------------------------------------
    // Fenster schließen
    //----------------------------------------

    close() {

        if (!this.overlay) {
            return;
        }

        this.overlay.remove();

        this.overlay = null;
    }
}