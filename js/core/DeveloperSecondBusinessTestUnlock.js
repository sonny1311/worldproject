// WorldProject - Entwicklungsfreigabe fuer den Mehrbetriebs-/Gewerbeauswahl-Test.
// Nur fuer die aktuelle Aufbauphase: Die zweite Betriebsgruendung umgeht Fortschritts-/Kreditvoraussetzungen,
// damit Portfolio, Gewerbeauswahl und Betriebwechsel praktisch getestet werden koennen.
import { businessPortfolio } from './AccountMultiplayerIntegration.js';

const originalCreate=businessPortfolio.createBusiness.bind(businessPortfolio);

businessPortfolio.createBusiness=async function(data={}){
  await this.refresh();
  const count=this.companies.length;
  if(count!==1)return originalCreate(data);
  const slotNo=data.slotNo||this.nextFreeSlot();
  const result=await this.api.createBusiness({...data,slotNo,developerTestUnlock:true,expansionCost:0});
  const { createStarterBuilding }=await import('./IndustryCatalog.js');
  const starter=createStarterBuilding({type:data.companyType||data.type,industry:data.industry});
  await this.api.updateBusinessSetup(result.company.id,'empty_building',starter);
  await this.refresh();
  const company=this.companies.find(c=>c.id===result.company.id)||{...result.company,building_state:starter,setup_phase:'empty_building'};
  return {success:true,company,developerTestUnlock:true};
};

export function secondBusinessTestUnlockActive(){return true;}
if(typeof window!=='undefined')window.worldSecondBusinessTestUnlock={active:true};
