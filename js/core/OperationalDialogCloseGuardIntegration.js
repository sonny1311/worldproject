// WorldProject – Sicherheitswache fuer den Einkaufs-/Lager-/Produktionsdialog.
// Der Dialog besitzt bereits sein eigenes X im Kopfbereich. Hier wird nur verhindert,
// dass ein alter zusaetzlicher "X Schliessen"-Button stehen bleibt. Escape schliesst ebenfalls.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const proto=OperationalSupplyChainDialog.prototype;
function installCloseGuard(dialog){
 const overlay=dialog?.overlay;if(!overlay)return false;
 overlay.style.zIndex='90000';
 // Fruehere Versionen erzeugten hier einen zweiten festen Schliessen-Button.
 // Diesen konsequent entfernen; das normale X des Dialogkopfs bleibt die einzige Schliessaktion.
 overlay.querySelectorAll('[data-world-operational-fixed-close]').forEach(node=>node.remove());
 const panel=overlay.firstElementChild;
 if(panel){panel.style.position='relative';panel.style.marginTop='0';panel.style.maxHeight='94vh';}
 const head=panel?.firstElementChild;
 const close=head?[...head.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='✕'):null;
 if(close)Object.assign(close.style,{position:'relative',zIndex:'2147483647',fontSize:'18px',minWidth:'42px',minHeight:'42px',pointerEvents:'auto'});
 return true;
}
if(!proto.__worldOperationalCloseGuard){
 proto.__worldOperationalCloseGuard=true;
 const originalOpen=proto.open;
 proto.open=async function(...args){const result=await originalOpen.apply(this,args);installCloseGuard(this);requestAnimationFrame(()=>installCloseGuard(this));return result;};
 const originalRender=proto.render;
 proto.render=function(...args){const result=originalRender.apply(this,args);installCloseGuard(this);requestAnimationFrame(()=>installCloseGuard(this));return result;};
}
if(typeof window!=='undefined'&&!window.__worldOperationalEscapeClose){
 window.__worldOperationalEscapeClose=true;
 window.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const dialog=window.worldOperationalSupplyChainDialog;if(dialog?.overlay){e.preventDefault();dialog.close();}});
}
export function runOperationalDialogCloseGuardTest(){return typeof installCloseGuard==='function'&&proto.__worldOperationalCloseGuard===true;}
