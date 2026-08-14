// WorldProject – berechtigter In-Game-Zugang zur Admin-Konsole.
// Lädt die schweren Adminmodule erst beim Klick. Normale Spieler sehen keinen Adminbutton.
const ADMIN_ROLES=new Set(['owner','admin','moderator','support','economy']);
const roleOf=user=>String(user?.admin_role||user?.adminRole||user?.role||'').toLowerCase();
const userId=user=>user?.id||user?.public_id||user?.auth_user_id||user?.authId||null;
const isAdminUser=user=>!!user&&ADMIN_ROLES.has(roleOf(user));

function mainNav(){return document.getElementById('world-main-nav');}
function runtimeCompanies(){const rows=[],seen=new Set(),add=c=>{if(!c)return;const id=c.id||c.companyId||c.serverCompanyId||c.slot_no||c.name;if(id&&seen.has(String(id)))return;if(id)seen.add(String(id));rows.push(c);};for(const c of window.worldServerAccountOverview?.companies||[])add(c);add(window.worldPlayerCompany);add(window.worldEconomyGameplay?.company);add(window.worldEngine?.company);return rows;}
function runtimePlayers(){const rows=[],seen=new Set(),add=p=>{if(!p)return;const id=userId(p)||p.username;if(id&&seen.has(String(id)))return;if(id)seen.add(String(id));rows.push(p);};add(window.worldCurrentUser);for(const p of window.worldAdminCachedPlayers||[])add(p);return rows;}
function runtimeWorld(){return window.worldProjectWorld||window.worldState||window.worldEngine?.world||window.worldEngine||{};}
function actorFromUser(user){const role=roleOf(user);if(!ADMIN_ROLES.has(role))throw new Error('Dieser Account hat keine Admin-Berechtigung.');return{id:userId(user),username:user.username||user.display_name||user.email||'Admin',name:user.display_name||user.username||'Admin',role};}

class InGameAdminAccess{
 constructor(){this.button=null;this.session=null;this.closer=null;this.loading=false;}
 refresh(){const user=window.worldCurrentUser,nav=mainNav();if(!nav)return false;const allowed=isAdminUser(user);if(!allowed){this.button?.remove();this.button=null;if(this.session)this.close();return false;}if(!this.button){const b=document.createElement('button');b.id='world-admin-button';b.textContent='🛠 Admin';Object.assign(b.style,{position:'static',flex:'0 0 auto',whiteSpace:'nowrap',border:'1px solid #d29922',borderRadius:'10px',padding:'12px 16px',fontWeight:'900',cursor:'pointer',boxShadow:'0 5px 18px rgba(0,0,0,.35)',pointerEvents:'auto',background:'#2d2110',color:'#ffd866'});b.onclick=()=>this.open().catch(error=>{console.error('Adminbereich konnte nicht geöffnet werden',error);alert(`Adminbereich konnte nicht geöffnet werden: ${error.message}`);});nav.append(b);this.button=b;}this.button.title=`Adminbereich öffnen · Rolle: ${roleOf(user)}`;return true;}
 async open(){if(this.loading||this.session)return this.session;const user=window.worldCurrentUser;if(!isAdminUser(user))throw new Error('Serverseitige Admin-Berechtigung fehlt.');this.loading=true;try{const actor=actorFromUser(user),mod=await import('../adminBootstrap.js'),context={players:runtimePlayers(),companies:runtimeCompanies(),world:runtimeWorld()};this.session=await mod.startWorldProjectAdmin({actor,context,mount:document.body});this.addCloseButton();window.dispatchEvent(new CustomEvent('world:admin-opened',{detail:{actor}}));return this.session;}finally{this.loading=false;}}
 addCloseButton(){this.closer?.remove();const b=document.createElement('button');b.id='world-admin-close';b.textContent='✕ Admin schließen';Object.assign(b.style,{position:'fixed',right:'18px',top:'12px',zIndex:'100010',border:'1px solid #f85149',background:'#3b1114',color:'#fff',borderRadius:'8px',padding:'8px 12px',fontWeight:'900',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,.45)'});b.onclick=()=>this.close();document.body.append(b);this.closer=b;}
 close(){try{this.session?.ui?.destroy?.();}catch(error){console.warn('Admin-UI konnte nicht sauber zerstört werden',error);}document.querySelectorAll('.wp-admin').forEach(x=>x.remove());this.closer?.remove();this.closer=null;this.session=null;window.dispatchEvent(new CustomEvent('world:admin-closed'));this.refresh();}
 status(){return{allowed:isAdminUser(window.worldCurrentUser),role:roleOf(window.worldCurrentUser)||null,open:!!this.session,buttonVisible:!!this.button?.isConnected};}
}

export const inGameAdminAccess=new InGameAdminAccess();
if(typeof window!=='undefined'){
 window.worldInGameAdminAccess=inGameAdminAccess;
 const refresh=()=>requestAnimationFrame(()=>inGameAdminAccess.refresh());
 for(const ev of ['world:access-granted','world:user-login','world:profile-updated','worldproject:profile-loaded','world:access-revoked'])window.addEventListener(ev,refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0));else setTimeout(refresh,0);
}
export {isAdminUser,roleOf,actorFromUser};
