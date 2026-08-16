// WorldProject – Startseite kompakt und normal scrollbar.
function headingOf(el){return String(el?.querySelector?.('h2')?.textContent||el?.querySelector?.('h1')?.textContent||el?.textContent||'').trim();}
function isSpacer(el){return el?.tagName==='DIV'&&el.children.length===0&&(el.style.height==='14px'||el.style.height==='9px');}
function findAnywhere(root,pattern){return [...root.querySelectorAll(':scope > *, :scope > * > *')].find(el=>pattern.test(headingOf(el)))||null;}
function customerGridOf(customers){return [...customers.children].find(el=>{try{return el.style?.display==='grid'||getComputedStyle(el).display==='grid';}catch{return false;}})||null;}
function ensureBoard(root,title,customers,timed,warehouse,production){let board=root.querySelector(':scope > [data-orvuno-workboard]');if(!board){board=document.createElement('div');board.dataset.orvunoWorkboard='1';const left=document.createElement('div'),right=document.createElement('div');left.dataset.orvunoWorkLeft='1';right.dataset.orvunoWorkRight='1';board.append(left,right);if(title?.nextSibling)root.insertBefore(board,title.nextSibling);else root.append(board);}const left=board.querySelector('[data-orvuno-work-left]'),right=board.querySelector('[data-orvuno-work-right]');for(const el of [customers,warehouse])if(el&&el.parentElement!==left)left.append(el);for(const el of [timed,production])if(el&&el.parentElement!==right)right.append(el);return{board,left,right};}
function applyWorkGrid(root){
 const title=[...root.children].find(el=>el.matches?.('section')&&el.querySelector('h1'))||root.firstElementChild;
 const customers=findAnywhere(root,/^📦?\s*Kundenaufträge|Kundenaufträge/i);
 const timed=findAnywhere(root,/Läuft gerade|Laufende Vorgänge/i);
 const production=findAnywhere(root,/^🏭?\s*Produktion|Produktion/i);
 const warehouse=[...root.querySelectorAll('[data-world-home-warehouse], :scope > *, :scope > * > *')].find(el=>el.dataset?.worldHomeWarehouse==='1'||/^🏬?\s*Lager/i.test(headingOf(el)))||null;
 if(!customers||!timed||!production)return false;
 for(const el of [...root.children])if(isSpacer(el))el.style.display='none';
 const {board,left,right}=ensureBoard(root,title,customers,timed,warehouse,production);
 root.style.setProperty('display','block','important');
 if(title)title.style.setProperty('margin-bottom','12px','important');
 Object.assign(board.style,{display:'grid',gridTemplateColumns:'minmax(0,1.62fr) minmax(290px,1fr)',gap:'12px',alignItems:'start'});
 Object.assign(left.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:'12px',alignContent:'start',minWidth:'0'});
 Object.assign(right.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:'12px',alignContent:'start',minWidth:'0'});
 for(const el of [customers,timed,production,warehouse])if(el){el.style.setProperty('margin','0','important');el.style.setProperty('min-width','0','important');el.style.removeProperty('grid-row');el.style.removeProperty('grid-column');}
 const customerGrid=customerGridOf(customers);
 if(customerGrid){customerGrid.dataset.orvunoCustomerGrid='1';customerGrid.style.setProperty('display','grid','important');customerGrid.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');customerGrid.style.setProperty('gap','10px','important');customerGrid.style.setProperty('align-items','stretch','important');for(const card of customerGrid.children){card.style.setProperty('min-width','0','important');card.style.setProperty('width','auto','important');}}
 return true;
}
function injectResponsiveCss(){let st=document.getElementById('orvuno-home-responsive-grid');if(!st){st=document.createElement('style');st.id='orvuno-home-responsive-grid';document.head.append(st);}st.textContent=`
#world-home-dashboard [data-orvuno-workboard]{width:100%}
#world-home-dashboard [data-orvuno-customer-grid]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
@media(max-width:940px){#world-home-dashboard [data-orvuno-workboard]{grid-template-columns:1fr!important}}
@media(max-width:680px){#world-home-dashboard [data-orvuno-customer-grid]{grid-template-columns:1fr!important}}
`;}
function applyHomeViewport(){
 const root=document.getElementById('world-home-dashboard');
 if(!root)return false;
 injectResponsiveCss();
 Object.assign(document.documentElement.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100%'});
 Object.assign(document.body.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100vh',maxHeight:'none'});
 Object.assign(root.style,{maxWidth:'1280px',width:'calc(100% - 28px)',boxSizing:'border-box',padding:'72px 14px 28px',fontSize:'14px',lineHeight:'1.35',minHeight:'100vh',height:'auto',maxHeight:'none',overflow:'visible'});
 for(const section of root.querySelectorAll(':scope > section, [data-orvuno-workboard] > div > section'))Object.assign(section.style,{marginBottom:'0'});
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
