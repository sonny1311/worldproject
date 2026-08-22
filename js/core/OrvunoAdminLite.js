// ORVUNO – sichere Vollzugriff-Admin-Konsole fuer die Testphase.
// Kritische Aenderungen laufen ausschliesslich ueber serverseitig rollenpruefende RPCs.
import {
  persistPlayerCoins,
  persistPlayerPremium,
  persistCompanyMoney,
  persistPlayerStatus,
  persistPlayerUnlock,
  persistCompanyName,
  persistPlayerProfile,
  persistPlayerAdminRole,
  persistPlayerPremiumDetails,
  listUserAudit
} from './AdminServerPersistenceBridge.js';

const money=v=>Number(v||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const uid=p=>Number(p?.id||p?.user_id||p?.userId||0);
const cid=c=>Number(c?.id||c?.companyId||c?.serverCompanyId||0);
const label=p=>p?.username||p?.display_name||p?.email||`Spieler ${uid(p)}`;
const companyLabel=c=>c?.name||c?.companyName||`Betrieb ${cid(c)}`;
const text=v=>v==null||v===''?'—':String(v);
const date=v=>{if(!v)return'—';const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString('de-DE'):'—';};
const reason=(title='Begruendung')=>{const r=prompt(`${title}:`,'Admin-Korrektur');return r==null?null:r.trim();};

function premiumTime(p){const raw=p?.premium_until||p?.premiumUntil||null;const t=raw?new Date(raw).getTime():0;return Number.isFinite(t)?t:0;}
function isPremium(p){return premiumTime(p)>Date.now();}
function statusOf(p){return String(p?.status||p?.account_status||'active').toLowerCase();}
function companiesOf(context,p){const id=String(uid(p));return (context.companies||[]).filter(c=>String(c.user_id||c.userId||'')===id);}
function el(tag,textValue='',className=''){const x=document.createElement(tag);if(textValue)x.textContent=textValue;if(className)x.className=className;return x;}
function button(textValue,fn,className=''){const b=el('button',textValue,`oa-btn ${className}`.trim());b.type='button';b.addEventListener('click',fn);return b;}
function row(k,v){const r=el('div','','oa-row');r.append(el('span',k),el('b',String(v)));return r;}
function field(labelText,value='',type='text'){const wrap=el('label','','oa-field');wrap.append(el('span',labelText));const input=el('input','','oa-input');input.type=type;input.value=value??'';wrap.append(input);return{wrap,input};}
function selectField(labelText,value,values){const wrap=el('label','','oa-field');wrap.append(el('span',labelText));const input=el('select','','oa-input');for(const [v,n] of values){const o=el('option',n);o.value=v;if(String(value??'')===String(v))o.selected=true;input.append(o);}wrap.append(input);return{wrap,input};}
function toast(msg,bad=false){const t=el('div',msg,'oa-toast');if(bad)t.classList.add('bad');document.body.append(t);setTimeout(()=>t.remove(),3000);}
async function busy(btn,fn){if(btn.disabled)return;const old=btn.textContent;btn.disabled=true;btn.textContent='Speichere …';try{await fn();}catch(e){console.error(e);toast(e?.message||String(e),true);}finally{btn.disabled=false;btn.textContent=old;}}

function installStyle(){
 if(document.getElementById('orvuno-admin-lite-style'))return;
 const s=el('style');s.id='orvuno-admin-lite-style';s.textContent=`
 .oa-root{position:fixed;inset:0;z-index:100000;background:#0b1220;color:#e5edf7;font:14px/1.45 system-ui;display:grid;grid-template-columns:300px 1fr}
 .oa-root *{box-sizing:border-box}.oa-side{border-right:1px solid #334155;background:#111827;padding:16px;overflow:auto}.oa-main{overflow:auto;padding:18px 18px 80px}
 .oa-title{font-size:20px;font-weight:900;margin-bottom:14px}.oa-search{width:100%;padding:10px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;margin:10px 0}
 .oa-player{width:100%;text-align:left;padding:10px;border:1px solid #334155;background:#172033;color:#fff;border-radius:8px;margin-bottom:7px;cursor:pointer}.oa-player.active{border-color:#d29922;background:#2d2110}
 .oa-card{background:#111827;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:12px}.oa-card h2,.oa-card h3{margin:0 0 10px}.oa-row{display:grid;grid-template-columns:190px 1fr;gap:10px;padding:6px 0;border-bottom:1px solid #1f2937}
 .oa-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.oa-btn{padding:8px 10px;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#fff;cursor:pointer;font-weight:700}.oa-btn:hover{filter:brightness(1.12)}.oa-btn:disabled{opacity:.55;cursor:wait}.oa-btn.danger{border-color:#b91c1c;background:#3f1117}.oa-btn.gold{border-color:#d29922;background:#2d2110;color:#ffd866}.oa-btn.good{border-color:#15803d;background:#12351f}
 .oa-grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:10px}.oa-field{display:grid;gap:5px}.oa-field span{color:#aebdce;font-weight:700}.oa-input,.oa-select{width:100%;padding:9px;border-radius:8px;background:#0f172a;color:#fff;border:1px solid #475569}.oa-select{min-width:280px}.oa-check{display:flex;gap:8px;align-items:center;margin:8px 0}.oa-close{position:fixed;right:18px;top:14px;z-index:100002}.oa-toast{position:fixed;right:20px;bottom:20px;z-index:100003;background:#166534;color:#fff;padding:10px 14px;border-radius:8px;font-weight:800}.oa-toast.bad{background:#991b1b}.oa-muted{color:#94a3b8}.oa-warn{color:#fbbf24}.oa-audit{max-height:340px;overflow:auto}.oa-audit-item{border-bottom:1px solid #253044;padding:8px 0}.oa-audit-item pre{white-space:pre-wrap;word-break:break-word;font-size:11px;color:#aebdce;margin:4px 0 0}
 @media(max-width:800px){.oa-root{grid-template-columns:1fr}.oa-side{max-height:220px;border-right:0;border-bottom:1px solid #334155}.oa-grid{grid-template-columns:1fr}}
 `;document.head.append(s);
}

export async function startOrvunoAdminLite({actor,context={},mount=document.body,onClose=null}={}){
 installStyle();
 let selected=(context.players||[])[0]||null;
 let query='';
 const root=el('div','','oa-root');
 const side=el('aside','','oa-side');
 const main=el('main','','oa-main');
 const close=button('✕ Admin schließen',()=>{root.remove();close.remove();onClose?.();},'danger oa-close');
 document.body.append(close);
 root.append(side,main);mount.append(root);

 function filteredPlayers(){const q=query.trim().toLowerCase();return (context.players||[]).filter(p=>!q||[p.username,p.display_name,p.email,p.id,p.public_id].some(v=>String(v||'').toLowerCase().includes(q)));}
 function renderSide(){side.replaceChildren();side.append(el('div','🛠 ORVUNO Admin','oa-title'));side.append(el('div',`${actor?.username||actor?.name||'Admin'} · ${actor?.role||'admin'}`,'oa-muted'));const count=el('div',`${(context.players||[]).length} User · ${(context.companies||[]).length} Betriebe`,'oa-muted');side.append(count);const reload=button('↻ Userliste aktualisieren',async()=>{try{await window.worldInGameAdminAccess?.reloadDirectory?.();selected=(context.players||[]).find(x=>uid(x)===uid(selected))||(context.players||[])[0]||null;toast('Userliste aktualisiert');refresh();}catch(e){toast(e.message,true);}});side.append(reload);const search=el('input','','oa-search');search.placeholder='Name, E-Mail oder ID suchen …';search.value=query;search.addEventListener('input',()=>{query=search.value;renderSide();});side.append(search);for(const p of filteredPlayers()){const b=el('button',`${label(p)}${p.admin_role?` · ${p.admin_role}`:''}`,'oa-player');if(selected&&uid(selected)===uid(p))b.classList.add('active');b.addEventListener('click',()=>{selected=p;renderSide();renderMain();});side.append(b);} }
 function refresh(){renderSide();renderMain();}
 function addActionBar(parent,title,actions){parent.append(el('h3',title));const bar=el('div','','oa-toolbar');for(const a of actions)bar.append(a);parent.append(bar);}

 function renderMain(){
  main.replaceChildren();
  if(!selected){main.append(el('div','Kein Spieler ausgewählt.','oa-card'));return;}
  const p=selected;
  const card=el('section','','oa-card');card.append(el('h2',label(p)));
  card.append(
   row('Spieler-ID',uid(p)||'—'),row('Public-ID',text(p.public_id)),row('E-Mail',text(p.email)),row('Status',statusOf(p)),
   row('Admin-Rolle',text(p.admin_role)),row('Coins',Number(p.coins||0).toLocaleString('de-DE')),row('Premium',isPremium(p)?`bis ${date(p.premium_until)}`:'Nein'),
   row('Registriert',date(p.created_at)),row('Letzter Login',date(p.last_login_at)),row('Zuletzt gesehen',date(p.last_seen_at)),
   row('Fehlversuche',Number(p.failed_login_count||0)),row('Login gesperrt bis',date(p.locked_until)),row('E-Mail bestätigt',date(p.email_verified_at)),row('Gelöscht am',date(p.deleted_at))
  );
  main.append(card);

  const profile=el('section','','oa-card');profile.append(el('h3','👤 Profil & Sprache'));
  const pg=el('div','','oa-grid');
  const username=field('Username',p.username||'');const display=field('Anzeigename',p.display_name||'');const country=field('Land (2-stellig)',p.country_code||'DE');const language=field('Sprache',p.language_code||'de');const image=field('Profilbild-URL',p.profile_image_url||'');
  pg.append(username.wrap,display.wrap,country.wrap,language.wrap,image.wrap);profile.append(pg);
  let saveProfile;saveProfile=button('Profil speichern',()=>busy(saveProfile,async()=>{const r=reason('Begruendung fuer Profiländerung');if(r===null)return;await persistPlayerProfile(p,{username:username.input.value,displayName:display.input.value,countryCode:country.input.value,languageCode:language.input.value,profileImageUrl:image.input.value,reason:r});toast('Profil gespeichert');refresh();}),'good');profile.append(el('div','','oa-toolbar')).lastChild?.append?.(saveProfile);main.append(profile);

  const coins=el('section','','oa-card');
  const coinButtons=[100,500,1000,5000,10000].map(amount=>{let b;b=button(`+${amount.toLocaleString('de-DE')} Coins`,()=>busy(b,async()=>{p.coins=await persistPlayerCoins(p,{delta:amount,reason:`Admin Gutschrift +${amount} Coins`});toast('Coins gutgeschrieben');refresh();}));return b;});
  let customCoin;customCoin=button('Coins frei ändern',()=>busy(customCoin,async()=>{const d=Math.trunc(Number(prompt('Coins hinzufügen oder abziehen:','1000')));if(!Number.isFinite(d)||d===0)return;const r=reason('Begruendung fuer Coin-Korrektur');if(r===null)return;p.coins=await persistPlayerCoins(p,{delta:d,reason:r});toast('Coin-Konto geändert');refresh();}));coinButtons.push(customCoin);addActionBar(coins,'🪙 Coins',coinButtons);main.append(coins);

  const premium=el('section','','oa-card');const premiumButtons=[];
  for(const days of [1,7,30,90]){let b;b=button(`+${days} Tage`,()=>busy(b,async()=>{const until=Math.max(Date.now(),premiumTime(p))+days*86400000;const r=await persistPlayerPremium(p,{enabled:true,until,reason:`Admin Premium +${days} Tage`});p.premium_until=r?.premium_until||new Date(until).toISOString();p.premiumUntil=new Date(p.premium_until).getTime();toast('Premium vergeben');refresh();}));premiumButtons.push(b);}
  let removePrem;removePrem=button('Premium entfernen',()=>busy(removePrem,async()=>{if(!confirm('Premium wirklich entfernen?'))return;await persistPlayerPremium(p,{enabled:false,until:null,reason:'Admin Premium entfernt'});p.premium_until=null;p.premiumUntil=0;toast('Premium entfernt');refresh();}),'danger');premiumButtons.push(removePrem);addActionBar(premium,'⭐ Premium Schnellwahl',premiumButtons);
  const premGrid=el('div','','oa-grid');const plan=field('Premium-Plan',p.premium_plan||'');const until=field('Premium bis',p.premium_until?new Date(p.premium_until).toISOString().slice(0,16):'','datetime-local');premGrid.append(plan.wrap,until.wrap);premium.append(premGrid);const autoWrap=el('label','','oa-check');const auto=document.createElement('input');auto.type='checkbox';auto.checked=!!p.premium_auto_renew;autoWrap.append(auto,el('span','Auto-Renew Kennzeichen'));premium.append(autoWrap);let savePrem;savePrem=button('Premiumdetails exakt speichern',()=>busy(savePrem,async()=>{const r=reason('Begruendung fuer Premiumänderung');if(r===null)return;await persistPlayerPremiumDetails(p,{plan:plan.input.value||null,until:until.input.value?new Date(until.input.value):null,autoRenew:auto.checked,reason:r});toast('Premiumdetails gespeichert');refresh();}));premium.append(el('div','','oa-toolbar')).lastChild?.append?.(savePrem);main.append(premium);

  const access=el('section','','oa-card');const accessButtons=[];
  let unlock;unlock=button('Login-Sperren lösen',()=>busy(unlock,async()=>{await persistPlayerUnlock(p,'Admin Login-Freigabe');p.failed_login_count=0;p.locked_until=null;toast('Login-Sperren gelöst');refresh();}));accessButtons.push(unlock);
  if(statusOf(p)==='suspended'||statusOf(p)==='blocked'||statusOf(p)==='banned'||statusOf(p)==='restricted'){let activate;activate=button('Spieler aktivieren',()=>busy(activate,async()=>{const r=reason('Begruendung fuer Freigabe');if(r===null)return;await persistPlayerStatus(p,{status:'active',reason:r});p.status='active';toast('Spieler aktiviert');refresh();}),'good');accessButtons.push(activate);}else{let suspend;suspend=button('Spieler sperren',()=>busy(suspend,async()=>{if(!confirm('Spieler wirklich sperren?'))return;const r=reason('Begruendung fuer Sperre');if(r===null)return;await persistPlayerStatus(p,{status:'suspended',reason:r});p.status='suspended';toast('Spieler gesperrt');refresh();}),'danger');accessButtons.push(suspend);}addActionBar(access,'🔐 Account-Zugriff',accessButtons);main.append(access);

  const roles=el('section','','oa-card');roles.append(el('h3','🛡 Admin-Rolle'));const roleSelect=selectField('Rolle',p.admin_role||'',[['','Kein Admin'],['owner','Owner'],['admin','Admin'],['moderator','Moderator'],['support','Support'],['economy','Economy']]);roles.append(roleSelect.wrap);if(String(actor?.role)==='owner'){let saveRole;saveRole=button('Admin-Rolle speichern',()=>busy(saveRole,async()=>{const r=reason('Begruendung fuer Rollenänderung');if(r===null)return;if(!confirm(`Admin-Rolle auf "${roleSelect.input.value||'keine'}" setzen?`))return;await persistPlayerAdminRole(p,{role:roleSelect.input.value||null,reason:r});toast('Admin-Rolle gespeichert');refresh();}),'gold');roles.append(el('div','','oa-toolbar')).lastChild?.append?.(saveRole);}else roles.append(el('div','Nur der Owner kann Rollen verändern.','oa-warn'));main.append(roles);

  const pcs=companiesOf(context,p);
  if(pcs.length){const comp=el('section','','oa-card');comp.append(el('h3','🏢 Betriebe & Kapital'));const select=el('select','','oa-select');for(const c of pcs){const o=el('option',`${companyLabel(c)} · ${money(c.money)} €`);o.value=String(cid(c));select.append(o);}comp.append(select);const selectedCompany=()=>pcs.find(c=>String(cid(c))===select.value)||pcs[0];const bar=el('div','','oa-toolbar');for(const amount of [10000,50000,100000,500000]){let b;b=button(`+${amount.toLocaleString('de-DE')} €`,()=>busy(b,async()=>{const c=selectedCompany();const after=Number(c.money||0)+amount;await persistCompanyMoney(c,after,`Admin Gutschrift +${amount} EUR`);c.money=after;toast('Firmenkapital geändert');refresh();}));bar.append(b);}let exact;exact=button('Kapital exakt setzen',()=>busy(exact,async()=>{const c=selectedCompany();const v=Number(prompt('Neues Firmenkapital:',String(Number(c.money||0))));if(!Number.isFinite(v)||v<0)return;const r=reason('Begruendung fuer Kapitaländerung');if(r===null)return;await persistCompanyMoney(c,v,r);c.money=v;toast('Firmenkapital gesetzt');refresh();}));let rename;rename=button('Betrieb umbenennen',()=>busy(rename,async()=>{const c=selectedCompany();const n=prompt('Neuer Betriebsname:',companyLabel(c));if(n==null||!n.trim())return;const r=reason('Begruendung fuer Umbenennung');if(r===null)return;await persistCompanyName(c,n.trim(),r);toast('Betrieb umbenannt');refresh();}));bar.append(exact,rename);comp.append(bar);main.append(comp);}

  const packs=el('section','','oa-card');const packBar=el('div','','oa-toolbar');let starter;starter=button('Starter: 5.000 Coins + 7 Tage Premium',()=>busy(starter,async()=>{p.coins=await persistPlayerCoins(p,{delta:5000,reason:'Testerpaket Starter'});const t=Math.max(Date.now(),premiumTime(p))+7*86400000;await persistPlayerPremium(p,{enabled:true,until:t,reason:'Testerpaket Starter'});p.premium_until=new Date(t).toISOString();p.premiumUntil=t;toast('Starterpaket vergeben');refresh();}),'gold');let intensive;intensive=button('Intensiv: 25.000 Coins + 30 Tage Premium',()=>busy(intensive,async()=>{if(!confirm('Intensivpaket wirklich vergeben?'))return;p.coins=await persistPlayerCoins(p,{delta:25000,reason:'Testerpaket Intensiv'});const t=Math.max(Date.now(),premiumTime(p))+30*86400000;await persistPlayerPremium(p,{enabled:true,until:t,reason:'Testerpaket Intensiv'});p.premium_until=new Date(t).toISOString();p.premiumUntil=t;toast('Intensivpaket vergeben');refresh();}),'gold');packBar.append(starter,intensive);packs.append(el('h3','🎁 Testerpakete'),packBar);main.append(packs);

  const audit=el('section','','oa-card');audit.append(el('h3','📜 User-Auditlog'));const box=el('div','Noch nicht geladen.','oa-audit oa-muted');let loadAudit;loadAudit=button('Auditlog laden',()=>busy(loadAudit,async()=>{const rows=await listUserAudit(p,{limit:100});box.replaceChildren();if(!rows.length){box.append(el('div','Keine Einträge.','oa-muted'));return;}for(const a of rows){const item=el('div','','oa-audit-item');item.append(el('b',`${date(a.created_at)} · ${a.event_type}`));const pre=el('pre');pre.textContent=JSON.stringify(a.details||{},null,2);item.append(pre);box.append(item);}}));audit.append(loadAudit,box);main.append(audit);

  const security=el('section','','oa-card');security.append(el('h3','🔒 Sicherheitsgrenze'));security.append(el('div','Passwörter, Passwort-Hashes, Session-Tokens und Auth-Schlüssel werden absichtlich nicht angezeigt oder editierbar gemacht. Alle kritischen Änderungen laufen serverseitig und werden protokolliert.','oa-muted'));main.append(security);
 }
 renderSide();renderMain();
 return {ui:{destroy(){root.remove();close.remove();}},actor,context};
}
