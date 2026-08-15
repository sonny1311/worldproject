// WorldProject – direkter Wechsel zwischen eigenen Betrieben.
import { businessPortfolio } from './AccountMultiplayerIntegration.js';
import { businessAttention } from './BusinessAttentionIndicator.js';

const idOf=c=>String(c?.id??c?.serverCompanyId??'');
const activeId=()=>String((businessPortfolio.activeCompany||window.worldPlayerCompany)?.serverCompanyId||window.worldActiveServerCompany?.id||'');
function sortCompanies(list=[]){return [...list].sort((a,b)=>Number(a.slot_no||0)-Number(b.slot_no||0));}
function btn(text,title=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;Object.assign(b.style,{border:'1px solid #475569',borderRadius:'9px',padding:'8px 10px',background:'#0f172a',color:'#fff',fontWeight:'800',cursor:'pointer',maxWidth:'260px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});return b;}
function attentionSignature(company){const a=businessAttention(company);return a.items.map(x=>x.kind+':'+x.label).sort().join('|');}
const seen=new Map();
function acknowledge(company){seen.set(idOf(company),attentionSignature(company));}
function unseenAttention(company){const a=businessAttention(company),sig=attentionSignature(company);return{...a,unseen:a.needsAttention&&seen.get(idOf(company))!==sig};}
export function mountBusinessQuickSwitcher(){
 let host=document.getElementById('world-business-quick-switcher');if(host)return host;
 host=document.createElement('div');host.id='world-business-quick-switcher';Object.assign(host.style,{position:'fixed',top:'10px',left:'50%',transform:'translateX(-50%)',zIndex:'18000',display:'flex',alignItems:'center',gap:'6px',padding:'7px',borderRadius:'12px',background:'rgba(2,6,23,.92)',boxShadow:'0 5px 18px rgba(0,0,0,.35)',maxWidth:'calc(100vw - 24px)'});document.body.append(host);
 async function render(){try{await businessPortfolio.refresh();}catch{return;}const list=sortCompanies(businessPortfolio.companies);host.innerHTML='';if(!list.length){host.style.display='none';return;}host.style.display='flex';let idx=Math.max(0,list.findIndex(c=>idOf(c)===activeId()));if(idx<0)idx=0;const current=list[idx]||list[0],prev=list[(idx-1+list.length)%list.length],next=list[(idx+1)%list.length];if(current)acknowledge(current);
  const left=btn('◀',prev?.name||'Vorheriger Betrieb');left.disabled=list.length<2;left.onclick=()=>switchTo(prev);
  const curA=unseenAttention(current),center=btn(`${current?.name||'Betrieb'} · ${idx+1}/${list.length}${curA.needsAttention?' 🔔'+curA.count:''}`,'Aktiver Betrieb – klicken für komplette Betriebsliste');center.onclick=()=>window.worldAccounts?.businessPortfolioDialog?.open?.();center.style.borderColor='#60a5fa';
  const rightA=unseenAttention(next),right=btn(`${next?.name||'▶'}${rightA.needsAttention?' 🔔'+rightA.count:''} ▶`,next?.name||'Nächster Betrieb');right.disabled=list.length<2;right.onclick=()=>switchTo(next);if(rightA.unseen){right.style.animation='worldBusinessPulse .65s ease-in-out 3';right.style.borderColor='#fbbf24';right.style.boxShadow='0 0 14px rgba(251,191,36,.7)';}
  host.append(left,center,right);
  const attention=list.filter(c=>idOf(c)!==activeId()).map(c=>({c,a:unseenAttention(c)})).filter(x=>x.a.needsAttention);if(attention.length){const bell=btn(`🔔 ${attention.reduce((s,x)=>s+x.a.count,0)}`,'Andere Betriebe brauchen Aufmerksamkeit');bell.onclick=()=>switchTo(attention[0].c);host.append(bell);}
 }
 function switchTo(company){if(!company)return;businessPortfolio.activate(company,window.worldPlayerCompany||{});acknowledge(company);render();}
 if(!document.getElementById('world-business-pulse-style')){const st=document.createElement('style');st.id='world-business-pulse-style';st.textContent='@keyframes worldBusinessPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07);box-shadow:0 0 24px rgba(251,191,36,.95)}}';document.head.append(st);}
 window.addEventListener('worldproject:company-switched',render);window.addEventListener('world:server-balances-changed',render);window.addEventListener('world:internal-goods-transferred',render);window.addEventListener('world:solar-changed',render);setInterval(render,15000);render();window.worldBusinessQuickSwitcher={render,switchTo,acknowledge};return host;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountBusinessQuickSwitcher);else mountBusinessQuickSwitcher();

export function runBusinessQuickSwitcherLogicTest(){const a={id:1,slot_no:2},b={id:2,slot_no:1};const s=sortCompanies([a,b]);if(s[0]!==b||s[1]!==a)throw new Error('Betriebswechsler sortiert Slots falsch');return true;}
