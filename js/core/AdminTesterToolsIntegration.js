// ORVUNO – stabile Tester- und Spielersteuerung im Adminbereich.
// Kritische Änderungen werden ausschließlich über serverseitig rollenprüfende RPCs gespeichert.
import { AdminConsoleUI } from './AdminConsoleUI.js';
import {
  persistPlayerCoins,
  persistPlayerPremium,
  persistCompanyMoney,
  persistPlayerStatus,
  persistPlayerUnlock
} from './AdminServerPersistenceBridge.js';

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const id=x=>x?.id||x?.userId||x?.user_id||null;
const el=(tag,text='')=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
const btn=(text,fn)=>{const b=el('button',text);b.className='action';b.onclick=fn;return b;};

function panel(title){const p=el('div');p.className='panel';p.append(el('h3',title));return p;}
function row(label,value){const r=el('div');r.className='kv';r.append(el('span',label),el('b',value));return r;}
function premiumUntil(player){return player?.premium_until||player?.premiumUntil||null;}
function premiumTime(player){const raw=premiumUntil(player);const t=raw?new Date(raw).getTime():0;return Number.isFinite(t)?t:0;}
function isPremium(player){return premiumTime(player)>Date.now();}
function statusOf(player){return String(player?.status||player?.account_status||player?.moderation?.status||(player?.moderation?.suspended?'suspended':'active')).toLowerCase();}
function playerCompanies(ui,player){const uid=String(id(player)||'');return ui.companies().filter(c=>String(c.user_id||c.userId||'')===uid);}
function companyName(c){return c?.name||c?.companyName||'Betrieb';}
function companyId(c){return c?.id||c?.companyId||c?.serverCompanyId||null;}

async function withBusy(ui,button,work){
  if(button.disabled)return;
  const old=button.textContent;
  button.disabled=true;
  button.textContent='Speichere …';
  try{await work();}
  catch(error){ui.toast(error?.message||String(error),true);}
  finally{button.disabled=false;button.textContent=old;}
}

function loadWallet(ui,player){
  if(player.__adminWalletLoaded||player.__adminWalletLoading)return;
  const uid=id(player),api=window.worldAccounts?.authApi;
  if(!uid||!api?.rest)return;
  player.__adminWalletLoading=true;
  api.rest(`coin_wallets?user_id=eq.${encodeURIComponent(uid)}&select=balance&limit=1`)
    .then(rows=>{
      const wallet=Array.isArray(rows)?rows[0]:rows;
      if(wallet&&Number.isFinite(Number(wallet.balance)))player.coins=Number(wallet.balance);
      player.__adminWalletLoaded=true;
    })
    .catch(error=>console.warn('Admin-Coinstand konnte nicht geladen werden',error))
    .finally(()=>{
      player.__adminWalletLoading=false;
      if(String(ui.selected)===String(id(player)))ui.render();
    });
}

async function creditCoins(ui,player,amount){
  const reason=`Tester-Gutschrift +${amount} Coins`;
  const balance=await persistPlayerCoins(player,{delta:amount,reason});
  player.coins=balance;
  player.__adminWalletLoaded=true;
  ui.admin.log(ui.actor,'tester_coins_credit',{playerId:id(player),amount,balance,reason});
  ui.toast(`✅ ${amount.toLocaleString('de-DE')} Coins gutgeschrieben`);
  ui.render();
}

async function changeCoins(ui,player){
  const amount=Number(prompt('Coins hinzufügen oder abziehen:','1000'));
  if(!Number.isFinite(amount)||amount===0)return;
  const reason=prompt('Begründung:','Tester-Gutschrift');
  if(reason===null)return;
  const delta=Math.trunc(amount);
  const balance=await persistPlayerCoins(player,{delta,reason});
  player.coins=balance;
  player.__adminWalletLoaded=true;
  ui.admin.log(ui.actor,'tester_coins_adjust',{playerId:id(player),amount:delta,balance,reason});
  ui.toast('✅ Coin-Konto serverseitig geändert');
  ui.render();
}

async function addPremium(ui,player,days){
  const current=Math.max(Date.now(),premiumTime(player));
  const until=current+days*86400000;
  const reason=`Tester-Premium +${days} Tage`;
  const result=await persistPlayerPremium(player,{enabled:true,until,reason});
  player.premium=true;
  player.premiumUntil=result?.premium_until?new Date(result.premium_until).getTime():until;
  player.premium_until=result?.premium_until||new Date(until).toISOString();
  ui.admin.log(ui.actor,'tester_premium_credit',{playerId:id(player),days,until:player.premium_until,reason});
  ui.toast(`✅ ${days} Premium-Tag${days===1?'':'e'} vergeben`);
  ui.render();
}

