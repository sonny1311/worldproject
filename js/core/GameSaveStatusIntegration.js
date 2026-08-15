// ORVUNO – Speichern bleibt vollständig im Hintergrund und erzeugt keine Spieler-UI.
function removeLegacySaveBadge(){
 if(typeof document==='undefined')return false;
 const badge=document.querySelector('[data-world-save-status]');
 if(badge)badge.remove();
 return true;
}
function setState(state,detail=''){
 // Kompatibilitäts-API für ältere Integrationen: bewusst ohne sichtbare Oberfläche.
 if(state==='error')console.warn('ORVUNO Hintergrundspeichern fehlgeschlagen',detail||'Unbekannter Fehler');
 return true;
}
export function installGameSaveStatus(){
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 removeLegacySaveBadge();
 window.addEventListener('world:game-save-error',e=>setState('error',e.detail?.message||'Speichern ist fehlgeschlagen.'));
 return true;
}
export function runGameSaveStatusTest(){return typeof setState==='function'&&typeof removeLegacySaveBadge==='function';}
if(typeof window!=='undefined'){
 window.worldGameSaveStatus={install:installGameSaveStatus,setState,runTest:runGameSaveStatusTest};
 installGameSaveStatus();
}
