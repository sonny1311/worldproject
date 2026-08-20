// ORVUNO – revisionssichere Admin-Gutschriften und Spielerentschädigungen.
import { AdminConsoleUI } from './AdminConsoleUI.js';
import { persistCompanyMoney, persistPlayerCompensation } from './AdminServerPersistenceBridge.js';

const h=(tag,props={},...kids)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(props||{})){if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k.startsWith('on')&&typeof v==='function')e.addEventListener(k.slice(2).toLowerCase(),v);else if(v!==undefined&&v!==null)e.setAttribute(k,String(v));}for(const x of kids.flat())if(x!==null&&x!==undefined)e.append(x?.nodeType?x:document.createTextNode(String(x)));return e;};
const uid=x=>String(x?.id||x?.user_id||x?.userId||'');
const makeRequestId=()=>globalThis.crypto?.randomUUID?.()||`admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const pendingKey=p=>`orvuno-admin-compensation:${uid(p)}`;
function readPending(p){try{return JSON.parse(sessionStorage.getItem(pendingKey(p))||'null');}catch{return null;}}
function writePending(p,value){try{if(value)sessionStorage.setItem(pendingKey(p),JSON.stringify(value));else sessionStorage.removeItem(pendingKey(p));}catch{}}
function samePending(a,b){return a&&Number(a.money)===Number(b.money)&&Number(a.coins)===Number(b.coins)&&String(a.reason)===String(b.reason)&&a.requestId;}

const basePlayerDetail=AdminConsoleUI.prototype.playerDetail;
AdminConsoleUI.prototype.playerDetail=function(player){
  basePlayerDetail?.call(this,player);
  if(!this.admin.can(this.actor,'economy.write'))return;
  const money=h('input',{type:'number',min:'0',max:'100000000',step:'1',value:'0',placeholder:'Firmengeld €'});
  const coins=h('input',{type:'number',min:'0',max:'1000000',step:'1',value:'0',placeholder:'Coins'});
  const reason=h('input',{type:'text',maxlength:'500',placeholder:'Grund, z. B. Entschädigung wegen Fehler'});
  const status=h('div',{class:'section-note',text:'Serverseitige Gutschrift mit Audit-Protokoll und Doppelbuchungsschutz. Mindestens Geld oder Coins muss größer 0 sein.'});
  const send=h('button',{class:'action',text:'🎁 Entschädigung senden'});
  send.addEventListener('click',async()=>{
    const m=Number(money.value||0),c=Math.trunc(Number(coins.value||0)),r=String(reason.value||'').trim();
    if(!Number.isFinite(m)||m<0||m>100000000)return this.toast('Ungültiger Geldbetrag',true);
    if(!Number.isFinite(c)||c<0||c>1000000)return this.toast('Ungültiger Coinbetrag',true);
    if(m===0&&c===0)return this.toast('Geld oder Coins müssen größer 0 sein',true);
    if(r.length<3)return this.toast('Bitte eine Begründung eingeben',true);
    const payload={money:m,coins:c,reason:r};
    let pending=readPending(player);
    if(!samePending(pending,payload)){pending={...payload,requestId:makeRequestId()};writePending(player,pending);}
    const label=[m>0?`${m.toLocaleString('de-DE')} €`:null,c>0?`${c.toLocaleString('de-DE')} Coins`:null].filter(Boolean).join(' + ');
    if(!confirm(`${label} an ${player.username||player.name||uid(player)} als Entschädigung senden?\n\nGrund: ${r}`))return;
    send.disabled=true;
    try{
      const result=await persistPlayerCompensation(player,{...payload,requestId:pending.requestId});
      writePending(player,null);
      status.textContent=result?.replayed?'✅ Vorgang war bereits verbucht – keine Doppelgutschrift.':'✅ Entschädigung serverseitig verbucht.';
      this.toast(result?.replayed?'Bereits verbucht – nicht doppelt ausgezahlt':'Entschädigung erfolgreich gesendet');
      window.dispatchEvent(new CustomEvent('world:admin-compensation-sent',{detail:{playerId:uid(player),result}}));
    }catch(error){
      status.textContent=`❌ Nicht bestätigt: ${error.message}. Die Vorgangs-ID bleibt für einen sicheren erneuten Versuch gespeichert.`;
      this.toast(error.message,true);
    }finally{send.disabled=false;}
  });
  this.body.append(h('div',{class:'panel'},h('h3',{text:'🎁 Spieler entschädigen'}),status,h('div',{class:'toolbar'},money,coins),reason,h('div',{style:'margin-top:10px'},send)));
};

const baseCompanyDetail=AdminConsoleUI.prototype.companyDetail;
AdminConsoleUI.prototype.companyDetail=function(company){
  baseCompanyDetail?.call(this,company);
  if(!this.admin.can(this.actor,'economy.write'))return;
  const buttons=[...this.body.querySelectorAll('button.action')];
  const old=buttons.find(b=>String(b.textContent||'').includes('Kapital setzen'));
  if(!old)return;
  const secure=h('button',{class:'action',text:'💶 Kapital setzen'});
  secure.addEventListener('click',async()=>{
    const amount=Number(prompt('Neues Firmenkapital:',String(company.money||0)));
    if(!Number.isFinite(amount)||amount<0)return this.toast('Ungültiger Betrag',true);
    const reason=prompt('Begründung für „Firmenkapital setzen“:');
    if(reason===null)return;
    secure.disabled=true;
    try{
      await persistCompanyMoney(company,amount,String(reason).trim());
      this.toast('Firmenkapital serverseitig geändert');
      this.render();
    }catch(error){this.toast(error.message,true);}finally{secure.disabled=false;}
  });
  old.replaceWith(secure);
};

if(typeof window!=='undefined')window.worldAdminCompensationConsoleView=true;
