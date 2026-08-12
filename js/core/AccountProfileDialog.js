// WorldProject - Spielerprofil, Coin-Wallet und Betriebe
export class AccountProfileDialog {
    constructor({api,parent=document.body}={}){this.api=api;this.parent=parent;this.overlay=null;}
    el(tag,text=null){const e=document.createElement(tag);if(text!==null)e.textContent=text;return e;}
    input(value=""){const i=this.el("input");i.value=value;Object.assign(i.style,{width:"100%",boxSizing:"border-box",padding:"10px",margin:"5px 0",border:"1px solid #c9ced6",borderRadius:"8px"});return i;}
    button(text,fn){const b=this.el("button",text);Object.assign(b.style,{padding:"10px 13px",border:0,borderRadius:"8px",cursor:"pointer",fontWeight:"700",margin:"4px"});b.addEventListener("click",fn);return b;}
    money(v){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});}
    async open(){if(this.overlay)return;const overlay=this.el("div");Object.assign(overlay.style,{position:"fixed",inset:0,zIndex:21000,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});const panel=this.el("div");Object.assign(panel.style,{width:"min(680px,95vw)",maxHeight:"90vh",overflow:"auto",background:"#fff",color:"#111",borderRadius:"14px",padding:"22px",fontFamily:"Arial,sans-serif"});overlay.append(panel);this.parent.append(overlay);this.overlay=overlay;await this.render(panel);}
    close(){this.overlay?.remove();this.overlay=null;}
    async render(panel){
        panel.innerHTML="";let data;try{data=await this.api.accountOverview();}catch(error){panel.append(this.el("h2","Account"),this.el("div",`Serverprofil nicht verfügbar: ${error.message}`),this.button("Schließen",()=>this.close()));return;}
        const user=data.user||{},wallet=data.wallet||{balance:0},companies=data.companies||[],transactions=data.transactions||[];
        const head=this.el("div");Object.assign(head.style,{display:"flex",justifyContent:"space-between",alignItems:"center"});head.append(this.el("h2","👤 Spielerprofil"),this.button("✕",()=>this.close()));panel.append(head);
        panel.append(this.el("div",`Benutzername: ${user.username||"-"}`),this.el("div",`E-Mail: ${user.email||"-"}`),this.el("div",`Status: ${user.status||"-"}`),this.el("div",`Spieler-ID: ${user.public_id||user.id||"-"}`));
        const display=this.input(user.display_name||user.username||""),country=this.input(user.country_code||"DE"),language=this.input(user.language_code||"de");panel.append(this.el("h3","Profil"),this.el("div","Anzeigename"),display,this.el("div","Land"),country,this.el("div","Sprache"),language,this.button("Profil speichern",async()=>{try{await this.api.updateProfile({displayName:display.value,countryCode:country.value,languageCode:language.value});alert("Profil gespeichert.");await this.render(panel);}catch(e){alert(e.message);}}));
        panel.append(this.el("h3","🪙 Coin-Wallet"),this.el("div",`Kontostand: ${Number(wallet.balance||0).toLocaleString("de-DE")} Coins`));
        if(transactions.length){const list=this.el("div");transactions.slice(0,8).forEach(t=>list.append(this.el("div",`${new Date(t.created_at).toLocaleString("de-DE")} · ${Number(t.amount)>0?"+":""}${t.amount} · ${t.transaction_type}`)));panel.append(list);}else panel.append(this.el("div","Noch keine Coin-Transaktionen."));
        panel.append(this.el("h3",`🏢 Betriebe (${companies.length}/4)`));for(const c of companies)panel.append(this.el("div",`Betrieb ${c.slot_no}: ${c.name} · ${c.company_type||"-"} · ${this.money(c.money)} € · ${c.setup_phase}`));
        panel.append(this.button("Betriebe verwalten",()=>{this.close();window.worldAccounts?.businessPortfolioDialog?.open?.();}),this.button("Abmelden",async()=>{await window.worldAccounts?.gameAccessGate?.logout?.();}));
    }
}
