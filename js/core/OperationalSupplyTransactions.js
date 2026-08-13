// WorldProject - transaktionale Schutzschicht fuer Einkauf und Wareneingang.
// Verhindert Doppelzahlung/Doppelbestellung und erlaubt kontrollierten Teil-Wareneingang.

function positive(value,label){const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new Error(`${label} muss groesser als 0 sein`);return n;}
function requestKey(requestId){const key=String(requestId??"").trim();if(!key)throw new Error("requestId fuer transaktionalen Einkauf fehlt");return key;}

export function purchaseSupplyOrder({orders,company,supplier,material,quantity,transportMode="supplier",vehicle=null,cargo={},now=Date.now(),requestId}={}){
 if(!orders?.createOrder)throw new Error("Bestellsystem fehlt");if(!company)throw new Error("Betrieb fehlt");
 const key=requestKey(requestId);company.supplyPurchaseLedger??={};
 const existing=company.supplyPurchaseLedger[key];if(existing){const order=orders.orders?.find(o=>String(o.id)===String(existing.orderId))||existing.orderSnapshot;return{success:true,deduplicated:true,order,paidCost:existing.paidCost};}
 const amount=positive(quantity,"Bestellmenge"),quote=orders.createOrder({company,supplier,material,quantity:amount,transportMode,vehicle,cargo,now}).quote;
 const order=orders.orders[orders.orders.length-1],cost=positive(quote.totalCost,"Bestellwert"),balance=Number(company.money||0);
 if(!Number.isFinite(balance)||balance+1e-9<cost){orders.orders=orders.orders.filter(o=>o!==order);throw new Error("Nicht genug Geld");}
 company.money=balance-cost;order.paidCost=cost;order.paymentRequestId=key;order.paidAt=Number(now)||Date.now();
 company.supplyPurchaseLedger[key]={orderId:order.id,paidCost:cost,paidAt:order.paidAt,orderSnapshot:{...order}};
 return{success:true,deduplicated:false,order,paidCost:cost};
}

export function receiveSupplyOrder({warehouse,order,quantity=null,now=Date.now()}={}){
 if(!warehouse?.receive)throw new Error("Lagersystem fehlt");if(!order)throw new Error("Lieferung fehlt");
 const total=positive(order.quantity,"Liefermenge"),already=Math.max(0,Number(order.receivedQuantity)||0),remaining=Math.max(0,total-already);
 if(order.status==="stored"||remaining<=1e-9){order.status="stored";order.receivedQuantity=Math.max(already,total);order.remainingQuantity=0;return{success:true,deduplicated:true,received:0,remaining:0,status:"stored"};}
 if(!["arrived","partially_stored"].includes(order.status))throw new Error("Lieferung ist noch nicht angekommen");
 const requested=quantity===null?remaining:positive(quantity,"Wareneingangsmenge"),received=Math.min(requested,remaining);
 const zone=warehouse.zoneFor(order.material),free=warehouse.free(zone),accepted=Math.min(received,free);
 if(!(accepted>0))throw new Error("Nicht genug Lagerplatz fuer Teil-Wareneingang");
 const receipt={...order,status:"arrived",quantity:accepted};warehouse.receive(receipt);
 order.receivedQuantity=already+accepted;order.remainingQuantity=Math.max(0,total-order.receivedQuantity);order.lastReceiptAt=Number(now)||Date.now();
 order.receipts??=[];order.receipts.push({quantity:accepted,at:order.lastReceiptAt,zone});
 order.status=order.remainingQuantity<=1e-9?"stored":"partially_stored";if(order.status==="stored")order.storedAt=order.lastReceiptAt;
 return{success:true,deduplicated:false,received:accepted,remaining:order.remainingQuantity,status:order.status,zone};
}

export function runOperationalSupplyTransactionTest({SupplyOrderSystem,WarehouseSystem,supplier}={}){
 if(!SupplyOrderSystem||!WarehouseSystem||!supplier)throw new Error("Testabhaengigkeiten fehlen");
 const company={id:"txn-test",branchKey:"brewery",money:10000},orders=new SupplyOrderSystem(),before=company.money;
 const first=purchaseSupplyOrder({orders,company,supplier,material:"malt",quantity:500,requestId:"click-1",now:1000}),afterFirst=company.money;
 const duplicate=purchaseSupplyOrder({orders,company,supplier,material:"malt",quantity:500,requestId:"click-1",now:1001});
 if(!first.success||!duplicate.deduplicated||orders.orders.length!==1||company.money!==afterFirst||!(before>afterFirst))throw new Error("Doppelzahlungs-Schutz fehlgeschlagen");
 let noMoney=false;try{purchaseSupplyOrder({orders,company:{id:"poor",branchKey:"brewery",money:0},supplier,material:"malt",quantity:500,requestId:"poor-1"});}catch{noMoney=true;}if(!noMoney)throw new Error("Einkauf ohne Deckung wurde zugelassen");
 const warehouse=new WarehouseSystem({raw:300,packaging:1000,finished:1000,cold:1000}),delivery={id:1,status:"arrived",material:"malt",quantity:500};
 const partial=receiveSupplyOrder({warehouse,order:delivery});if(partial.received!==300||partial.remaining!==200||delivery.status!=="partially_stored"||warehouse.stock.raw.malt!==300)throw new Error("Teil-Wareneingang falsch");
 warehouse.baseCapacities.raw=600;const rest=receiveSupplyOrder({warehouse,order:delivery});if(rest.received!==200||rest.remaining!==0||delivery.status!=="stored"||warehouse.stock.raw.malt!==500)throw new Error("Rest-Wareneingang falsch");
 const again=receiveSupplyOrder({warehouse,order:delivery});if(!again.deduplicated||warehouse.stock.raw.malt!==500)throw new Error("Wareneingang nach Abschluss wurde doppelt gebucht");
 console.log("✅ SUPPLY-TRANSAKTIONS-TEST ERFOLGREICH");return true;
}
