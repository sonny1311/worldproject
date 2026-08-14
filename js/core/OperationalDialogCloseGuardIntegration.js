// WorldProject – Sicherheitswache fuer den Einkaufs-/Lager-/Produktionsdialog.
// Das Schliessen-X bleibt immer ueber allen Balken sichtbar; Escape schliesst ebenfalls.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const proto=OperationalSupplyChainDialog.prototype;
function installCloseGuard(dialog){
 const overlay=dialog?.overlay;if(!overlay)return false;
 let close=overlay.querySelector('[data-world-operational-fixed-close]');
 if(!close){
  close=document.createElement('button');
  close.type='button';close.dataset.worldOperationalFixedClose='1';close.textContent='✕';close.title='Schließen';close.setAttribute('aria-label','Dialog schließen');
  Object.assign(close.style,{position:'fixed',top:'14px',right:'18px',zIndex:'2147483647',width:'46px',height:'46px',display:'grid',placeItems:'center',padding:'0',border:'2px solid rgba(255,255,255,.8)',borderRadius:'50%',background:'#111827',color:'#fff',fontSize:'25px',fontWeight:'900',lineHeight:'1',cursor:'pointer',boxShadow:'0 4px 18px rgba(0,0,0,.55)',pointerEvents:'auto'});
  close.onclick=e=>{e.preventDefault();e.stopPropagation();dialog.close();};overlay.append(close);
 }
 const panel=overlay.firstElementChild;if(panel&&panel!==close){panel.style.position='relative';panel.style.paddingTop='64px';}
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
