// WorldProject – Regression für offene Mehrbetriebs-Skalierung und bezahlte Expansion.
import { BusinessPortfolioSystem } from './BusinessPortfolioSystem.js';
import { expansionRequirements } from './BusinessExpansionSystem.js';
import { AuthApiClient } from './AuthApiClient.js';

export function runBusinessPortfolioScaleRegression(){
 const portfolio=new BusinessPortfolioSystem({api:{}});
 portfolio.companies=[1,2,3,4,5].map(slot_no=>({id:slot_no,slot_no,money:1000000,game_state:{money:1000000}}));
 if(portfolio.nextFreeSlot()!==6)throw new Error('Portfolio stoppt nach vier/fünf Betrieben statt Slot 6 anzubieten');
 const r4=expansionRequirements(4),r5=expansionRequirements(5),r10=expansionRequirements(10);
 if(!(r5.creationCost>r4.creationCost&&r10.creationCost>r5.creationCost))throw new Error('Expansionskosten skalieren nach Betrieb 4 nicht weiter');
 if(typeof AuthApiClient.prototype.createPaidBusiness!=='function')throw new Error('Bezahlter Serverpfad für weitere Betriebe fehlt im API-Client');
 return{success:true,nextSlot:6,cost4:r4.creationCost,cost5:r5.creationCost,cost10:r10.creationCost};
}
if(typeof window!=='undefined')window.runBusinessPortfolioScaleRegression=runBusinessPortfolioScaleRegression;
