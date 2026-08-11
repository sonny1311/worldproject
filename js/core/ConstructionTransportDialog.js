// ============================================
// ConstructionTransportDialog.js
// WorldProject
//
// Spieleroberfläche für die Auswahl
// eines optimierten Baustofftransports.
//
// Zeigt:
//
// - normalen Transport
// - Giga-Optimierung
// - eingesparte Fahrten
// - benötigte Coins
// - vorhandene Coins
//
// Der Spieler entscheidet:
//
// - Giga bestätigen
// - normalen Transport verwenden
//
// WICHTIG:
//
// Coins werden NICHT in dieser UI abgezogen.
//
// Die tatsächliche Coinprüfung und Abbuchung
// erfolgt ausschließlich über:
//
// order.confirmSpecialTransports()
//
// Dadurch bleibt Spiellogik von der UI getrennt.
// ============================================

import {
    TransportCostCalculator
} from "./TransportCostCalculator.js";
export class ConstructionTransportDialog {

    constructor({

        order,

        parent = document.body,

        onConfirmed = null,

        onNormalTransport = null,

        onCoinShop = null,

        onClose = null

    } = {}) {


        // ========================================
        // Grunddaten
        // ========================================

        this.order =
            order;


        this.parent =
            parent ??
            document.body;


        // ========================================
        // Callbacks
        // ========================================

        this.onConfirmed =
            onConfirmed;


        this.onNormalTransport =
            onNormalTransport;


        this.onCoinShop =
            onCoinShop;


        this.onClose =
            onClose;


        // ========================================
        // DOM
        // ========================================

        this.overlay =
            null;


        this.dialog =
            null;


        this.content =
            null;


        // ========================================
        // Status
        // ========================================

        this.isOpen =
            false;
    }


    // ========================================
    // Zahl formatieren
    // ========================================

    formatNumber(
        value,
        digits = 0
    ) {

        const number =
            Number(
                value
            );


        if (
            !Number.isFinite(
                number
            )
        ) {

            return "0";
        }


        return number.toLocaleString(
            "de-DE",
            {
                minimumFractionDigits:
                    digits,

                maximumFractionDigits:
                    digits
            }
        );
    }


    // ========================================
    // Coinbestand
    // ========================================

    getAvailableCoins() {

        return (

            this.order
                ?.company
                ?.coins

            ??

            0
        );
    }


    // ========================================
    // Giga-Jobs
    // ========================================

    getGigaJobs() {

        if (
            !Array.isArray(
                this.order
                    ?.transportJobs
            )
        ) {

            return [];
        }


        return this.order
            .transportJobs
            .filter(

                job =>
                    job
                        ?.transportType ===
                    "giga"
            );
    }


    // ========================================
    // Normale Jobs
    // ========================================

    getNormalJobs() {

        if (
            !Array.isArray(
                this.order
                    ?.transportJobs
            )
        ) {

            return [];
        }


        return this.order
            .transportJobs
            .filter(

                job =>
                    job
                        ?.transportType ===
                    "normal"
            );
    }


    // ========================================
    // Coinbedarf
    // ========================================

    getRequiredCoins() {

        const gigaJobs =
            this.getGigaJobs();


        return gigaJobs.reduce(

            (
                total,
                job
            ) =>

                total +

                (
                    job.coinCost ??
                    0
                ),

            0
        );
    }


    // ========================================
    // Eingesparte Fahrten
    //
    // Wird aus den Optimierungsergebnissen
    // der einzelnen Materialpositionen gelesen.
    // ========================================

    getSavedTrips() {

        if (
            !Array.isArray(
                this.order
                    ?.items
            )
        ) {

            return 0;
        }


        return this.order
            .items
            .reduce(

                (
                    total,
                    item
                ) =>

                    total +

                    (
                        item
                            ?.gigaOptimization
                            ?.savedTrips

                        ??

                        0
                    ),

                0
            );
    }


    // ========================================
    // Ursprüngliche normale Fahrten
    // ========================================

    getOriginalNormalTrips() {

        if (
            !Array.isArray(
                this.order
                    ?.items
            )
        ) {

            return 0;
        }


        return this.order
            .items
            .reduce(

                (
                    total,
                    item
                ) =>

                    total +

                    (
                        item
                            ?.gigaOptimization
                            ?.normalTrips

                        ??

                        0
                    ),

                0
            );
    }


