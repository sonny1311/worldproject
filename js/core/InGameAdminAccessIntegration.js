// WorldProject – berechtigter In-Game-Zugang zur Admin-Konsole.
// Lädt die schweren Adminmodule erst beim Klick. Normale Spieler sehen keinen Adminbutton.
const ADMIN_ROLES=new Set(['owner','admin','moderator','support','economy']);
const roleOf=user=>String(user?.admin_role||user?.adminRole||user?.role||'').toLowerCase();
const userId=user=>user?.id||user?.public_id||user?.auth_user_id||user?.authId||null;
const isAdminUser=user=>!!user&&ADMIN_ROLES.has(roleOf(user));

function mainNav(){return document.getElementById('world-main-nav');}
function companyId(c){return c?.id||c?.companyId||c?.serverCompanyId||c?.slot_no||c?.name||null;}
function mergeUnique(base=[],extra=[],idFn=x=>x?.id){const map=new Map();for(const x of base||[]){const id=idFn(x);if(id!=null)map.set(String(id),x);}for(const x of extra||[]){const id=idFn(x);if(id!=null)map.set(String(id),{...(map.get(String(id))||{}),...x});}return [...map.values()];}
function runtimeCompanies(){const rows=[];for(const c of window.worldServerAccountOverview?.companies||[])rows.push(c);for(const c of [window.worldPlayerCompany,window.worldEconomyGameplay?.company,window.worldEngine?.company])if(c)rows.push(c);return mergeUnique([],rows,companyId);}
function runtimePlayers(){const rows=[];if(window.worldCurrentUser)rows.push(window.worldCurrentUser);for(const p of window.worldAdminCachedPlayers||[])rows.push(p);return mergeUnique([],rows,p=>userId(p)||p?.username);}
function runtimeWorld(){return window.worldProjectWorld||window.worldState||window.worldEngine?.world||window.worldEngine||{};}
function actorFromUser(user){const role=roleOf(user);if(!ADMIN_ROLES.has(role))throw new Error('Dieser Account hat keine Admin-Berechtigung.');return{id:userId(user),username:user.username||user.display_name||user.email||'Admin',name:user.display_name||user.username||'Admin',role};}
async function loadServerDirectory(){const api=window.worldAccounts?.authApi;if(!api?.rest)return{players:runtimePlayers(),companies:runtimeCompanies(),source:'runtime'};try{const [players,companies]=await Promise.all([api.rest('users?select=*&order=id.asc'),api.rest('companies?select=*&order=id.asc')]);const mergedPlayers=mergeUnique(Array.isArray(players)?players:[],runtimePlayers(),p=>userId(p)||p?.username),mergedCompanies=mergeUnique(Array.isArray(companies)?companies:[],runtimeCompanies(),companyId);window.worldAdminCachedPlayers=mergedPlayers;window.worldAdminCachedCompanies=mergedCompanies;return{players:mergedPlayers,companies:mergedCompanies,source:'server'};}catch(error){console.warn('Admin-Verzeichnis konnte nicht vollständig vom Server geladen werden',error);return{players:runtimePlayers(),companies:runtimeCompanies(),source:'runtime-fallback',error:error.message};}}

class InGameAdminAccess{
 constructor(){this.button=null;this.session=null;this.closer=null;this.loading=false;this.lastDirectorySource=null;}
 refresh(){const user=window.worldCurrentUser,nav=mainNav();if(!nav)return false;const allowed=isAdminUser(user);if(!allowed){this.button?.remove();this.button=null;if(this.session)this.close();return false;}if(!this.button){const b=document.createElement('button');b.id='world-admin-button';b.textContent='🛠 Admin';Object.assign(b.style,{position:'static',flex:'0 0 auto',whiteSpace:'nowrap',border:'1px solid #d29922',borderRadius:'10px',padding:'12px 16px',fontWeight:'900',cursor:'pointer',boxShadow:'0 5px 18px rgba(0,0,0,.35)',pointerEvents:'auto',background:'#2d2110',color:'#ffd866'});b.onclick=()=>this.open().catch(error=>{console.error('Adminbereich konnte nicht geöffnet werden',error);alert(`Adminbereich konnte nicht geöffnet werden: ${error.message}`);});nav.append(b);this.button=b;}this.button.title=`Adminbereich öffnen · Rolle: ${roleOf(user)}`;return true;}
 async open(){if(this.loading||this.session)return this.session;const user=window.worldCurrentUser;if(!isAdminUser(user))throw new Error('Serverseitige Admin-Berechtigung fehlt.');this.loading=true;try{const actor=actorFromUser(user),directory=await loadServerDirectory(),mod=await import('../adminBootstrap.js'),context={players:directory.players,companies:directory.companies,world:runtimeWorld()};this.lastDirectorySource=directory.source;this.session=await mod.startWorldProjectAdmin({actor,context,mount:document.body});this.addCloseButton();window.dispatchEvent(new CustomEvent('world:admin-opened',{detail:{actor,directorySource:directory.source}}));return this.session;}finally{this.loading=false;}}
 async reloadDirectory(){if(!this.session)throw new Error('Adminbereich ist nicht geöffnet');const directory=await loadServerDirectory(),context=this.session.ui?.context;if(context){context.players=directory.players;context.companies=directory.companies;context.world=runtimeWorld();}this.lastDirectorySource=directory.source;this.session.ui?.render?.();window.dispatchEvent(new CustomEvent('world:admin-directory-reloaded',{detail:{source:directory.source,players:directory.players.length,companies:directory.companies.length}}));return directory;}
 addCloseButton(){this.closer?.remove();const b=document.createElement('button');b.id='world-admin-close';b.textContent='✕ Admin schließen';Object.assign(b.style,{position:'fixed',right:'18px',top:'12px',zIndex:'100010',border:'1px solid #f85149',background:'#3b1114',color:'#fff',borderRadius:'8px',padding:'8px 12px',fontWeight:'900',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,.45)'});b.onclick=()=>this.close();document.body.append(b);this.closer=b;}
 close(){try{this.session?.ui?.destroy?.();}catch(error){console.warn('Admin-UI konnte nicht sauber zerstört werden',error);}document.querySelectorAll('.wp-admin').forEach(x=>x.remove());this.closer?.remove();this.closer=null;this.session=null;window.dispatchEvent(new CustomEvent('world:admin-closed'));this.refresh();}
 status(){return{allowed:isAdminUser(window.worldCurrentUser),role:roleOf(window.worldCurrentUser)||null,open:!!this.session,buttonVisible:!!this.button?.isConnected,directorySource:this.lastDirectorySource,cachedPlayers:(window.worldAdminCachedPlayers||[]).length,cachedCompanies:(window.worldAdminCachedCompanies||[]).length};}
}

export const inGameAdminAccess=new InGameAdminAccess();
if(typeof window!=='undefined'){
 window.worldInGameAdminAccess=inGameAdminAccess;
 const refresh=()=>requestAnimationFrame(()=>inGameAdminAccess.refresh());
 for(const ev of ['world:access-granted','world:user-login','world:profile-updated','worldproject:profile-loaded','world:access-revoked'])window.addEventListener(ev,refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0));else setTimeout(refresh,0);
}
export {isAdminUser,roleOf,actorFromUser,loadServerDirectory};
