// WorldProject - sichtbare Verwaltung für Ausbau, Standort und Expansion
import {UpgradeTracks,getUpgradeState,upgradeCost,upgradeBonus,operationalModifiers} from "./BusinessExpansionSystem.js";
import {LocationClasses,propertyOffer,managementCapacity,managementMonthlyCost,administrationMonthlyCost,expansionLoanOffer} from "./BusinessLocationSystem.js";

const euro=n=>Number(n||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
export class BusinessExpansionDialog{
 constructor({portfolio}={}){this.portfolio=portfolio;this.id="world-business-expansion-dialog";}
 close(){document.getElementById(this.id)?.remove();}
 render(){
  this.close();const c=this.portfolio?.activeCompany||window.worldPlayerCompany;if(!c)return;
  c.upgrades=getUpgradeState(c);c.managementStaff=c.managementStaff||[];
  const status=this.portfolio?.getExpansionStatus?.(c),mods=operationalModifiers(c),count=this.portfolio?.companies?.length||1;
  const rows=Object.entries(UpgradeTracks).map(([k,v])=>{const lv=c.upgrades[k]||0;return `<div style="display:grid;grid-template-columns:1.2fr .5fr .8fr .9fr auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #ffffff16"><b>${v.label}</b><span>Stufe ${lv}/${v.maxLevel}</span><span>Bonus ${(upgradeBonus(k,lv)*100).toFixed(2)}%</span><span>${lv<v.maxLevel?euro(upgradeCost(k,lv)):"MAX"}</span><button data-upgrade="${k}" ${lv>=v.maxLevel?"disabled":""}>Ausbauen</button></div>`}).join("");
  const req=status?.requirements||{};
  const el=document.createElement("div");el.id=this.id;el.style.cssText="position:fixed;inset:5%;z-index:10050;background:#17202b;color:#fff;border:1px solid #ffffff35;border-radius:14px;padding:18px;overflow:auto;box-shadow:0 18px 60px #000b;font:14px Arial";
  el.innerHTML=`<button data-close style="float:right">✕</button><h2>🏭 Betriebsausbau & Expansion</h2><p><b>${c.name||"Betrieb"}</b> · ${count} Betrieb${count===1?"":"e"}</p>
  <h3>Ausbaustufen</h3>${rows}
  <h3>Aktuelle Wirkung</h3><div>Produktion × ${mods.productionMultiplier.toFixed(3)} · Lager × ${mods.storageMultiplier.toFixed(3)} · Betriebskosten × ${mods.operatingCostMultiplier.toFixed(3)} · Qualität + ${(mods.qualityBonus*100).toFixed(2)}%</div>
  <h3>Nächster Betrieb</h3><div style="line-height:1.7">Gründung: <b>${euro(req.creationCost)}</b> · benötigter Unternehmenswert: <b>${euro(req.requiredNetWorth)}</b> · Reserve danach: <b>${euro(req.requiredCashReserve)}</b><br>Management benötigt: <b>${req.requiredManagement||0}</b> · vorhanden: <b>${Number(c.managementCapacity||managementCapacity(c.managementStaff))}</b><br>Status: <b>${status?.allowed?"✅ möglich":"🔒 noch nicht möglich"}</b>${status?.reasons?.length?` – ${status.reasons.join("; ")}`:""}</div>
  <h3>Standortvergleich</h3><div>${Object.keys(LocationClasses).map(k=>{const r=propertyOffer(k,"rent",1),b=propertyOffer(k,"buy",1);return `<div style="padding:5px 0"><b>${LocationClasses[k].label}</b>: Miete ${euro(r.monthly)}/Monat · Kauf ${euro(b.upfront)} · Logistik ×${r.modifiers.logistics} · Kunden ×${r.modifiers.customers}</div>`}).join("")}</div>
  <h3>Verwaltung & Finanzierung</h3><div>Managementkosten: ${euro(managementMonthlyCost(c.managementStaff))}/Monat · zentrale Verwaltung: ${euro(administrationMonthlyCost(count))}/Monat</div>`;
  document.body.appendChild(el);el.querySelector("[data-close]").onclick=()=>this.close();el.querySelectorAll("[data-upgrade]").forEach(btn=>btn.onclick=()=>{const k=btn.dataset.upgrade;try{const lv=c.upgrades[k]||0,cost=upgradeCost(k,lv);if(Number(c.money||0)<cost)throw new Error("Nicht genügend Geld");c.money-=cost;c.upgrades[k]=lv+1;window.dispatchEvent(new CustomEvent("world:server-balances-changed"));this.render();}catch(e){alert(e.message);}});
 }
 loanPreview(amount){const c=this.portfolio?.activeCompany||window.worldPlayerCompany;return expansionLoanOffer({amount,netWorth:this.portfolio?.getExpansionStatus?.(c)?.netWorth||0,businessCount:this.portfolio?.companies?.length||1});}
}