    // ========================================
    // Aktuell geplante Fahrten
    // ========================================

    getOptimizedTrips() {

        return (

            this.getGigaJobs()
                .length

            +

            this.getNormalJobs()
                .length
        );
    }


    // ========================================
    // Empfehlung vorhanden?
    // ========================================

    hasGigaRecommendation() {

        return (
            this.getGigaJobs()
                .length >
            0
        );
    }


    // ========================================
    // DOM-Hilfsfunktion
    // ========================================

    createElement(
        tag,
        className = null,
        text = null
    ) {

        const element =
            document.createElement(
                tag
            );


        if (
            className
        ) {

            element.className =
                className;
        }


        if (
            text !==
            null
        ) {

            element.textContent =
                text;
        }


        return element;
    }


    // ========================================
    // Overlay erzeugen
    // ========================================

    createOverlay() {

        const overlay =
            this.createElement(
                "div",
                "construction-transport-overlay"
            );


        Object.assign(
            overlay.style,
            {

                position:
                    "fixed",

                inset:
                    "0",

                display:
                    "flex",

                alignItems:
                    "center",

                justifyContent:
                    "center",

                background:
                    "rgba(0, 0, 0, 0.65)",

                padding:
                    "20px",

                boxSizing:
                    "border-box",

                zIndex:
                    "10000"
            }
        );


        return overlay;
    }


    // ========================================
    // Dialog erzeugen
    // ========================================

    createDialog() {

        const dialog =
            this.createElement(
                "div",
                "construction-transport-dialog"
            );


        Object.assign(
            dialog.style,
            {

                width:
                    "100%",

                maxWidth:
                    "560px",

                maxHeight:
                    "90vh",

                overflowY:
                    "auto",

                background:
                    "#1d232b",

                color:
                    "#ffffff",

                borderRadius:
                    "12px",

                boxShadow:
                    "0 20px 60px rgba(0,0,0,0.45)",

                fontFamily:
                    "Arial, sans-serif"
            }
        );


        return dialog;
    }


    // ========================================
    // Kopfbereich
    // ========================================

    createHeader() {

        const header =
            this.createElement(
                "div"
            );


        Object.assign(
            header.style,
            {

                display:
                    "flex",

                justifyContent:
                    "space-between",

                alignItems:
                    "center",

                gap:
                    "15px",

                padding:
                    "20px 22px",

                borderBottom:
                    "1px solid rgba(255,255,255,0.12)"
            }
        );


        const title =
            this.createElement(
                "div"
            );


        const heading =
            this.createElement(
                "div",
                null,
                "🚛 Giga-Transport verfügbar"
            );


        Object.assign(
            heading.style,
            {

                fontSize:
                    "22px",

                fontWeight:
                    "700"
            }
        );


        const subtitle =
            this.createElement(
                "div",
                null,
                "Das System hat eine günstigere Transportkombination gefunden."
            );


        Object.assign(
            subtitle.style,
            {

                marginTop:
                    "5px",

                fontSize:
                    "13px",

                opacity:
                    "0.72"
            }
        );


        title.append(
            heading,
            subtitle
        );


        const closeButton =
            this.createElement(
                "button",
                null,
                "×"
            );


        closeButton.type =
            "button";


        Object.assign(
            closeButton.style,
            {

                width:
                    "36px",

                height:
                    "36px",

                border:
                    "none",

                borderRadius:
                    "8px",

                background:
                    "rgba(255,255,255,0.10)",

                color:
                    "#ffffff",

                fontSize:
                    "24px",

                cursor:
                    "pointer"
            }
        );


        closeButton.addEventListener(
            "click",
            () => {

                this.close();
            }
        );


        header.append(
            title,
            closeButton
        );


        return header;
    }


    // ========================================
    // Statistikbox
    // ========================================

