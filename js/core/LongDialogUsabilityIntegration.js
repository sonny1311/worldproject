// ORVUNO - zentraler Standard fuer lange Verwaltungsfenster.
import { WorkforceOperationsDialog } from "./WorkforceOperationsDialog.js";
import { MarketFleetDialog } from "./MarketFleetDialog.js";
import { OperationalSupplyChainDialog } from "./OperationalSupplyChainDialog.js";
import { BusinessPortfolioDialog } from "./BusinessPortfolioDialog.js";
import { AccountProfileDialog } from "./AccountProfileDialog.js";

function resolveHeader(panel,close){
 if(!panel||!close)return null;
 if(close.parentElement!==panel)return close.parentElement;
 const candidate=[...panel.children].find(el=>el!==close&&el.querySelector?.('h1,h2'));
 if(candidate){
  candidate.append(close);
  Object.assign(candidate.style,{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'});
  return candidate;
 }
 const head=document.createElement('div');
 Object.assign(head.style,{display:'flex',justifyContent:'flex-end',alignItems:'center'});
 panel.insertBefore(head,panel.firstChild);
 head.append(close);
 return head;
}

function enhanceCloseHeader(panel){
 if(!panel?.querySelectorAll)return false;
 const close=[...panel.querySelectorAll("button")].find(b=>String(b.textContent||"").trim()==="✕");
 if(!close)return false;
 close.setAttribute("aria-label","Fenster schließen");close.title="Fenster schließen";
 const overlay=panel.parentElement;
 if(overlay){Object.assign(overlay.style,{zIndex:"300000",alignItems:"flex-start",justifyContent:"center",padding:"88px 20px 20px",boxSizing:"border-box"});}
 Object.assign(panel.style,{position:"relative",maxHeight:"calc(100vh - 108px)",overflow:"auto",background:"#111827",color:"#f8fafc",border:"1px solid #334155",boxSizing:"border-box"});
 const head=resolveHeader(panel,close);
 if(!head)return false;
 Object.assign(head.style,{position:"sticky",top:"0",zIndex:"300010",background:"#111827",padding:"8px 0",borderBottom:"1px solid #334155",boxShadow:'0 4px 12px rgba(0,0,0,.28)'});
 Object.assign(close.style,{position:"relative",top:'auto',float:'none',margin:'0 0 0 12px',zIndex:"300020",background:"#1e293b",color:"#f8fafc",border:"1px solid #64748b",fontSize:"20px",lineHeight:"1",padding:"9px 12px",boxShadow:"0 4px 14px rgba(0,0,0,.35)",flex:'0 0 auto'});
 return true;
}

function enhanceEconomicsInputs(panel){
 const heading=[...panel.querySelectorAll("h3")].find(h=>String(h.textContent||"").includes("Produktkosten"));
 const section=heading?.closest("section");if(!section)return false;
 const labels=[["Produktionsmenge","Wie viele Einheiten werden kalkuliert?"],["Gesamtumsatz","Verkaufserlös für die gesamte Menge"],["Rohstoffkosten","Gesamte Rohstoffkosten"],["Verpackungskosten","Gesamte Verpackungskosten"],["Energiekosten","Gesamte Energiekosten"],["Personalkosten","Zurechenbare Personalkosten"],["Maschinenkosten","Zurechenbare Maschinenkosten"],["Transportkosten","Zurechenbare Transportkosten"]];
 const inputs=[...section.querySelectorAll("input")];inputs.slice(0,labels.length).forEach((input,index)=>{const [label,help]=labels[index];input.placeholder=label;input.title=`${label}: ${help}`;input.setAttribute("aria-label",label);const existing=input.previousElementSibling;if(existing?.dataset?.worldCostLabel===String(index))return;const caption=document.createElement("span");caption.dataset.worldCostLabel=String(index);caption.textContent=label;Object.assign(caption.style,{display:"inline-block",fontSize:"12px",fontWeight:"700",marginLeft:"6px"});input.before(caption);});return true;
}
function patchRender(ClassRef,{economics=false}={}){
 if(!ClassRef?.prototype||ClassRef.prototype.__worldLongDialogUsabilityPatched)return;
 const baseRender=ClassRef.prototype.render;if(typeof baseRender!=="function")return;
 ClassRef.prototype.render=function(panel,...args){const result=baseRender.call(this,panel,...args);Promise.resolve(result).finally(()=>{enhanceCloseHeader(panel);if(economics)enhanceEconomicsInputs(panel);});return result;};
 Object.defineProperty(ClassRef.prototype,"__worldLongDialogUsabilityPatched",{value:true});
}
patchRender(WorkforceOperationsDialog,{economics:true});patchRender(MarketFleetDialog);patchRender(OperationalSupplyChainDialog);patchRender(BusinessPortfolioDialog);patchRender(AccountProfileDialog);
export {enhanceCloseHeader,enhanceEconomicsInputs};
if(typeof window!=="undefined")window.worldLongDialogUsability={enhanceCloseHeader,enhanceEconomicsInputs};
