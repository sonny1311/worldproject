// ORVUNO – stabile linke Hauptnavigation.
// Die Sidebar wird von mehreren Dashboard-Renderzyklen umgeben. Dadurch kann ein Button
// zwischen pointerdown und click ersetzt werden; dann erzeugt der Browser keinen normalen Click.
// Wir fuehren die vorhandene onclick-Aktion bereits beim pointerdown aus und unterdruecken den
// unmittelbar folgenden Doppel-Click. Ausserdem bleibt die Sidebar ueber Arbeitsfenstern klickbar.

let lastHandledAt=0;
let lastHandledLabel='';

function navButtonFrom(target){
  return target?.closest?.('#orvuno-side-nav button')||null;
}

function hardenSidebar(){
  const nav=document.getElementById('orvuno-side-nav');
  if(!nav)return false;
  Object.assign(nav.style,{pointerEvents:'auto',zIndex:'70010'});
  for(const button of nav.querySelectorAll('button')){
    button.style.pointerEvents='auto';
    button.disabled=false;
  }
  return true;
}

function install(){
  if(window.__orvunoSideNavigationStabilityInstalled)return;
  window.__orvunoSideNavigationStabilityInstalled=true;

  const harden=()=>requestAnimationFrame(hardenSidebar);
  hardenSidebar();
  for(const eventName of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty']){
    window.addEventListener(eventName,harden);
  }

  new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes?.length||m.removedNodes?.length))harden();
  }).observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const button=navButtonFrom(event.target);
    if(!button||typeof button.onclick!=='function')return;
    const label=(button.textContent||'').trim();
    lastHandledAt=performance.now();
    lastHandledLabel=label;
    event.preventDefault();
    event.stopImmediatePropagation();
    try{
      button.onclick.call(button,event);
    }catch(error){
      console.error(`ORVUNO Sidebar '${label}' konnte nicht geoeffnet werden`,error);
    }
  },true);

  document.addEventListener('click',event=>{
    const button=navButtonFrom(event.target);
    if(!button)return;
    const label=(button.textContent||'').trim();
    if(performance.now()-lastHandledAt<900&&label===lastHandledLabel){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);
}

if(typeof window!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}

export function runSideNavigationStabilityTest(){
  return typeof hardenSidebar==='function'&&typeof navButtonFrom==='function';
}