    createStatBox(
        label,
        value
    ) {

        const box =
            this.createElement(
                "div"
            );


        Object.assign(
            box.style,
            {

                flex:
                    "1",

                minWidth:
                    "130px",

                padding:
                    "14px",

                borderRadius:
                    "9px",

                background:
                    "rgba(255,255,255,0.07)"
            }
        );


        const labelElement =
            this.createElement(
                "div",
                null,
                label
            );


        Object.assign(
            labelElement.style,
            {

                fontSize:
                    "12px",

                opacity:
                    "0.7",

                marginBottom:
                    "5px"
            }
        );


        const valueElement =
            this.createElement(
                "div",
                null,
                value
            );


        Object.assign(
            valueElement.style,
            {

                fontSize:
                    "20px",

                fontWeight:
                    "700"
            }
        );


        box.append(
            labelElement,
            valueElement
        );


        return box;
    }


    // ========================================
    // Transportübersicht
    // ========================================

    createTransportSummary() {

        const wrapper =
            this.createElement(
                "div"
            );


        Object.assign(
            wrapper.style,
            {

                padding:
                    "20px 22px"
            }
        );


        const normalTrips =
            this.getOriginalNormalTrips();


        const optimizedTrips =
            this.getOptimizedTrips();


        const gigaTrips =
            this.getGigaJobs()
                .length;


        const remainingNormalTrips =
            this.getNormalJobs()
                .length;


        const savedTrips =
            this.getSavedTrips();


        const coins =
            this.getRequiredCoins();


        const stats =
            this.createElement(
                "div"
            );


        Object.assign(
            stats.style,
            {

                display:
                    "flex",

                flexWrap:
                    "wrap",

                gap:
                    "10px"
            }
        );


        stats.append(

            this.createStatBox(

                "Normal",

                `${normalTrips} ${
                    normalTrips === 1
                        ? "Fahrt"
                        : "Fahrten"
                }`
            ),

            this.createStatBox(

                "Optimiert",

                `${optimizedTrips} ${
                    optimizedTrips === 1
                        ? "Fahrt"
                        : "Fahrten"
                }`
            ),

            this.createStatBox(

                "Gespart",

                `${savedTrips} ${
                    savedTrips === 1
                        ? "Fahrt"
                        : "Fahrten"
                }`
            )
        );


        wrapper.append(
            stats
        );


        // ====================================
        // Fahrzeugkombination
        // ====================================

        const combination =
            this.createElement(
                "div"
            );


        Object.assign(
            combination.style,
            {

                marginTop:
                    "18px",

                padding:
                    "16px",

                borderRadius:
                    "9px",

                background:
                    "rgba(255,255,255,0.05)"
            }
        );


        const combinationTitle =
            this.createElement(
                "div",
                null,
                "Empfohlene Kombination"
            );


        Object.assign(
            combinationTitle.style,
            {

                fontWeight:
                    "700",

                marginBottom:
                    "10px"
            }
        );


        combination.append(
            combinationTitle
        );


        const gigaText =
            this.createElement(
                "div",
                null,
                `🚛 Giga-LKW: ${gigaTrips}`
            );


        const normalText =
            this.createElement(
                "div",
                null,
                `🚚 Sattelzüge: ${remainingNormalTrips}`
            );


        Object.assign(
            gigaText.style,
            {
                marginBottom:
                    "6px"
            }
        );


        combination.append(
            gigaText,
            normalText
        );


        wrapper.append(
            combination
        );


        // ====================================
        // Coinbereich
        // ====================================

        const coinBox =
            this.createElement(
                "div"
            );


        Object.assign(
            coinBox.style,
            {

                marginTop:
                    "18px",

                padding:
                    "16px",

                borderRadius:
                    "9px",

                background:
                    "rgba(255,255,255,0.08)"
            }
        );


        const coinTitle =
            this.createElement(
                "div",
                null,
                "🪙 Coin-Kosten"
            );


        Object.assign(
            coinTitle.style,
            {

                fontWeight:
                    "700",

                marginBottom:
                    "8px"
            }
        );


        const availableCoins =
            this.getAvailableCoins();


        const coinInfo =
            this.createElement(
                "div",
                null,
                `Benötigt: ${coins} ${
                    coins === 1
                        ? "Coin"
                        : "Coins"
                } · Guthaben: ${availableCoins}`
            );


        coinBox.append(
            coinTitle,
            coinInfo
        );


        wrapper.append(
            coinBox
        );


        // ====================================
// Echte Transportkosten
// ====================================

const firstItem =
    this.order
        ?.items
        ?.[0];


const distanceKm =
    firstItem
        ?.distanceKm ??
    0;


const costCalculator =
    new TransportCostCalculator();


const costComparison =
    costCalculator
        .compareNormalAndGiga({

            distanceKm,

            normalTrips,

            gigaTrips,

            optimizedNormalTrips:
                remainingNormalTrips,

            coinsRequired:
                coins,

            normalConsumptionPer100Km:
                30
        });


// ====================================
// Kostenbox
// ====================================

const costBox =
    this.createElement(
        "div"
    );


Object.assign(
    costBox.style,
    {

        marginTop:
            "18px",

        padding:
            "16px",

        borderRadius:
            "9px",

        background:
            "rgba(255,255,255,0.07)"
    }
);


const costTitle =
    this.createElement(
        "div",
        null,
        "💰 Transportkosten"
    );


Object.assign(
    costTitle.style,
    {

        fontWeight:
            "700",

        marginBottom:
            "10px"
    }
);


const normalCostText =
    this.createElement(
        "div",
        null,
        `Normal: ${costCalculator.formatMoney(
            costComparison
                .normal
                .totalCost
        )} €`
    );


const gigaCostText =
    this.createElement(
        "div",
        null,
        `Mit Giga: ${costCalculator.formatMoney(
            costComparison
                .optimized
                .totalCost
        )} €`
    );


const savingsText =
    this.createElement(
        "div",
        null,
        `Du sparst: ${costCalculator.formatMoney(
            costComparison
                .savings
        )} €`
    );


Object.assign(
    normalCostText.style,
    {

        marginBottom:
            "6px"
    }
);


Object.assign(
    gigaCostText.style,
    {

        marginBottom:
            "8px"
    }
);


Object.assign(
    savingsText.style,
    {

        fontSize:
            "18px",

        fontWeight:
            "700"
    }
);


costBox.append(
    costTitle,
    normalCostText,
    gigaCostText,
    savingsText
);


wrapper.append(
    costBox
);


        return wrapper;
    }


