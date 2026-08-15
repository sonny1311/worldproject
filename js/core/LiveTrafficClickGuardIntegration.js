// ORVUNO – robuste Klickbehandlung fuer Live-Verkehr.
// Fängt Klicks im Capture-Modus ab, damit überlagerte/neu gerenderte Handler
// den HERE-Test nicht wirkungslos machen können.

function findTrafficButton(target){
  return target?.closest?.('[data-world-live-traffic-overlay] [data-refresh], [data-world-live-traffic-overlay] button');
}

async function runRefreshAll(button){
  const api=window.worldLiveTraffic;
  if(!api?.refresh) throw new Error('Live-Verkehr ist noch nicht initialisiert');
  button.dataset.guardBusy='1';
  button.disabled=true;
  const old=button.textContent;
  button.textContent='Prüfe HERE …';
  try{
    await api.refresh(undefined,{force:true});
    window.dispatchEvent(new CustomEvent('world:game-state-dirty'));
    window.dispatchEvent(new CustomEvent('world:traffic-updated',{detail:{source:'click-guard'}}));
  }catch(error){
    console.error('HERE Live-Prüfung fehlgeschlagen',error);
    alert(`Live-Verkehr konnte nicht geprüft werden: ${error?.message||String(error)}`);
  }finally{
    button.dataset.guardBusy='0';
    button.disabled=false;
    button.textContent=old||'Jetzt alle live prüfen';
  }
}

function install(){
  if(window.__worldLiveTrafficClickGuard)return;
  window.__worldLiveTrafficClickGuard=true;
  document.addEventListener('click',event=>{
    const button=findTrafficButton(event.target);
    if(!button)return;
    const overlay=button.closest('[data-world-live-traffic-overlay]');
    if(!overlay)return;
    if(button.matches('[data-refresh]')){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(button.dataset.guardBusy==='1')return;
      runRefreshAll(button);
    }
  },true);
}

if(typeof window!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
