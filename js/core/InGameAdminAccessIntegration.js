// WorldProject – berechtigter In-Game-Zugang zur eigenstaendigen ORVUNO-Admin-Konsole.
// Der normale Spielerclient laedt die Admin-UI erst beim Klick; Verzeichnis und Mutationen sind serverseitig rollenpruefend.
const ADMIN_ROLES=new Set(['owner','admin','moderator','support','economy']);
const roleOf=user=>String(user?.admin_role||user?.adminRole||user?.role||'').toLowerCase();
const userId=user=>user?.id||user?.public_id||user?.auth_user_id||user?.authId||null;
const isAdminUser=user=>!!user&&ADMIN_ROLES.has(roleOf(user));

function mainNav(){return document.getElementById('world-main-nav');}
function currentUser(){return window.worldCurrentUser||window.worldAccounts?.gameAccessGate?.user||window.worldServerAccountOverview?.user||null;}
function companyId(c){return c?.id||c?.companyId||c?.serverCompanyId||c?.slot_no||c?.name||null;}
function mergeUnique(base=[],extra=[],idFn=x=>x?.id){const map=new Map();for(const x of base||[]){const key=idFn(x);if(key!=null)map.set(String(key),x);}for(const x of extra||[]){const key=idFn(x);if(key!=null)map.set(String(key),{...(map.get(String(key))||{}),...x});}return [...map.values()];}
function runtimeCompanies(){const rows=[];for(const c of window.worldServerAccountOverview?.companies||[])rows.push(c);for(const c of [window.worldPlayerCompany,window.worldEconomyGameplay?.company,window.worldEngine?.company])if(c)rows.push(c);return mergeUnique([],rows,companyId);}
function runtimePlayers(){const rows=[];const user=currentUser();if(user)rows.push(user);for(const p of window.worldAdminCachedPlayers||[])rows.push(p);return mergeUnique([],rows,p=>userId(p)||p?.username);}
function actorFromUser(user){const role=roleOf(user);if(!ADMIN_ROLES.has(role))throw new Error('Dieser Account hat keine Admin-Berechtigung.');return{id:userId(user),username:user.username||user.display_name||user.email||'Admin',name:user.display_name||user.username||'Admin',role};}

async function refreshUserFromServer(){
 const api=window.worldAccounts?.authApi;
 if(!api?.me)return currentUser();
 const serverUser=await api.me();
 const merged={...(currentUser()||{}),...(serverUser||{})};
 window.worldCurrentUser=merged;
 if(window.worldAccounts?.gameAccessGate)window.worldAccounts.gameAccessGate.user=merged;
 if(window.worldServerAccountOverview)window.worldServerAccountOverview.user=merged;
 return merged;
}

async function loadServerDirectory(){
 const api=window.worldAccounts?.authApi;
 if(!api?.rpc)return{players:runtimePlayers(),companies:runtimeCompanies(),source:'runtime'};
 try{
  const [playerRows,companyRows]=await Promise.all([api.rpc('admin_list_players',{}),api.rpc('admin_list_companies',{})]);
  const players=mergeUnique(Array.isArray(playerRows)?playerRows:[],runtimePlayers(),p=>p?.id||p?.public_id||p?.username);
  const companies=mergeUnique(Array.isArray(companyRows)?companyRows:[],runtimeCompanies(),companyId);
  window.worldAdminCachedPlayers=players;
  window.worldAdminCachedCompanies=companies;
  return{players,companies,source:'server-admin-rpc'};
 }catch(error){
  console.warn('Geschuetztes Admin-Verzeichnis konnte nicht geladen werden',error);
  return{players:runtimePlayers(),companies:runtimeCompanies(),source:'runtime-fallback',error:error?.message||String(error)};
 }
}

