// ORVUNO – entfernt den alten manuellen Produktkosten-/Deckungsbeitragsrechner aus der Spieleroberfläche.
// Die echten automatischen Kosten-, Buchungs- und Wirtschaftssysteme bleiben unverändert.

const TITLE='Produktkosten | Deckungsbeitrag';
const MARKERS=['Produktionsmenge','Gesamtumsatz','Rohstoffkosten','Verpackungskosten','Energiekosten','Personalkosten','Maschinenkosten','Transportkosten'];
const MACHINE_MARKERS=['Probelauf','Warten','Reparieren'];

function text(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim();}
function markerCount(el){const value=text(el);return MARKERS.reduce((n,m)=>n+(value.includes(m)?1:0),0);}
function containsMachineControls(el){const value=text(el);return MACHINE_MARKERS.some(m=>value.includes(m));}

function removeCalculatorFromHeading(heading){
 if(!heading?.isConnected)return false;

 // Bevorzugt einen echten semantischen Container entfernen, falls der Alt-Dialog einen besitzt.
 const semantic=heading.closest('section,fieldset,article,[data-product-cost-calculator],[data-cost-calculator]');
 if(semantic&&markerCount(semantic)>=4&&!containsMachineControls(semantic)){
  semantic.remove();
  return true;
 }

 // Kleinsten gemeinsamen Alt-Container suchen, ohne den Maschinenbereich mit zu löschen.
 let candidate=heading.parentElement;
 for(let depth=0;candidate&&depth<5;depth++,candidate=candidate.parentElement){
  if(markerCount(candidate)>=4&&!containsMachineControls(candidate)){
   candidate.remove();
   return true;
  }
 }

 // Fallback für sehr alte flache Dialoge: ab der Überschrift nur den darunterliegenden Rechner entfernen.
 // Das ist absichtlich auf das Ende des Containers begrenzt und stoppt vor einer neuen Hauptüberschrift.
 let node=heading;
 while(node){
  const next=node.nextElementSibling;
  node.remove();
  if(!next)break;
  const nextText=text(next);
  if(/^H[1-4]$/.test(next.tagName)&&!nextText.includes('Produktkosten')&&!MARKERS.some(m=>nextText.includes(m)))break;
  node=next;
 }
 return true;
}

export function removeManualProductCostCalculator(root=document){
 if(typeof document==='undefined'||!root?.querySelectorAll)return 0;
 const matches=[...root.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,div')].filter(el=>{
  if(el.childElementCount>0)return false;
  const value=text(el);
  return value===TITLE||(value.includes('Produktkosten')&&value.includes('Deckungsbeitrag'));
 });
 let removed=0;
 for(const heading of matches)if(removeCalculatorFromHeading(heading))removed++;
 return removed;
}

export function installManualProductCostCalculatorCleanup(){
 if(typeof document==='undefined')return false;
 let queued=false;
 const run=()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;removeManualProductCostCalculator(document);});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
 new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
 return true;
}

if(typeof window!=='undefined')installManualProductCostCalculatorCleanup();