    // ========================================
    // Standardbutton
    // ========================================

    createButton(
        text,
        onClick,
        primary = false
    ) {

        const button =
            this.createElement(
                "button",
                null,
                text
            );


        button.type =
            "button";


        Object.assign(
            button.style,
            {

                flex:
                    "1",

                minWidth:
                    "180px",

                padding:
                    "13px 16px",

                border:
                    primary
                        ? "none"
                        : "1px solid rgba(255,255,255,0.18)",

                borderRadius:
                    "8px",

                background:
                    primary
                        ? "#ffffff"
                        : "transparent",

                color:
                    primary
                        ? "#15191f"
                        : "#ffffff",

                fontSize:
                    "14px",

                fontWeight:
                    "700",

                cursor:
                    "pointer"
            }
        );


        button.addEventListener(
            "click",
            onClick
        );


        return button;
    }


    // ========================================
    // Aktionen
    // ========================================

    createActions() {

        const actions =
            this.createElement(
                "div"
            );


        Object.assign(
            actions.style,
            {

                display:
                    "flex",

                flexWrap:
                    "wrap",

                gap:
                    "10px",

                padding:
                    "0 22px 22px"
            }
        );


        const coins =
            this.getRequiredCoins();


        const confirmButton =
            this.createButton(

                `Giga für ${coins} ${
                    coins === 1
                        ? "Coin"
                        : "Coins"
                } bestätigen`,

                () => {

                    this.confirmGiga();
                },

                true
            );


        const normalButton =
            this.createButton(

                "Normal transportieren",

                () => {

                    this.chooseNormalTransport();
                },

                false
            );


        actions.append(
            confirmButton,
            normalButton
        );


        return actions;
    }


    // ========================================
    // Hauptansicht rendern
    // ========================================

    renderMainView() {

        if (
            !this.content
        ) {

            return;
        }


        this.content.innerHTML =
            "";


        if (
            !this.hasGigaRecommendation()
        ) {

            const message =
                this.createElement(
                    "div",
                    null,
                    "Für diese Bestellung ist kein Giga-Transport erforderlich."
                );


            Object.assign(
                message.style,
                {

                    padding:
                        "25px",

                    textAlign:
                        "center"
                }
            );


            this.content.append(
                message
            );


            return;
        }


        this.content.append(

            this.createHeader(),

            this.createTransportSummary(),

            this.createActions()
        );
    }


