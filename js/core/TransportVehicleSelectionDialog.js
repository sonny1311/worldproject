// ============================================
// TransportVehicleSelectionDialog.js
// WorldProject
//
// Wiederverwendbare Fahrzeugauswahl fuer
// Transportauftraege.
// ============================================

import { TransportGameplaySystem } from "./TransportGameplaySystem.js";

export class TransportVehicleSelectionDialog {
    constructor({
        cargo = {},
        distanceKm = 0,
        parent = document.body,
        onSelected = null,
        onClose = null
    } = {}) {
        this.cargo = cargo;
        this.distanceKm = distanceKm;
        this.parent = parent ?? document.body;
        this.onSelected = onSelected;
        this.onClose = onClose;
        this.system = new TransportGameplaySystem();
        this.overlay = null;
    }

    formatNumber(value, digits = 0) {
        return Number(value || 0).toLocaleString("de-DE", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        });
    }

    open() {
        if (this.overlay) return false;

        const recommendation = this.system.recommendVehicle(this.cargo);
        if (!recommendation.success) return false;

        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            zIndex: "12000",
            background: "rgba(0,0,0,.70)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        });

        const dialog = document.createElement("div");
        Object.assign(dialog.style, {
            width: "min(760px, 96vw)",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#1d232b",
            color: "#fff",
            borderRadius: "12px",
            padding: "22px",
            fontFamily: "Arial, sans-serif",
            boxShadow: "0 20px 60px rgba(0,0,0,.45)"
        });

        const title = document.createElement("h2");
        title.textContent = "🚚 Fahrzeug für Transport wählen";
        title.style.marginTop = "0";

        const hint = document.createElement("div");
        hint.textContent = `Empfehlung: ${recommendation.recommended.vehicleName} · ${recommendation.recommended.trips} Fahrt${recommendation.recommended.trips === 1 ? "" : "en"}`;
        Object.assign(hint.style, {
            marginBottom: "16px",
            padding: "12px",
            borderRadius: "8px",
            background: "rgba(255,255,255,.08)"
        });

        const list = document.createElement("div");
        Object.assign(list.style, {
            display: "grid",
            gap: "10px"
        });

        for (const candidate of recommendation.candidates) {
            const button = document.createElement("button");
            button.type = "button";
            const isRecommended = candidate.vehicleType === recommendation.recommended.vehicleType;
            button.textContent = `${isRecommended ? "⭐ " : ""}${candidate.vehicleName} · ${candidate.trips} Fahrt${candidate.trips === 1 ? "" : "en"} · ${this.formatNumber(candidate.payloadKg)} kg Nutzlast · ${candidate.maxPallets} Paletten`;
            Object.assign(button.style, {
                textAlign: "left",
                padding: "14px",
                border: isRecommended ? "2px solid #fff" : "1px solid rgba(255,255,255,.18)",
                borderRadius: "8px",
                background: "rgba(255,255,255,.06)",
                color: "#fff",
                cursor: "pointer"
            });

            button.addEventListener("click", () => {
                const plan = this.system.createTripPlan({
                    vehicleType: candidate.vehicleType,
                    distanceKm: this.distanceKm,
                    cargo: this.cargo,
                    departureTime: new Date()
                });

                if (typeof this.onSelected === "function") {
                    this.onSelected({ candidate, plan, recommendation });
                }
                this.close();
            });

            list.append(button);
        }

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "Abbrechen";
        Object.assign(closeButton.style, {
            marginTop: "16px",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer"
        });
        closeButton.addEventListener("click", () => this.close());

        dialog.append(title, hint, list, closeButton);
        overlay.append(dialog);
        this.parent.append(overlay);
        this.overlay = overlay;
        return true;
    }

    close() {
        if (this.overlay?.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        if (typeof this.onClose === "function") this.onClose();
    }
}
