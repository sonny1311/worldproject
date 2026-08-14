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
  const best=[...matching].sort((a,b)=>Number(b.condition??100)-Number(a.condition??100))[0],state=machineConditionState(best),box=this.el('div');box.dataset.machineCondition='1';Object.assign(box.style,{margin:'7px 0',padding:'7px 9px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',background:state.state==='critical'?'#fee2e2':state.state==='maintenance_due'?'#ffedd5':'#dcfce7',color:'#111827'});box.textContent=state.state==='critical'?`🔴 Maschine ${Math.round(state.condition)} % · Wartung erforderlich – kein neuer Produktionsstart`:state.state==='maintenance_due'?`🟠 Maschine ${Math.round(state.condition)} % · Wartung bald empfohlen`:`🟢 Maschine ${Math.round(state.condition)} % · betriebsbereit`;row.insertBefore(box,row.children[1]||null);return result;
 };
}
export function runMachineConditionVisibilityTest(){return typeof machineConditionState==='function';}
