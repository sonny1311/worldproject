// WorldProject - API-Client fuer Registrierung/Login
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
    async register(data) { return this.request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }); }
    async login(data) { return this.request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }); }
    async logout() { return this.request("/api/auth/logout", { method: "POST", body: "{}" }); }
    async me() { return this.request("/api/auth/me"); }
}