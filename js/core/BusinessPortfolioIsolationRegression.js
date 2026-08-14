// Regression: Beim Wechsel zwischen Betrieben duerfen keine dynamischen Zustandsfelder des vorherigen Betriebs haengen bleiben.
import { BusinessPortfolioSystem } from './BusinessPortfolioSystem.js';

export function runBusinessPortfolioIsolationRegression(){
  const portfolio=new BusinessPortfolioSystem({api:null});
  const target={};
  portfolio.hydrateCompany(target,{id:1,slot_no:1,name:'Brauerei A',industry:'Getränke',company_type:'Brauerei',money:1000,setup_phase:'running',building_state:{equipment:[{id:'brew_kettle'}]},game_state:{finishedGoods:{beer:100},rawMaterials:{malt:50},productionQueue:[{id:'brew-1'}],breweryOnlyFlag:true}},{balance:5});
  if(!target.breweryOnlyFlag||!target.finishedGoods?.beer)throw new Error('Erster Betrieb wurde nicht korrekt hydriert');
  portfolio.hydrateCompany(target,{id:2,slot_no:2,name:'Mühle B',industry:'Agrarverarbeitung',company_type:'Mühle',money:2000,setup_phase:'empty_building',building_state:{equipment:[]},game_state:{rawMaterials:{wheat:500},finishedGoods:{flour_wheat:20}}},{balance:5});
  if('breweryOnlyFlag' in target)throw new Error('Betriebsspezifisches Feld der Brauerei blieb nach Wechsel erhalten');
  if('productionQueue' in target)throw new Error('Produktionswarteschlange des vorherigen Betriebs blieb nach Wechsel erhalten');
  if(target.finishedGoods?.beer)throw new Error('Fertigware des vorherigen Betriebs wurde in neuen Betrieb uebernommen');
  if(Number(target.rawMaterials?.wheat)!==500||Number(target.finishedGoods?.flour_wheat)!==20)throw new Error('Zielbetrieb wurde nach Bereinigung nicht korrekt hydriert');
  if(target.serverCompanyId!==2||target.type!=='Mühle')throw new Error('Kernidentitaet des Zielbetriebs stimmt nicht');
  return {success:true};
}

try{const result=runBusinessPortfolioIsolationRegression();if(typeof window!=='undefined')window.worldBusinessPortfolioIsolationRegression=result;console.log('✅ MEHRBETRIEB-ZUSTANDSISOLATION',result);}catch(error){if(typeof window!=='undefined')window.worldBusinessPortfolioIsolationRegression={success:false,error:error?.message||String(error)};console.error('❌ MEHRBETRIEB-ZUSTANDSISOLATION',error);}
