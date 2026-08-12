// WorldProject - Supabase Auth + Data API Client
// Publishable keys are intended for browser use. Sensitive writes remain server-side/RPC protected.

const SUPABASE_URL = "https://ojhaeccyulyrwoxgeurf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JZH6Ker5-yZoNY6sQFhVTA_YKnImI3z";
const SESSION_KEY = "worldproject_supabase_session";

export class AuthApiClient {
    constructor({ baseUrl = SUPABASE_URL, publishableKey = SUPABASE_PUBLISHABLE_KEY } = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.publishableKey = publishableKey;
        this.session = this.loadSession();
        this.captureSessionFromUrl();
    }

    loadSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
        catch { return null; }
    }

    saveSession(session) {
        this.session = session || null;
        if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        else localStorage.removeItem(SESSION_KEY);
    }

    captureSessionFromUrl() {
        const raw = location.hash?.replace(/^#/, "");
        if (!raw) return null;
        const params = new URLSearchParams(raw);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (!access_token) return null;
        const session = {
            access_token,
            refresh_token,
            expires_in: Number(params.get("expires_in") || 3600),
            token_type: params.get("token_type") || "bearer",
            expires_at: Math.floor(Date.now()/1000) + Number(params.get("expires_in") || 3600),
            type: params.get("type") || null
        };
        this.saveSession(session);
        history.replaceState(null, document.title, location.pathname + location.search);
        return session;
    }

    headers({ auth = false, json = true } = {}) {
        const h = { apikey: this.publishableKey };
        if (json) h["Content-Type"] = "application/json";
        if (auth && this.session?.access_token) h.Authorization = `Bearer ${this.session.access_token}`;
        return h;
    }

    async parse(response) {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = body.msg || body.message || body.error_description || body.error || `HTTP ${response.status}`;
            throw new Error(message);
        }
        return body;
    }

    async health() {
        const response = await fetch(`${this.baseUrl}/auth/v1/health`, { headers:this.headers({json:false}) });
        if (!response.ok) throw new Error("Supabase nicht erreichbar");
        return { success:true, mode:"supabase" };
    }

    async register(data) {
        const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
            method:"POST",
            headers:this.headers(),
            body:JSON.stringify({
                email:data.email,
                password:data.password,
                data:{
                    username:data.username,
                    country_code:data.countryCode || "DE",
                    language_code:data.languageCode || "de",
                    terms_version:"1.0",
                    privacy_version:"1.0"
                }
            })
        });
        const body = await this.parse(response);
        if (body.access_token) this.saveSession(body);
        return { success:true, user:body.user, session:body.access_token ? body : null, confirmationRequired:!body.access_token };
    }

    async login({email,password,emailOrUsername} = {}) {
        const loginEmail = email || emailOrUsername;
        const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
            method:"POST",
            headers:this.headers(),
            body:JSON.stringify({ email:loginEmail, password })
        });
        const body = await this.parse(response);
        this.saveSession(body);
        const user = await this.me();
        return { success:true, user };
    }

    async refreshSession() {
        const refreshToken = this.session?.refresh_token;
        if (!refreshToken) throw new Error("Keine Sitzung vorhanden");
        const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method:"POST",
            headers:this.headers(),
            body:JSON.stringify({ refresh_token:refreshToken })
        });
        const body = await this.parse(response);
        this.saveSession(body);
        return body;
    }

    async ensureAccessToken() {
        if (!this.session?.access_token) return null;
        const expiresAt = Number(this.session.expires_at || 0);
        if (expiresAt && expiresAt - 60 > Math.floor(Date.now()/1000)) return this.session.access_token;
        try { await this.refreshSession(); return this.session?.access_token || null; }
        catch { this.saveSession(null); return null; }
    }

    async authRequest(path, options={}) {
        const token = await this.ensureAccessToken();
        if (!token) throw new Error("Nicht angemeldet");
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers:{ ...this.headers({auth:true}), ...(options.headers || {}) }
        });
        return this.parse(response);
    }

    async rest(path, options={}) {
        return this.authRequest(`/rest/v1/${path}`, options);
    }

    async rpc(name, data={}) {
        return this.rest(`rpc/${name}`, { method:"POST", body:JSON.stringify(data) });
    }

    async me() {
        const token = await this.ensureAccessToken();
        if (!token) throw new Error("Nicht angemeldet");
        const authResponse = await fetch(`${this.baseUrl}/auth/v1/user`, { headers:this.headers({auth:true,json:false}) });
        const authUser = await this.parse(authResponse);
        const rows = await this.rest(`users?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=id,public_id,auth_user_id,username,email,status,country_code,language_code,email_verified_at,display_name,profile_image_url,created_at`);
        const profile = rows?.[0];
        if (!profile) throw new Error("Spielerprofil wurde noch nicht angelegt");
        return { ...profile, authId:authUser.id, emailConfirmedAt:authUser.email_confirmed_at || null };
    }

    async logout() {
        try {
            if (this.session?.access_token) {
                await fetch(`${this.baseUrl}/auth/v1/logout`, { method:"POST", headers:this.headers({auth:true}) });
            }
        } finally { this.saveSession(null); }
        return { success:true };
    }

    async resendVerification(email) {
        const response = await fetch(`${this.baseUrl}/auth/v1/resend`, {
            method:"POST", headers:this.headers(), body:JSON.stringify({ type:"signup", email })
        });
        await this.parse(response);
        return { success:true };
    }

    async requestPasswordReset(email) {
        const response = await fetch(`${this.baseUrl}/auth/v1/recover`, {
            method:"POST", headers:this.headers(), body:JSON.stringify({ email })
        });
        await this.parse(response);
        return { success:true };
    }

    async resetPassword(_token,password) {
        const response = await fetch(`${this.baseUrl}/auth/v1/user`, {
            method:"PUT", headers:this.headers({auth:true}), body:JSON.stringify({ password })
        });
        await this.parse(response);
        return { success:true };
    }

    async accountOverview() {
        const user = await this.me();
        const [walletRows, companyRows, txRows] = await Promise.all([
            this.rest(`coin_wallets?select=balance,updated_at`),
            this.rest(`companies?select=id,name,industry,company_type,money,game_state,saved_at,created_at`),
            this.rest(`coin_transactions?select=id,amount,balance_after,transaction_type,reference_type,reference_id,note,created_at&order=created_at.desc&limit=30`)
        ]);
        return { success:true, user, wallet:walletRows?.[0] || {balance:0}, company:companyRows?.[0] || null, transactions:txRows || [] };
    }

    async updateProfile(data) {
        const user = await this.me();
        const allowed = {};
        if (data.countryCode !== undefined) allowed.country_code = data.countryCode;
        if (data.languageCode !== undefined) allowed.language_code = data.languageCode;
        if (data.displayName !== undefined) allowed.display_name = data.displayName;
        if (data.profileImageUrl !== undefined) allowed.profile_image_url = data.profileImageUrl;
        const rows = await this.rest(`users?auth_user_id=eq.${encodeURIComponent(user.auth_user_id)}`, {
            method:"PATCH",
            headers:{ Prefer:"return=representation" },
            body:JSON.stringify(allowed)
        });
        return { success:true, user:rows?.[0] || null };
    }

    async ensureCompany(data={}) {
        const result = await this.rpc("ensure_player_company", {
            p_name:data.name || null,
            p_industry:data.industry || null,
            p_company_type:data.companyType || data.type || null
        });
        return { success:true, company:Array.isArray(result) ? result[0] : result };
    }

    async saveGameState(state) {
        const result = await this.rpc("save_player_game_state", { p_state:state || {} });
        return { success:true, company:Array.isArray(result) ? result[0] : result };
    }

    async claimDailyCoin() {
        const result = await this.rpc("claim_daily_coin_reward");
        return { success:true, reward:Array.isArray(result) ? result[0] : result };
    }

    async listCoinOrders() {
        return this.rest("coin_market_orders?status=eq.open&select=id,seller_user_id,original_amount,remaining_amount,price_per_coin,status,created_at&order=price_per_coin.asc,created_at.asc");
    }

    async createCoinSellOrder(amount,pricePerCoin) {
        const result = await this.rpc("create_coin_sell_order", { p_amount:Number(amount), p_price_per_coin:Number(pricePerCoin) });
        return { success:true, orderId:Array.isArray(result) ? result[0] : result };
    }

    async cancelCoinSellOrder(orderId) {
        const result = await this.rpc("cancel_coin_sell_order", { p_order_id:Number(orderId) });
        return { success:true, balance:Array.isArray(result) ? result[0] : result };
    }

    async buyCoinOrder(orderId,amount) {
        const result = await this.rpc("buy_coin_market_order", { p_order_id:Number(orderId), p_amount:Number(amount) });
        window.dispatchEvent(new CustomEvent("world:server-balances-changed",{detail:result}));
        return { success:true, trade:Array.isArray(result) ? result[0] : result };
    }
}
