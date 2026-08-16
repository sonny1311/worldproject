// ORVUNO – kompaktere Startseite ohne große tote Leerflächen.
const STYLE_ID='orvuno-home-compact-layout-css';
function findSection(root,label){return [...root.querySelectorAll(':scope > section')].find(sec=>sec.querySelector('h2')?.textContent?.includes(label));}
function applyLayout(){const root=document.getElementById('world-home-dashboard');if(!root)return false;
 const customers=findSection(root,'Kundenaufträge'),running=findSection(root,'Läuft gerade'),production=findSection(root,'Produktion'),warehouse=findSection(root,'Lager');
 if(!customers||!production)return false;
 let grid=root.querySelector(':scope > [data-orvuno-home-workgrid]');
 if(!grid){grid=document.createElement('div');grid.dataset.orvunoHomeWorkgrid='1';const first=[running,customers,production,warehouse].filter(Boolean)[0];first?.before(grid);}
 for(const sec of [customers,running,production,warehouse])if(sec&&sec.parentElement!==grid)grid.append(sec);
 customers.dataset.orvunoArea='customers';if(running)running.dataset.orvunoArea='running';production.dataset.orvunoArea='production';if(warehouse)warehouse.dataset.orvunoArea='warehouse';return true;}
function css(){return `
#world-home-dashboard>[data-orvuno-home-workgrid]{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr)!important;grid-template-areas:'customers running' 'customers production' 'warehouse warehouse'!important;gap:13px!important;align-items:start!important;margin-bottom:13px!important}
#world-home-dashboard>[data-orvuno-home-workgrid]>section{margin:0!important;min-width:0!important;height:auto!important;align-self:start!important}
#world-home-dashboard [data-orvuno-area='customers']{grid-area:customers!important}
#world-home-dashboard [data-orvuno-area='running']{grid-area:running!important}
#world-home-dashboard [data-orvuno-area='production']{grid-area:production!important}
#world-home-dashboard [data-orvuno-area='warehouse']{grid-area:warehouse!important}
#world-home-dashboard [data-orvuno-area='customers']>div[style*='grid-template-columns']{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))!important}
#world-home-dashboard [data-orvuno-area='customers'] [style*='minmax(290px']{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))!important}
#world-home-dashboard [data-orvuno-area='running'],#world-home-dashboard [data-orvuno-area='production']{min-height:0!important}
@media(max-width:1280px){#world-home-dashboard>[data-orvuno-home-workgrid]{grid-template-columns:minmax(0,1fr)!important;grid-template-areas:'customers' 'running' 'production' 'warehouse'!important}}
`;}
function install(){if(typeof document==='undefined')return;let style=document.getElementById(STYLE_ID);if(!style){style=document.createElement('style');style.id=STYLE_ID;style.textContent=css();document.head.append(style);}let queued=false;const run=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyLayout();});};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();for(const ev of ['world:game-state-dirty','worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched'])window.addEventListener(ev,run);new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});}
install();
