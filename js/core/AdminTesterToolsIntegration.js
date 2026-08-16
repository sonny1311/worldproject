// ORVUNO – Testerwerkzeuge im Adminbereich.
// Serverkritische Änderungen werden erst nach erfolgreicher RPC-Antwort als Erfolg angezeigt.
import { AdminConsoleUI } from './AdminConsoleUI.js';
import { persistPlayerCoins, persistPlayerPremium, persistCompanyMoney } from './AdminServerPersistenceBridge.js';

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const id=x=>x?.id||x?.userId||x?.user_id||null;
const el=(tag,text='')=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
const btn=(text,fn)=>{const b=el('button',text);b.className='action';b.onclick=fn;return b;};
function panel(title){const p=el('div');p.className='panel';const h=el('h3',title);p.append(h);return p;}
function row(label,value){const r=el('div');r.className='kv';r.append(el('span',label),el('b',value));return r;}
function playerCompanies(ui,player){const uid=String(id(player)||'');return ui.companies().filter(c=>String(c.user_id||c.userId||'')===uid);}
async function withBusy(ui,button,work){if(button.disabled)return;const old=button.textContent;button.disabled=true;button.textContent='Speichere …';try{await work();}catch(error){ui.toast(error?.message||String(error),true);}finally{button.disabled=false;button.textContent=old;}}

const base=AdminConsoleUI.prototype.playerDetail;
AdminConsoleUI.prototype.playerDetail=function(player){
  base.call(this,player);
  if(!this.admin.can(this.actor,'players.write'))return;
  const box=panel('🧪 Tester-Gutschriften');
  const premiumUntil=player.premium_until||player.premiumUntil||null;
  box.append(row('Aktuelle Coins',n(player.coins).toLocaleString('de-DE')),row('Premium bis',premiumUntil?new Date(premiumUntil).toLocaleString('de-DE'):'Kein Premium'));

  const coinBar=el('div');coinBar.className='toolbar';
  for(const amount of [100,500,1000,5000]){const b=btn(`+${amount.toLocaleString('de-DE')} Coins`,()=>withBusy(this,b,async()=>{const reason=`Tester-Gutschrift +${amount} Coins`;const balance=await persistPlayerCoins(player,{delta:amount,reason});player.coins=balance;this.admin.log(this.actor,'tester_coins_credit',{playerId:id(player),amount,balance,reason});this.toast(`✅ ${amount.toLocaleString('de-DE')} Coins gutgeschrieben`);this.render();}));coinBar.append(b);}
  const custom=btn('🪙 Coins frei eingeben',()=>withBusy(this,custom,async()=>{const amount=Number(prompt('Coins hinzufügen oder abziehen:','1000'));if(!Number.isFinite(amount)||amount===0)return;const reason=prompt('Begründung:','Tester-Gutschrift');if(reason===null)return;const balance=await persistPlayerCoins(player,{delta:Math.trunc(amount),reason});player.coins=balance;this.admin.log(this.actor,'tester_coins_adjust',{playerId:id(player),amount:Math.trunc(amount),balance,reason});this.toast('✅ Coin-Konto serverseitig geändert');this.render();}));coinBar.append(custom);box.append(coinBar);

  const premBar=el('div');premBar.className='toolbar';
  for(const days of [1,7,30]){const b=btn(`⭐ ${days} Tag${days===1?'':'e'} Premium`,()=>withBusy(this,b,async()=>{const current=Math.max(Date.now(),Number(new Date(player.premium_until||player.premiumUntil||0))||0),until=current+days*86400000,reason=`Tester-Premium ${days} Tag${days===1?'':'e'}`;const result=await persistPlayerPremium(player,{enabled:true,until,reason});player.premium=true;player.premiumUntil=result?.premium_until?new Date(result.premium_until).getTime():until;player.premium_until=result?.premium_until||new Date(until).toISOString();this.admin.log(this.actor,'tester_premium_credit',{playerId:id(player),days,until:player.premium_until,reason});this.toast(`✅ ${days} Tag${days===1?'':'e'} Premium vergeben`);this.render();}));premBar.append(b);}
  box.append(premBar);

  const companies=playerCompanies(this,player);
  if(companies.length){const company=companies.find(c=>c.is_primary)||companies[0];box.append(row('Hauptbetrieb',`${company.name||'Betrieb'} · ${n(company.money).toLocaleString('de-DE',{minimumFractionDigits:2})} €`));const moneyBar=el('div');moneyBar.className='toolbar';for(const amount of [10000,50000,100000]){const b=btn(`💶 +${amount.toLocaleString('de-DE')} €`,()=>withBusy(this,b,async()=>{const after=n(company.money)+amount,reason=`Tester-Gutschrift +${amount} EUR`;await persistCompanyMoney(company,after,reason);company.money=after;this.admin.log(this.actor,'tester_money_credit',{playerId:id(player),companyId:company.id,amount,after,reason});this.toast(`✅ ${amount.toLocaleString('de-DE')} € gutgeschrieben`);this.render();}));moneyBar.append(b);}box.append(moneyBar);}

  const pack=btn('🎁 Testerpaket: 5.000 Coins + 7 Tage Premium',()=>withBusy(this,pack,async()=>{const reason='ORVUNO Testerpaket',balance=await persistPlayerCoins(player,{delta:5000,reason}),current=Math.max(Date.now(),Number(new Date(player.premium_until||player.premiumUntil||0))||0),until=current+7*86400000;await persistPlayerPremium(player,{enabled:true,until,reason});player.coins=balance;player.premium=true;player.premiumUntil=until;player.premium_until=new Date(until).toISOString();this.admin.log(this.actor,'tester_package_credit',{playerId:id(player),coins:5000,premiumDays:7,reason});this.toast('✅ Testerpaket vollständig serverseitig vergeben');this.render();}));pack.style.fontWeight='900';box.append(pack);
  this.body.prepend(box);
};

if(typeof window!=='undefined')window.worldAdminTesterTools=true;
