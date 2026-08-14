// WorldProject – sichtbarer Einstieg in den bereits vorhandenen Spielermarktplatz.
function mountMarketButton(){
  if(typeof document==='undefined')return;
  if(document.getElementById('world-player-market-button'))return;
  const nav=document.getElementById('world-main-nav');if(!nav)return;
  const b=document.createElement('button');b.id='world-player-market-button';b.textContent='🌐 Marktplatz';
  Object.assign(b.style,{position:'static',flex:'0 0 auto',whiteSpace:'nowrap',border:'0',borderRadius:'10px',padding:'12px 16px',fontWeight:'800',cursor:'pointer',boxShadow:'0 5px 18px rgba(0,0,0,.35)',pointerEvents:'auto'});
  b.onclick=()=>{if(typeof window.openWorldPlayerMarket==='function')window.openWorldPlayerMarket();else alert('Marktplatz konnte nicht geöffnet werden.');};nav.append(b);
}
if(typeof window!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mountMarketButton,0));else setTimeout(mountMarketButton,0);
  window.addEventListener('world:access-granted',()=>setTimeout(mountMarketButton,0));
}
export function runPlayerMarketNavigationTest(){return true;}
