// WorldProject – Startseite kompakt und normal scrollbar.
function headingOf(el){return String(el?.querySelector?.('h2')?.textContent||el?.querySelector?.('h1')?.textContent||el?.textContent||'').trim();}
function isSpacer(el){return el?.tagName==='DIV'&&el.children.length===0&&(el.style.height==='14px'||el.style.height==='9px');}
function findDirect(root,pattern){return [...root.children].find(el=>pattern.test(headingOf(el)))||null;}
function applyWorkGrid(root){
 const title=[...root.children].find(el=>el.matches?.('section')&&el.querySelector('h1'))||root.firstElementChild;
 const customers=findDirect(root,/Kundenaufträge/i);
 const timed=findDirect(root,/Läuft gerade|Laufende Vorgänge/i);
 const production=findDirect(root,/Produktion/i);
 const warehouse=[...root.children].find(el=>el.dataset?.worldHomeWarehouse==='1'||/Lager/i.test(headingOf(el)))||null;
 if(!customers||!timed||!production)return false;
 for(const el of [...root.children])if(isSpacer(el))el.style.display='none';
 root.style.setProperty('display','grid','important');
 root.style.setProperty('grid-template-columns','minmax(0,1.7fr) minmax(300px,.95fr)','important');
 root.style.setProperty('gap','12px','important');
 root.style.setProperty('align-items','start','important');
 if(title){title.style.setProperty('grid-column','1 / -1','important');title.style.setProperty('margin-bottom','0','important');}
 customers.style.setProperty('grid-column','1','important');
 customers.style.setProperty('grid-row','2','important');
 timed.style.setProperty('grid-column','2','important');
 timed.style.setProperty('grid-row','2','important');
 production.style.setProperty('grid-column','2','important');
 production.style.setProperty('grid-row','3','important');
 if(warehouse){warehouse.style.setProperty('grid-column','1','important');warehouse.style.setProperty('grid-row','3','important');warehouse.style.setProperty('margin-bottom','0','important');}
 const customerGrid=[...customers.children].find(el=>el.style?.display==='grid'||getComputedStyle(el).display==='grid');
 if(customerGrid){customerGrid.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');customerGrid.style.setProperty('gap','10px','important');}
 return true;
}
function injectResponsiveCss(){if(document.getElementById('orvuno-home-responsive-grid'))return;const st=document.createElement('style');st.id='orvuno-home-responsive-grid';st.textContent=`
@media(max-width:1250px){#world-home-dashboard{grid-template-columns:1fr!important}#world-home-dashboard>*{grid-column:1!important;grid-row:auto!important}#world-home-dashboard [data-world-home-warehouse]{grid-column:1!important;grid-row:auto!important}}
@media(max-width:760px){#world-home-dashboard div[style*="grid-template-columns: repeat(2"]{grid-template-columns:1fr!important}}
`;document.head.append(st);}
function applyHomeViewport(){
 const root=document.getElementById('world-home-dashboard');
 if(!root)return false;
 injectResponsiveCss();
 Object.assign(document.documentElement.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100%'});
 Object.assign(document.body.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100vh',maxHeight:'none'});
 Object.assign(root.style,{maxWidth:'1280px',width:'calc(100% - 28px)',boxSizing:'border-box',padding:'72px 14px 28px',fontSize:'14px',lineHeight:'1.35',minHeight:'100vh',height:'auto',maxHeight:'none',overflow:'visible'});
 for(const section of root.children){if(section.matches?.('section'))Object.assign(section.style,{marginBottom:'0'});}
 for(const h1 of root.querySelectorAll('h1'))Object.assign(h1.style,{fontSize:'26px',lineHeight:'1.15'});
 for(const h2 of root.querySelectorAll('h2'))Object.assign(h2.style,{fontSize:'20px',lineHeight:'1.2'});
 for(const button of root.querySelectorAll('button'))Object.assign(button.style,{padding:'7px 10px',minHeight:'34px'});
 applyWorkGrid(root);
 return true;
}
export function installHomeDashboardViewport(){
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 let scheduled=false;
 const run=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyHomeViewport();});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty','world:customer-order-updated'])window.addEventListener(ev,run);
 const observer=new MutationObserver(run);observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('resize',run);
 return true;
}
if(typeof window!=='undefined'){window.worldHomeDashboardViewport={apply:applyHomeViewport,install:installHomeDashboardViewport};installHomeDashboardViewport();}
