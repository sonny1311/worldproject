// ORVUNO – Testerwerkzeuge im Adminbereich.
// Serverkritische Änderungen werden erst nach erfolgreicher RPC-Antwort als Erfolg angezeigt.
import { AdminConsoleUI } from './AdminConsoleUI.js';
import { persistPlayerCoins, persistPlayerPremium, persistCompanyMoney, persistPlayerStatus, persistPlayerUnlock } from './AdminServerPersistenceBridge.js';

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const id=x=>x?.id||x?.userId||x?.user_id||null;
const el=(tag,text='')=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
const btn=(text,fn)=>{const b=el('button',text);b.className='action';b.onclick=fn;return b;};
function panel(title){const p=el('div');p.className='panel';const h=el('h3',title);p.append(h);return p;}
function row(label,value){const r=el('div');r.className='kv';r.append(el('span',label),el('b',value));return r;}
function playerCompanies(ui,player){const uid=String(id(player)||'');return ui.companies().filter(c=>String(c.user_id||c.userId||'')===uid);}
async function withBusy(ui,button,work){if(button.disabled)return;const old=button.textContent;button.disabled=true;button.textContent='Speichere …';try{await work();}catch(error){ui.toast(error?.message||String(error),true);}finally{button.disabled=false;button.textContent=old;}}
function loadWallet(ui,player){if(player.__adminWalletLoaded||player.__adminWalletLoading)return;const uid=id(player),api=window.worldAccounts?.authApi;if(!uid||!api?.rest)return;player.__adminWalletLoading=true;api.rest(`coin_wallets?user_id=eq.${encodeURIComponent(uid)}&select=balance&limit=1`).then(rows=>{const wallet=Array.isArray(rows)?rows[0]:rows;if(wallet&&Number.isFinite(Number(wallet.balance)))player.coins=Number(wallet.balance);player.__adminWalletLoaded=true;}).catch(error=>console.warn('Admin-Coinstand konnte nicht geladen werden',error)).finally(()=>{player.__adminWalletLoading=false;if(String(ui.selected)===String(id(player)))ui.render();});}
function premiumDate(player){const until=player.premium_until||player.premiumUntil||null;return until?new Date(until):null;}
function isPremium(player){const d=premiumDate(player);return !!d&&d.getTime()>Date.now();}
function playerStatus(player){return String(player.status||player.account_status||player.moderation?.status||(player.moderation?.suspended?'suspended':'active')).toLowerCase();}
function companyLabel(c){return `${c.name||c.companyName||'Betrieb'} · ${n(c.money).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} €`;}

