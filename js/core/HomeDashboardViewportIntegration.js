// WorldProject – Startseite als stabiles, kompaktes Arbeitsraster.
function headingOf(el){return String(el?.querySelector?.('h2')?.textContent||el?.querySelector?.('h1')?.textContent||el?.textContent||'').trim();}
function isSpacer(el){return el?.tagName==='DIV'&&el.children.length===0&&(el.style.height==='14px'||el.style.height==='9px');}
function findInitial(root,pattern){return [...root.querySelectorAll(':scope > *, :scope > * > *')].find(el=>pattern.test(headingOf(el)))||null;}
function locate(root,role,pattern){return root.querySelector(`[data-orvuno-home-role="${role}"]`)||findInitial(root,pattern);}
function customerGridOf(customers){return [...customers.children].find(el=>{try{return el.style?.display==='grid'||getComputedStyle(el).display==='grid';}catch{return false;}})||null;}
function safeMove(parent,el){if(!parent||!el||parent===el||el.contains(parent))return false;if(el.parentElement!==parent)parent.append(el);return true;}
function ensureBoard(root,title,customers,timed,warehouse,production){
 let board=root.querySelector(':scope > [data-orvuno-workboard]');
 if(!board){board=document.createElement('div');board.dataset.orvunoWorkboard='1';if(title?.nextSibling)root.insertBefore(board,title.nextSibling);else root.append(board);}
 let side=board.querySelector(':scope > [data-orvuno-home-side]');
 if(!side){side=document.createElement('div');side.dataset.orvunoHomeSide='1';board.append(side);}
 customers.dataset.orvunoHomeRole='customers';timed.dataset.orvunoHomeRole='timed';production.dataset.orvunoHomeRole='production';if(warehouse)warehouse.dataset.orvunoHomeRole='warehouse';
 safeMove(board,customers);if(warehouse)safeMove(board,warehouse);safeMove(side,timed);safeMove(side,production);safeMove(board,side);
 for(const old of [...board.children])if((old.dataset?.orvunoWorkLeft==='1'||old.dataset?.orvunoWorkRight==='1')&&old.children.length===0)old.remove();
 return{board,side};
}
function applyWorkGrid(root){
 const title=[...root.children].find(el=>el.matches?.('section')&&el.querySelector('h1'))||root.firstElementChild;
 const customers=locate(root,'customers',/^📦?\s*Kundenaufträge|Kundenaufträge/i);
 const timed=locate(root,'timed',/Läuft gerade|Laufende Vorgänge/i);
 const production=locate(root,'production',/^🏭?\s*Produktion|Produktion/i);
 const warehouse=root.querySelector('[data-orvuno-home-role="warehouse"],[data-world-home-warehouse]')||findInitial(root,/^🏬?\s*Lager/i);
 if(!customers||!timed||!production)return false;
 for(const el of [...root.children])if(isSpacer(el))el.remove();
 const {board,side}=ensureBoard(root,title,customers,timed,warehouse,production);
 root.style.setProperty('display','block','important');
 if(title)title.style.setProperty('margin-bottom','8px','important');
 Object.assign(board.style,{display:'grid',gridTemplateColumns:'minmax(0,1.55fr) minmax(300px,1fr)',gap:'8px',alignItems:'start',alignContent:'start'});
 customers.style.setProperty('grid-column','1 / -1','important');
 customers.style.setProperty('grid-row','1','important');
 if(warehouse){warehouse.style.setProperty('grid-column','1','important');warehouse.style.setProperty('grid-row','2','important');}
 Object.assign(side.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:'8px',alignContent:'start',minWidth:'0',gridColumn:'2',gridRow:'2',margin:'0',padding:'0'});
 for(const el of [customers,timed,production,warehouse])if(el){el.style.setProperty('margin','0','important');el.style.setProperty('min-width','0','important');el.style.setProperty('align-self','start','important');}
 const customerGrid=customerGridOf(customers);
 if(customerGrid){customerGrid.dataset.orvunoCustomerGrid='1';customerGrid.style.setProperty('display','grid','important');customerGrid.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');customerGrid.style.setProperty('gap','8px','important');customerGrid.style.setProperty('align-items','stretch','important');for(const card of customerGrid.children){card.style.setProperty('min-width','0','important');card.style.setProperty('width','auto','important');}}
 return true;
}
function injectResponsiveCss(){let st=document.getElementById('orvuno-home-responsive-grid');if(!st){st=document.createElement('style');st.id='orvuno-home-responsive-grid';document.head.append(st);}st.textContent=`
#world-home-dashboard [data-orvuno-workboard]{width:100%;margin:0!important}
#world-home-dashboard [data-orvuno-home-side]{margin:0!important;padding:0!important}
#world-home-dashboard [data-orvuno-customer-grid]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
@media(max-width:940px){
 #world-home-dashboard [data-orvuno-workboard]{grid-template-columns:1fr!important}
 #world-home-dashboard [data-orvuno-home-role="customers"],#world-home-dashboard [data-orvuno-home-role="warehouse"],#world-home-dashboard [data-orvuno-home-side]{grid-column:1!important;grid-row:auto!important}
}
@media(max-width:680px){#world-home-dashboard [data-orvuno-customer-grid]{grid-template-columns:1fr!important}}
`;}
let applying=false;
function applyHomeViewport(){
 if(applying)return false;
 const root=document.getElementById('world-home-dashboard');if(!root)return false;
 applying=true;
 try{
  injectResponsiveCss();
  Object.assign(document.documentElement.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100%'});
  Object.assign(document.body.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100vh',maxHeight:'none'});
  Object.assign(root.style,{maxWidth:'1280px',width:'calc(100% - 28px)',boxSizing:'border-box',padding:'64px 14px 18px',fontSize:'14px',lineHeight:'1.35',minHeight:'0',height:'auto',maxHeight:'none',overflow:'visible'});
  for(const h1 of root.querySelectorAll('h1'))Object.assign(h1.style,{fontSize:'26px',lineHeight:'1.15'});
  for(const h2 of root.querySelectorAll('h2'))Object.assign(h2.style,{fontSize:'20px',lineHeight:'1.2'});
  for(const button of root.querySelectorAll('button'))Object.assign(button.style,{padding:'7px 10px',minHeight:'34px'});
  applyWorkGrid(root);return true;
 }finally{applying=false;}
}
export function installHomeDashboardViewport(){
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 let scheduled=false;const run=()=>{if(scheduled||applying)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyHomeViewport();});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty','world:customer-order-updated'])window.addEventListener(ev,run);
 const observer=new MutationObserver(mutations=>{if(applying)return;const relevant=mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&!n.closest?.('[data-orvuno-workboard]')));if(relevant)run();});observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('resize',run);return true;
}
if(typeof window!=='undefined'){window.worldHomeDashboardViewport={apply:applyHomeViewport,install:installHomeDashboardViewport};installHomeDashboardViewport();}
