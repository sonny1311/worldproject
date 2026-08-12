// WorldProject - API-Client fuer Accounts und Registrierung
export class AuthApiClient {
    constructor({ baseUrl = "http://localhost:3001" } = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    async request(path, options = {}) {
        const response = await fetch(`${this.baseUrl}${path}`, {
            credentials: "include",
            headers: { "Content-Type": "application/json", ...(options.headers || {}) },
            ...options
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || body.reason || `HTTP ${response.status}`);
        return body;
    }

    async health() { return this.request("/api/health"); }
    async register(data) { return this.request("/api/auth/register", { method:"POST", body:JSON.stringify(data) }); }
    async login(data) { return this.request("/api/auth/login", { method:"POST", body:JSON.stringify(data) }); }
    async logout() { return this.request("/api/auth/logout", { method:"POST", body:"{}" }); }
    async me() { return this.request("/api/auth/me"); }
    async verifyEmail(token) { return this.request("/api/auth/verify-email", { method:"POST", body:JSON.stringify({token}) }); }
    async resendVerification(email) { return this.request("/api/auth/resend-verification", { method:"POST", body:JSON.stringify({email}) }); }
    async requestPasswordReset(email) { return this.request("/api/auth/password-reset/request", { method:"POST", body:JSON.stringify({email}) }); }
    async resetPassword(token,password) { return this.request("/api/auth/password-reset/confirm", { method:"POST", body:JSON.stringify({token,password}) }); }
    async updateProfile(data) { return this.request("/api/account/profile", { method:"PATCH", body:JSON.stringify(data) }); }
    async requestDeletion() { return this.request("/api/account/delete-request", { method:"POST", body:"{}" }); }
    async cancelDeletion() { return this.request("/api/account/delete-request/cancel", { method:"POST", body:"{}" }); }
}
