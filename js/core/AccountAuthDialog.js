// WorldProject - sichtbare Supabase-Registrierung/Login
import { AuthApiClient } from "./AuthApiClient.js";

export class AccountAuthDialog {
    constructor({ accountSystem, api = new AuthApiClient(), parent = document.body, required = false, onAuthenticated = null } = {}) {
        this.accountSystem = accountSystem;
        this.api = api;
        this.parent = parent;
        this.overlay = null;
        this.backendOnline = false;
        this.currentUser = null;
        this.required = required;
        this.onAuthenticated = onAuthenticated;
    }

    el(tag,text=null){ const e=document.createElement(tag); if(text!==null)e.textContent=text; return e; }
    input(type,placeholder){ const i=this.el("input"); i.type=type; i.placeholder=placeholder; Object.assign(i.style,{width:"100%",boxSizing:"border-box",padding:"11px",margin:"6px 0",borderRadius:"8px",border:"1px solid #c9ced6",fontSize:"15px"}); return i; }
    button(text,onClick){ const b=this.el("button",text); Object.assign(b.style,{padding:"10px 14px",border:"0",borderRadius:"8px",cursor:"pointer",fontWeight:"700",margin:"4px"}); b.addEventListener("click",onClick); return b; }

    async detectBackend(){ try{ await this.api.health(); this.backendOnline=true; }catch{ this.backendOnline=false; } return this.backendOnline; }

    async open(mode="login"){
        if(this.overlay) return;
        await this.detectBackend();
        const overlay=this.el("div");
        Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"20000",background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});
        const panel=this.el("div");
        Object.assign(panel.style,{width:"min(460px,94vw)",background:"#fff",color:"#111",borderRadius:"14px",padding:"24px",fontFamily:"Arial,sans-serif",boxShadow:"0 20px 70px rgba(0,0,0,.5)"});
        overlay.append(panel); this.parent.append(overlay); this.overlay=overlay; this.render(panel,mode);
    }

    close(){ if(this.required && !this.currentUser) return false; this.overlay?.remove(); this.overlay=null; return true; }

    render(panel,mode="login"){
        panel.innerHTML="";
        const head=this.el("div"); Object.assign(head.style,{display:"flex",justifyContent:"space-between",alignItems:"center"});
        const title=this.el("h2",mode==="login"?"Anmelden":"Registrieren"); title.style.margin="0"; head.append(title);
        if(!this.required) head.append(this.button("✕",()=>this.close())); panel.append(head);
        if(this.required){ const lock=this.el("div","🔒 Ohne registrierten und bestätigten Account kein Spielzugang."); Object.assign(lock.style,{margin:"12px 0",padding:"10px",borderRadius:"8px",background:"#fff3cd",fontWeight:"700"}); panel.append(lock); }
        const status=this.el("div",this.backendOnline?"✅ Supabase verbunden":"❌ Supabase nicht erreichbar – Spielstart bleibt gesperrt"); Object.assign(status.style,{margin:"12px 0",padding:"9px",borderRadius:"8px",background:"#f1f3f5",fontSize:"13px"}); panel.append(status);
        if(mode==="login") this.renderLogin(panel); else this.renderRegister(panel);
        const switcher=this.button(mode==="login"?"Noch keinen Account? Registrieren":"Schon registriert? Anmelden",()=>this.render(panel,mode==="login"?"register":"login")); Object.assign(switcher.style,{width:"100%",marginTop:"12px"}); panel.append(switcher);
    }

    async authenticated(user){
        this.currentUser=user; window.worldCurrentUser=user;
        if(this.onAuthenticated) await this.onAuthenticated(user);
        this.overlay?.remove(); this.overlay=null;
        window.dispatchEvent(new CustomEvent("world:user-login",{detail:{user}}));
    }

    renderLogin(panel){
        const email=this.input("email","E-Mail-Adresse"); const password=this.input("password","Passwort"); panel.append(email,password);
        const login=this.button("Anmelden",async()=>{
            try{
                if(!this.backendOnline) throw new Error("Supabase ist derzeit nicht erreichbar.");
                const result=await this.api.login({email:email.value.trim(),password:password.value});
                if(["restricted","suspended","banned"].includes(result.user.status)) throw new Error("Dieser Account ist derzeit nicht zum Spielen freigegeben.");
                if(result.user.status!=="active") throw new Error("Bitte zuerst deine E-Mail-Adresse bestätigen.");
                await this.authenticated(result.user);
            }catch(error){ alert(error.message); }
        });
        Object.assign(login.style,{width:"100%",marginTop:"10px",background:"#1f6feb",color:"#fff"}); panel.append(login);
        const reset=this.button("Passwort vergessen",async()=>{ try{ if(!email.value.trim()) throw new Error("Bitte zuerst die E-Mail-Adresse eingeben."); await this.api.requestPasswordReset(email.value.trim()); alert("Wenn der Account existiert, wurde eine Reset-Mail versendet."); }catch(e){ alert(e.message); } }); panel.append(reset);
        const resend=this.button("Bestätigungsmail erneut senden",async()=>{ try{ if(!email.value.trim()) throw new Error("Bitte zuerst die E-Mail-Adresse eingeben."); await this.api.resendVerification(email.value.trim()); alert("Bestätigungsmail wurde erneut angefordert."); }catch(e){ alert(e.message); } }); panel.append(resend);
    }

    renderRegister(panel){
        const username=this.input("text","Benutzername"); const email=this.input("email","E-Mail-Adresse"); const password=this.input("password","Passwort (mind. 10 Zeichen)"); const country=this.input("text","Land (z. B. DE)"); country.value="DE";
        const terms=this.el("label"); const termsBox=this.input("checkbox",""); termsBox.style.width="auto"; terms.append(termsBox,document.createTextNode(" AGB akzeptieren"));
        const privacy=this.el("label"); const privacyBox=this.input("checkbox",""); privacyBox.style.width="auto"; privacy.append(privacyBox,document.createTextNode(" Datenschutzerklärung akzeptieren")); panel.append(username,email,password,country,terms,privacy);
        const register=this.button("Account erstellen",async()=>{
            try{
                if(!this.backendOnline) throw new Error("Supabase ist derzeit nicht erreichbar.");
                if(!termsBox.checked||!privacyBox.checked) throw new Error("AGB und Datenschutzerklärung müssen akzeptiert werden.");
                if(username.value.trim().length<3) throw new Error("Benutzername muss mindestens 3 Zeichen haben.");
                if(password.value.length<10) throw new Error("Passwort muss mindestens 10 Zeichen haben.");
                const result=await this.api.register({username:username.value.trim(),email:email.value.trim(),password:password.value,countryCode:country.value||"DE",languageCode:"de",termsAccepted:true,privacyAccepted:true});
                if(result.session){ const user=await this.api.me(); await this.authenticated(user); return; }
                alert("Account erstellt. Bitte bestätige jetzt die E-Mail. Erst danach kannst du spielen.");
                this.render(panel,"login");
            }catch(error){ alert(error.message); }
        });
        Object.assign(register.style,{width:"100%",marginTop:"12px",background:"#198754",color:"#fff"}); panel.append(register);
    }
}
