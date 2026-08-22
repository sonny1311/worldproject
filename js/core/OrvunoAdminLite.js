// ORVUNO – sichere Vollzugriff-Admin-Konsole fuer die Testphase.
// Kritische Aenderungen laufen ausschliesslich ueber serverseitig rollenpruefende RPCs.
import {
  persistPlayerCoins,persistPlayerPremium,persistCompanyMoney,persistPlayerStatus,persistPlayerUnlock,
  persistCompanyName,persistPlayerProfile,persistPlayerAdminRole,persistPlayerPremiumDetails,listUserAudit
} from './AdminServerPersistenceBridge.js';

const uid=p=>Number(p?.id||p?.user_id||p?.userId||0);
const cid=c=>Number(c?.id||c?.companyId||c?.serverCompanyId||0);
const label=p=>p?.username||p?.display_name||p?.email||`Spieler ${uid(p)}`;
const companyLabel=c=>c?.name||c?.companyName||`Betrieb ${cid(c)}`;
const fmtMoney=v=>Number(v||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const txt=v=>v==null||v===''?'—':String(v);
const fmtDate=v=>{if(!v)return'—';const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString('de-DE'):'—';};
const premiumMs=p=>{const d=p?.premium_until||p?.premiumUntil;const t=d?new Date(d).getTime():0;return Number.isFinite(t)?t:0;};
const statusOf=p=>String(p?.status||'active').toLowerCase();
const askReason=title=>{const r=prompt(`${title}:`,'Admin-Korrektur');return r==null?null:r.trim();};
const companiesOf=(context,p)=>(context.companies||[]).filter(c=>String(c.user_id||c.userId||'')===String(uid(p)));

function el(tag,text='',cls=''){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
function btn(text,fn,cls=''){const b=el('button',text,`oa-btn ${cls}`.trim());b.type='button';b.onclick=fn;return b;}
function row(k,v){const r=el('div','','oa-row');r.append(el('span',k),el('b',String(v)));return r;}
function inputField(title,value='',type='text'){const w=el('label','','oa-field'),i=el('input','','oa-input');i.type=type;i.value=value??'';w.append(el('span',title),i);return{w,i};}
function selectField(title,value,items){const w=el('label','','oa-field'),s=el('select','','oa-input');for(const [v,n] of items){const o=el('option',n);o.value=v;o.selected=String(v)===String(value??'');s.append(o);}w.append(el('span',title),s);return{w,i:s};}
function toolbar(...buttons){const t=el('div','','oa-toolbar');t.append(...buttons);return t;}
function toast(message,bad=false){const t=el('div',message,`oa-toast${bad?' bad':''}`);document.body.append(t);setTimeout(()=>t.remove(),3200);}
async function busy(button,fn){if(button.disabled)return;const old=button.textContent;button.disabled=true;button.textContent='Speichere …';try{await fn();}catch(e){console.error(e);toast(e?.message||String(e),true);}finally{button.disabled=false;button.textContent=old;}}

function installStyle(){
 if(document.getElementById('orvuno-admin-lite-style'))return;
 const s=el('style');s.id='orvuno-admin-lite-style';s.textContent=`
 .oa-root{position:fixed;inset:0;z-index:100000;background:#0b1220;color:#e5edf7;font:14px/1.45 system-ui;display:grid;grid-template-columns:300px 1fr}.oa-root *{box-sizing:border-box}
 .oa-side{border-right:1px solid #334155;background:#111827;padding:16px;overflow:auto}.oa-main{overflow:auto;padding:18px 18px 90px}.oa-title{font-size:20px;font-weight:900;margin:0 0 12px}
 .oa-search,.oa-input,.oa-select{width:100%;padding:9px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff}.oa-search{margin:10px 0}.oa-select{min-width:260px}
 .oa-player{width:100%;text-align:left;padding:10px;border:1px solid #334155;background:#172033;color:#fff;border-radius:8px;margin-bottom:7px;cursor:pointer}.oa-player.active{border-color:#d29922;background:#2d2110}
 .oa-card{background:#111827;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:12px}.oa-card h2,.oa-card h3{margin:0 0 10px}.oa-row{display:grid;grid-template-columns:190px 1fr;gap:10px;padding:6px 0;border-bottom:1px solid #1f2937}
 .oa-grid{display:grid;grid-template-columns:repeat(2,minmax(210px,1fr));gap:10px}.oa-field{display:grid;gap:5px}.oa-field span{color:#aebdce;font-weight:700}.oa-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
 .oa-btn{padding:8px 10px;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#fff;cursor:pointer;font-weight:700}.oa-btn:hover{filter:brightness(1.12)}.oa-btn:disabled{opacity:.55;cursor:wait}.oa-btn.danger{border-color:#b91c1c;background:#3f1117}.oa-btn.gold{border-color:#d29922;background:#2d2110;color:#ffd866}.oa-btn.good{border-color:#15803d;background:#12351f}
 .oa-check{display:flex;gap:8px;align-items:center;margin:10px 0}.oa-close{position:fixed;right:18px;top:14px;z-index:100002}.oa-toast{position:fixed;right:20px;bottom:20px;z-index:100003;background:#166534;color:#fff;padding:10px 14px;border-radius:8px;font-weight:800}.oa-toast.bad{background:#991b1b}.oa-muted{color:#94a3b8}.oa-warn{color:#fbbf24}.oa-audit{max-height:360px;overflow:auto}.oa-audit-item{border-bottom:1px solid #253044;padding:8px 0}.oa-audit-item pre{white-space:pre-wrap;word-break:break-word;font-size:11px;color:#aebdce}
 @media(max-width:800px){.oa-root{grid-template-columns:1fr}.oa-side{max-height:220px;border-right:0;border-bottom:1px solid #334155}.oa-grid{grid-template-columns:1fr}}
 `;document.head.append(s);
}

export async function startOrvunoAdminLite({actor,context={},mount=document.body,onClose=null}={}){
 installStyle();
 let selected=(context.players||[])[0]||null,query='';
 const root=el('div','','oa-root'),side=el('aside','','oa-side'),main=el('main','','oa-main');
 const close=btn('✕ Admin schließen',()=>{root.remove();close.remove();onClose?.();},'danger oa-close');
 root.append(side,main);mount.append(root);document.body.append(close);

 const filtered=()=>{const q=query.trim().toLowerCase();return(context.players||[]).filter(p=>!q||[p.id,p.public_id,p.username,p.display_name,p.email].some(v=>String(v||'').toLowerCase().includes(q)));};
 const refresh=()=>{renderSide();renderMain();};

 function renderSide(){
  side.replaceChildren(el('div','🛠 ORVUNO Admin','oa-title'),el('div',`${actor?.username||actor?.name||'Admin'} · ${actor?.role||'admin'}`,'oa-muted'),el('div',`${(context.players||[]).length} User · ${(context.companies||[]).length} Betriebe`,'oa-muted'));
  const reload=btn('↻ Userliste aktualisieren',async()=>{try{await window.worldInGameAdminAccess?.reloadDirectory?.();selected=(context.players||[]).find(x=>uid(x)===uid(selected))||(context.players||[])[0]||null;toast('Userliste aktualisiert');refresh();}catch(e){toast(e.message,true);}});side.append(toolbar(reload));
  const search=el('input','','oa-search');search.placeholder='Name, E-Mail oder ID suchen …';search.value=query;search.oninput=()=>{query=search.value;renderSide();};side.append(search);
  for(const p of filtered()){const b=el('button',`${label(p)}${p.admin_role?` · ${p.admin_role}`:''}`,'oa-player');if(selected&&uid(selected)===uid(p))b.classList.add('active');b.onclick=()=>{selected=p;refresh();};side.append(b);}
 }

 function renderMain(){
  main.replaceChildren();if(!selected){main.append(el('section','Kein Spieler ausgewählt.','oa-card'));return;}const p=selected;

  const overview=el('section','','oa-card');overview.append(el('h2',label(p)),row('Spieler-ID',uid(p)||'—'),row('Public-ID',txt(p.public_id)),row('E-Mail',txt(p.email)),row('Status',statusOf(p)),row('Admin-Rolle',txt(p.admin_role)),row('Coins',Number(p.coins||0).toLocaleString('de-DE')),row('Premium',premiumMs(p)>Date.now()?`bis ${fmtDate(p.premium_until)}`:'Nein'),row('Registriert',fmtDate(p.created_at)),row('Letzter Login',fmtDate(p.last_login_at)),row('Zuletzt gesehen',fmtDate(p.last_seen_at)),row('Fehlversuche',Number(p.failed_login_count||0)),row('Gesperrt bis',fmtDate(p.locked_until)),row('E-Mail bestätigt',fmtDate(p.email_verified_at)),row('Gelöscht am',fmtDate(p.deleted_at)));main.append(overview);

  const profile=el('section','','oa-card');profile.append(el('h3','👤 Profil & Sprache'));const pg=el('div','','oa-grid');const username=inputField('Username',p.username||''),display=inputField('Anzeigename',p.display_name||''),country=inputField('Land (2-stellig)',p.country_code||'DE'),language=inputField('Sprache',p.language_code||'de'),image=inputField('Profilbild-URL',p.profile_image_url||'');pg.append(username.w,display.w,country.w,language.w,image.w);profile.append(pg);let saveProfile;saveProfile=btn('Profil speichern',()=>busy(saveProfile,async()=>{const r=askReason('Begründung für Profiländerung');if(r===null)return;await persistPlayerProfile(p,{username:username.i.value,displayName:display.i.value,countryCode:country.i.value,languageCode:language.i.value,profileImageUrl:image.i.value,reason:r});toast('Profil gespeichert');refresh();}),'good');profile.append(toolbar(saveProfile));main.append(profile);

  const coins=el('section','','oa-card');coins.append(el('h3','🪙 Coins'));const coinBar=el('div','','oa-toolbar');for(const amount of [100,500,1000,5000,10000]){let b;b=btn(`+${amount.toLocaleString('de-DE')} Coins`,()=>busy(b,async()=>{p.coins=await persistPlayerCoins(p,{delta:amount,reason:`Admin Gutschrift +${amount} Coins`});toast('Coins gutgeschrieben');refresh();}));coinBar.append(b);}let custom;custom=btn('Coins frei ändern',()=>busy(custom,async()=>{const d=Math.trunc(Number(prompt('Coins hinzufügen oder abziehen:','1000')));if(!Number.isFinite(d)||d===0)return;const r=askReason('Begründung für Coin-Korrektur');if(r===null)return;p.coins=await persistPlayerCoins(p,{delta:d,reason:r});toast('Coins geändert');refresh();}));coinBar.append(custom);coins.append(coinBar);main.append(coins);

  const premium=el('section','','oa-card');premium.append(el('h3','⭐ Premium'));const quick=el('div','','oa-toolbar');for(const days of [1,7,30,90]){let b;b=btn(`+${days} Tage`,()=>busy(b,async()=>{const until=Math.max(Date.now(),premiumMs(p))+days*86400000;const out=await persistPlayerPremium(p,{enabled:true,until,reason:`Admin Premium +${days} Tage`});p.premium_until=out?.premium_until||new Date(until).toISOString();toast('Premium vergeben');refresh();}));quick.append(b);}let remove;remove=btn('Premium entfernen',()=>busy(remove,async()=>{if(!confirm('Premium wirklich entfernen?'))return;await persistPlayerPremium(p,{enabled:false,until:null,reason:'Admin Premium entfernt'});p.premium_until=null;toast('Premium entfernt');refresh();}),'danger');quick.append(remove);premium.append(quick);const premGrid=el('div','','oa-grid'),plan=inputField('Premium-Plan',p.premium_plan||''),until=inputField('Premium bis',p.premium_until?new Date(p.premium_until).toISOString().slice(0,16):'','datetime-local');premGrid.append(plan.w,until.w);premium.append(premGrid);const autoWrap=el('label','','oa-check'),auto=document.createElement('input');auto.type='checkbox';auto.checked=!!p.premium_auto_renew;autoWrap.append(auto,el('span','Auto-Renew Kennzeichen'));premium.append(autoWrap);let savePrem;savePrem=btn('Premiumdetails exakt speichern',()=>busy(savePrem,async()=>{const r=askReason('Begründung für Premiumänderung');if(r===null)return;await persistPlayerPremiumDetails(p,{plan:plan.i.value||null,until:until.i.value?new Date(until.i.value):null,autoRenew:auto.checked,reason:r});toast('Premiumdetails gespeichert');refresh();}));premium.append(toolbar(savePrem));main.append(premium);

  const access=el('section','','oa-card');access.append(el('h3','🔐 Account-Zugriff'));let unlock;unlock=btn('Login-Sperren lösen',()=>busy(unlock,async()=>{await persistPlayerUnlock(p,'Admin Login-Freigabe');p.failed_login_count=0;p.locked_until=null;toast('Login-Sperren gelöst');refresh();}));const accessBar=toolbar(unlock);if(['suspended','blocked','banned','restricted'].includes(statusOf(p))){let activate;activate=btn('Spieler aktivieren',()=>busy(activate,async()=>{const r=askReason('Begründung für Freigabe');if(r===null)return;await persistPlayerStatus(p,{status:'active',reason:r});p.status='active';toast('Spieler aktiviert');refresh();}),'good');accessBar.append(activate);}else{let suspend;suspend=btn('Spieler sperren',()=>busy(suspend,async()=>{if(!confirm('Spieler wirklich sperren?'))return;const r=askReason('Begründung für Sperre');if(r===null)return;await persistPlayerStatus(p,{status:'suspended',reason:r});p.status='suspended';toast('Spieler gesperrt');refresh();}),'danger');accessBar.append(suspend);}access.append(accessBar);main.append(access);

  const roles=el('section','','oa-card');roles.append(el('h3','🛡 Admin-Rolle'));const role=selectField('Rolle',p.admin_role||'',[['','Kein Admin'],['owner','Owner'],['admin','Admin'],['moderator','Moderator'],['support','Support'],['economy','Economy']]);roles.append(role.w);if(String(actor?.role)==='owner'){let saveRole;saveRole=btn('Admin-Rolle speichern',()=>busy(saveRole,async()=>{const r=askReason('Begründung für Rollenänderung');if(r===null)return;if(!confirm(`Admin-Rolle auf "${role.i.value||'keine'}" setzen?`))return;await persistPlayerAdminRole(p,{role:role.i.value||null,reason:r});toast('Admin-Rolle gespeichert');refresh();}),'gold');roles.append(toolbar(saveRole));}else roles.append(el('div','Nur der Owner kann Rollen verändern.','oa-warn'));main.append(roles);

  const pcs=companiesOf(context,p);if(pcs.length){const comp=el('section','','oa-card');comp.append(el('h3','🏢 Betriebe & Kapital'));const select=el('select','','oa-select');for(const c of pcs){const o=el('option',`${companyLabel(c)} · ${fmtMoney(c.money)} €`);o.value=String(cid(c));select.append(o);}comp.append(select);const pick=()=>pcs.find(c=>String(cid(c))===select.value)||pcs[0];const bar=el('div','','oa-toolbar');for(const amount of [10000,50000,100000,500000]){let b;b=btn(`+${amount.toLocaleString('de-DE')} €`,()=>busy(b,async()=>{const c=pick(),after=Number(c.money||0)+amount;await persistCompanyMoney(c,after,`Admin Gutschrift +${amount} EUR`);c.money=after;toast('Kapital geändert');refresh();}));bar.append(b);}let exact;exact=btn('Kapital exakt setzen',()=>busy(exact,async()=>{const c=pick(),v=Number(prompt('Neues Firmenkapital:',String(Number(c.money||0))));if(!Number.isFinite(v)||v<0)return;const r=askReason('Begründung für Kapitaländerung');if(r===null)return;await persistCompanyMoney(c,v,r);c.money=v;toast('Kapital gesetzt');refresh();}));let rename;rename=btn('Betrieb umbenennen',()=>busy(rename,async()=>{const c=pick(),n=prompt('Neuer Betriebsname:',companyLabel(c));if(n==null||!n.trim())return;const r=askReason('Begründung für Umbenennung');if(r===null)return;await persistCompanyName(c,n.trim(),r);toast('Betrieb umbenannt');refresh();}));bar.append(exact,rename);comp.append(bar);main.append(comp);}

  const packs=el('section','','oa-card');packs.append(el('h3','🎁 Testerpakete'));let starter;starter=btn('5.000 Coins + 7 Tage Premium',()=>busy(starter,async()=>{p.coins=await persistPlayerCoins(p,{delta:5000,reason:'Testerpaket Starter'});const t=Math.max(Date.now(),premiumMs(p))+7*86400000;await persistPlayerPremium(p,{enabled:true,until:t,reason:'Testerpaket Starter'});p.premium_until=new Date(t).toISOString();toast('Starterpaket vergeben');refresh();}),'gold');let intensive;intensive=btn('25.000 Coins + 30 Tage Premium',()=>busy(intensive,async()=>{if(!confirm('Intensivpaket wirklich vergeben?'))return;p.coins=await persistPlayerCoins(p,{delta:25000,reason:'Testerpaket Intensiv'});const t=Math.max(Date.now(),premiumMs(p))+30*86400000;await persistPlayerPremium(p,{enabled:true,until:t,reason:'Testerpaket Intensiv'});p.premium_until=new Date(t).toISOString();toast('Intensivpaket vergeben');refresh();}),'gold');packs.append(toolbar(starter,intensive));main.append(packs);

  const audit=el('section','','oa-card');audit.append(el('h3','📜 User-Auditlog'));const box=el('div','Noch nicht geladen.','oa-audit oa-muted');let load;load=btn('Auditlog laden',()=>busy(load,async()=>{const rows=await listUserAudit(p,{limit:100});box.replaceChildren();if(!rows.length){box.append(el('div','Keine Einträge.','oa-muted'));return;}for(const a of rows){const item=el('div','','oa-audit-item');item.append(el('b',`${fmtDate(a.created_at)} · ${a.event_type}`));const pre=el('pre');pre.textContent=JSON.stringify(a.details||{},null,2);item.append(pre);box.append(item);}}));audit.append(toolbar(load),box);main.append(audit);

  const security=el('section','','oa-card');security.append(el('h3','🔒 Sicherheitsgrenze'),el('div','Passwörter, Passwort-Hashes, Session-Tokens und Auth-Schlüssel werden absichtlich nicht angezeigt oder editierbar gemacht. Alle kritischen Änderungen laufen serverseitig und werden protokolliert.','oa-muted'));main.append(security);
 }

 renderSide();renderMain();
 return{ui:{destroy(){root.remove();close.remove();}},actor,context};
}
