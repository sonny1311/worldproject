// ORVUNO – sicherer In-Game-Zugang zur eigenständigen Admin-Konsole.
const ADMIN_ROLES=new Set(['owner','admin','moderator','support','economy']);
const roleOf=user=>String(user?.admin_role||user?.adminRole||user?.role||'').toLowerCase();
const userId=user=>user?.id||user?.public_id||user?.auth_user_id||user?.authId||null;
const isAdminUser=user=>!!user&&ADMIN_ROLES.has(roleOf(user));

function mainNav(){return document.getElementById('world-main-nav');}
function currentUser(){return window.worldCurrentUser||window.worldAccounts?.gameAccessGate?.user||window.worldServerAccountOverview?.user||null;}
function companyId(c){return c?.id||c?.companyId||c?.serverCompanyId||c?.slot_no||c?.name||null;}
function mergeUnique(base=[],extra=[],idFn=x=>x?.id){
 const map=new Map();
 for(const x of base||[]){const id=idFn(x);if(id!=null)map.set(String(id),x);}
 for(const x of extra||[]){const id=idFn(x);if(id!=null)map.set(String(id),{...(map.get(String(id))||{}),...x});}
 return [...map.values()];
}
function runtimeCompanies(){
 const rows=[];
 for(const c of window.worldServerAccountOverview?.companies||[])rows.push(c);
 for(const c of [window.worldPlayerCompany,window.worldEconomyGameplay?.company,window.worldEngine?.company])if(c)rows.push(c);
 return mergeUnique([],rows,companyId);
}
function runtimePlayers(){
 const rows=[];
 const user=currentUser();
 if(user)rows.push(user);
 for(const p of window.worldAdminCachedPlayers||[])rows.push(p);
 return mergeUnique([],rows,p=>userId(p)||p?.username);
}
function runtimeWorld(){return window.worldProjectWorld||window.worldState||window.worldEngine?.world||window.worldEngine||{};}
function actorFromUser(user){
 const role=roleOf(user);
 if(!ADMIN_ROLES.has(role))throw new Error('Dieser Account hat keine Admin-Berechtigung.');
 return {id:userId(user),username:user.username||user.display_name||user.email||'Admin',name:user.display_name||user.username||'Admin',role};
}

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
 if(!api?.rest)return {players:runtimePlayers(),companies:runtimeCompanies(),source:'runtime'};
 try{
  const [players,companies]=await Promise.all([
   api.rest('users?select=*&order=id.asc'),
   api.rest('companies?select=*&order=id.asc')
  ]);
  const mergedPlayers=mergeUnique(Array.isArray(players)?players:[],runtimePlayers(),p=>userId(p)||p?.username);
  const mergedCompanies=mergeUnique(Array.isArray(companies)?companies:[],runtimeCompanies(),companyId);
  window.worldAdminCachedPlayers=mergedPlayers;
  window.worldAdminCachedCompanies=mergedCompanies;
  return {players:mergedPlayers,companies:mergedCompanies,source:'server'};
 }catch(error){
  console.warn('Admin-Verzeichnis konnte nicht vollständig vom Server geladen werden',error);
  return {players:runtimePlayers(),companies:runtimeCompanies(),source:'runtime-fallback',error:error.message};
 }
}

class InGameAdminAccess{
 constructor(){this.button=null;this.session=null;this.loading=false;this.lastDirectorySource=null;}
 refresh(){
  const user=currentUser(),nav=mainNav();
  if(!nav)return false;
  if(!isAdminUser(user)){
   this.button?.remove();this.button=null;
   if(this.session)this.close();
   return false;
  }
  if(!this.button?.isConnected){
   const existing=document.getElementById('world-admin-button');
   if(existing)this.button=existing;
   else{
    const b=document.createElement('button');
    b.id='world-admin-button';
    b.textContent='🛠 Admin';
    Object.assign(b.style,{position:'static',flex:'0 0 auto',whiteSpace:'nowrap',border:'1px solid #d29922',borderRadius:'10px',padding:'12px 16px',fontWeight:'900',cursor:'pointer',background:'#2d2110',color:'#ffd866'});
    b.onclick=()=>this.open().catch(error=>{console.error('Adminbereich konnte nicht geöffnet werden',error);alert(`Adminbereich konnte nicht geöffnet werden: ${error.message}`);});
    nav.append(b);this.button=b;
   }
  }
  this.button.title=`Adminbereich öffnen · Rolle: ${roleOf(user)}`;
  return true;
 }
 async open(){
  if(this.loading||this.session)return this.session;
  this.loading=true;
  try{
   const user=await refreshUserFromServer();
   if(!isAdminUser(user))throw new Error('Serverseitige Admin-Berechtigung fehlt.');
   const actor=actorFromUser(user);
   const directory=await loadServerDirectory();
   const context={players:directory.players,companies:directory.companies,world:runtimeWorld()};
   const mod=await import('./OrvunoAdminLite.js');
   this.lastDirectorySource=directory.source;
   this.session=await mod.startOrvunoAdminLite({actor,context,mount:document.body,onClose:()=>{this.session=null;window.dispatchEvent(new CustomEvent('world:admin-closed'));}});
   window.dispatchEvent(new CustomEvent('world:admin-opened',{detail:{actor,directorySource:directory.source}}));
   return this.session;
  }finally{this.loading=false;}
 }
 close(){
  try{this.session?.ui?.destroy?.();}catch(error){console.warn('Admin-UI konnte nicht sauber zerstört werden',error);}
  document.querySelectorAll('.oa-root,.oa-close').forEach(x=>x.remove());
  this.session=null;
  window.dispatchEvent(new CustomEvent('world:admin-closed'));
  this.refresh();
 }
 status(){
  const user=currentUser();
  return {allowed:isAdminUser(user),role:roleOf(user)||null,open:!!this.session,buttonVisible:!!this.button?.isConnected,directorySource:this.lastDirectorySource};
 }
}

export const inGameAdminAccess=new InGameAdminAccess();
if(typeof window!=='undefined'){
 window.worldInGameAdminAccess=inGameAdminAccess;
 let refreshQueued=false;
 const refresh=()=>{if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(()=>{refreshQueued=false;inGameAdminAccess.refresh();});};
 for(const ev of ['world:access-granted','world:user-login','world:profile-updated','worldproject:profile-loaded','world:access-revoked'])window.addEventListener(ev,refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0));else setTimeout(refresh,0);
 const observer=new MutationObserver(()=>{if(mainNav())refresh();});
 observer.observe(document.documentElement,{childList:true,subtree:true});
}

export {isAdminUser,roleOf,actorFromUser,loadServerDirectory,refreshUserFromServer};
