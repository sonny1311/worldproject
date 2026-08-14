// WorldProject – Bauzeiten laufen unabhängig davon weiter, welcher Dialog geöffnet ist.
import { advanceExpansion } from './LandConstructionExpansionSystem.js';
import { advanceWarehouseExpansion } from './WarehouseConstructionExpansionSystem.js';

const company=()=>window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;
function toast(text){if(typeof document==='undefined')return;const t=document.createElement('div');t.textContent=text;Object.assign(t.style,{position:'fixed',right:'18px',bottom:'18px',zIndex:55000,background:'#1f6f43',color:'#fff',padding:'11px 14px',borderRadius:'9px',fontWeight:'800',boxShadow:'0 5px 18px rgba(0,0,0,.35)'});document.body.append(t);setTimeout(()=>t.remove(),5000);}
export function advanceAllConstruction(now=Date.now()){
 const c=company();if(!c)return{finished:[]};const a=advanceExpansion(c,{now}),w=advanceWarehouseExpansion(c,{now}),finished=[...a,...w];
 if(finished.length){window.dispatchEvent(new CustomEvent('world:game-state-dirty'));window.dispatchEvent(new CustomEvent('world:construction-completed',{detail:{company:c,finished}}));for(const j of finished)toast(`✅ Fertig: ${j.label||j.kind}`);}
 return{finished};
}
let timer=null;export function startConstructionRuntime(){if(timer)return timer;timer=setInterval(()=>advanceAllConstruction(Date.now()),15000);return timer;}
export function stopConstructionRuntime(){if(timer){clearInterval(timer);timer=null;}}
if(typeof window!=='undefined'){window.worldConstructionRuntime={advance:advanceAllConstruction,start:startConstructionRuntime,stop:stopConstructionRuntime};for(const ev of ['worldproject:company-activated','worldproject:company-switched'])window.addEventListener(ev,()=>{advanceAllConstruction();startConstructionRuntime();});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startConstructionRuntime);else startConstructionRuntime();}
