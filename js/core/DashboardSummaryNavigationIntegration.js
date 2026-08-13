// WorldProject – obere Kennzahlen-Kacheln als echte Navigation.
import { EconomyDashboard } from './EconomyDashboard.js';

const proto=EconomyDashboard.prototype;
if(!proto.__worldSummaryNavigationIntegrated){
 proto.__worldSummaryNavigationIntegrated=true;
 const original=proto.render;
 proto.render=function(panel){
  const result=original.call(this,panel);
  const cards=[...panel.querySelectorAll('div')].filter(el=>el.children?.length>=2&&el.firstElementChild&&['💶 Firmenkonto','🪙 Coins','🚚 Fuhrpark','🏬 Lager','📈 Wochengewinn','🎯 Aufgabe'].includes(el.firstElementChild.textContent?.trim()));
  const allCards=[...panel.querySelectorAll('div')];
  const findDetail=title=>allCards.find(el=>el.firstElementChild?.textContent?.trim()===title);
  const finance=findDetail('📊 Tages-/Wochenübersicht'),fleet=findDetail('🚛 Fuhrpark, Tank & Wartung'),warehouse=findDetail('🏬 Lager nach Bereichen');
  if(finance)finance.id='dashboard-finance';if(fleet)fleet.id='dashboard-fleet';if(warehouse)warehouse.id='dashboard-warehouse';
  const jump=target=>{if(!target)return;target.scrollIntoView({behavior:'smooth',block:'center'});const old=target.style.outline;target.style.outline='2px solid #ffd54a';setTimeout(()=>target.style.outline=old,1400);};
  for(const card of cards){
   const title=card.firstElementChild.textContent?.trim();Object.assign(card.style,{cursor:'pointer',transition:'transform .12s ease, box-shadow .12s ease'});card.title='Klicken für Details';card.tabIndex=0;
   const run=()=>{
    if(title==='💶 Firmenkonto'||title==='📈 Wochengewinn')return jump(finance);
    if(title==='🚚 Fuhrpark')return jump(fleet);
    if(title==='🏬 Lager')return jump(warehouse);
    if(title==='🪙 Coins'){
      const premium=[...document.querySelectorAll('button,a')].find(x=>/premium|coins?/i.test(x.textContent||'')&&!card.contains(x));
      if(premium)return premium.click();
      alert(`Coins: ${Number(this.company?.coins||0).toLocaleString('de-DE')}\nCoin-/Premium-Bereich wird hier geöffnet, sobald eine passende Aktion verfügbar ist.`);return;
    }
    if(title==='🎯 Aufgabe'){
      const mission=this.controller?.missions?.getActiveMission?.(this.company);if(!mission){alert('Aktuell ist keine Aufgabe aktiv.');return;}
      const done=mission.deliveredAmount??0,target=mission.targetAmount??0,reward=mission.rewardMoney??mission.reward??null;
      alert(`Aktive Aufgabe\nFortschritt: ${done} / ${target}${reward!=null?`\nBelohnung: ${Number(reward).toLocaleString('de-DE')} €`:''}`);
    }
   };
   card.onclick=run;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}};
  }
  return result;
 };
}