    // ========================================
    // Giga bestätigen
    // ========================================

    confirmGiga() {

        if (
            !this.order ||
            typeof this.order
                .confirmSpecialTransports !==
                "function"
        ) {

            this.showError(
                "Transportbestätigung ist nicht verfügbar."
            );

            return;
        }


        // ========================================
        // HIER passiert erst die Coinabbuchung.
        // ========================================

        const result =
            this.order
                .confirmSpecialTransports();


        // ========================================
        // Erfolgreich
        // ========================================

        if (
            result
                ?.success ===
                true &&
            result
                ?.confirmed ===
                true
        ) {

            this.showSuccess(
                result
            );


            if (
                typeof this.onConfirmed ===
                "function"
            ) {

                this.onConfirmed(
                    result,
                    this.order
                );
            }


            return;
        }


        // ========================================
        // Zu wenig Coins
        // ========================================

        if (
            result
                ?.reason ===
                "insufficient_coins"
        ) {

            this.showCoinOffer(
                result
            );

            return;
        }


        // ========================================
        // Sonstiger Fehler
        // ========================================

        this.showError(

            result
                ?.message ??

            result
                ?.reason ??

            "Giga-Transport konnte nicht bestätigt werden."
        );
    }


    // ========================================
    // Erfolgsanzeige
    // ========================================

    showSuccess(
        result
    ) {

        if (
            !this.content
        ) {

            return;
        }


        this.content.innerHTML =
            "";


        const wrapper =
            this.createElement(
                "div"
            );


        Object.assign(
            wrapper.style,
            {

                padding:
                    "30px 22px",

                textAlign:
                    "center"
            }
        );


        const icon =
            this.createElement(
                "div",
                null,
                "✅"
            );


        Object.assign(
            icon.style,
            {

                fontSize:
                    "42px",

                marginBottom:
                    "12px"
            }
        );


        const title =
            this.createElement(
                "div",
                null,
                "Giga-Transport bestätigt"
            );


        Object.assign(
            title.style,
            {

                fontSize:
                    "22px",

                fontWeight:
                    "700"
            }
        );


        const spent =
            result
                ?.coinsSpent ??
            0;


        const remaining =
            result
                ?.remainingCoins ??
            this.getAvailableCoins();


        let infoText;


        if (
            result
                ?.packageActive ===
                true
        ) {

            infoText =
                "Dein aktives Giga-Paket deckt diesen Transport ab.";
        }

        else {

            infoText =
                `${spent} ${
                    spent === 1
                        ? "Coin wurde"
                        : "Coins wurden"
                } verwendet. Restguthaben: ${remaining} Coins.`;
        }


        const info =
            this.createElement(
                "div",
                null,
                infoText
            );


        Object.assign(
            info.style,
            {

                marginTop:
                    "10px",

                lineHeight:
                    "1.5",

                opacity:
                    "0.78"
            }
        );


        const closeButton =
            this.createButton(

                "Weiter",

                () => {

                    this.close();
                },

                true
            );


        Object.assign(
            closeButton.style,
            {

                width:
                    "100%",

                marginTop:
                    "22px"
            }
        );


        wrapper.append(
            icon,
            title,
            info,
            closeButton
        );


        this.content.append(
            wrapper
        );
    }


    // ========================================
    // Coin-Angebot
    // ========================================

