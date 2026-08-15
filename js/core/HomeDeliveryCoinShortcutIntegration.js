// ORVUNO – Coin- und Werbe-Beschleunigung direkt auf der Startseite bei "Läuft gerade".
import { activeOperationsSummary } from './ActiveOperationsOverview.js';
import { transportTimeReductionQuote, reduceTransportTimeWithCoins } from './TransportCoinTimeReductionSystem.js';
import { appendTimeAdControl } from './RewardedAdUIIntegration.js';

const company=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;
const text=v=>String(v||'').trim();

function runningSection(){
 const root=document.getElementById('world-home-dashboard');if(!root)return null;
 const h=[...root.querySelectorAll('h2')].find(x=>text(x.textContent).includes('Läuft gerade'));
 return h?.closest('section')||h?.parentElement?.parentElement||null;
}
function deliveryCards(section){
 if(!section)return[];
 const all=[...section.querySelectorAll('div')].filter(el=>{
  const t=text(el.textContent);return t.includes('Lieferung')&&t.includes('Restzeit')&&el.querySelector('div');
 });
 // Immer die kleinsten passenden Karten nehmen, nicht deren Elterncontainer.
 return all.filter(el=>!all.some(other=>other!==el&&el.contains(other))).slice(0,12);
}
function decorate(){
 if(typeof document==='undefined')return false;
 const c=company(),section=runningSection();if(!c||!section)return false;
 const deliveries=activeOperationsSummary(c).rows.filter(r=>r.kind==='delivery'&&r.raw&&Number(r.remainingMs)>0);
 if(!deliveries.length)return false;
 const cards=deliveryCards(section);let changed=false;
 cards.forEach((card,index)=>{
  if(card.dataset.deliverySpeedControls==='1')return;
  const r=deliveries.find(x=>text(card.textContent).includes(text(x.label)))||deliveries[index];if(!r)return;
  const controls=document.createElement('div');controls.dataset.deliverySpeedControls='1';Object.assign(controls.style,{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #2b3a50'});
  try{
   const quote=transportTimeReductionQuote(c,r.raw,1),btn=document.createElement('button');btn.textContent=`⚡ 1 Std. schneller · ${quote.cost} Coins`;Object.assign(btn.style,{padding:'7px 10px',borderRadius:'7px',border:'1px solid #d39b21',background:'#2a210b',color:'#f7c95d',fontWeight:'800',cursor:'pointer'});btn.disabled=Number(c.coins||0)<quote.cost;if(btn.disabled){btn.style.opacity='.55';btn.title=`Nicht genug Coins · Guthaben ${Number(c.coins||0)}`;}
   btn.onclick=e=>{e.stopPropagation();try{const fresh=transportTimeReductionQuote(c,r.raw,1);if(!confirm(`${fresh.cost} Coins einsetzen und diese Lieferung um 1 Stunde beschleunigen?`))return;reduceTransportTimeWithCoins(c,r.raw,1);window.worldHomeOperationsDashboard?.render?.();setTimeout(decorate,0);}catch(err){alert(err?.message||String(err));}};
   const hint=document.createElement('small');hint.textContent=`Coins: ${Number(c.coins||0)}`;hint.style.color='#8fa1ba';controls.append(btn,hint);
  }catch{}
  card.append(controls);
  // Zeitwerbung direkt an derselben Lieferung anbieten (bestehendes 0/5-System).
  try{appendTimeAdControl(card,r);}catch{}
  card.dataset.deliverySpeedControls='1';changed=true;
 });
 return changed;
}
if(typeof window!=='undefined'){
 window.worldHomeDeliveryCoinShortcut={decorate};const run=()=>setTimeout(decorate,20);
 for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty','world:rewarded-ad-updated'])window.addEventListener(ev,run);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setInterval(decorate,5000);
}
export function runHomeDeliveryCoinShortcutTest(){const now=1000000,c={coins:10},t={arrivalTime:new Date(now+2*3600000)};const q=transportTimeReductionQuote(c,t,1,{now});if(q.cost!==5||q.reductionMs!==3600000)throw new Error('Home-Lieferbeschleunigung falsch kalkuliert');return true;}