const base=AdminConsoleUI.prototype.playerDetail;
AdminConsoleUI.prototype.playerDetail=function(player){
  loadWallet(this,player);
  player.premium=isPremium(player);
  base.call(this,player);
  if(!this.admin.can(this.actor,'players.write'))return;

  const box=panel('🧪 Tester- & Spielersteuerung');
  const premiumUntil=player.premium_until||player.premiumUntil||null,status=playerStatus(player);
  box.append(
    row('Spieler-ID',String(id(player)||'—')),
    row('Aktuelle Coins',player.__adminWalletLoading?'wird geladen …':n(player.coins).toLocaleString('de-DE')),
    row('Premium bis',premiumUntil?new Date(premiumUntil).toLocaleString('de-DE'):'Kein Premium'),
    row('Accountstatus',status||'active')
  );

  const ids=el('div');ids.className='toolbar';
  const copyId=btn('📋 Spieler-ID kopieren',async()=>{try{await navigator.clipboard.writeText(String(id(player)||''));this.toast('Spieler-ID kopiert');}catch{this.toast('Kopieren nicht möglich',true);}});
  ids.append(copyId);box.append(ids);

  const coinTitle=el('h4','🪙 Coins');box.append(coinTitle);
  const coinBar=el('div');coinBar.className='toolbar';
  for(const amount of [100,500,1000,5000,10000]){const b=btn(`+${amount.toLocaleString('de-DE')}`,()=>withBusy(this,b,async()=>{const reason=`Tester-Gutschrift +${amount} Coins`;const balance=await persistPlayerCoins(player,{delta:amount,reason});player.coins=balance;player.__adminWalletLoaded=true;this.admin.log(this.actor,'tester_coins_credit',{playerId:id(player),amount,balance,reason});this.toast(`✅ ${amount.toLocaleString('de-DE')} Coins gutgeschrieben`);this.render();}));coinBar.append(b);}
  const custom=btn('🪙 Frei ändern',()=>withBusy(this,custom,async()=>{const amount=Number(prompt('Coins hinzufügen oder abziehen:','1000'));if(!Number.isFinite(amount)||amount===0)return;const reason=prompt('Begründung:','Tester-Gutschrift');if(reason===null)return;const balance=await persistPlayerCoins(player,{delta:Math.trunc(amount),reason});player.coins=balance;player.__adminWalletLoaded=true;this.admin.log(this.actor,'tester_coins_adjust',{playerId:id(player),amount:Math.trunc(amount),balance,reason});this.toast('✅ Coin-Konto serverseitig geändert');this.render();}));coinBar.append(custom);box.append(coinBar);

  const premTitle=el('h4','⭐ Premium');box.append(premTitle);
  const premBar=el('div');premBar.className='toolbar';
  for(const days of [1,7,30,90]){const b=btn(`+${days} Tag${days===1?'':'e'}`,()=>withBusy(this,b,async()=>{const current=Math.max(Date.now(),premiumDate(player)?.getTime()||0),until=current+days*86400000,reason=`Tester-Premium ${days} Tag${days===1?'':'e'}`;const result=await persistPlayerPremium(player,{enabled:true,until,reason});player.premium=true;player.premiumUntil=result?.premium_until?new Date(result.premium_until).getTime():until;player.premium_until=result?.premium_until||new Date(until).toISOString();this.admin.log(this.actor,'tester_premium_credit',{playerId:id(player),days,until:player.premium_until,reason});this.toast(`✅ ${days} Tag${days===1?'':'e'} Premium vergeben`);this.render();}));premBar.append(b);}
  const customPremium=btn('⭐ Tage frei eingeben',()=>withBusy(this,customPremium,async()=>{const days=Math.trunc(Number(prompt('Wie viele Premium-Tage hinzufügen?','14')));if(!Number.isFinite(days)||days<=0)return;const current=Math.max(Date.now(),premiumDate(player)?.getTime()||0),until=current+days*86400000,reason=`Admin Premium +${days} Tage`;await persistPlayerPremium(player,{enabled:true,until,reason});player.premium=true;player.premiumUntil=until;player.premium_until=new Date(until).toISOString();this.admin.log(this.actor,'tester_premium_custom',{playerId:id(player),days,until:player.premium_until,reason});this.toast(`✅ ${days} Premium-Tage hinzugefügt`);this.render();}));premBar.append(customPremium);
  if(isPremium(player)){const revoke=btn('✕ Premium entfernen',()=>withBusy(this,revoke,async()=>{if(!confirm('Premium für diesen Spieler wirklich entfernen?'))return;const reason='Admin: Premium entfernt';await persistPlayerPremium(player,{enabled:false,until:null,reason});player.premium=false;player.premiumUntil=0;player.premium_until=null;this.admin.log(this.actor,'tester_premium_removed',{playerId:id(player),reason});this.toast('Premium entfernt');this.render();}));revoke.classList.add('danger');premBar.append(revoke);}
  box.append(premBar);

  const accountTitle=el('h4','🔐 Account & Testzugang');box.append(accountTitle);
  const accountBar=el('div');accountBar.className='toolbar';
  const unlock=btn('🔓 Login-Sperren lösen',()=>withBusy(this,unlock,async()=>{const reason='Admin: Login-Sperren zurückgesetzt';await persistPlayerUnlock(player,reason);this.admin.log(this.actor,'tester_login_unlock',{playerId:id(player),reason});this.toast('✅ Login-Sperren zurückgesetzt');this.render();}));accountBar.append(unlock);
  if(this.admin.can(this.actor,'moderation.write')){
    if(status==='suspended'||status==='blocked'||player.moderation?.suspended){const activate=btn('✅ Spieler aktivieren',()=>withBusy(this,activate,async()=>{const reason=prompt('Begründung:','Tester wieder freigegeben');if(reason===null)return;await persistPlayerStatus(player,{status:'active',reason});player.status='active';if(player.moderation)player.moderation.suspended=false;this.admin.log(this.actor,'tester_player_activated',{playerId:id(player),reason});this.toast('✅ Spieler aktiviert');this.render();}));accountBar.append(activate);}else{const suspend=btn('⛔ Spieler sperren',()=>withBusy(this,suspend,async()=>{const reason=prompt('Begründung für Sperre:','Admin-Sperre');if(reason===null)return;if(!confirm('Spieler wirklich sperren?'))return;await persistPlayerStatus(player,{status:'suspended',reason});player.status='suspended';player.moderation={...(player.moderation||{}),suspended:true};this.admin.log(this.actor,'tester_player_suspended',{playerId:id(player),reason});this.toast('Spieler gesperrt');this.render();}));suspend.classList.add('danger');accountBar.append(suspend);}
  }
  box.append(accountBar);

  const companies=playerCompanies(this,player);
  if(companies.length){
    const moneyTitle=el('h4','💶 Betriebskapital');box.append(moneyTitle);
    const select=el('select');for(const c of companies){const option=el('option',companyLabel(c));option.value=String(c.id||c.companyId||'');select.append(option);}const primary=companies.find(c=>c.is_primary)||companies[0];select.value=String(primary.id||primary.companyId||'');box.append(select);
    const selectedCompany=()=>companies.find(c=>String(c.id||c.companyId||'')===select.value)||companies[0];
    const moneyBar=el('div');moneyBar.className='toolbar';moneyBar.style.marginTop='8px';
    for(const amount of [10000,50000,100000,500000]){const b=btn(`+${amount.toLocaleString('de-DE')} €`,()=>withBusy(this,b,async()=>{const company=selectedCompany(),after=n(company.money)+amount,reason=`Tester-Gutschrift +${amount} EUR`;await persistCompanyMoney(company,after,reason);company.money=after;this.admin.log(this.actor,'tester_money_credit',{playerId:id(player),companyId:company.id,amount,after,reason});this.toast(`✅ ${amount.toLocaleString('de-DE')} € an ${company.name||'Betrieb'} gutgeschrieben`);this.render();}));moneyBar.append(b);}
    const exact=btn('💶 Kapital exakt setzen',()=>withBusy(this,exact,async()=>{const company=selectedCompany(),amount=Number(prompt(`Neues Kapital für ${company.name||'Betrieb'}:`,String(n(company.money))));if(!Number.isFinite(amount)||amount<0)return;const reason=prompt('Begründung:','Admin-Korrektur / Test');if(reason===null)return;await persistCompanyMoney(company,amount,reason);company.money=amount;this.admin.log(this.actor,'tester_money_set',{playerId:id(player),companyId:company.id,amount,reason});this.toast('✅ Firmenkapital gesetzt');this.render();}));moneyBar.append(exact);box.append(moneyBar);
  }

  const packTitle=el('h4','🎁 Testerpakete');box.append(packTitle);
  const packs=el('div');packs.className='toolbar';
  const pack=btn('Starter: 5.000 Coins + 7 Tage Premium',()=>withBusy(this,pack,async()=>{const reason='ORVUNO Testerpaket Starter',balance=await persistPlayerCoins(player,{delta:5000,reason}),current=Math.max(Date.now(),premiumDate(player)?.getTime()||0),until=current+7*86400000;await persistPlayerPremium(player,{enabled:true,until,reason});player.coins=balance;player.__adminWalletLoaded=true;player.premium=true;player.premiumUntil=until;player.premium_until=new Date(until).toISOString();this.admin.log(this.actor,'tester_package_credit',{playerId:id(player),coins:5000,premiumDays:7,reason});this.toast('✅ Starter-Testerpaket vergeben');this.render();}));
  const bigPack=btn('Intensivtest: 25.000 Coins + 30 Tage Premium',()=>withBusy(this,bigPack,async()=>{if(!confirm('Großes Intensivtest-Paket wirklich vergeben?'))return;const reason='ORVUNO Testerpaket Intensiv',balance=await persistPlayerCoins(player,{delta:25000,reason}),current=Math.max(Date.now(),premiumDate(player)?.getTime()||0),until=current+30*86400000;await persistPlayerPremium(player,{enabled:true,until,reason});player.coins=balance;player.__adminWalletLoaded=true;player.premium=true;player.premiumUntil=until;player.premium_until=new Date(until).toISOString();this.admin.log(this.actor,'tester_package_intensive',{playerId:id(player),coins:25000,premiumDays:30,reason});this.toast('✅ Intensivtest-Paket vergeben');this.render();}));pack.style.fontWeight='900';bigPack.style.fontWeight='900';packs.append(pack,bigPack);box.append(packs);

  this.body.prepend(box);
};

if(typeof window!=='undefined')window.worldAdminTesterTools=true;
