// WorldProject – Startseite ohne separaten Fremdspedition-/Transportkosten-Kasten.
// Die eigentliche Transportberechnung beim Ausliefern bleibt unverändert erhalten.

function cleanup(){
 if(typeof document==='undefined')return false;
 const boxes=[...document.querySelectorAll('[data-world-customer-freight-preview]')];
 boxes.forEach(box=>box.remove());
 return boxes.length>0;
}

function install(){
 if(typeof document==='undefined')return;
 const run=()=>setTimeout(cleanup,0);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
 for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated','world:game-state-dirty','world:customer-order-updated'])window.addEventListener(ev,run);
}

install();
if(typeof window!=='undefined')window.worldCustomerOrderFreightPreview={apply:cleanup,cleanup};

export {cleanup};
