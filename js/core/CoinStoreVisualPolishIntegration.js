// ORVUNO – Coinshop optisch als vollwertige Shopansicht und Premium-Abfüllplanung sauber sperren.
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';

const premium=new PremiumEntitlementSystem();
const account=()=>window.worldCurrentUser||window.worldAccount||{};
const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
const important=(el,key,value)=>el?.style?.setProperty?.(key,value,'important');

function coinHeading(){
 return [...document.querySelectorAll('h1,h2,h3,h4,strong,div')].find(el=>text(el).includes('Coins mit Echtgeld kaufen'))||null;
}
function smallestPackageNodes(root){
 const candidates=[...root.querySelectorAll('article,section,div')].filter(el=>/Coins gesamt/.test(text(el))&&/€/.test(text(el)));
 return candidates.filter(el=>!candidates.some(other=>other!==el&&el.contains(other)));
}
function cardFrom(node,root){
 let cur=node;
 while(cur?.parentElement&&cur.parentElement!==root){
  const parent=cur.parentElement;
  const parentPackages=smallestPackageNodes(parent);
  if(parentPackages.length>1)break;
  cur=parent;
 }
 return cur||node;
}
function commonParent(cards){
 if(!cards.length)return null;
 let p=cards[0].parentElement;
 while(p&&cards.some(card=>!p.contains(card)))p=p.parentElement;
 return p;
}
function styleCoinShop(){
 const heading=coinHeading();if(!heading)return false;
 const root=heading.closest('section')||heading.parentElement;if(!root)return false;
 root.dataset.orvunoCoinStorePolished='1';
 important(root,'width','min(1180px, calc(100vw - 64px))');important(root,'max-width','1180px');important(root,'margin-left','auto');important(root,'margin-right','auto');important(root,'box-sizing','border-box');
 important(root,'padding','24px');important(root,'border-radius','16px');important(root,'background','linear-gradient(180deg,#0b1626,#08111f)');important(root,'border','1px solid #334155');important(root,'box-shadow','0 24px 70px rgba(0,0,0,.42)');
 important(heading,'margin','0 0 8px');important(heading,'font-size','24px');important(heading,'letter-spacing','-.02em');
 const leaves=smallestPackageNodes(root),cards=[...new Set(leaves.map(x=>cardFrom(x,root)))];
 const grid=commonParent(cards);
 if(grid&&cards.length>1){
  important(grid,'display','grid');important(grid,'grid-template-columns','repeat(auto-fit,minmax(210px,1fr))');important(grid,'gap','16px');important(grid,'align-items','stretch');important(grid,'width','100%');important(grid,'max-width','none');
 }
 for(const card of cards){
  card.dataset.orvunoCoinCard='1';important(card,'width','auto');important(card,'max-width','none');important(card,'min-width','0');important(card,'min-height','270px');important(card,'box-sizing','border-box');important(card,'padding','16px');important(card,'border-radius','14px');important(card,'border','1px solid #40516a');important(card,'background','linear-gradient(180deg,#13213a,#0d1829)');important(card,'box-shadow','0 12px 28px rgba(0,0,0,.28)');
  for(const b of card.querySelectorAll('button')){important(b,'width','100%');important(b,'min-height','42px');important(b,'border-radius','9px');important(b,'font-weight','850');important(b,'font-size','14px');}
 }
 const overlay=root.closest('[data-world-overlay],[role="dialog"]')||root.parentElement;
 const close=overlay?[...overlay.querySelectorAll('button')].find(b=>/Schließen/.test(text(b))):null;
 if(close){close.textContent='✕';close.title='Schließen';close.setAttribute('aria-label','Schließen');important(close,'width','40px');important(close,'min-width','40px');important(close,'height','40px');important(close,'padding','0');important(close,'font-size','20px');}
 return true;
}
function premiumActive(){try{return !!premium.state(account()).active;}catch{return false;}}
function isBottlingPlanControl(el){return !!el?.closest?.('button,a,[role="button"]')&&text(el.closest('button,a,[role="button"]')).includes('Abfüllung planen');}
function enforceBottlingPremium(){
 const active=premiumActive();
 for(const el of document.querySelectorAll('button,a,[role="button"]')){
  if(!text(el).includes('Abfüllung planen'))continue;
  el.dataset.premiumBottlingControl='1';
  el.hidden=!active;important(el,'display',active?'':'none');
 }
 return active;
}
function guardBottlingClick(event){
 const control=event.target?.closest?.('button,a,[role="button"]');if(!control||!isBottlingPlanControl(control)||premiumActive())return;
 event.preventDefault();event.stopImmediatePropagation();
 window.worldActionFeedback?.show?.('Abfüllplanung ist eine Premium-Funktion.',{type:'warning',title:'Premium erforderlich'});
}
function apply(){styleCoinShop();enforceBottlingPremium();}
export function installCoinStoreVisualPolish(){
 if(typeof document==='undefined')return false;
 let queued=false;const run=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
 document.addEventListener('click',guardBottlingClick,true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
 for(const ev of ['world:open-premium','world:game-state-dirty','worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched'])window.addEventListener(ev,run);
 return true;
}
export function runCoinStoreVisualPolishTest(){
 if(typeof document==='undefined')return true;
 const host=document.createElement('div');host.innerHTML='<section><h2>Coins mit Echtgeld kaufen</h2><div><article><div>100 Coins gesamt · 0,99 €</div><button>0,99 €</button></article><article><div>550 Coins gesamt · 4,99 €</div><button>4,99 €</button></article></div></section>';
 document.body.append(host);const ok=styleCoinShop()&&host.querySelectorAll('[data-orvuno-coin-card]').length===2;host.remove();if(!ok)throw new Error('Coinshop-Grid wurde nicht angewendet');return true;
}
if(typeof window!=='undefined'){window.worldCoinStoreVisualPolish={apply,runTest:runCoinStoreVisualPolishTest};installCoinStoreVisualPolish();}
