// WorldProject – verbindet den bestehenden Einkaufs-/Produktionsdialog mit dem zentralen Maschinenmarkt.
// Keine neue UI: erweitert ausschließlich OperationalSupplyChainDialog.
import './OperationalPurchaseFeedbackIntegration.js';
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { recipesForCompany } from './OperationalSupplyChainSystem.js';
import { compatibleMachineIds } from './IndustryMachineCompatibility.js';
import { equipmentForMachineRequirement,buyIndustryEquipment,persistIndustryEquipment } from './IndustryEquipmentMarketplace.js';

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__worldEquipmentIntegrated){
 proto.__worldEquipmentIntegrated=true;
 const originalEnsure=proto.ensureMachines;
 proto.ensureMachines=function(company){
  originalEnsure.call(this,company);
  const machines=[...(this.planner.machines||[])],building=company?.buildingState?.equipment||[],recipes=recipesForCompany(company);
  for(const source of building){
   if(!source||source.status==='sold')continue;
   const sourceId=source.id||source.type,instanceId=source.instanceId||source.id||source.type;
   for(const recipe of recipes){
    const ids=compatibleMachineIds(company,recipe.machineType);
    if(!ids.includes(sourceId)&&sourceId!==recipe.machineType)continue;
    if(machines.some(x=>String(x.id)===String(instanceId)&&x.type===recipe.machineType))continue;
    machines.push({...source,id:instanceId,type:recipe.machineType,sourceType:sourceId,label:source.name||source.label||sourceId,busy:false,capacity:Number(source.capacity||0),condition:Number(source.condition??100)});
   }
  }
  for(const job of this.planner.queue||[]){
   if(job.status!=='running')continue;
   const id=job.machine?.id;
   if(id!=null)for(const machine of machines)if(String(machine.id)===String(id))machine.busy=true;
  }
  this.planner.machines=machines;
  return machines;
 };
 const originalCard=proto.renderProductionCard;
 proto.renderProductionCard=function(parent,recipe,company,recipes,panel){
  originalCard.call(this,parent,recipe,company,recipes,panel);
  const row=parent.lastElementChild;if(!row)return;
  const addPurchaseOptions=()=>{
   row.querySelector('.machine-purchase-options')?.remove();
   const current=this.planner.planForOutput?.(recipe,Number(recipe.output||1));
   if(current?.machineAvailable)return;
   const options=equipmentForMachineRequirement(company,recipe.machineType).filter(x=>!x.owned);
   if(!options.length)return;
   const box=this.el('div');box.className='machine-purchase-options';Object.assign(box.style,{marginTop:'8px',padding:'9px',border:'1px solid #e0a000',borderRadius:'7px',background:'#fff8df'});
   box.append(this.el('strong','Benötigte Maschine kaufen:'));
   for(const option of options)box.append(this.btn(`${option.name||option.label||option.id} · ${this.money(option.price)}`,async()=>{try{buyIndustryEquipment(company,option.id,{requestId:`dialog-machine-${option.id}-${Date.now()}`});await persistIndustryEquipment(company);this.ensureMachines(company);this.render(panel);}catch(error){alert(error.message);}}));
   row.append(box);
  };
  try{addPurchaseOptions();}catch{}
 };
}
