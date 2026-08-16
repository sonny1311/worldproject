// ORVUNO – klare Informationsarchitektur für Navigation und Startseite.
// Keine neue Spiellogik: vorhandene Dialoge/Funktionen werden nur besser gruppiert und erreichbar gemacht.

const STYLE_ID='orvuno-usability-reorg-style';
const NAV_ID='orvuno-side-nav';
const HOME_ID='world-home-dashboard';
let scheduled=false;

function css(){return `
#orvuno-side-nav .group{margin-top:16px!important}
#orvuno-side-nav .group:first-of-type{margin-top:8px!important}
#orvuno-side-nav button[data-orvuno-primary="1"]{background:linear-gradient(180deg,#13243a,#0f1d30)!important;border-color:#2e4665!important;color:#fff!important}
#orvuno-side-nav button[data-orvuno-primary="1"]:hover{border-color:#8b5cf6!important}
#orvuno-side-nav .orvuno-nav-separator{height:1px;background:#233248;margin:13px 7px}
#world-home-dashboard.orvuno-home-reorganized{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr)!important;gap:13px!important;align-items:start!important}
#world-home-dashboard.orvuno-home-reorganized>section{margin-bottom:0!important;min-width:0!important}
#world-home-dashboard.orvuno-home-reorganized>section.orvuno-home-full{grid-column:1/-1!important}
#world-home-dashboard.orvuno-home-reorganized>section.orvuno-home-priority{border-color:#3c4f6b!important;box-shadow:0 9px 28px #02071166!important}
#world-home-dashboard.orvuno-home-reorganized>section.orvuno-home-secondary{opacity:.97}
#world-home-dashboard .orvuno-home-section-note{display:inline-flex;align-items:center;margin-left:8px;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:900;background:#16243a;color:#aebfd5;border:1px solid #293d59;vertical-align:middle}
@media(max-width:1180px){#world-home-dashboard.orvuno-home-reorganized{grid-template-columns:1fr!important}#world-home-dashboard.orvuno-home-reorganized>section{grid-column:1!important}}
`;}
function installCss(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css();document.head.append(s);}
function allButtonsOutsideSide(){return [...document.querySelectorAll('button')].filter(x=>!x.closest(`#${NAV_ID}`));}
function clickExisting(text){const b=allButtonsOutsideSide().find(x=>(x.textContent||'').trim().includes(text));if(!b)return false;b.click();return true;}
function openAccount(key,fallback){const d=window.worldAccounts?.[key];if(d?.open)return d.open();if(fallback&&clickExisting(fallback))return;throw new Error('Dieser Bereich ist derzeit noch nicht verfügbar.');}
function openCustomers(){const fn=window.worldHomeOperationsDashboard?.openCustomers;if(typeof fn==='function')return fn.call(window.worldHomeOperationsDashboard);return openAccount('marketFleetDialog','Markt & Fuhrpark');}
function actionButton(label,fn,{primary=false}={}){const b=document.createElement('button');b.type='button';b.textContent=label;if(primary)b.dataset.orvunoPrimary='1';b.onclick=async()=>{for(const x of b.closest(`#${NAV_ID}`)?.querySelectorAll('button')||[])x.classList.toggle('active',x===b);try{await fn();}catch(error){console.error(`ORVUNO Navigation '${label}' konnte nicht geöffnet werden`,error);alert(error?.message||'Dieser Bereich konnte nicht geöffnet werden.');}};return b;}
function group(nav,title,items){const g=document.createElement('div');g.className='group';g.textContent=title;nav.append(g);for(const item of items)nav.append(actionButton(item[0],item[1],item[2]||{}));}
function rebuildSideNav(){const nav=document.getElementById(NAV_ID);if(!nav)return false;const brand=nav.querySelector('.brand')?.outerHTML||'<div class="brand"><span class="brand-mark"></span><span class="brand-name">ORVUNO</span><small class="brand-sub">Wirtschaftssimulation</small></div>';nav.innerHTML=brand;
 group(nav,'Betrieb',[['🏭  Gelände & Gebäude',()=>{if(window.worldBusinessPremisesOverview?.open)return window.worldBusinessPremisesOverview.open();const d=window.worldUniversalOperations;if(d?.open)return d.open('premises');throw new Error('Geländeübersicht ist noch nicht bereit.');},{primary:true}],['📦  Einkauf · Lager · Produktion',()=>openAccount('operationalSupplyChainDialog','Betrieb')],['👥  Personal',()=>openAccount('workforceOperationsDialog','Personal')]]);
 group(nav,'Handel',[['📋  Kundenaufträge',openCustomers,{primary:true}],['🌐  Markt & Fuhrpark',()=>openAccount('marketFleetDialog','Markt & Fuhrpark')],['📑  Verträge',()=>{if(!clickExisting('Verträge'))return openAccount('marketFleetDialog','Markt & Fuhrpark');}]]);
 group(nav,'Unternehmen',[['🏢  Meine Betriebe',()=>openAccount('businessPortfolioDialog','Betriebe')],['📊  Statistiken',()=>{if(window.worldPlayerInfoHub?.open)return window.worldPlayerInfoHub.open('stats');if(!clickExisting('Statistik'))throw new Error('Statistiken sind derzeit noch nicht verfügbar.');}],['✉️  Nachrichten',()=>{if(window.worldPlayerInfoHub?.open)return window.worldPlayerInfoHub.open('messages');if(!clickExisting('Nachrichten'))throw new Error('Nachrichten sind derzeit noch nicht verfügbar.');}],['📅  Vorgänge & Ereignisse',()=>{if(window.worldActiveOperationsUI?.open)return window.worldActiveOperationsUI.open();if(!clickExisting('Vorgänge'))throw new Error('Die Vorgangsübersicht ist derzeit noch nicht verfügbar.');}]]);
 return true;
}
function sectionTitle(section){return (section.querySelector('h1,h2,h3')?.textContent||'').trim();}
function classify(section){const t=sectionTitle(section).toLowerCase();if(!t)return'other';if(t.includes('willkommen')||t.includes('unternehmens')||t.includes('übersicht')&&section.querySelector('h1'))return'hero';if(t.includes('läuft gerade')||t.includes('vorgäng'))return'running';if(t.includes('kundenauftrag'))return'orders';if(t.includes('produktion'))return'production';if(t.includes('lager'))return'warehouse';if(t.includes('finanz')||t.includes('kennzahl')||t.includes('umsatz')||t.includes('gewinn'))return'finance';if(t.includes('hinweis')||t.includes('tipp')||t.includes('priorität'))return'hint';return'other';}
function mark(section,label){const h=section.querySelector('h2');if(!h||h.querySelector('.orvuno-home-section-note'))return;const n=document.createElement('span');n.className='orvuno-home-section-note';n.textContent=label;h.append(n);}
function reorganizeHome(){const root=document.getElementById(HOME_ID);if(!root)return false;root.classList.add('orvuno-home-reorganized');const sections=[...root.children].filter(x=>x.tagName==='SECTION');if(!sections.length)return false;const buckets={hero:[],running:[],orders:[],production:[],warehouse:[],finance:[],hint:[],other:[]};for(const s of sections){s.classList.remove('orvuno-home-full','orvuno-home-priority','orvuno-home-secondary');(buckets[classify(s)]||buckets.other).push(s);}const ordered=[...buckets.hero,...buckets.running,...buckets.orders,...buckets.production,...buckets.warehouse,...buckets.finance,...buckets.hint,...buckets.other];for(const s of ordered)root.append(s);for(const s of buckets.hero){s.classList.add('orvuno-home-full');}for(const s of [...buckets.running,...buckets.orders]){s.classList.add('orvuno-home-priority');mark(s,'JETZT WICHTIG');}for(const s of [...buckets.production,...buckets.warehouse]){mark(s,'BETRIEB');}for(const s of [...buckets.finance,...buckets.hint,...buckets.other])s.classList.add('orvuno-home-secondary');return true;}
function apply(){installCss();rebuildSideNav();reorganizeHome();}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});}
export function installOrvunoUsabilityReorganization(){if(typeof document==='undefined')return false;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty','world:user-login','world:access-granted','world:admin-closed'])window.addEventListener(ev,schedule);new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length||x.removedNodes?.length))schedule();}).observe(document.documentElement,{childList:true,subtree:true});return true;}
if(typeof window!=='undefined')installOrvunoUsabilityReorganization();
