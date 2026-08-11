// WorldProject - verbindet Fuhrpark, Lieferungen, Lager und Produktion mit Company
import { Company } from "./Company.js";
import { FleetManagementSystem, runFleetManagementTest } from "./FleetManagementSystem.js";
import { EconomyGameplaySystem, FirstPlayableRecipe, runEconomyGameplayTest } from "./EconomyGameplaySystem.js";

const fleet=new FleetManagementSystem();
const economy=new EconomyGameplaySystem();

if(Company.prototype.__economyGameplayIntegrated!==true){
 Company.prototype.buyFleetVehicle=function(type,options={}){return fleet.buyVehicle(this,type,options);};
 Company.prototype.leaseFleetVehicle=function(type,options={}){return fleet.leaseVehicle(this,type,options);};
 Company.prototype.getAvailableFleetVehicles=function(type=null){return fleet.getAvailable(this,type);};
 Company.prototype.orderSupplierGoods=function(options={}){return economy.createSupplierOrder(this,options);};
 Company.prototype.receiveSupplierGoods=function(order){return economy.receiveSupplierOrder(this,order);};
 Company.prototype.produceFirstPlayableProduct=function(batches=1){return economy.produce(this,FirstPlayableRecipe,batches);};
 Company.prototype.sellFinishedGoods=function(options={}){return economy.sell(this,options);};
 Company.prototype.__economyGameplayIntegrated=true;
}

runFleetManagementTest();
runEconomyGameplayTest();