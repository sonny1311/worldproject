// WorldProject - interne Warenbewegungen zwischen eigenen Betrieben
// Generisch gehalten: Produktionsbetrieb -> Handelsbetrieb, Lager -> Werk, Hof -> Großhandel usw.

export class InternalTradeSystem {
 constructor(){this.transfers=[];this.seq=1;}
 ensureBusiness(company){if(!company)throw new Error("Betrieb fehlt");company.finishedGoods??={};company.tradeInventory??={};company.internalTransfers??=[];return company;}
 available(company,product){this.ensureBusiness(company);return Number(company.finishedGoods?.[product]??company.tradeInventory?.[product]??0);}
 createTransfer({fromCompany,toCompany,product,quantity,unitInternalPrice=0,transportCost=0,now=Date.now()}={}){
  this.ensureBusiness(fromCompany);this.ensureBusiness(toCompany);const q=Math.max(0,Number(quantity||0));if(!product||q<=0)throw new Error("Produkt und Menge erforderlich");
  const sourceFinished=Number(fromCompany.finishedGoods?.[product]||0),sourceTrade=Number(fromCompany.tradeInventory?.[product]||0),total=sourceFinished+sourceTrade;if(total<q)throw new Error("Nicht genug Ware im Quellbetrieb");
  let left=q;if(sourceFinished>0){const take=Math.min(left,sourceFinished);fromCompany.finishedGoods[product]-=take;left-=take;}if(left>0)fromCompany.tradeInventory[product]-=left;
  const goodsValue=q*Number(unitInternalPrice||0),cost=Math.max(0,Number(transportCost||0)),t={id:this.seq++,fromCompanyId:fromCompany.serverCompanyId||fromCompany.id,toCompanyId:toCompany.serverCompanyId||toCompany.id,product,quantity:q,unitInternalPrice:Number(unitInternalPrice||0),goodsValue,transportCost:cost,status:"in_transit",createdAt:now};this.transfers.push(t);fromCompany.internalTransfers.push(t);toCompany.internalTransfers.push(t);return t;
 }
 receive(transfer,toCompany,{now=Date.now()}={}){this.ensureBusiness(toCompany);if(!transfer||transfer.status!=="in_transit")throw new Error("Transfer ist nicht empfangsbereit");const targetId=toCompany.serverCompanyId||toCompany.id;if(transfer.toCompanyId!=null&&String(transfer.toCompanyId)!==String(targetId))throw new Error("Falscher Zielbetrieb");toCompany.tradeInventory[transfer.product]=Number(toCompany.tradeInventory[transfer.product]||0)+transfer.quantity;transfer.status="received";transfer.receivedAt=now;return transfer;}
 sellFromTradeBusiness(company,{product,quantity,unitPrice,costPerUnit=0}={}){this.ensureBusiness(company);const q=Math.max(0,Number(quantity||0)),have=Number(company.tradeInventory[product]||0);if(have<q)throw new Error("Nicht genug Handelsbestand");company.tradeInventory[product]-=q;const revenue=q*Number(unitPrice||0),cost=q*Number(costPerUnit||0);company.money=Number(company.money||0)+revenue;const sale={product,quantity:q,unitPrice:Number(unitPrice||0),revenue,cost,profit:revenue-cost,soldAt:Date.now()};company.tradeSales??=[];company.tradeSales.push(sale);return sale;}
}

export function runInternalTradeTest(){const production={id:1,finishedGoods:{beer:1000},money:1000},shop={id:2,type:"retail",tradeInventory:{},money:500};const s=new InternalTradeSystem(),t=s.createTransfer({fromCompany:production,toCompany:shop,product:"beer",quantity:400,unitInternalPrice:.7,transportCost:40});s.receive(t,shop);const sale=s.sellFromTradeBusiness(shop,{product:"beer",quantity:250,unitPrice:1.4,costPerUnit:.7});if(production.finishedGoods.beer!==600||shop.tradeInventory.beer!==150||sale.profit<=0||shop.money<=500)throw new Error("Interner-Handelsbetrieb-Test fehlgeschlagen");console.log("✅ EIGENE-BETRIEBE-WARENTRANSFER-/HANDELSTEST ERFOLGREICH",{transfer:t,sale,production,shop});return true;}
