// WorldProject – ein einziger sichtbarer Einstieg für Spielermarkt und Fuhrpark.
// Verwendet den bereits vorhandenen Hauptnavigations-Button statt einen zweiten Marktbutton anzulegen.
function wireMarketButton(){
  if(typeof document==='undefined')return false;
  document.getElementById('world-player-market-button')?.remove();
  const b=document.getElementById('world-market-fleet-button');
  if(!b)return false;
  b.textContent='🌐 Markt & Fuhrpark';
  b.title='Marktplatz, Kunden und Fuhrpark öffnen';
  b.onclick=()=>{
    if(typeof window.openWorldPlayerMarket==='function')window.openWorldPlayerMarket();
    else alert('Marktplatz konnte nicht geöffnet werden.');
  };
  return true;
}
function mountMarketButton(){
  if(wireMarketButton())return;
  let tries=0;const timer=setInterval(()=>{tries++;if(wireMarketButton()||tries>=40)clearInterval(timer);},50);
}
if(typeof window!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mountMarketButton,0));else setTimeout(mountMarketButton,0);
  window.addEventListener('world:access-granted',()=>setTimeout(mountMarketButton,0));
}
export function runPlayerMarketNavigationTest(){return typeof wireMarketButton==='function';}
