// WorldProject – direkter Wechsel zwischen eigenen Betrieben.
import { businessPortfolio } from './AccountMultiplayerIntegration.js';
import { businessAttention } from './BusinessAttentionIndicator.js';

const idOf=c=>String(c?.id??c?.serverCompanyId??'');
const activeId=()=>String((businessPortfolio.activeCompany||window.worldPlayerCompany)?.serverCompanyId||window.worldActiveServerCompany?.id||'');
function sortCompanies(list=[]){return [...list].sort((a,b)=>Number(a.slot_no||0)-Number(b.slot_no||0));}
function btn(text,title=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;Object.assign(b.style,{border:'1px solid #475569',borderRadius:'9px',padding:'8px 10px',background:'#0f172a',color:'#fff',fontWeight:'800',cursor:'pointer',maxWidth:'260px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});return b;}
function attentionSignature(company){const a=businessAttention(company);return a.items.map(x=>x.key||x.kind+':'+x.label).sort().join('|');}
const STORAGE_KEY='worldproject_seen_business_attention_v1';
function loadSeen(){try{return new Map(Object.entries(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')));}catch{return new Map();}}
const seen=loadSeen();
function saveSeen(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(Object.fromEntries(seen)));}catch{}}
function acknowledge(company){seen.set(idOf(company),attentionSignature(company));saveSeen();}
function unseenAttention(company){const a=businessAttention(company),sig=attentionSignature(company),unseen=a.needsAttention&&seen.get(idOf(company))!==sig;return{...a,unseen};}
export function mountBusinessQuickSwitcher(){
 let host=document.getElementById('world-business-quick-switcher');if(host)return host;
 host=document.createElement('div');host.id='world-business-quick-switcher';Object.assign(host.style,{position:'fixed',top:'10px',left:'50%',transform:'translateX(-50%)',zIndex:'18000',display:'flex',alignItems:'center',gap:'6px',padding:'7px',borderRadius:'12px',background:'rgba(2,6,23,.92)',boxShadow:'0 5px 18px rgba(0,0,0,.35)',maxWidth:'calc(100vw - 24px)'});document.body.append(host);
 async function render(){try{await businessPortfolio.refresh();}catch{return;}const list=sortCompanies(businessPortfolio.companies);host.innerHTML='';if(!list.length){host.style.display='none';return;}host.style.display='flex';let idx=list.findIndex(c=>idOf(c)===activeId());if(idx<0)idx=0;const current=list[idx]||list[0],prev=list[(idx-1+list.length)%list.length],next=list[(idx+1)%list.length];if(current)acknowledge(current);
  const left=btn(`◀ ${prev?.name||''}`,prev?.name||'Vorheriger Betrieb');left.disabled=list.length<2;left.onclick=()=>switchTo(prev,false);
  const currentAttention=businessAttention(current),center=btn(`${current?.name||'Betrieb'} · ${idx+1}/${list.length}${currentAttention.needsAttention?' · '+currentAttention.count+' offen':''}`,'Aktiver Betrieb – klicken für komplette Betriebsliste');center.onclick=()=>window.worldAccounts?.businessPortfolioDialog?.open?.();center.style.borderColor='#60a5fa';
  const rightA=unseenAttention(next),right=btn(`${next?.name||'Nächster Betrieb'}${rightA.unseen?' 🔔'+rightA.count:''} ▶`,next?.name||'Nächster Betrieb');right.disabled=list.length<2;right.onclick=()=>switchTo(next,rightA.unseen);if(rightA.unseen){right.style.borderColor='#fbbf24';right.style.boxShadow='0 0 14px rgba(251,191,36,.55)';right.style.animation='worldBusinessPulse .65s ease-in-out 3';}
  host.append(left,center,right);
  const attention=list.filter(c=>idOf(c)!==activeId()).map(c=>({c,a:unseenAttention(c)})).filter(x=>x.a.unseen);if(attention.length){const total=attention.reduce((s,x)=>s+x.a.count,0),bell=btn(`🔔 ${total}`,`${attention.length} noch ungesehene Betriebe brauchen Aufmerksamkeit`);bell.onclick=()=>switchTo(attention[0].c,true);host.append(bell);}
 }
 function switchTo(company,openAttention=false){if(!company)return;const before=businessAttention(company),target=before.items[0]?.target||null;businessPortfolio.activate(company,window.worldPlayerCompany||{});acknowledge(company);render();if(openAttention&&target)setTimeout(()=>window.dispatchEvent(new CustomEvent('world:business-attention-open',{detail:{company,target,attention:before}})),50);}
 if(!document.getElementById('world-business-pulse-style')){const st=document.createElement('style');st.id='world-business-pulse-style';st.textContent='@keyframes worldBusinessPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07);box-shadow:0 0 24px rgba(251,191,36,.95)}}';document.head.append(st);}
 for(const ev of ['worldproject:company-switched','world:server-balances-changed','world:internal-goods-transferred','world:solar-changed','world:access-granted','world:user-login'])window.addEventListener(ev,render);
 setInterval(render,15000);render();window.worldBusinessQuickSwitcher={render,switchTo,acknowledge};return host;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountBusinessQuickSwitcher);else mountBusinessQuickSwitcher();

export function runBusinessQuickSwitcherLogicTest(){const a={id:1,slot_no:2},b={id:2,slot_no:1};const s=sortCompanies([a,b]);if(s[0]!==b||s[1]!==a)throw new Error('Betriebswechsler sortiert Slots falsch');return true;}
