// WorldProject - Entwicklungsfreigabe fuer den Mehrbetriebs-/Gewerbeauswahl-Test.
// Nur fuer die aktuelle Aufbauphase: Genau die zweite Betriebsgruendung umgeht Fortschritts-/Kreditvoraussetzungen.
// Ab dem dritten Betrieb gelten wieder die normalen Expansionsregeln.
import { businessPortfolio } from './AccountMultiplayerIntegration.js';

const originalStatus=businessPortfolio.getExpansionStatus.bind(businessPortfolio);
businessPortfolio.getExpansionStatus=function(sourceCompany=this.activeCompany||window.worldPlayerCompany){
  const normal=originalStatus(sourceCompany);
  if(this.companies.length!==1)return normal;
  return {...normal,allowed:true,reasons:[],developerTestUnlock:true,requirements:{...normal.requirements,creationCost:0}};
};

export function secondBusinessTestUnlockActive(){return true;}
if(typeof window!=='undefined')window.worldSecondBusinessTestUnlock={active:true,scope:'second-business-only'};
