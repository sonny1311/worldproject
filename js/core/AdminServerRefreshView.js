// WorldProject – lädt Spieler/Betriebe im geöffneten Adminbereich ohne Neustart neu.
import { AdminConsoleUI } from './AdminConsoleUI.js';
const base=AdminConsoleUI.prototype.render;
AdminConsoleUI.prototype.render=function(){base?.call(this);if(!this.header||document.getElementById('world-admin-refresh-data'))return;const b=document.createElement('button');b.id='world-admin-refresh-data';b.className='action';b.textContent='↻ Serverdaten';b.title='Spieler und Betriebe frisch vom Server laden';b.onclick=async()=>{b.disabled=true;const old=b.textContent;b.textContent='↻ Lädt …';try{const d=await window.worldInGameAdminAccess?.reloadDirectory?.();this.toast(`Serverdaten neu geladen: ${d?.players?.length||0} Spieler · ${d?.companies?.length||0} Betriebe`);}catch(error){this.toast(error.message,true);}finally{b.disabled=false;b.textContent=old;}};this.header.append(b);};
if(typeof window!=='undefined')window.worldAdminServerRefreshView=true;
