// WorldProject – eindeutiger Produktionsstatus im Wirtschaftsdashboard.
import './ProductionQueueClarityIntegration.js';
import { EconomyDashboard } from './EconomyDashboard.js';

function ts(v){if(v instanceof Date)return v.getTime();const n=Number(v);if(Number.isFinite(n)&&n>0)return n;const p=Date.parse(v);return Number.isFinite(p)?p:null;}
function pct(j){const s=String(j?.status||'').toLowerCase();if(!['running','paused'].includes(s))return null;const a=ts(j.startedAt||j.startAt),b=ts(j.finishAt||j.completeAt);if(!a||!b||b<=a)return 0;return Math.max(0,Math.min(100,Math.floor((Date.now()-a)/(b-a)*100)));}
function name(d,j){return j?.recipe?.label||d.label(j?.productId||j?.product||j?.recipeId)||'Produktion';}
function text(d,jobs){const running=jobs.find(j=>String(j?.status||'').toLowerCase()==='running');if(running)return running.storageBlocked?`🔴 FERTIG: ${name(d,running)} · wartet auf Lagerplatz`:`🟢 LÄUFT: ${name(d,running)} · ${pct(running)??0} %`;const paused=jobs.find(j=>String(j?.status||'').toLowerCase()==='paused');if(paused)return `🟠 PAUSIERT: ${name(d,paused)} · ${pct(paused)??0} %`;const planned=jobs.filter(j=>['queued','planned','scheduled'].includes(String(j?.status||'').toLowerCase())).length;return planned?`🟡 KEINE PRODUKTION AKTIV · ${planned} geplant`:'⚪ KEINE PRODUKTION AKTIV';}

const p=EconomyDashboard.prototype;
if(!p.__worldProductionStatusBanner){
 p.__worldProductionStatusBanner=true;
 const oldRender=p.render;
 p.render=function(panel){const r=oldRender.call(this,panel),card=panel.querySelector('#dashboard-production'),jobs=this.operationsOverview?.activeProduction?.()||[];if(card){card.querySelector('[data-live-production-status]')?.remove();const b=document.createElement('div');b.dataset.liveProductionStatus='1';b.textContent=text(this,jobs);Object.assign(b.style,{padding:'10px 12px',margin:'9px 0',borderRadius:'8px',fontWeight:'800',background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.18)'});card.insertBefore(b,card.children[1]||null);}return r;};
 const oldOpen=p.open;
 p.open=function(...args){const r=oldOpen.apply(this,args);clearInterval(this.productionStatusBannerTimer);this.productionStatusBannerTimer=setInterval(()=>{if(!this.overlay?.isConnected)return;const el=this.overlay.querySelector('[data-live-production-status]');if(el)el.textContent=text(this,this.operationsOverview?.activeProduction?.()||[]);},2000);return r;};
 const oldClose=p.close;
 p.close=function(...args){clearInterval(this.productionStatusBannerTimer);this.productionStatusBannerTimer=null;return oldClose.apply(this,args);};
}