async function addCustomPremium(ui,player){
  const days=Math.trunc(Number(prompt('Wie viele Premium-Tage hinzufügen?','14')));
  if(!Number.isFinite(days)||days<=0)return;
  await addPremium(ui,player,days);
}

async function removePremium(ui,player){
  if(!confirm('Premium für diesen Spieler wirklich entfernen?'))return;
  const reason='Admin: Premium entfernt';
  await persistPlayerPremium(player,{enabled:false,until:null,reason});
  player.premium=false;
  player.premiumUntil=0;
  player.premium_until=null;
  ui.admin.log(ui.actor,'tester_premium_removed',{playerId:id(player),reason});
  ui.toast('✅ Premium entfernt');
  ui.render();
}

async function unlockPlayer(ui,player){
  const reason='Admin: Login-Sperren zurückgesetzt';
  await persistPlayerUnlock(player,reason);
  ui.admin.log(ui.actor,'tester_login_unlock',{playerId:id(player),reason});
  ui.toast('✅ Login-Sperren zurückgesetzt');
}

async function setPlayerActive(ui,player,active){
  const status=active?'active':'suspended';
  const defaultReason=active?'Tester wieder freigegeben':'Admin-Sperre';
  const reason=prompt('Begründung:',defaultReason);
  if(reason===null)return;
  if(!active&&!confirm('Spieler wirklich sperren?'))return;
  await persistPlayerStatus(player,{status,reason});
  player.status=status;
  player.moderation={...(player.moderation||{}),suspended:!active,status};
  ui.admin.log(ui.actor,active?'tester_player_activated':'tester_player_suspended',{playerId:id(player),reason});
  ui.toast(active?'✅ Spieler aktiviert':'✅ Spieler gesperrt');
  ui.render();
}

async function creditCompany(ui,player,company,amount){
  const after=n(company.money)+amount;
  const reason=`Tester-Gutschrift +${amount} EUR`;
  await persistCompanyMoney(company,after,reason);
  company.money=after;
  ui.admin.log(ui.actor,'tester_money_credit',{playerId:id(player),companyId:companyId(company),amount,after,reason});
  ui.toast(`✅ ${amount.toLocaleString('de-DE')} € an ${companyName(company)} gutgeschrieben`);
  ui.render();
}

async function setCompanyBalance(ui,player,company){
  const amount=Number(prompt(`Neues Kapital für ${companyName(company)}:`,String(n(company.money))));
  if(!Number.isFinite(amount)||amount<0)return;
  const reason=prompt('Begründung:','Admin-Korrektur / Test');
  if(reason===null)return;
  await persistCompanyMoney(company,amount,reason);
  company.money=amount;
  ui.admin.log(ui.actor,'tester_money_set',{playerId:id(player),companyId:companyId(company),amount,reason});
  ui.toast('✅ Firmenkapital gesetzt');
  ui.render();
}

async function giveStarterPack(ui,player){
  const reason='ORVUNO Testerpaket Starter';
  const balance=await persistPlayerCoins(player,{delta:5000,reason});
  const until=Math.max(Date.now(),premiumTime(player))+7*86400000;
  await persistPlayerPremium(player,{enabled:true,until,reason});
  player.coins=balance;
  player.__adminWalletLoaded=true;
  player.premium=true;
  player.premiumUntil=until;
  player.premium_until=new Date(until).toISOString();
  ui.admin.log(ui.actor,'tester_package_credit',{playerId:id(player),coins:5000,premiumDays:7,reason});
  ui.toast('✅ Starter-Testerpaket vergeben');
  ui.render();
}

async function giveIntensivePack(ui,player){
  if(!confirm('Intensivtest-Paket mit 25.000 Coins und 30 Tagen Premium vergeben?'))return;
  const reason='ORVUNO Testerpaket Intensiv';
  const balance=await persistPlayerCoins(player,{delta:25000,reason});
  const until=Math.max(Date.now(),premiumTime(player))+30*86400000;
  await persistPlayerPremium(player,{enabled:true,until,reason});
  player.coins=balance;
  player.__adminWalletLoaded=true;
  player.premium=true;
  player.premiumUntil=until;
  player.premium_until=new Date(until).toISOString();
  ui.admin.log(ui.actor,'tester_package_intensive',{playerId:id(player),coins:25000,premiumDays:30,reason});
  ui.toast('✅ Intensivtest-Paket vergeben');
  ui.render();
}

