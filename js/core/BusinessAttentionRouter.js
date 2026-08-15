// WorldProject – führt nach einem Betriebsalarm möglichst direkt zur Ursache.
import { operationalSupplyChainDialog } from './AccountMultiplayerIntegration.js';

function scrollToHeading(terms=[]){setTimeout(()=>{const nodes=[...document.querySelectorAll('h2,h3,h4,strong')],target=nodes.find(el=>terms.some(t=>String(el.textContent||'').toLocaleLowerCase('de').includes(t)));target?.scrollIntoView?.({behavior:'smooth',block:'center'});},120);}
export async function openBusinessAttentionTarget(target){
 if(['production','deliveries'].includes(target)){
  await operationalSupplyChainDialog.open();
  scrollToHeading(target==='production'?['produktion','produktions']:['lieferung','laufende lieferungen','wareneingang']);
  return true;
 }
 if(target==='maintenance'){
  if(window.worldMachineMaintenanceUI?.open){window.worldMachineMaintenanceUI.open();return true;}
  window.dispatchEvent(new CustomEvent('world:navigate',{detail:{target:'maintenance'}}));return true;
 }
 if(target==='construction'){
  if(window.worldTimedBusinessUpgrades?.open){window.worldTimedBusinessUpgrades.open();return true;}
  window.dispatchEvent(new CustomEvent('world:navigate',{detail:{target:'construction'}}));return true;
 }
 if(target==='orders'){
  window.dispatchEvent(new CustomEvent('world:navigate',{detail:{target:'customer-orders'}}));
  const dashboard=document.querySelector('[data-world-economy-dashboard],.world-economy-dashboard');dashboard?.scrollIntoView?.({behavior:'smooth'});return true;
 }
 return false;
}
window.addEventListener('world:business-attention-open',e=>openBusinessAttentionTarget(e.detail?.target).catch(err=>console.warn('Aufmerksamkeitsziel konnte nicht geöffnet werden',err)));
export function runBusinessAttentionRouterTest(){return typeof openBusinessAttentionTarget==='function';}
