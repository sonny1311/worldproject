// ORVUNO – Coin-Beschleunigung direkt auf der Startseite bei "Läuft gerade".
// Nutzt ausschließlich das vorhandene TransportCoinTimeReductionSystem: 5 Coins je Stunde,
// maximal 10 Stunden / 50 Coins pro Kauf bleiben dort zentral geregelt.
import { activeOperationsSummary } from './ActiveOperationsOverview.js';
import { transportTimeReductionQuote, reduceTransportTimeWithCoins } from './TransportCoinTimeReductionSystem.js';

const company=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEngine?.company||null;
const text=v=>String(v||'').trim();

function runningSection(){
 const root=document.getElementById('world-home-dashboard');
 if(!root)return null;
 return [...root.querySelectorAll('section,div')].find(el=>el.querySelector?.(':scope > div > h2')?.textContent?.includes('Läuft gerade'))||null;
}

function decorate(){
 if(typeof document==='undefined')return false;
 const c=company(),section=runningSection();if(!c||!section)return false;
 const deliveries=activeOperationsSummary(c).rows.filter(r=>r.kind==='delivery'&&r.raw&&Number(r.remainingMs)>=3600000);
 if(!deliveries.length)return false;
 const cards=[...section.querySelectorAll('div')].filter(el=>{
  const first=el.firstElementChild;return first&&text(first.textContent).includes('🚚 Lieferung')&&!el.dataset.deliveryCoinShortcut;
 });
 let changed=false;
 cards.forEach((card,index)=>{
  const r=deliveries[index]||deliveries.find(x=>text(card.textContent).includes(text(x.label)));
  if(!r)return;
  let quote;try{quote=transportTimeReductionQuote(c,r.raw,1);}catch{return;}
  const wrap=document.createElement('div');wrap.dataset.deliveryCoinShortcut='1';
  Object.assign(wrap.style,{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginTop:'10px',paddingTop:'9px',borderTop:'1px solid #334155'});
  const hint=document.createElement('small');hint.textContent=`⚡ Dringend? 5 Coins = 1 Std. weniger · Guthaben ${Number(c.coins||0)} Coins`;hint.style.color='#cbd5e1';
  const btn=document.createElement('button');btn.textContent='⚡ 1 Std. beschleunigen · 5 Coins';
  Object.assign(btn.style,{padding:'7px 10px',borderRadius:'7px',border:'1px solid #f59e0b',background:'#3a2808',color:'#fde68a',fontWeight:'800',cursor:'pointer'});
  btn.disabled=Number(c.coins||0)<quote.cost;
  if(btn.disabled){btn.style.opacity='.5';btn.style.cursor='not-allowed';btn.title='Nicht genug Coins';}
  btn.onclick=()=>{
   try{
    const fresh=transportTimeReductionQuote(c,r.raw,1);
    if(!confirm(`${fresh.cost} Coins einsetzen und diese Lieferung um 1 Stunde beschleunigen?`))return;
    const result=reduceTransportTimeWithCoins(c,r.raw,1);
    window.worldHomeOperationsDashboard?.render?.();
    setTimeout(decorate,0);
    alert(`✅ Lieferung beschleunigt. Neue Restzeit wurde um ${Math.round(result.reductionMs/60000)} Minuten verkürzt.\nVerbleibende Coins: ${result.coinsAfter}`);
   }catch(e){alert(e?.message||String(e));}
  };
  wrap.append(hint,btn);card.append(wrap);card.dataset.deliveryCoinShortcut='1';changed=true;
 });
 return changed;
}

if(typeof window!=='undefined'){
 window.worldHomeDeliveryCoinShortcut={decorate};
 const run=()=>setTimeout(decorate,0);
 for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty'])window.addEventListener(ev,run);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 setInterval(decorate,15000);
}

export function runHomeDeliveryCoinShortcutTest(){
 const now=1000000,c={coins:10},t={arrivalTime:new Date(now+2*3600000)};
 const q=transportTimeReductionQuote(c,t,1,{now});
 if(q.cost!==5||q.reductionMs!==3600000)throw new Error('Home-Lieferbeschleunigung falsch kalkuliert');
 return true;
}
