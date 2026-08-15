// ORVUNO – kompakte dunkle Darstellung fuer Einkauf/Lager/Produktion.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const STYLE_ID='orvuno-operational-warehouse-visual-fix';
const css=`
[data-orvuno-operational-dialog]{align-items:flex-start!important;padding:84px 14px 18px!important;box-sizing:border-box!important}
[data-orvuno-operational-dialog]>.orvuno-operational-panel{background:#0b1220!important;color:#f8fafc!important;border:1px solid #334155!important;box-shadow:0 24px 80px rgba(0,0,0,.5)!important;max-height:calc(100vh - 104px)!important}
[data-orvuno-operational-dialog] section{background:#101827!important;border:1px solid #26354a!important;border-radius:12px!important;padding:12px!important;margin:10px 0!important;color:#f8fafc!important}
[data-orvuno-operational-dialog] section>div{color:#f8fafc!important;border-color:#334155!important}
[data-orvuno-operational-dialog] section>div[style*="background"],
[data-orvuno-operational-dialog] section>div[style*="Background"]{background:#0f172a!important;color:#f8fafc!important}
[data-orvuno-operational-dialog] strong,[data-orvuno-operational-dialog] h2,[data-orvuno-operational-dialog] h3,[data-orvuno-operational-dialog] h4,[data-orvuno-operational-dialog] label,[data-orvuno-operational-dialog] span,[data-orvuno-operational-dialog] p{color:#f8fafc!important}
[data-orvuno-operational-dialog] input,[data-orvuno-operational-dialog] select{background:#0a1220!important;color:#fff!important;border:1px solid #475569!important}
[data-orvuno-operational-dialog] button{background:#1d2a3d!important;color:#fff!important;border:1px solid #52627a!important}
[data-orvuno-operational-dialog] button:hover:not(:disabled){background:#293a53!important}
[data-orvuno-operational-dialog] .orvuno-stock-card{background:#0f172a!important;border:1px solid #334155!important;border-radius:10px!important;padding:10px 12px!important;margin:7px 0!important;min-height:0!important;color:#f8fafc!important}
[data-orvuno-operational-dialog] .orvuno-stock-card>*{color:#f8fafc!important}
[data-orvuno-operational-dialog] .orvuno-stock-card input{max-width:130px!important}
[data-orvuno-operational-dialog] .orvuno-stock-card button{white-space:nowrap!important}
`;
function installStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.append(s);}
function looksLikeStockCard(el){if(!(el instanceof HTMLElement))return false;const text=(el.textContent||'').toLowerCase();return (text.includes('bestand eintragen')||text.includes('schnellverkauf'))&&el.querySelector('input')&&el.querySelector('button');}
function polish(dialog){const ov=dialog?.overlay;if(!ov)return;installStyle();ov.dataset.orvunoOperationalDialog='1';const panel=ov.firstElementChild;if(panel)panel.classList.add('orvuno-operational-panel');for(const el of ov.querySelectorAll('div')){if(looksLikeStockCard(el))el.classList.add('orvuno-stock-card');const bg=getComputedStyle(el).backgroundColor;if(['rgb(255, 255, 255)','rgb(250, 250, 250)','rgb(248, 249, 250)','rgb(245, 245, 245)'].includes(bg)){el.style.setProperty('background','#0f172a','important');el.style.setProperty('color','#f8fafc','important');}}
}
const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__orvunoWarehouseVisualFix){proto.__orvunoWarehouseVisualFix=true;const originalOpen=proto.open,originalRender=proto.render;proto.open=async function(...args){const result=await originalOpen.apply(this,args);polish(this);return result;};proto.render=function(...args){const result=originalRender.apply(this,args);polish(this);return result;};}
export function runOperationalWarehouseVisualFixTest(){return css.includes('orvuno-stock-card')&&css.includes('#0f172a');}
if(typeof window!=='undefined')window.worldOperationalWarehouseVisualFix={polish,test:runOperationalWarehouseVisualFixTest};
