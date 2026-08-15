// ORVUNO – bessere Lesbarkeit und konsistentes Dark-Theme im Dialog „Meine Betriebe“.
// Bewusst als UI-Integration umgesetzt, damit die Spiellogik des Gewerbekatalogs unverändert bleibt.

const STYLE_ID='orvuno-business-portfolio-polish-style';

function installCss(){
 if(document.getElementById(STYLE_ID))return;
 const style=document.createElement('style');
 style.id=STYLE_ID;
 style.textContent=`
[data-orvuno-business-portfolio-polished="1"]{
  width:min(1240px,97vw)!important;
  background:#0b1524!important;
  color:#edf3fb!important;
  border:1px solid #32445f!important;
  box-shadow:0 24px 70px rgba(0,0,0,.58)!important;
}
[data-orvuno-business-portfolio-polished="1"] h2{font-size:26px!important;line-height:1.2!important}
[data-orvuno-business-portfolio-polished="1"] h3{font-size:19px!important;color:#f4f7fb!important}
[data-orvuno-business-portfolio-polished="1"] input,
[data-orvuno-business-portfolio-polished="1"] select{
  background:#101e31!important;
  color:#f3f6fb!important;
  border:1px solid #4a617f!important;
  font-size:15px!important;
  min-height:42px!important;
}
[data-orvuno-business-portfolio-polished="1"] input::placeholder{color:#9eacc0!important;opacity:1!important}
[data-orvuno-business-catalog="1"]{
  background:#0d1a2b!important;
  border:1px solid #3b4f6b!important;
  padding:16px!important;
  border-radius:12px!important;
}
[data-orvuno-business-catalog="1"]>[data-orvuno-catalog-title="1"]{
  font-size:20px!important;
  color:#f5f7fb!important;
  margin-bottom:10px!important;
}
[data-orvuno-business-catalog="1"] input{font-size:16px!important;padding:12px 14px!important}
[data-orvuno-business-catalog="1"] [data-orvuno-catalog-tabs="1"] button{
  font-size:14px!important;
  padding:9px 13px!important;
  min-height:40px!important;
  background:#14253b!important;
  color:#e9eff8!important;
  border:1px solid #48617f!important;
}
[data-orvuno-business-catalog="1"] [data-orvuno-catalog-grid="1"]{
  grid-template-columns:repeat(auto-fill,minmax(270px,1fr))!important;
  gap:12px!important;
  max-height:520px!important;
  padding:6px!important;
}
[data-orvuno-business-catalog="1"] [data-orvuno-catalog-grid="1"]>button{
  min-height:160px!important;
  padding:15px!important;
  background:#101e31!important;
  color:#f0f4fa!important;
  border:1px solid #435a78!important;
  border-radius:10px!important;
  line-height:1.4!important;
}
[data-orvuno-business-catalog="1"] [data-orvuno-catalog-grid="1"]>button strong{
  display:block!important;
  font-size:18px!important;
  line-height:1.25!important;
  margin-bottom:6px!important;
  color:#fff!important;
}
[data-orvuno-business-catalog="1"] [data-orvuno-catalog-grid="1"]>button div{
  font-size:13.5px!important;
  line-height:1.42!important;
  color:#c5d2e4!important;
}
[data-orvuno-business-catalog="1"] [data-orvuno-catalog-detail="1"]{
  background:#101e31!important;
  color:#e8eef7!important;
  border:1px solid #3c526f!important;
  font-size:14px!important;
  line-height:1.5!important;
  padding:13px!important;
}
[data-orvuno-dev-unlock-note="1"]{
  background:#2a2413!important;
  color:#f6e7a7!important;
  border:1px solid #806a24!important;
  box-shadow:none!important;
  font-size:14px!important;
  line-height:1.45!important;
}
@media(max-width:900px){
 [data-orvuno-business-catalog="1"] [data-orvuno-catalog-grid="1"]{grid-template-columns:1fr!important}
}
`;
 document.head.append(style);
}

function text(el){return (el?.textContent||'').trim();}

function polishPanel(panel){
 if(!panel||panel.dataset.orvunoBusinessPortfolioPolished==='1')return;
 panel.dataset.orvunoBusinessPortfolioPolished='1';
}

function polishCatalog(panel){
 const titles=[...panel.querySelectorAll('div')].filter(el=>/^Gewerbekatalog\s*·/.test(text(el)));
 for(const title of titles){
  const wrap=title.parentElement;
  if(!wrap)continue;
  wrap.dataset.orvunoBusinessCatalog='1';
  title.dataset.orvunoCatalogTitle='1';
  const children=[...wrap.children];
  const tabs=children.find(el=>el.tagName==='DIV'&&[...el.querySelectorAll(':scope > button')].length>=3);
  if(tabs)tabs.dataset.orvunoCatalogTabs='1';
  const grid=children.find(el=>el.tagName==='DIV'&&el.style.display==='grid');
  if(grid)grid.dataset.orvunoCatalogGrid='1';
  const detail=children.find(el=>el!==grid&&el!==tabs&&el.tagName==='DIV'&&/^Ausgewählt:/.test(text(el)));
  if(detail)detail.dataset.orvunoCatalogDetail='1';
 }
}

function polishDevNote(panel){
 for(const el of panel.querySelectorAll('div')){
  if(text(el).startsWith('🧪 Entwicklungsfreigabe aktiv:'))el.dataset.orvunoDevUnlockNote='1';
 }
}

function apply(){
 installCss();
 for(const h2 of document.querySelectorAll('h2')){
  if(!text(h2).includes('Meine Betriebe'))continue;
  const panel=h2.parentElement?.parentElement;
  if(!panel)continue;
  polishPanel(panel);
  polishCatalog(panel);
  polishDevNote(panel);
 }
}

export function installBusinessPortfolioVisualPolish(){
 if(typeof document==='undefined')return false;
 let queued=false;
 const run=()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply();});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
 return true;
}

if(typeof window!=='undefined')installBusinessPortfolioVisualPolish();
