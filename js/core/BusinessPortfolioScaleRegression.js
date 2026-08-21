// WorldProject – Regression für offene Mehrbetriebs-Skalierung und bezahlte Expansion.
import { BusinessPortfolioSystem } from './BusinessPortfolioSystem.js';
import { expansionRequirements } from './BusinessExpansionSystem.js';
import { AuthApiClient } from './AuthApiClient.js';

export function runBusinessPortfolioScaleRegression(){
 const portfolio=new BusinessPortfolioSystem({api:{}});
 portfolio.companies=[1,2,3,4,5].map(slot_no=>({id:slot_no,slot_no,money:1000000,game_state:{money:1000000}}));
 if(portfolio.nextFreeSlot()!==6)throw new Error('Portfolio stoppt nach vier/fünf Betrieben statt Slot 6 anzubieten');
 const r4=expansionRequirements(4),r5=expansionRequirements(5),r10=expansionRequirements(10);
 if(r4.creationCost!==0||r5.creationCost!==0||r10.creationCost!==0)throw new Error('Veraltete versteckte Gründungspauschale ist wieder aktiv');
 if(!(r5.requiredNetWorth>r4.requiredNetWorth&&r10.requiredNetWorth>r5.requiredNetWorth&&r5.requiredCashReserve>r4.requiredCashReserve&&r10.requiredCashReserve>r5.requiredCashReserve))throw new Error('Expansionsanforderungen skalieren nach Betrieb 4 nicht weiter');
 if(typeof AuthApiClient.prototype.createPaidBusiness!=='function')throw new Error('Bezahlter Serverpfad für weitere Betriebe fehlt im API-Client');
 return{success:true,nextSlot:6,netWorth4:r4.requiredNetWorth,netWorth5:r5.requiredNetWorth,netWorth10:r10.requiredNetWorth,reserve4:r4.requiredCashReserve,reserve5:r5.requiredCashReserve,reserve10:r10.requiredCashReserve};
}
if(typeof window!=='undefined')window.runBusinessPortfolioScaleRegression=runBusinessPortfolioScaleRegression;