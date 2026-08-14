// WorldProject - zeigt Maschinenzustand direkt dort, wo Produktion geplant wird.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { machineConditionState } from './MachineConditionProductionGuard.js';

const p=OperationalSupplyChainDialog.prototype;
if(!p.__worldMachineConditionVisibility){
 p.__worldMachineConditionVisibility=true;
 const old=p.renderProductionCard;
 p.renderProductionCard=function(parent,recipe,company,recipes,panel){
  const result=old.call(this,parent,recipe,company,recipes,panel),row=parent.lastElementChild;if(!row)return result;
  const matching=(this.planner?.machines||[]).filter(m=>m.type===recipe.machineType);
  if(!matching.length)return result;
  const best=[...matching].sort((a,b)=>Number(b.condition??100)-Number(a.condition??100))[0],state=machineConditionState(best),box=this.el('div');
  box.dataset.machineCondition='1';
  const palette=state.state==='critical'?{background:'#7f1d1d',border:'#ef4444'}:state.state==='maintenance_due'?{background:'#78350f',border:'#f59e0b'}:{background:'#14532d',border:'#22c55e'};
  Object.assign(box.style,{margin:'7px 0',padding:'8px 10px',borderRadius:'7px',fontSize:'12px',fontWeight:'800',background:palette.background,border:`1px solid ${palette.border}`,color:'#ffffff',textShadow:'0 1px 1px rgba(0,0,0,.35)'});
  box.textContent=state.state==='critical'?`🔴 Maschine ${Math.round(state.condition)} % · Wartung erforderlich – kein neuer Produktionsstart`:state.state==='maintenance_due'?`🟠 Maschine ${Math.round(state.condition)} % · Wartung bald empfohlen`:`🟢 Maschine ${Math.round(state.condition)} % · betriebsbereit`;
  row.insertBefore(box,row.children[1]||null);return result;
 };
}
export function runMachineConditionVisibilityTest(){return typeof machineConditionState==='function';}
