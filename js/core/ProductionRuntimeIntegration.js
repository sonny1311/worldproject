// WorldProject - haelt die bestehende operative Produktionswarteschlange auch bei geschlossener UI aktiv.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const currentCompany=()=>window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;
const currentId=c=>c?.serverCompanyId||c?.id||c?.companyId||null;

export function advanceOperationalProduction(now=Date.now()){
 const company=currentCompany(),id=currentId(company);
 if(!company||!id)return false;
 if(!window.worldOperationalSupplyChainDialog)window.worldOperationalSupplyChainDialog=new OperationalSupplyChainDialog({companyProvider:currentCompany,parent:document.body});
 const dialog=window.worldOperationalSupplyChainDialog;
 if(dialog.overlay?.isConnected)return false;
 if(dialog.loadedCompanyId!==id){dialog.loadedCompanyId=null;dialog.loadState(company);}
 dialog.ensureMachines?.(company);
 const before=(dialog.planner?.queue||[]).map(j=>`${j.id}:${j.status}:${j.finishAt||0}:${j.storageBlocked?'1':'0'}`).join('|');
 dialog.orders?.advance?.(now);
 dialog.planner?.advance?.(now);
 const started=dialog.tryAutoStartNextProduction?.();
 const after=(dialog.planner?.queue||[]).map(j=>`${j.id}:${j.status}:${j.finishAt||0}:${j.storageBlocked?'1':'0'}`).join('|');
 if(started||before!==after)dialog.saveState?.(company);
 return !!started||before!==after;
}

let timer=null;
export function startProductionRuntime(){if(timer)return timer;advanceOperationalProduction();timer=setInterval(()=>advanceOperationalProduction(),5000);return timer;}
export function stopProductionRuntime(){if(timer)clearInterval(timer);timer=null;}

if(typeof window!=='undefined'){
 window.worldAdvanceOperationalProduction=advanceOperationalProduction;
 const start=()=>startProductionRuntime();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
