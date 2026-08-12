// WorldProject - sichtbare Registrierung/Login
import { AuthApiClient } from "./AuthApiClient.js";

export class AccountAuthDialog {
    constructor({ accountSystem, api = new AuthApiClient(), parent = document.body } = {}) {
        this.accountSystem = accountSystem;
        this.api = api;
        this.parent = parent;
        this.overlay = null;
        this.backendOnline = false;
        this.currentUser = null;
    }

    el(tag, text = null) { const e = document.createElement(tag); if (text !== null) e.textContent = text; return e; }
    input(type, placeholder) { const i = this.el("input"); i.type = type; i.placeholder = placeholder; Object.assign(i.style,{width:"100%",boxSizing:"border-box",padding:"11px",margin:"6px 0",borderRadius:"8px",border:"1px solid #c9ced6",fontSize:"15px"}); return i; }
    button(text, onClick) { const b=this.el("button",text); Object.assign(b.style,{padding:"10px 14px",border:"0",borderRadius:"8px",cursor:"pointer",fontWeight:"700",margin:"4px"}); b.addEventListener("click",onClick); return b; }

    async detectBackend() {
        try { await this.api.health(); this.backendOnline = true; }
        catch { this.backendOnline = false; }
        return this.backendOnline;
    }

    async open(mode = "login") {
        if (this.overlay) return;
        await this.detectBackend();
        const overlay=this.el("div");
        Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"20000",background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});
        const panel=this.el("div");
        Object.assign(panel.style,{width:"min(460px,94vw)",background:"#fff",color:"#111",borderRadius:"14px",padding:"24px",fontFamily:"Arial,sans-serif",boxShadow:"0 20px 70px rgba(0,0,0,.5)"});
        overlay.append(panel); this.parent.append(overlay); this.overlay=overlay;
        this.render(panel, mode);
    }

    close(){ this.overlay?.remove(); this.overlay=null; }

    render(panel, mode="login") {
        panel.innerHTML="";
        const head=this.el("div"); Object.assign(head.style,{display:"flex",justifyContent:"space-between",alignItems:"center"});
        const title=this.el("h2", mode === "login" ? "Anmelden" : "Registrieren"); title.style.margin="0";
        head.append(title,this.button("✕",()=>this.close())); panel.append(head);

        const status=this.el("div",this.backendOnline ? "✅ Server/Datenbank-Modus" : "⚠️ Lokaler Testmodus – Backend noch nicht gestartet");
        Object.assign(status.style,{margin:"12px 0",padding:"9px",borderRadius:"8px",background:"#f1f3f5",fontSize:"13px"}); panel.append(status);

        if(mode === "login") this.renderLogin(panel); else this.renderRegister(panel);
        const switcher=this.button(mode === "login" ? "Noch keinen Account? Registrieren" : "Schon registriert? Anmelden",()=>this.render(panel,mode === "login" ? "register" : "login"));
        Object.assign(switcher.style,{width:"100%",marginTop:"12px"}); panel.append(switcher);
    }

    renderLogin(panel) {
        const key=this.input("text","E-Mail oder Benutzername");
        const password=this.input("password","Passwort");
        panel.append(key,password);
        const login=this.button("Anmelden",async()=>{
            try {
                let result;
                if(this.backendOnline) result=await this.api.login({emailOrUsername:key.value,password:password.value});
                else result=this.accountSystem.login({emailOrUsername:key.value});
                if(!result.success) throw new Error(result.reason || "Anmeldung fehlgeschlagen");
                this.currentUser=result.user;
                window.worldCurrentUser=result.user;
                alert(`Willkommen ${result.user.username}.`);
                this.close();
                window.dispatchEvent(new CustomEvent("world:user-login",{detail:{user:result.user}}));
            } catch(error){ alert(error.message); }
        });
        Object.assign(login.style,{width:"100%",marginTop:"10px",background:"#1f6feb",color:"#fff"}); panel.append(login);
    }

    renderRegister(panel) {
        const username=this.input("text","Benutzername");
        const email=this.input("email","E-Mail-Adresse");
        const password=this.input("password","Passwort (mind. 10 Zeichen)");
        const country=this.input("text","Land (z. B. DE)"); country.value="DE";
        const terms=this.el("label"); const termsBox=this.input("checkbox",""); termsBox.style.width="auto"; terms.append(termsBox,document.createTextNode(" AGB akzeptieren"));
        const privacy=this.el("label"); const privacyBox=this.input("checkbox",""); privacyBox.style.width="auto"; privacy.append(privacyBox,document.createTextNode(" Datenschutzerklärung akzeptieren"));
        panel.append(username,email,password,country,terms,privacy);

        const register=this.button("Account erstellen",async()=>{
            const data={username:username.value,email:email.value,password:password.value,countryCode:country.value||"DE",languageCode:"de",termsAccepted:termsBox.checked,privacyAccepted:privacyBox.checked};
            try {
                let result;
                if(this.backendOnline) result=await this.api.register(data);
                else result=this.accountSystem.register(data);
                if(!result.success) throw new Error(result.reason || result.errors?.join("\n") || "Registrierung fehlgeschlagen");
                alert(this.backendOnline ? "Account erstellt. E-Mail-Verifizierung folgt als nächster Server-Schritt." : "Testaccount erstellt. Im lokalen Modus wird nichts dauerhaft gespeichert.");
                this.render(panel,"login");
            } catch(error){ alert(error.message); }
        });
        Object.assign(register.style,{width:"100%",marginTop:"12px",background:"#198754",color:"#fff"}); panel.append(register);
    }
}
