// WorldProject – bündelt die Hauptnavigation oben auf der dunklen Spielzentrale.
// Der alte separate Wirtschafts-/Engine-Umweg wird nicht mehr als Navigation benötigt.
const NAV_ID='world-main-nav';
const obsoleteIds=['world-economy-button','world-economy-dashboard-button','world-wirtschaft-button'];
function movePrimaryActions(nav){const active=document.querySelector('[data-world-active-operations-button]');if(active&&active.parentElement!==nav){Object.assign(active.style,{position:'static',left:'auto',right:'auto',top:'auto',bottom:'auto',zIndex:'auto',borderRadius:'9px',padding:'9px 12px'});nav.append(active);} }
function styleNav(){
 const nav=document.getElementById(NAV_ID);if(!nav)return false;
 for(const id of obsoleteIds)document.getElementById(id)?.remove();
 movePrimaryActions(nav);
 Object.assign(nav.style,{position:'fixed',left:'16px',right:'16px',top:'12px',bottom:'auto',zIndex:'44000',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px',padding:'10px 12px',maxWidth:'none',background:'rgba(15,23,42,.96)',border:'1px solid #334155',borderRadius:'14px',boxShadow:'0 10px 30px rgba(0,0,0,.35)',backdropFilter:'blur(8px)',pointerEvents:'auto'});
 for(const b of nav.querySelectorAll('button'))Object.assign(b.style,{background:b.id==='world-admin-button'?'#2d2110':'#1e293b',color:b.id==='world-admin-button'?'#ffd866':'#f8fafc',border:`1px solid ${b.id==='world-admin-button'?'#d29922':'#475569'}`,borderRadius:'9px',padding:'9px 12px',boxShadow:'none',fontWeight:'800',position:'static'});
 nav.dataset.worldDarkMainNav='1';return true;
}
export function installDarkMainNavigation(){if(typeof document==='undefined')return false;const apply=()=>styleNav();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();const observer=new MutationObserver(()=>{const nav=document.getElementById(NAV_ID);if(nav)styleNav();for(const id of obsoleteIds)document.getElementById(id)?.remove();});observer.observe(document.documentElement,{childList:true,subtree:true});for(const ev of ['world:access-granted','worldproject:company-loaded','worldproject:company-switched'])window.addEventListener(ev,()=>setTimeout(apply,0));return true;}
export function runDarkMainNavigationTest(){return obsoleteIds.includes('world-wirtschaft-button')&&NAV_ID==='world-main-nav';}
if(typeof window!=='undefined'){window.worldDarkMainNavigation={install:installDarkMainNavigation,runTest:runDarkMainNavigationTest};installDarkMainNavigation();}
