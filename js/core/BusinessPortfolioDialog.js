// WorldProject - Betriebsauswahl und weitere Betriebe
import { IndustryGroups } from "./IndustryCatalog.js";

export class BusinessPortfolioDialog {
    constructor({portfolio,parent=document.body}={}){this.portfolio=portfolio;this.parent=parent;this.overlay=null;}
    el(tag,text=null){const e=document.createElement(tag);if(text!==null)e.textContent=text;return e;}
    input(value=""){const i=this.el("input");i.value=value;Object.assign(i.style,{width:"100%",boxSizing:"border-box",padding:"9px",margin:"4px 0",borderRadius:"7px",border:"1px solid #bbb"});return i;}
    button(text,fn){const b=this.el("button",text);Object.assign(b.style,{padding:"8px 10px",margin:"4px",border:0,borderRadius:"7px",fontWeight:"700",cursor:"pointer"});b.addEventListener("click",fn);return b;}
    select(values){const s=this.el("select");Object.assign(s.style,{width:"100%",padding:"9px",margin:"4px 0"});for(const v of values){const o=this.el("option",v);o.value=v;s.append(o);}return s;}
    async open(){if(this.overlay)return;const overlay=this.el("div");Object.assign(overlay.style,{position:"fixed",inset:0,zIndex:20500,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});const panel=this.el("div");Object.assign(panel.style,{width:"min(760px,96vw)",maxHeight:"92vh",overflow:"auto",background:"#fff",color:"#111",borderRadius:"14px",padding:"22px",fontFamily:"Arial,sans-serif"});overlay.append(panel);this.parent.append(overlay);this.overlay=overlay;await this.render(panel);}
    close(){this.overlay?.remove();this.overlay=null;}

    async render(panel){
        panel.innerHTML="";const overview=await this.portfolio.refresh(),companies=overview.companies||[];
        const head=this.el("div");Object.assign(head.style,{display:"flex",justifyContent:"space-between",alignItems:"center"});head.append(this.el("h2","🏢 Meine Betriebe"),this.button("✕",()=>this.close()));panel.append(head);
        panel.append(this.el("div",`Belegt: ${companies.length} / 4 Betriebe`));

        for(const c of companies){const card=this.el("div");Object.assign(card.style,{border:"1px solid #ddd",borderRadius:"10px",padding:"12px",margin:"10px 0"});card.append(this.el("strong",`Betrieb ${c.slot_no}: ${c.name}`),this.el("div",`${c.company_type||c.industry||"-"} · ${Number(c.money||0).toLocaleString("de-DE",{minimumFractionDigits:2})} € · Phase: ${c.setup_phase}`));card.append(this.button("Diesen Betrieb öffnen",()=>{this.portfolio.activate(c,window.worldPlayerCompany||{});this.close();}));panel.append(card);}

        if(companies.length<4){
            const box=this.el("div");Object.assign(box.style,{borderTop:"2px solid #ddd",marginTop:"18px",paddingTop:"16px"});box.append(this.el("h3","Weiteren Betrieb gründen"),this.el("div","Zusätzliche Betriebe starten mit 0 € und müssen aus einem bestehenden Betrieb finanziert werden."));
            const name=this.input("Neuer Betrieb"),industry=this.select(Object.keys(IndustryGroups)),type=this.select(IndustryGroups[industry.value]||[]);
            industry.addEventListener("change",()=>{type.innerHTML="";for(const v of IndustryGroups[industry.value]||[]){const o=this.el("option",v);o.value=v;type.append(o);}});
            box.append(name,industry,type,this.button("Betrieb anlegen",async()=>{try{await this.portfolio.createBusiness({name:name.value,industry:industry.value,companyType:type.value});await this.render(panel);}catch(e){alert(e.message);}}));panel.append(box);
        }

        if(companies.length>1){
            const transfer=this.el("div");Object.assign(transfer.style,{borderTop:"2px solid #ddd",marginTop:"18px",paddingTop:"16px"});transfer.append(this.el("h3","Spielgeld zwischen eigenen Betrieben übertragen"));
            const from=this.select(companies.map(c=>`${c.slot_no} · ${c.name}`)),to=this.select(companies.map(c=>`${c.slot_no} · ${c.name}`)),amount=this.input("10000");
            const companyByLabel=label=>companies.find(c=>label.startsWith(`${c.slot_no} ·`));
            transfer.append(from,to,amount,this.button("Übertragen",async()=>{try{const a=companyByLabel(from.value),b=companyByLabel(to.value);if(!a||!b||a.id===b.id)throw new Error("Bitte zwei verschiedene Betriebe wählen");await this.portfolio.transferMoney(a.id,b.id,Number(amount.value));await this.render(panel);}catch(e){alert(e.message);}}));panel.append(transfer);
        }
    }
}
