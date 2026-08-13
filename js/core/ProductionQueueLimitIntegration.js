// WorldProject – Free-Spieler dürfen maximal drei Produktionen gleichzeitig einplanen.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const plannedStatuses=new Set(['queued','planned','scheduled']);
function hasPremium(company){
  const account=window.worldAccount||window.worldPlayerAccount||window.worldUserAccount||null;
  const premiumApi=window.worldPremium||window.worldPremiumSystem||window.premiumSystem||null;
  try{if(typeof premiumApi?.isActive==='function'&&premiumApi.isActive(account||company))return true;}catch{}
  return Boolean(company?.premiumActive||company?.premium?.active||company?.subscription?.premium||account?.premiumActive||account?.premium?.active||account?.subscription?.premium);
}
function plannedCount(dialog){return (dialog?.planner?.queue||[]).filter(j=>plannedStatuses.has(String(j?.status||'').toLowerCase())).length;}

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__worldProductionQueueLimitIntegrated){
  proto.__worldProductionQueueLimitIntegrated=true;
  const originalCard=proto.renderProductionCard;
  proto.renderProductionCard=function(parent,recipe,company,recipes,panel){
    const result=originalCard.call(this,parent,recipe,company,recipes,panel);
    const row=parent.lastElementChild;if(!row)return result;
    const queueButton=[...row.querySelectorAll('button')].find(b=>/^(Produktion einplanen|Einplanen)(\b|\s|·)/i.test((b.textContent||'').trim()));
    if(!queueButton)return result;
    const originalClick=queueButton.onclick;
    const premium=hasPremium(company),count=plannedCount(this),limit=premium?Infinity:3;
    if(!premium){
      queueButton.textContent=`Einplanen · ${Math.min(count,3)}/3`;
      queueButton.title=count>=3?'Ohne Premium sind maximal 3 geplante Produktionen möglich.':'Freie Planungsslots ohne Premium';
      if(count>=3)Object.assign(queueButton.style,{opacity:'.62',borderColor:'#c98a00'});
    }
    queueButton.onclick=(event)=>{
      const current=plannedCount(this);
      if(!hasPremium(company)&&current>=3){
        alert(`Planungslimit erreicht: ${current}/3.\n\nOhne Premium kannst du maximal 3 Produktionen gleichzeitig einplanen. Lösche zuerst eine geplante Charge oder warte, bis eine startet.`);
        return;
      }
      return originalClick?.call(queueButton,event);
    };
    return result;
  };
}

export { plannedCount, hasPremium };
