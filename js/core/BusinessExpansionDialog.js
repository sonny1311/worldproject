// WorldProject - sichtbare Verwaltung für Ausbau, Standort und Expansion
import {UpgradeTracks,getUpgradeState,upgradeCost,upgradeBonus,operationalModifiers,applyUpgrade} from "./BusinessExpansionSystem.js";
import {LocationClasses,propertyOffer,managementCapacity,managementMonthlyCost,administrationMonthlyCost,expansionLoanOffer} from "./BusinessLocationSystem.js";

const euro=n=>Number(n||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const percent=n=>`${(Number(n||0)*100).toFixed(2)}%`;
const effectLabel=(track,level)=>{
 const bonus=upgradeBonus(track,level);
 switch(track){
  case "production":return `Produktionsleistung +${percent(bonus)}`;
  case "storage":return `Lagerkapazität +${percent(bonus)}`;
  case "efficiency":return `Betriebskosten −${percent(bonus)}`;
  case "quality":return `Qualität +${percent(bonus)}`;
  case "logistics":return `Logistikleistung +${percent(bonus)}`;
  case "administration":return `Verwaltungsleistung +${percent(bonus)}`;
  default:return `Bonus ${percent(bonus)}`;
 }
};
export class BusinessExpansionDialog{
 constructor({portfolio}={}){this.portfolio=portfolio;this.id="world-business-expansion-dialog";}
 close(){document.getElementById(this.id)?.remove();}
 render(){
  this.close();const c=this.portfolio?.activeCompany||window.worldPlayerCompany;if(!c)return;
  c.upgrades=getUpgradeState(c);c.managementStaff=c.managementStaff||[];
  const status=this.portfolio?.getExpansionStatus?.(c),mods=operationalModifiers(c),count=this.portfolio?.companies?.length||1;
  const rows=Object.entries(UpgradeTracks).map(([k,v])=>{const lv=c.upgrades[k]||0,next=Math.min(v.maxLevel,lv+1);return `<div style="display:grid;grid-template-columns:minmax(130px,1fr) .55fr minmax(190px,1.4fr) .85fr auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #ffffff16"><b>${v.label}</b><span>Stufe ${lv}/${v.maxLevel}</span><span>${lv>=v.maxLevel?effectLabel(k,lv):`${effectLabel(k,lv)} → <b>${effectLabel(k,next)}</b>`}</span><span>${lv<v.maxLevel?euro(upgradeCost(k,lv)):"MAX"}</span><button data-upgrade="${k}" ${lv>=v.maxLevel?"disabled":""}>${lv>=v.maxLevel?"Maximum":"Ausbauen"}</button></div>`}).join("");
  const req=status?.requirements||{};
  const el=document.createElement("div");el.id=this.id;el.style.cssText="position:fixed;inset:5%;z-index:10050;background:#17202b;color:#fff;border:1px solid #ffffff35;border-radius:14px;padding:0 18px 18px;overflow:auto;box-shadow:0 18px 60px #000b;font:14px Arial";
  el.innerHTML=`<div style="position:sticky;top:0;z-index:3;background:#17202b;padding:16px 0 10px;border-bottom:1px solid #ffffff22"><button data-close aria-label="Fenster schließen" title="Fenster schließen" style="float:right;font-size:18px;cursor:pointer">✕</button><h2 style="margin:0">🏭 Betriebsausbau & Expansion</h2><p style="margin:7px 0 0"><b>${c.name||"Betrieb"}</b> · ${count} Betrieb${count===1?"":"e"}</p></div>
  <h3>Ausbaustufen</h3><p style="opacity:.82">Jede Zeile zeigt die <b>aktuelle Wirkung → Wirkung nach dem nächsten Kauf</b>. Die Wirkung wird direkt im operativen Betrieb angewendet.</p>${rows}
  <h3>Aktuelle Gesamtwirkung</h3><div>Produktion × ${mods.productionMultiplier.toFixed(3)} · Lager × ${mods.storageMultiplier.toFixed(3)} · Betriebskosten × ${mods.operatingCostMultiplier.toFixed(3)} · Qualität + ${(mods.qualityBonus*100).toFixed(2)}% · Logistik × ${mods.logisticsMultiplier.toFixed(3)} · Verwaltung × ${mods.administrationMultiplier.toFixed(3)}</div>
  <h3>Nächster Betrieb</h3><div style="line-height:1.7">Gründung: <b>${euro(req.creationCost)}</b> · benötigter Unternehmenswert: <b>${euro(req.requiredNetWorth)}</b> · Reserve danach: <b>${euro(req.requiredCashReserve)}</b><br>Management benötigt: <b>${req.requiredManagement||0}</b> · vorhanden: <b>${Number(c.managementCapacity||managementCapacity(c.managementStaff))}</b><br>Status: <b>${status?.allowed?"✅ möglich":"🔒 noch nicht möglich"}</b>${status?.reasons?.length?` – ${status.reasons.join("; ")}`:""}</div>
  <h3>Standortvergleich</h3><div>${Object.keys(LocationClasses).map(k=>{const r=propertyOffer(k,"rent",1),b=propertyOffer(k,"buy",1);return `<div style="padding:5px 0"><b>${LocationClasses[k].label}</b>: Miete ${euro(r.monthly)}/Monat · Kauf ${euro(b.upfront)} · Logistik ×${r.modifiers.logistics} · Kunden ×${r.modifiers.customers}</div>`}).join("")}</div>
  <h3>Verwaltung & Finanzierung</h3><div>Managementkosten: ${euro(managementMonthlyCost(c.managementStaff))}/Monat · zentrale Verwaltung: ${euro(administrationMonthlyCost(count))}/Monat</div>`;
  document.body.appendChild(el);el.querySelector("[data-close]").onclick=()=>this.close();el.querySelectorAll("[data-upgrade]").forEach(btn=>btn.onclick=()=>{const k=btn.dataset.upgrade;try{const result=applyUpgrade(c,k);window.dispatchEvent(new CustomEvent("world:server-balances-changed"));window.dispatchEvent(new CustomEvent("world:game-state-dirty",{detail:{reason:"business-upgrade",track:k,level:result.level}}));this.render();}catch(e){alert(e.message);}});
 }
 loanPreview(amount){const c=this.portfolio?.activeCompany||window.worldPlayerCompany;return expansionLoanOffer({amount,netWorth:this.portfolio?.getExpansionStatus?.(c)?.netWorth||0,businessCount:this.portfolio?.companies?.length||1});}
}