const base=AdminConsoleUI.prototype.playerDetail;
AdminConsoleUI.prototype.playerDetail=function(player){
  loadWallet(this,player);
  player.premium=isPremium(player);
  base.call(this,player);
  if(!this.admin.can(this.actor,'players.write'))return;

  const box=panel('🧪 Tester- & Spielersteuerung');
  const premium=premiumUntil(player);
  const status=statusOf(player);
  box.append(
    row('Spieler-ID',String(id(player)||'—')),
    row('Aktuelle Coins',player.__adminWalletLoading?'wird geladen …':n(player.coins).toLocaleString('de-DE')),
    row('Premium bis',premium?new Date(premium).toLocaleString('de-DE'):'Kein Premium'),
    row('Accountstatus',status||'active')
  );

  const coinTitle=el('h4','🪙 Coins');
  const coinBar=el('div');coinBar.className='toolbar';
  for(const amount of [100,500,1000,5000,10000]){
    let b=null;
    b=btn(`+${amount.toLocaleString('de-DE')}`,()=>withBusy(this,b,()=>creditCoins(this,player,amount)));
    coinBar.append(b);
  }
  let customCoins=null;
  customCoins=btn('🪙 Frei ändern',()=>withBusy(this,customCoins,()=>changeCoins(this,player)));
  coinBar.append(customCoins);
  box.append(coinTitle,coinBar);

  const premiumTitle=el('h4','⭐ Premium');
  const premiumBar=el('div');premiumBar.className='toolbar';
  for(const days of [1,7,30,90]){
    let b=null;
    b=btn(`+${days} Tag${days===1?'':'e'}`,()=>withBusy(this,b,()=>addPremium(this,player,days)));
    premiumBar.append(b);
  }
  let customPremium=null;
  customPremium=btn('⭐ Tage frei eingeben',()=>withBusy(this,customPremium,()=>addCustomPremium(this,player)));
  premiumBar.append(customPremium);
  if(isPremium(player)){
    let revoke=null;
    revoke=btn('✕ Premium entfernen',()=>withBusy(this,revoke,()=>removePremium(this,player)));
    revoke.classList.add('danger');
    premiumBar.append(revoke);
  }
  box.append(premiumTitle,premiumBar);

  const accountTitle=el('h4','🔐 Account & Testzugang');
  const accountBar=el('div');accountBar.className='toolbar';
  let unlock=null;
  unlock=btn('🔓 Login-Sperren lösen',()=>withBusy(this,unlock,()=>unlockPlayer(this,player)));
  accountBar.append(unlock);
  if(this.admin.can(this.actor,'moderation.write')){
    if(status==='suspended'||status==='blocked'||player.moderation?.suspended){
      let activate=null;
      activate=btn('✅ Spieler aktivieren',()=>withBusy(this,activate,()=>setPlayerActive(this,player,true)));
      accountBar.append(activate);
    }else{
      let suspend=null;
      suspend=btn('⛔ Spieler sperren',()=>withBusy(this,suspend,()=>setPlayerActive(this,player,false)));
      suspend.classList.add('danger');
      accountBar.append(suspend);
    }
  }
  box.append(accountTitle,accountBar);

  const companies=playerCompanies(this,player);
  if(companies.length){
    const moneyTitle=el('h4','💶 Betriebskapital');
    const select=el('select');
    for(const company of companies){
      const option=el('option',`${companyName(company)} · ${n(company.money).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} €`);
      option.value=String(companyId(company)||'');
      select.append(option);
    }
    const primary=companies.find(c=>c.is_primary)||companies[0];
    select.value=String(companyId(primary)||'');
    const selectedCompany=()=>companies.find(c=>String(companyId(c)||'')===select.value)||companies[0];
    const moneyBar=el('div');moneyBar.className='toolbar';moneyBar.style.marginTop='8px';
    for(const amount of [10000,50000,100000,500000]){
      let b=null;
      b=btn(`+${amount.toLocaleString('de-DE')} €`,()=>withBusy(this,b,()=>creditCompany(this,player,selectedCompany(),amount)));
      moneyBar.append(b);
    }
    let exact=null;
    exact=btn('💶 Kapital exakt setzen',()=>withBusy(this,exact,()=>setCompanyBalance(this,player,selectedCompany())));
    moneyBar.append(exact);
    box.append(moneyTitle,select,moneyBar);
  }

  const packTitle=el('h4','🎁 Testerpakete');
  const packBar=el('div');packBar.className='toolbar';
  let starter=null;
  starter=btn('Starter: 5.000 Coins + 7 Tage Premium',()=>withBusy(this,starter,()=>giveStarterPack(this,player)));
  starter.style.fontWeight='900';
  let intensive=null;
  intensive=btn('Intensivtest: 25.000 Coins + 30 Tage Premium',()=>withBusy(this,intensive,()=>giveIntensivePack(this,player)));
  intensive.style.fontWeight='900';
  packBar.append(starter,intensive);
  box.append(packTitle,packBar);

  this.body.prepend(box);
};

if(typeof window!=='undefined')window.worldAdminTesterTools=true;
