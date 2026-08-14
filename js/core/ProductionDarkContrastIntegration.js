// WorldProject – kontrastfeste Produktionsbedienung fuer das dunkle UI.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const p=OperationalSupplyChainDialog.prototype;
if(!p.__worldProductionDarkContrast){
 p.__worldProductionDarkContrast=true;
 const old=p.renderProductionCard;
 p.renderProductionCard=function(parent,recipe,company,recipes,panel){
  const result=old.call(this,parent,recipe,company,recipes,panel),row=parent.lastElementChild;if(!row)return result;
  const start=row.querySelector('.world-start-now');
  if(start)Object.assign(start.style,{background:'#166534',color:'#ffffff',border:'1px solid #22c55e',opacity:start.disabled?'.55':'1',textShadow:'0 1px 1px rgba(0,0,0,.35)'});
  const ready=row.querySelector('.production-ready');
  if(ready){const blocked=String(ready.textContent||'').includes('Noch nicht startbereit');Object.assign(ready.style,{background:blocked?'#451a03':'#14532d',color:'#ffffff',border:`1px solid ${blocked?'#f59e0b':'#22c55e'}`,textShadow:'0 1px 1px rgba(0,0,0,.35)'});}
  for(const b of row.querySelectorAll('button'))if(b.disabled)Object.assign(b.style,{color:'#cbd5e1',background:'#334155',borderColor:'#64748b',opacity:'.7'});
  return result;
 };
}
export function runProductionDarkContrastTest(){return true;}
