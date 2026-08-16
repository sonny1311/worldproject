// WorldProject – visuelle Nachbearbeitung der Ausbauansicht ohne die bestehende Baulogik zu duplizieren.
import { UniversalOperationsDialog } from './UniversalOperationsDialog.js';

const STYLE_ID='world-expansion-visual-polish';
function ensureStyles(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 #world-universal-ops[data-expansion-polished="1"] [data-body]{background:linear-gradient(180deg,#0b1220 0%,#101827 100%);padding:20px 22px!important}
 #world-universal-ops[data-expansion-polished="1"] [data-body]>h2{font-size:24px!important;letter-spacing:-.02em;margin:0 0 5px!important;color:#f8fafc}
 #world-universal-ops[data-expansion-polished="1"] button{border:1px solid #475569;border-radius:9px;padding:9px 13px;background:#1e293b;color:#f8fafc;font-weight:800;cursor:pointer;transition:background .15s,border-color .15s,transform .15s;min-height:38px}
 #world-universal-ops[data-expansion-polished="1"] button:hover:not(:disabled){background:#334155;border-color:#64748b;transform:translateY(-1px)}
 #world-universal-ops[data-expansion-polished="1"] button:disabled{opacity:.48;cursor:not-allowed;transform:none}
 #world-universal-ops[data-expansion-polished="1"] article[data-world-building-card]{padding:18px!important;border-radius:14px!important;background:linear-gradient(145deg,#121c2d,#0b1321)!important;box-shadow:0 12px 28px rgba(0,0,0,.22)!important;overflow:hidden}
 #world-universal-ops[data-expansion-polished="1"] article[data-world-building-card] [data-world-building-actions]{padding-top:12px;border-top:1px solid #263244;margin-top:15px!important}
 #world-universal-ops[data-expansion-polished="1"] article[data-world-building-card] [data-world-material-grid]{grid-template-columns:repeat(auto-fit,minmax(175px,1fr))!important;gap:9px!important}
 #world-universal-ops[data-expansion-polished="1"] article[data-world-building-card] [data-world-material-grid]>div{padding:10px!important;border-radius:10px!important;background:#0a1220!important}
 #world-universal-ops[data-expansion-polished="1"] [data-world-expansion-section-title]{padding:0 2px;margin-top:24px!important}
 #world-universal-ops[data-expansion-polished="1"] [data-world-land-card]{padding:16px!important;border-radius:13px!important;background:linear-gradient(135deg,#172033,#111827)!important;box-shadow:0 8px 20px rgba(0,0,0,.16)}
 #world-universal-ops[data-expansion-polished="1"] [data-world-land-card] button{margin-top:6px;background:#24334a}
 #world-universal-ops[data-expansion-polished="1"] [data-world-running-site]{border-radius:11px!important;background:#111b2a!important}
 #world-universal-ops[data-expansion-polished="1"] [data-world-existing-building]{border-bottom:0!important;border:1px solid #263244;border-radius:9px;margin:6px 0;background:#0c1523}
 @media(max-width:760px){#world-universal-ops[data-expansion-polished="1"] [data-body]{padding:14px!important}#world-universal-ops[data-expansion-polished="1"] button{width:100%}}
 `;document.head.append(s);
}
function polish(root){
 if(!root)return;ensureStyles();root.dataset.expansionPolished='1';const body=root.querySelector('[data-body]');if(!body)return;
 [...body.querySelectorAll('article')].forEach(a=>a.dataset.worldBuildingCard='1');
 [...body.querySelectorAll('div')].forEach(d=>{
  const t=(d.textContent||'').trim();
  if(d.children.length<=2&&/^🌍 Grundstück erweitern/.test(t))d.dataset.worldLandCard='1';
  if(d.firstElementChild?.textContent?.trim()==='Material auf der Baustelle')d.firstElementChild.innerHTML='📦 Material auf der Baustelle';
  if(d.style?.display==='grid'&&d.parentElement?.dataset?.worldBuildingCard)d.dataset.worldMaterialGrid='1';
  if(d.style?.display==='flex'&&d.parentElement?.dataset?.worldBuildingCard&&[...d.querySelectorAll('button')].length)d.dataset.worldBuildingActions='1';
  if(/^🏗️ Gebäude/.test(t)||/^🚧 Laufende Baustellen/.test(t)||/^🏢 Vorhandene Gebäude/.test(t)||/^⚙️ Maschinen einzeln ausbauen/.test(t))d.dataset.worldExpansionSectionTitle='1';
  if(d.querySelector(':scope > button')&&/Zeit verkürzen/.test(t))d.dataset.worldRunningSite='1';
  if(d.style?.justifyContent==='space-between'&&/m²/.test(t)&&(/fertig/.test(t)||/🏗️/.test(t)))d.dataset.worldExistingBuilding='1';
 });
 // Lange Materialknöpfe lesbarer machen, ohne ihre Funktion zu ändern.
 for(const b of body.querySelectorAll('article button')){
  const txt=(b.textContent||'').trim();
  if(/^\+\s/.test(txt)&&/liefern$/.test(txt)){b.textContent='📦 '+txt.replace(/^\+\s*/,'').replace(/ liefern$/,' beschaffen');b.title='Benötigtes Baumaterial direkt zur Baustelle liefern';}
  if(/Ausbaustufe .* bauen/.test(txt)){b.style.background='#14532d';b.style.borderColor='#16a34a';}
 }
}
const proto=UniversalOperationsDialog.prototype;
if(!proto.__worldExpansionVisualPolish){
 proto.__worldExpansionVisualPolish=true;
 const original=proto.render;
 proto.render=function(...args){const result=original.apply(this,args);if(this.tab==='expansion'){polish(this.root);requestAnimationFrame(()=>polish(this.root));}else if(this.root)delete this.root.dataset.expansionPolished;return result;};
}
if(typeof window!=='undefined')window.worldExpansionVisualPolish={polish};
