// WorldProject – Startseite ohne separaten Fremdspedition-/Transportkosten-Kasten.
// Die eigentliche Transportberechnung beim Ausliefern bleibt unverändert erhalten.

const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();

function isStandaloneFreightBox(el,root){
 if(!el||el===root||!root?.contains(el))return false;
 if(el.matches?.('[data-world-customer-freight-preview]'))return true;

 // Alte Versionen hatten den Kasten teilweise ohne data-Attribut erzeugt.
 // Nur eigenständige Karten/Sections mit eindeutiger Fracht-Überschrift entfernen;
 // Kundenauftragskarten selbst bleiben unangetastet.
 const heading=el.querySelector?.(':scope > h2, :scope > h3, :scope > strong, :scope > b');
 const title=norm(heading?.textContent);
 const body=norm(el.textContent);
 const freightTitle=title.includes('fremdspedition')||title.includes('fremdfracht')||title.includes('transportkosten');
 const looksLikeFreightOnly=freightTitle&&!body.includes('kundenauftrag')&&!body.includes('produktion');
 return looksLikeFreightOnly;
}

function cleanup(){
 if(typeof document==='undefined')return false;
 const root=document.getElementById('world-home-dashboard');
 if(!root)return false;
 const candidates=new Set([
  ...root.querySelectorAll('[data-world-customer-freight-preview]'),
  ...root.querySelectorAll(':scope > section, :scope > div, :scope > [data-orvuno-home-workgrid] > section, :scope > [data-orvuno-home-workgrid] > div')
 ]);
 let removed=0;
 for(const box of candidates){if(isStandaloneFreightBox(box,root)){box.remove();removed++;}}
 return removed>0;
}

function install(){
 if(typeof document==='undefined')return;
 let queued=false;
 const run=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;cleanup();});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
 for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated','world:game-state-dirty','world:customer-order-updated'])window.addEventListener(ev,run);
 new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
}

install();
if(typeof window!=='undefined')window.worldCustomerOrderFreightPreview={apply:cleanup,cleanup};

export {cleanup};
