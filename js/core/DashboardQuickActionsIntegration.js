// WorldProject - zentrale Schnellleiste im Wirtschaftsdashboard.
// Haelt die wichtigsten Alltagsaktionen ohne Scroll-/Suchwege erreichbar.
import { EconomyDashboard } from './EconomyDashboard.js';

const originalRender=EconomyDashboard.prototype.render;
function quickButton(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;Object.assign(b.style,{border:'1px solid #475569',borderRadius:'9px',padding:'9px 11px',cursor:'pointer',fontWeight:'800',background:'#0f172a',color:'#fff',whiteSpace:'nowrap'});b.addEventListener('click',fn);return b;}
function addQuickActions(dashboard,panel){
 if(!panel||panel.querySelector('[data-world-dashboard-quick-actions]'))return;
 const bar=document.createElement('div');bar.dataset.worldDashboardQuickActions='1';Object.assign(bar.style,{display:'flex',flexWrap:'wrap',gap:'7px',padding:'10px',margin:'8px 0 14px',background:'rgba(15,23,42,.82)',border:'1px solid #334155',borderRadius:'11px',position:'sticky',top:'58px',zIndex:'25'});
 bar.append(
  quickButton('📦 Einkauf',()=>dashboard.openOperationalSupplyChain?.('buy')),
  quickButton('🚚 Lieferungen',()=>dashboard.openOperationalSupplyChain?.('deliveries')),
  quickButton('🏭 Produktion',()=>dashboard.openOperationalSupplyChain?.('production')),
  quickButton('⚙️ Ausbau',()=>window.worldTimedBusinessUpgrades?.open?.()),
  quickButton('🚦 Verkehr',()=>window.worldLiveTrafficDelivery?.open?.()||window.worldLiveTrafficUI?.open?.()),
  quickButton('📋 Läuft gerade',()=>window.worldActiveOperationsUI?.open?.())
 );
 const head=panel.firstElementChild;if(head?.nextSibling)panel.insertBefore(bar,head.nextSibling);else panel.append(bar);
}
EconomyDashboard.prototype.render=function(panel){const result=originalRender.call(this,panel);addQuickActions(this,panel);return result;};

export function runDashboardQuickActionsTest(){return typeof EconomyDashboard.prototype.render==='function';}
if(typeof window!=='undefined')window.runDashboardQuickActionsTest=runDashboardQuickActionsTest;
