// WorldProject – Sicherheitswache fuer den Einkaufs-/Lager-/Produktionsdialog.
// Das Schliessen-X bleibt unterhalb der festen Spielleiste sichtbar; Escape schliesst ebenfalls.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const proto=OperationalSupplyChainDialog.prototype;
function installCloseGuard(dialog){
 const overlay=dialog?.overlay;if(!overlay)return false;
 overlay.style.zIndex='90000';
 let close=overlay.querySelector('[data-world-operational-fixed-close]');
 if(!close){
  close=document.createElement('button');
  close.type='button';close.dataset.worldOperationalFixedClose='1';close.textContent='✕ Schließen';close.title='Schließen';close.setAttribute('aria-label','Dialog schließen');
  Object.assign(close.style,{position:'fixed',top:'122px',right:'24px',zIndex:'2147483647',minWidth:'126px',height:'42px',display:'grid',placeItems:'center',padding:'0 14px',border:'2px solid rgba(255,255,255,.85)',borderRadius:'10px',background:'#991b1b',color:'#fff',fontSize:'16px',fontWeight:'900',lineHeight:'1',cursor:'pointer',boxShadow:'0 5px 20px rgba(0,0,0,.65)',pointerEvents:'auto'});
  close.onclick=e=>{e.preventDefault();e.stopPropagation();dialog.close();};overlay.append(close);
 }
 const panel=[...overlay.children].find(x=>x!==close);if(panel){panel.style.position='relative';panel.style.marginTop='58px';panel.style.maxHeight='calc(94vh - 58px)';}
 return true;
}
if(!proto.__worldOperationalCloseGuard){
 proto.__worldOperationalCloseGuard=true;
 const originalOpen=proto.open;
 proto.open=async function(...args){const result=await originalOpen.apply(this,args);installCloseGuard(this);requestAnimationFrame(()=>installCloseGuard(this));return result;};
 const originalRender=proto.render;
 proto.render=function(...args){const result=originalRender.apply(this,args);installCloseGuard(this);return result;};
}
if(typeof window!=='undefined'&&!window.__worldOperationalEscapeClose){
 window.__worldOperationalEscapeClose=true;
 window.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const dialog=window.worldOperationalSupplyChainDialog;if(dialog?.overlay){e.preventDefault();dialog.close();}});
}
export function runOperationalDialogCloseGuardTest(){return typeof installCloseGuard==='function'&&proto.__worldOperationalCloseGuard===true;}
