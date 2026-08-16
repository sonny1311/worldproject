// ORVUNO – eigenständige, stabile Admin-Konsole für die Testphase.
// Lädt bewusst keine alten Admin-Zusatzmodule.
import {
  persistPlayerCoins,
  persistPlayerPremium,
  persistCompanyMoney,
  persistPlayerStatus,
  persistPlayerUnlock
} from './AdminServerPersistenceBridge.js';

const money=v=>Number(v||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const uid=p=>Number(p?.id||p?.user_id||p?.userId||0);
const cid=c=>Number(c?.id||c?.companyId||c?.serverCompanyId||0);
const label=p=>p?.username||p?.display_name||p?.email||`Spieler ${uid(p)}`;
const companyLabel=c=>c?.name||c?.companyName||`Betrieb ${cid(c)}`;

function premiumTime(p){const raw=p?.premium_until||p?.premiumUntil||null;const t=raw?new Date(raw).getTime():0;return Number.isFinite(t)?t:0;}
function isPremium(p){return premiumTime(p)>Date.now();}
function statusOf(p){return String(p?.status||p?.account_status||'active').toLowerCase();}
function companiesOf(context,p){const id=String(uid(p));return (context.companies||[]).filter(c=>String(c.user_id||c.userId||'')===id);}
function el(tag,text='',className=''){const x=document.createElement(tag);if(text)x.textContent=text;if(className)x.className=className;return x;}
function button(text,fn,className=''){const b=el('button',text,`oa-btn ${className}`.trim());b.type='button';b.addEventListener('click',fn);return b;}
function row(k,v){const r=el('div','','oa-row');r.append(el('span',k),el('b',String(v)));return r;}
function toast(msg,bad=false){const t=el('div',msg,'oa-toast');if(bad)t.classList.add('bad');document.body.append(t);setTimeout(()=>t.remove(),3000);}
async function busy(btn,fn){if(btn.disabled)return;const old=btn.textContent;btn.disabled=true;btn.textContent='Speichere …';try{await fn();}catch(e){console.error(e);toast(e?.message||String(e),true);}finally{btn.disabled=false;btn.textContent=old;}}

function installStyle(){
 if(document.getElementById('orvuno-admin-lite-style'))return;
 const s=el('style');s.id='orvuno-admin-lite-style';s.textContent=`
 .oa-root{position:fixed;inset:0;z-index:100000;background:#0b1220;color:#e5edf7;font:14px/1.45 system-ui;display:grid;grid-template-columns:280px 1fr}
 .oa-root *{box-sizing:border-box}.oa-side{border-right:1px solid #334155;background:#111827;padding:16px;overflow:auto}.oa-main{overflow:auto;padding:18px}
 .oa-title{font-size:20px;font-weight:900;margin-bottom:14px}.oa-search{width:100%;padding:10px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;margin-bottom:10px}
 .oa-player{width:100%;text-align:left;padding:10px;border:1px solid #334155;background:#172033;color:#fff;border-radius:8px;margin-bottom:7px;cursor:pointer}.oa-player.active{border-color:#d29922;background:#2d2110}
 .oa-card{background:#111827;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:12px}.oa-card h2,.oa-card h3{margin:0 0 10px}.oa-row{display:grid;grid-template-columns:180px 1fr;gap:10px;padding:6px 0;border-bottom:1px solid #1f2937}
 .oa-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.oa-btn{padding:8px 10px;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#fff;cursor:pointer;font-weight:700}.oa-btn.danger{border-color:#b91c1c;background:#3f1117}.oa-btn.gold{border-color:#d29922;background:#2d2110;color:#ffd866}
 .oa-select{padding:8px;border-radius:8px;background:#0f172a;color:#fff;border:1px solid #475569;min-width:280px}.oa-close{position:fixed;right:18px;top:14px;z-index:100002}.oa-toast{position:fixed;right:20px;bottom:20px;z-index:100003;background:#166534;color:#fff;padding:10px 14px;border-radius:8px;font-weight:800}.oa-toast.bad{background:#991b1b}.oa-muted{color:#94a3b8}
 @media(max-width:800px){.oa-root{grid-template-columns:1fr}.oa-side{max-height:220px;border-right:0;border-bottom:1px solid #334155}}
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

 function filteredPlayers(){const q=query.trim().toLowerCase();return (context.players||[]).filter(p=>!q||[p.username,p.display_name,p.email,p.id].some(v=>String(v||'').toLowerCase().includes(q)));}
 function renderSide(){side.replaceChildren();side.append(el('div','🛠 ORVUNO Admin','oa-title'));const info=el('div',`${actor?.username||actor?.name||'Admin'} · ${actor?.role||'admin'}`,'oa-muted');side.append(info);const search=el('input','','oa-search');search.placeholder='Spieler suchen …';search.value=query;search.addEventListener('input',()=>{query=search.value;renderSide();});side.append(search);for(const p of filteredPlayers()){const b=el('button',label(p),'oa-player');if(selected&&uid(selected)===uid(p))b.classList.add('active');b.addEventListener('click',()=>{selected=p;renderSide();renderMain();});side.append(b);} }
 function refresh(){renderSide();renderMain();}
 function addActionBar(parent,title,actions){parent.append(el('h3',title));const bar=el('div','','oa-toolbar');for(const a of actions)bar.append(a);parent.append(bar);}

 function renderMain(){
  main.replaceChildren();
  if(!selected){main.append(el('div','Kein Spieler ausgewählt.','oa-card'));return;}
  const p=selected;
  const card=el('section','','oa-card');card.append(el('h2',label(p)));
  card.append(row('Spieler-ID',uid(p)||'—'),row('E-Mail',p.email||'—'),row('Status',statusOf(p)),row('Coins',Number(p.coins||0).toLocaleString('de-DE')),row('Premium',isPremium(p)?`bis ${new Date(premiumTime(p)).toLocaleString('de-DE')}`:'Nein'));
  main.append(card);

  const coins=el('section','','oa-card');
  const coinButtons=[100,500,1000,5000,10000].map(amount=>{let b; b=button(`+${amount.toLocaleString('de-DE')} Coins`,()=>busy(b,async()=>{p.coins=await persistPlayerCoins(p,{delta:amount,reason:`Admin Gutschrift +${amount} Coins`});toast('Coins gutgeschrieben');refresh();}));return b;});
  let customCoin;customCoin=button('Coins frei ändern',()=>busy(customCoin,async()=>{const d=Math.trunc(Number(prompt('Coins hinzufügen oder abziehen:','1000')));if(!Number.isFinite(d)||d===0)return;p.coins=await persistPlayerCoins(p,{delta:d,reason:'Admin Coin-Korrektur'});toast('Coin-Konto geändert');refresh();}));coinButtons.push(customCoin);addActionBar(coins,'🪙 Coins',coinButtons);main.append(coins);

  const premium=el('section','','oa-card');const premiumButtons=[];
  for(const days of [1,7,30,90]){let b;b=button(`+${days} Tage`,()=>busy(b,async()=>{const until=Math.max(Date.now(),premiumTime(p))+days*86400000;const r=await persistPlayerPremium(p,{enabled:true,until,reason:`Admin Premium +${days} Tage`});p.premium_until=r?.premium_until||new Date(until).toISOString();p.premiumUntil=new Date(p.premium_until).getTime();toast('Premium vergeben');refresh();}));premiumButtons.push(b);}
  let removePrem;removePrem=button('Premium entfernen',()=>busy(removePrem,async()=>{if(!confirm('Premium wirklich entfernen?'))return;await persistPlayerPremium(p,{enabled:false,until:null,reason:'Admin Premium entfernt'});p.premium_until=null;p.premiumUntil=0;toast('Premium entfernt');refresh();}),'danger');premiumButtons.push(removePrem);addActionBar(premium,'⭐ Premium',premiumButtons);main.append(premium);

  const access=el('section','','oa-card');const accessButtons=[];
  let unlock;unlock=button('Login-Sperren lösen',()=>busy(unlock,async()=>{await persistPlayerUnlock(p,'Admin Login-Freigabe');toast('Login-Sperren gelöst');}));accessButtons.push(unlock);
  if(statusOf(p)==='suspended'||statusOf(p)==='blocked'){let activate;activate=button('Spieler aktivieren',()=>busy(activate,async()=>{await persistPlayerStatus(p,{status:'active',reason:'Admin Freigabe'});p.status='active';toast('Spieler aktiviert');refresh();}));accessButtons.push(activate);}else{let suspend;suspend=button('Spieler sperren',()=>busy(suspend,async()=>{if(!confirm('Spieler wirklich sperren?'))return;await persistPlayerStatus(p,{status:'suspended',reason:'Admin Sperre'});p.status='suspended';toast('Spieler gesperrt');refresh();}),'danger');accessButtons.push(suspend);}addActionBar(access,'🔐 Account',accessButtons);main.append(access);

  const pcs=companiesOf(context,p);
  if(pcs.length){const comp=el('section','','oa-card');comp.append(el('h3','💶 Betriebskapital'));const select=el('select','','oa-select');for(const c of pcs){const o=el('option',`${companyLabel(c)} · ${money(c.money)} €`);o.value=String(cid(c));select.append(o);}comp.append(select);const selectedCompany=()=>pcs.find(c=>String(cid(c))===select.value)||pcs[0];const bar=el('div','','oa-toolbar');for(const amount of [10000,50000,100000,500000]){let b;b=button(`+${amount.toLocaleString('de-DE')} €`,()=>busy(b,async()=>{const c=selectedCompany();const after=Number(c.money||0)+amount;await persistCompanyMoney(c,after,`Admin Gutschrift +${amount} EUR`);c.money=after;toast('Firmenkapital geändert');refresh();}));bar.append(b);}let exact;exact=button('Kapital exakt setzen',()=>busy(exact,async()=>{const c=selectedCompany();const v=Number(prompt('Neues Firmenkapital:',String(Number(c.money||0))));if(!Number.isFinite(v)||v<0)return;await persistCompanyMoney(c,v,'Admin Kapital gesetzt');c.money=v;toast('Firmenkapital gesetzt');refresh();}));bar.append(exact);comp.append(bar);main.append(comp);}

  const packs=el('section','','oa-card');const packBar=el('div','','oa-toolbar');let starter;starter=button('Starter: 5.000 Coins + 7 Tage Premium',()=>busy(starter,async()=>{p.coins=await persistPlayerCoins(p,{delta:5000,reason:'Testerpaket Starter'});const until=Math.max(Date.now(),premiumTime(p))+7*86400000;await persistPlayerPremium(p,{enabled:true,until,reason:'Testerpaket Starter'});p.premium_until=new Date(until).toISOString();p.premiumUntil=until;toast('Starterpaket vergeben');refresh();}),'gold');let intensive;intensive=button('Intensiv: 25.000 Coins + 30 Tage Premium',()=>busy(intensive,async()=>{if(!confirm('Intensivpaket wirklich vergeben?'))return;p.coins=await persistPlayerCoins(p,{delta:25000,reason:'Testerpaket Intensiv'});const until=Math.max(Date.now(),premiumTime(p))+30*86400000;await persistPlayerPremium(p,{enabled:true,until,reason:'Testerpaket Intensiv'});p.premium_until=new Date(until).toISOString();p.premiumUntil=until;toast('Intensivpaket vergeben');refresh();}),'gold');packBar.append(starter,intensive);packs.append(el('h3','🎁 Testerpakete'),packBar);main.append(packs);
 }
 renderSide();renderMain();
 return {ui:{destroy(){root.remove();close.remove();}},actor,context};
}
