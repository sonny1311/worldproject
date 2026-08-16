// WorldProject – stabile Startseite ohne DOM-Verschiebungen.
// Die Karten bleiben dort, wo die Fachmodule sie erzeugen; nur ihre Rasterposition wird gesetzt.
function ownHeading(el){return String(el?.querySelector?.(':scope > h2, :scope > div:first-child > h2, :scope > h1')?.textContent||'').trim();}
function isSpacer(el){return el?.tagName==='DIV'&&el.children.length===0&&(el.style.height==='14px'||el.style.height==='9px');}
function directCard(root,pattern){return [...root.children].find(el=>pattern.test(ownHeading(el)))||null;}
function customerGridOf(customers){if(!customers)return null;return [...customers.children].find(el=>el.tagName==='DIV'&&el!==customers.firstElementChild&&el.children.length>0)||null;}
function injectCss(){let st=document.getElementById('orvuno-home-stable-grid');if(!st){st=document.createElement('style');st.id='orvuno-home-stable-grid';document.head.append(st);}st.textContent=`
#world-home-dashboard{display:grid!important;grid-template-columns:minmax(0,1.55fr) minmax(320px,1fr)!important;gap:8px!important;align-items:start!important;align-content:start!important}
#world-home-dashboard>[data-world-home-warehouse]{grid-column:1!important;grid-row:3!important}
#world-home-dashboard>[data-orvuno-home-customers]{grid-column:1/-1!important;grid-row:2!important}
#world-home-dashboard>[data-orvuno-home-timed]{grid-column:2!important;grid-row:3!important}
#world-home-dashboard>[data-orvuno-home-production]{grid-column:2!important;grid-row:4!important}
#world-home-dashboard>[data-orvuno-home-title]{grid-column:1/-1!important;grid-row:1!important}
#world-home-dashboard>[data-orvuno-home-spacer]{display:none!important}
#world-home-dashboard [data-orvuno-customer-grid]{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important}
#world-home-dashboard [data-orvuno-customer-grid]>*{min-width:0!important;width:auto!important}
#world-home-dashboard [data-orvuno-customer-grid]>*:nth-child(n+5){display:none!important}
@media(max-width:940px){
 #world-home-dashboard{grid-template-columns:1fr!important}
 #world-home-dashboard>[data-orvuno-home-title],#world-home-dashboard>[data-orvuno-home-customers],#world-home-dashboard>[data-world-home-warehouse],#world-home-dashboard>[data-orvuno-home-timed],#world-home-dashboard>[data-orvuno-home-production]{grid-column:1!important;grid-row:auto!important}
}
@media(max-width:680px){#world-home-dashboard [data-orvuno-customer-grid]{grid-template-columns:1fr!important}}
`;}
function tagCards(root){
 const title=[...root.children].find(el=>el.querySelector?.(':scope > h1'))||null;
 const customers=directCard(root,/Kundenaufträge/i);
 const timed=directCard(root,/Läuft gerade|Laufende Vorgänge/i);
 const production=directCard(root,/Produktion/i);
 const warehouse=[...root.children].find(el=>el.dataset?.worldHomeWarehouse==='1')||directCard(root,/Lager/i);
 if(title)title.dataset.orvunoHomeTitle='1';
 if(customers)customers.dataset.orvunoHomeCustomers='1';
 if(timed)timed.dataset.orvunoHomeTimed='1';
 if(production)production.dataset.orvunoHomeProduction='1';
 for(const el of [...root.children])if(isSpacer(el))el.dataset.orvunoHomeSpacer='1';
 const customerGrid=customerGridOf(customers);if(customerGrid)customerGrid.dataset.orvunoCustomerGrid='1';
 return{title,customers,timed,production,warehouse};
}
let applying=false;
function applyHomeViewport(){
 if(applying)return false;const root=document.getElementById('world-home-dashboard');if(!root)return false;applying=true;
 try{
  injectCss();tagCards(root);
  Object.assign(document.documentElement.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100%'});
  Object.assign(document.body.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100vh',maxHeight:'none'});
  Object.assign(root.style,{maxWidth:'1280px',width:'calc(100% - 28px)',boxSizing:'border-box',padding:'64px 14px 18px',fontSize:'14px',lineHeight:'1.35',minHeight:'0',height:'auto',maxHeight:'none',overflow:'visible'});
  for(const el of root.children)if(!isSpacer(el)){el.style.setProperty('margin','0','important');el.style.setProperty('min-width','0','important');el.style.setProperty('align-self','start','important');}
  for(const h1 of root.querySelectorAll('h1'))Object.assign(h1.style,{fontSize:'26px',lineHeight:'1.15'});
  for(const h2 of root.querySelectorAll('h2'))Object.assign(h2.style,{fontSize:'20px',lineHeight:'1.2'});
  for(const button of root.querySelectorAll('button'))Object.assign(button.style,{padding:'7px 10px',minHeight:'34px'});
  return true;
 }finally{applying=false;}
}
export function installHomeDashboardViewport(){
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 let scheduled=false;const run=()=>{if(scheduled||applying)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyHomeViewport();});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty','world:customer-order-updated'])window.addEventListener(ev,run);
 const observer=new MutationObserver(mutations=>{if(applying)return;const root=document.getElementById('world-home-dashboard');if(!root)return;const relevant=mutations.some(m=>m.target===root||root.contains(m.target));if(relevant)run();});observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('resize',run);return true;
}
if(typeof window!=='undefined'){window.worldHomeDashboardViewport={apply:applyHomeViewport,install:installHomeDashboardViewport};installHomeDashboardViewport();}
