// WorldProject – alle eigenen Betriebe verwenden ein gemeinsames Firmenkonto.
import { BusinessPortfolioDialog } from './BusinessPortfolioDialog.js';

const proto=BusinessPortfolioDialog.prototype;
if(!proto.__worldSharedBusinessFinanceUi){
 proto.__worldSharedBusinessFinanceUi=true;
 const originalRender=proto.render;
 proto.render=async function(panel){
  const result=await originalRender.call(this,panel);
  const overview=window.worldServerAccountOverview||{};
  const companies=(overview.companies||[]).filter(c=>!c.closed_at);
  const primary=companies.find(c=>c.is_primary)||companies[0];
  const balance=Number(primary?.game_state?.money??primary?.money??0);
  const heading=[...panel.querySelectorAll('h2')].find(x=>(x.textContent||'').includes('Meine Betriebe'));
  if(heading&&!panel.querySelector('[data-shared-business-balance]')){
   const note=document.createElement('div');note.dataset.sharedBusinessBalance='1';
   note.textContent=`💶 Gemeinsames Firmenkonto: ${balance.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} € · dieser Kontostand gilt für alle eigenen Betriebe.`;
   Object.assign(note.style,{margin:'8px 0 14px',padding:'10px 12px',border:'1px solid #2d6a4f',borderRadius:'9px',background:'#e9f7ef',color:'#173d2b',fontWeight:'800'});
   heading.parentElement?.insertAdjacentElement('afterend',note);
  }
  // Geldtransfers zwischen eigenen Betrieben sind bei einem gemeinsamen Firmenkonto sinnlos.
  for(const h of panel.querySelectorAll('h3'))if((h.textContent||'').includes('Spielgeld zwischen eigenen Betrieben übertragen'))h.parentElement?.remove();
  return result;
 };
}