class InGameAdminAccess{
 constructor(){this.button=null;this.session=null;this.loading=false;this.lastDirectorySource=null;}
 refresh(){const user=currentUser(),nav=mainNav();if(!nav)return false;const allowed=isAdminUser(user);if(!allowed){this.button?.remove();this.button=null;if(this.session)this.close();return false;}if(!this.button?.isConnected){const existing=document.getElementById('world-admin-button');if(existing)this.button=existing;else{const b=document.createElement('button');b.id='world-admin-button';b.textContent='🛠 Admin';Object.assign(b.style,{position:'static',flex:'0 0 auto',whiteSpace:'nowrap',border:'1px solid #d29922',borderRadius:'10px',padding:'12px 16px',fontWeight:'900',cursor:'pointer',boxShadow:'0 5px 18px rgba(0,0,0,.35)',pointerEvents:'auto',background:'#2d2110',color:'#ffd866'});b.onclick=()=>this.open().catch(error=>{console.error('Adminbereich konnte nicht geöffnet werden',error);alert(`Adminbereich konnte nicht geöffnet werden: ${error?.message||error}`);});nav.append(b);this.button=b;}}this.button.title=`Adminbereich öffnen · Rolle: ${roleOf(user)}`;return true;}
 async open(){if(this.loading||this.session)return this.session;this.loading=true;try{const user=await refreshUserFromServer();if(!isAdminUser(user))throw new Error('Serverseitige Admin-Berechtigung fehlt.');this.refresh();const actor=actorFromUser(user);const directory=await loadServerDirectory();if(directory.source!=='server-admin-rpc')throw new Error(`Admin-Verzeichnis nicht serverseitig verfügbar${directory.error?`: ${directory.error}`:''}`);const mod=await import('./OrvunoAdminLite.js');this.lastDirectorySource=directory.source;this.session=await mod.startOrvunoAdminLite({actor,context:{players:directory.players,companies:directory.companies},mount:document.body,onClose:()=>{this.session=null;this.refresh();}});window.dispatchEvent(new CustomEvent('world:admin-opened',{detail:{actor,directorySource:directory.source}}));return this.session;}finally{this.loading=false;}}
 async reloadDirectory(){if(!this.session)throw new Error('Adminbereich ist nicht geöffnet');const user=await refreshUserFromServer();if(!isAdminUser(user)){this.close();throw new Error('Serverseitige Admin-Berechtigung fehlt.');}const directory=await loadServerDirectory();if(directory.source!=='server-admin-rpc')throw new Error('Admin-Verzeichnis konnte nicht sicher aktualisiert werden');const context=this.session.context;if(context){context.players=directory.players;context.companies=directory.companies;}this.lastDirectorySource=directory.source;window.dispatchEvent(new CustomEvent('world:admin-directory-reloaded',{detail:{source:directory.source,players:directory.players.length,companies:directory.companies.length}}));return directory;}
 close(){try{this.session?.ui?.destroy?.();}catch(error){console.warn('Admin-UI konnte nicht sauber zerstört werden',error);}document.querySelectorAll('.oa-root,.oa-close').forEach(x=>x.remove());this.session=null;window.dispatchEvent(new CustomEvent('world:admin-closed'));this.refresh();}
 status(){const user=currentUser();return{allowed:isAdminUser(user),role:roleOf(user)||null,open:!!this.session,buttonVisible:!!this.button?.isConnected,directorySource:this.lastDirectorySource,cachedPlayers:(window.worldAdminCachedPlayers||[]).length,cachedCompanies:(window.worldAdminCachedCompanies||[]).length};}
}

export const inGameAdminAccess=new InGameAdminAccess();
if(typeof window!=='undefined'){
 window.worldInGameAdminAccess=inGameAdminAccess;
 let refreshQueued=false;
 const refresh=()=>{if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(()=>{refreshQueued=false;inGameAdminAccess.refresh();});};
 for(const ev of ['world:access-granted','world:user-login','world:profile-updated','worldproject:profile-loaded','world:access-revoked'])window.addEventListener(ev,refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0));else setTimeout(refresh,0);
 const observer=new MutationObserver(()=>{if(mainNav())refresh();});observer.observe(document.documentElement,{childList:true,subtree:true});
}
export {isAdminUser,roleOf,actorFromUser,loadServerDirectory,refreshUserFromServer};
