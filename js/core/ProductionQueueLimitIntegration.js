// WorldProject – Produktionsplanung nutzt die zentrale Premium-Berechtigung.
// Standard: direkte Produktion, aber keine zusätzliche Warteschlange.
// Premium: bis zu 3 geplante Produktionen.
// Bereits geplante Premium-Aufträge werden beim Ablauf nicht gelöscht; neue Planung bleibt gesperrt,
// bis die Warteschlange wieder unter dem aktuell erlaubten Limit liegt.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';

const premiumSystem=new PremiumEntitlementSystem();
const plannedStatuses=new Set(['queued','planned','scheduled']);
const currentAccount=()=>window.worldCurrentUser||window.worldAccount||window.worldPlayerAccount||window.worldUserAccount||{};
function plannedCount(dialog){return (dialog?.planner?.queue||[]).filter(j=>plannedStatuses.has(String(j?.status||'').toLowerCase())).length;}
function queueLimit(){return premiumSystem.productionQueueLimit(currentAccount(),Date.now());}
function hasPremium(){return premiumSystem.state(currentAccount(),Date.now()).active;}

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__worldProductionQueueLimitIntegrated){
  proto.__worldProductionQueueLimitIntegrated=true;
  const originalCard=proto.renderProductionCard;
  proto.renderProductionCard=function(parent,recipe,company,recipes,panel){
    const result=originalCard.call(this,parent,recipe,company,recipes,panel),row=parent.lastElementChild;if(!row)return result;
    const queueButton=[...row.querySelectorAll('button')].find(b=>/^(Produktion einplanen|Produktion planen|Einplanen)(\b|\s|·)/i.test((b.textContent||'').trim()));if(!queueButton)return result;
    const originalClick=queueButton.onclick,count=plannedCount(this),limit=queueLimit(),premium=hasPremium();

    // Ohne Premium ist Planung kein sichtbarer Standard-Spielzug. Direkter Start bleibt erhalten.
    if(!premium){
      queueButton.hidden=true;
      queueButton.style.setProperty('display','none','important');
      queueButton.dataset.premiumProductionPlanning='locked';
      queueButton.onclick=event=>{event?.preventDefault?.();event?.stopPropagation?.();return false;};
      return result;
    }

    queueButton.hidden=false;
    queueButton.style.removeProperty('display');
    queueButton.dataset.premiumProductionPlanning='active';
    queueButton.textContent=`Produktion planen · ${Math.min(count,limit)}/${limit}`;
    queueButton.title=count>=limit?`Premium-Warteschlange voll: ${count}/${limit}`:`Premium-Planungsslots: ${count}/${limit}`;
    if(count>=limit)Object.assign(queueButton.style,{opacity:'.62',borderColor:'#c98a00'});
    else{queueButton.style.opacity='';queueButton.style.borderColor='';}
    queueButton.onclick=(event)=>{const current=plannedCount(this),allowed=queueLimit(),active=hasPremium();if(!active){event?.preventDefault?.();event?.stopPropagation?.();return false;}if(current>=allowed){alert(`Premium-Planungslimit erreicht: ${current}/${allowed}.\n\nWarte, bis eine geplante Charge startet oder entferne eine Planung.`);return;}return originalClick?.call(queueButton,event);};
    return result;
  };
}
export { plannedCount, hasPremium, queueLimit };