    showCoinOffer(
        result
    ) {

        if (
            !this.content
        ) {

            return;
        }


        this.content.innerHTML =
            "";


        const wrapper =
            this.createElement(
                "div"
            );


        Object.assign(
            wrapper.style,
            {

                padding:
                    "24px 22px"
            }
        );


        const title =
            this.createElement(
                "div",
                null,
                "🪙 Nicht genügend Coins"
            );


        Object.assign(
            title.style,
            {

                fontSize:
                    "22px",

                fontWeight:
                    "700",

                marginBottom:
                    "16px"
            }
        );


        const required =
            result
                ?.coinsRequired ??
            this.getRequiredCoins();


        const available =
            result
                ?.availableCoins ??
            this.getAvailableCoins();


        const missing =
            result
                ?.missingCoins ??
            Math.max(
                required -
                available,
                0
            );


        const info =
            this.createElement(
                "div"
            );


        Object.assign(
            info.style,
            {

                padding:
                    "16px",

                borderRadius:
                    "8px",

                background:
                    "rgba(255,255,255,0.07)",

                lineHeight:
                    "1.7"
            }
        );


        info.append(

            this.createElement(
                "div",
                null,
                `Benötigt: ${required} Coins`
            ),

            this.createElement(
                "div",
                null,
                `Vorhanden: ${available} Coins`
            ),

            this.createElement(
                "div",
                null,
                `Es fehlen: ${missing} Coins`
            )
        );


        const minimumPackage =
            result
                ?.minimumCoinPackage ??
            50;


        const packageNote =
            this.createElement(
                "div",
                null,
                `Das kleinste verfügbare Paket enthält ${minimumPackage} Coins.`
            );


        Object.assign(
            packageNote.style,
            {

                marginTop:
                    "14px",

                fontSize:
                    "13px",

                opacity:
                    "0.75"
            }
        );


        const buttons =
            this.createElement(
                "div"
            );


        Object.assign(
            buttons.style,
            {

                display:
                    "flex",

                flexWrap:
                    "wrap",

                gap:
                    "10px",

                marginTop:
                    "20px"
            }
        );


        const buyButton =
            this.createButton(

                `${minimumPackage} Coins kaufen`,

                () => {

                    if (
                        typeof this.onCoinShop ===
                        "function"
                    ) {

                        this.onCoinShop({

                            minimumPackage,

                            requiredCoins:
                                required,

                            availableCoins:
                                available,

                            missingCoins:
                                missing,

                            result,

                            order:
                                this.order
                        });
                    }

                    else {

                        console.log(
                            "Coin-Shop noch nicht angeschlossen.",
                            {
                                minimumPackage,
                                required,
                                available,
                                missing
                            }
                        );
                    }
                },

                true
            );


        const normalButton =
            this.createButton(

                "Normal transportieren",

                () => {

                    this.chooseNormalTransport();
                }
            );


        const backButton =
            this.createButton(

                "Zurück",

                () => {

                    this.renderMainView();
                }
            );


        buttons.append(
            buyButton,
            normalButton,
            backButton
        );


        wrapper.append(
            title,
            info,
            packageNote,
            buttons
        );


        this.content.append(
            wrapper
        );
    }


    // ========================================
    // Normalen Transport wählen
    //
    // WICHTIG:
    //
    // Aktuell informieren wir nur den
    // aufrufenden Spielbereich.
    //
    // Die Giga-Jobs werden in diesem Schritt
    // noch nicht automatisch neu geplant.
    //
    // Das schließen wir als nächsten
    // Entwicklungsschritt an.
    // ========================================

  // ========================================
// Normalen Transport wählen
// ========================================

chooseNormalTransport() {

    // ========================================
    // Prüfen, ob Order vorhanden ist
    // ========================================

    if (
        !this.order ||
        typeof this.order
            .chooseNormalTransport !==
            "function"
    ) {

        this.showError(
            "Normale Transportplanung ist nicht verfügbar."
        );

        return;
    }


    // ========================================
    // Spiellogik aufrufen
    // ========================================

    const result =
        this.order
            .chooseNormalTransport();


    // ========================================
    // Fehler
    // ========================================

    if (
        !result ||
        result.success !==
            true
    ) {

        this.showError(

            result
                ?.message ??

            result
                ?.reason ??

            "Normaler Transport konnte nicht geplant werden."
        );

        return;
    }


    // ========================================
    // Callback
    // ========================================

    if (
        typeof this.onNormalTransport ===
        "function"
    ) {

        this.onNormalTransport(

            result,

            this.order
        );
    }


    // ========================================
    // Erfolgsanzeige
    // ========================================

    this.showNormalTransportSuccess(
        result
    );
}
// ========================================
// Normaltransport erfolgreich
// ========================================

showNormalTransportSuccess(
    result
) {

    if (
        !this.content
    ) {

        return;
    }


    this.content.innerHTML =
        "";


    const wrapper =
        this.createElement(
            "div"
        );


    Object.assign(
        wrapper.style,
        {

            padding:
                "30px 22px",

            textAlign:
                "center"
        }
    );


    const icon =
        this.createElement(
            "div",
            null,
            "🚚"
        );


    Object.assign(
        icon.style,
        {

            fontSize:
                "42px",

            marginBottom:
                "12px"
        }
    );


    const title =
        this.createElement(
            "div",
            null,
            "Normaler Transport gewählt"
        );


    Object.assign(
        title.style,
        {

            fontSize:
                "22px",

            fontWeight:
                "700"
        }
    );


    const trips =
        result
            ?.normalTrips ??
        0;


    const info =
        this.createElement(
            "div",
            null,
            `${trips} ${
                trips === 1
                    ? "normale Fahrt wurde"
                    : "normale Fahrten wurden"
            } geplant. Es werden keine Coins verwendet.`
        );


    Object.assign(
        info.style,
        {

            marginTop:
                "10px",

            lineHeight:
                "1.5",

            opacity:
                "0.78"
        }
    );


    const closeButton =
        this.createButton(

            "Weiter",

            () => {

                this.close();
            },

            true
        );


    Object.assign(
        closeButton.style,
        {

            width:
                "100%",

            marginTop:
                "22px"
        }
    );


    wrapper.append(
        icon,
        title,
        info,
        closeButton
    );


    this.content.append(
        wrapper
    );
}

