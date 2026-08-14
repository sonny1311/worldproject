// WorldProject – dezente Farbverläufe nur für die obere Kennzahlenleiste.
// Keine Größen-, Inhalts- oder Navigationsänderung.
import { EconomyDashboard } from './EconomyDashboard.js';

const gradients = Object.freeze({
  '💶 Firmenkonto': 'linear-gradient(135deg,#183252 0%,#214b70 100%)',
  '🪙 Coins': 'linear-gradient(135deg,#162a48 0%,#123b62 100%)',
  '🚚 Fuhrpark': 'linear-gradient(135deg,#17314f 0%,#174a70 100%)',
  '🏬 Lager': 'linear-gradient(135deg,#173942 0%,#14545a 100%)',
  '📈 Wochengewinn': 'linear-gradient(135deg,#252e55 0%,#3b3068 100%)',
  '🎯 Aufgabe': 'linear-gradient(135deg,#382946 0%,#592d46 100%)'
});

function styleSummaryCards(panel){
  if(!panel?.querySelectorAll)return 0;
  let changed=0;
  for(const card of panel.querySelectorAll('div')){
    const title=card.firstElementChild?.textContent?.trim();
    const background=gradients[title];
    if(!background)continue;
    Object.assign(card.style,{
      background,
      border:'1px solid rgba(255,255,255,.08)',
      boxShadow:'inset 0 1px 0 rgba(255,255,255,.045), 0 5px 14px rgba(0,0,0,.12)'
    });
    changed++;
  }
  return changed;
}

const proto=EconomyDashboard.prototype;
if(!proto.__worldSummaryGradientIntegrated){
  Object.defineProperty(proto,'__worldSummaryGradientIntegrated',{value:true});
  const originalRender=proto.render;
  proto.render=function(panel,...args){
    const result=originalRender.call(this,panel,...args);
    styleSummaryCards(panel);
    return result;
  };
}

export function runDashboardSummaryGradientTest(){
  if(Object.keys(gradients).length!==6)throw new Error('Kennzahlen-Farbverläufe unvollständig');
  if(!gradients['🏬 Lager']?.includes('linear-gradient'))throw new Error('Lager-Farbverlauf fehlt');
  return true;
}

export { styleSummaryCards };
if(typeof window!=='undefined')window.runDashboardSummaryGradientTest=runDashboardSummaryGradientTest;
