// WorldProject - harter Spielzugang: ohne Account kein Spiel
// Der eigentliche Spielcode wird erst geladen, wenn ein Account angemeldet ist.
import { AccountAuthDialog } from "./AccountAuthDialog.js";
import { AuthApiClient } from "./AuthApiClient.js";

export class GameAccessGate {
    constructor({ accountSystem, api = new AuthApiClient() } = {}) {
        this.accountSystem = accountSystem;
        this.api = api;
        this.dialog = null;
        this.user = null;
        this.backendOnline = false;
        this._resolver = null;
        this._promise = null;
    }

    async detectBackend() {
        try { await this.api.health(); this.backendOnline = true; }
        catch { this.backendOnline = false; }
        return this.backendOnline;
    }

    async restoreSession() {
        await this.detectBackend();
        if (!this.backendOnline) return null;
        try {
            const result = await this.api.me();
            if (result?.success && result.user) {
                this.grant(result.user);
                return result.user;
            }
        } catch {}
        return null;
    }

    grant(user) {
        if (!user) return false;
        // Gesperrte Accounts kommen niemals ins Spiel.
        if (["restricted","suspended","banned"].includes(user.status)) return false;
        this.user = user;
        window.worldCurrentUser = user;
        window.dispatchEvent(new CustomEvent("world:access-granted", { detail:{ user } }));
        if (this._resolver) {
            const resolve = this._resolver;
            this._resolver = null;
            resolve(user);
        }
        return true;
    }

    async ensureAccess() {
        if (this.user) return this.user;
        if (!this._promise) this._promise = new Promise(resolve => { this._resolver = resolve; });

        const restored = await this.restoreSession();
        if (restored) return restored;

        this.openRequiredLogin();
        return this._promise;
    }

    openRequiredLogin() {
        if (this.dialog?.overlay) return;
        this.dialog = new AccountAuthDialog({
            accountSystem: this.accountSystem,
            api: this.api,
            required: true,
            onAuthenticated: user => this.grant(user)
        });
        this.dialog.open("login");
    }

    async logout() {
        try { if (this.backendOnline) await this.api.logout(); }
        catch {}
        this.accountSystem?.logout?.();
        this.user = null;
        window.worldCurrentUser = null;
        window.dispatchEvent(new CustomEvent("world:access-revoked"));
        location.reload();
    }
}