    // ========================================
    // Fehler anzeigen
    // ========================================

    showError(
        message
    ) {

        if (
            !this.content
        ) {

            return;
        }


        this.content.innerHTML =
            "";


        const wrapper =
            this.createElement(
                "div"
            );


        Object.assign(
            wrapper.style,
            {

                padding:
                    "28px 22px",

                textAlign:
                    "center"
            }
        );


        const icon =
            this.createElement(
                "div",
                null,
                "❌"
            );


        Object.assign(
            icon.style,
            {

                fontSize:
                    "40px",

                marginBottom:
                    "12px"
            }
        );


        const title =
            this.createElement(
                "div",
                null,
                "Transport konnte nicht bestätigt werden"
            );


        Object.assign(
            title.style,
            {

                fontSize:
                    "20px",

                fontWeight:
                    "700"
            }
        );


        const text =
            this.createElement(
                "div",
                null,
                String(
                    message ??
                    "Unbekannter Fehler"
                )
            );


        Object.assign(
            text.style,
            {

                marginTop:
                    "10px",

                opacity:
                    "0.75",

                lineHeight:
                    "1.5"
            }
        );


        const backButton =
            this.createButton(

                "Zurück",

                () => {

                    this.renderMainView();
                }
            );


        Object.assign(
            backButton.style,
            {

                width:
                    "100%",

                marginTop:
                    "20px"
            }
        );


        wrapper.append(
            icon,
            title,
            text,
            backButton
        );


        this.content.append(
            wrapper
        );
    }


    // ========================================
    // Dialog öffnen
    // ========================================

    open() {

        if (
            this.isOpen
        ) {

            return false;
        }


        if (
            !this.order
        ) {

            console.error(
                "ConstructionTransportDialog: Keine Bestellung übergeben."
            );

            return false;
        }


        this.overlay =
            this.createOverlay();


        this.dialog =
            this.createDialog();


        this.content =
            this.createElement(
                "div"
            );


        this.dialog.append(
            this.content
        );


        this.overlay.append(
            this.dialog
        );


        this.parent.append(
            this.overlay
        );


        // ====================================
        // Klick auf dunklen Hintergrund
        // schließt Dialog.
        // ====================================

        this.overlay.addEventListener(

            "click",

            event => {

                if (
                    event.target ===
                    this.overlay
                ) {

                    this.close();
                }
            }
        );


        this.isOpen =
            true;


        this.renderMainView();


        return true;
    }


    // ========================================
    // Dialog schließen
    // ========================================

    close() {

        if (
            this.overlay
                ?.parentNode
        ) {

            this.overlay
                .parentNode
                .removeChild(
                    this.overlay
                );
        }


        this.overlay =
            null;


        this.dialog =
            null;


        this.content =
            null;


        this.isOpen =
            false;


        if (
            typeof this.onClose ===
            "function"
        ) {

            this.onClose(
                this.order
            );
        }


        return true;
    }
}