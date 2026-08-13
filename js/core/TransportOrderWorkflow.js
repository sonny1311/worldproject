// WorldProject - robuster Transportauftrags-Workflow ohne UI-Abhaengigkeit.
// Deckt Deduplizierung, Storno, Fahrzeugreservierung, Kosten und Reload-Reparatur ab.

function positive(value,label){const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new Error(`${label} muss groesser als 0 sein`);return n;}
function validTime(value){const n=Number(value);if(Number.isFinite(n)&&n>0)return n;const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:null;}
function key(value,label){const k=String(value??"").trim();if(!k)throw new Error(`${label} fehlt`);return k;}
function activeStatus(status){return ["planned","ordered","reserved","loading","in_transit","refueling","unloading","delayed"].includes(status);}

export class TransportOrderWorkflow{
 constructor(){this.orders=[];this.byRequest=new Map();this.seq=1;}
 create({requestId,companyId=null,vehicle=null,cargo={},distanceKm=0,transportCost=0,createdAt=Date.now(),eta=null}={}){
  const rid=key(requestId,"Transport-requestId");
  const existing=this.byRequest.get(rid);if(existing)return{success:true,deduplicated:true,order:existing};
  const distance=Math.max(0,Number(distanceKm)||0),cost=Math.max(0,Number(transportCost)||0),weight=Math.max(0,Number(cargo.weightKg)||0),pallets=Math.max(0,Number(cargo.pallets)||0),volume=Math.max(0,Number(cargo.volumeM3)||0);
  if(vehicle&&vehicle.status&&!['available','idle'].includes(vehicle.status))throw new Error("Fahrzeug ist nicht verfuegbar");
  const start=validTime(createdAt)||Date.now(),arrival=eta==null?null:validTime(eta);if(eta!=null&&!arrival)throw new Error("Ungueltige ETA");
  const order={id:this.seq++,requestId:rid,companyId,vehicleId:vehicle?.id??null,status:vehicle?"reserved":"ordered",cargo:{weightKg:weight,pallets,volumeM3:volume},distanceKm:distance,transportCost:cost,createdAt:start,eta:arrival,costPosted:false,cancelCost:0};
  if(vehicle){vehicle.status="reserved";vehicle.transportOrderId=order.id;}
  this.orders.push(order);this.byRequest.set(rid,order);return{success:true,deduplicated:false,order};
 }
 assignVehicle(order,vehicle){if(!order||!activeStatus(order.status))throw new Error("Transportauftrag ist nicht mehr aktiv");if(!vehicle)throw new Error("Fahrzeug fehlt");if(!['available','idle'].includes(vehicle.status))throw new Error("Fahrzeug ist nicht verfuegbar");if(order.vehicleId&&String(order.vehicleId)!==String(vehicle.id))throw new Error("Transportauftrag hat bereits ein Fahrzeug");order.vehicleId=vehicle.id;vehicle.status="reserved";vehicle.transportOrderId=order.id;order.status="reserved";return order;}
 start(order,{now=Date.now()}={}){if(!order||!["ordered","reserved","planned"].includes(order.status))return false;order.status="in_transit";order.departedAt=validTime(now)||Date.now();return true;}
 delay(order,{eta,reason="Verspaetung"}={}){if(!order||!activeStatus(order.status))return false;const next=validTime(eta);if(!next)throw new Error("Neue ETA ungueltig");order.status="delayed";order.eta=next;order.delayReason=reason;return true;}
 complete(order,{vehicle=null,now=Date.now()}={}){if(!order)return false;if(order.status==="delivered")return true;if(["cancelled","rejected"].includes(order.status))return false;order.status="delivered";order.completedAt=validTime(now)||Date.now();this.releaseVehicle(order,vehicle);return true;}
 cancel(order,{vehicle=null,now=Date.now(),afterDepartureFeeRate=.25}={}){if(!order)return{success:false,reason:"Transportauftrag fehlt"};if(order.status==="cancelled")return{success:true,deduplicated:true,cancelCost:order.cancelCost||0};if(order.status==="delivered")return{success:false,reason:"Bereits zugestellt"};const departed=!!order.departedAt||["in_transit","refueling","unloading","delayed"].includes(order.status),fee=departed?Math.max(0,Number(order.transportCost)||0)*Math.max(0,Math.min(1,Number(afterDepartureFeeRate)||0)):0;order.status="cancelled";order.cancelledAt=validTime(now)||Date.now();order.cancelCost=fee;this.releaseVehicle(order,vehicle);return{success:true,deduplicated:false,cancelCost:fee};}
 releaseVehicle(order,vehicle){if(!vehicle)return false;if(String(vehicle.transportOrderId??"")===String(order?.id??"")||String(vehicle.id??"")===String(order?.vehicleId??"")){vehicle.status="available";delete vehicle.transportOrderId;return true;}return false;}
 postTransportCost(order,company,{type="transport_cost"}={}){if(!order||!company)throw new Error("Transportauftrag oder Betrieb fehlt");if(order.costPosted)return{success:true,deduplicated:true,amount:0};const cost=Math.max(0,Number(order.transportCost)||0)+Math.max(0,Number(order.cancelCost)||0);company.money=Number(company.money)||0;company.financialLog??=[];company.money-=cost;company.financialLog.push({type,amount:-cost,time:new Date(),details:{transportOrderId:order.id,requestId:order.requestId,transportCost:order.transportCost,cancelCost:order.cancelCost}});order.costPosted=true;order.costPostedAt=Date.now();return{success:true,deduplicated:false,amount:cost};}
 repairAfterReload(order,{now=Date.now(),vehicle=null}={}){if(!order)return null;const current=validTime(now)||Date.now(),eta=validTime(order.eta);if(order.status==="delivered"||order.status==="cancelled"){this.releaseVehicle(order,vehicle);return order;}if(eta&&current>=eta&&activeStatus(order.status)){order.status="delivered";order.completedAt=eta;this.releaseVehicle(order,vehicle);return order;}if(order.status==="reserved"&&vehicle&&String(vehicle.transportOrderId??"")!==String(order.id)){vehicle.status="reserved";vehicle.transportOrderId=order.id;}return order;}
 importOrders(rows=[]){this.orders=[];this.byRequest.clear();let max=0;for(const raw of rows||[]){if(!raw)continue;const order={...raw};this.orders.push(order);if(order.requestId)this.byRequest.set(String(order.requestId),order);max=Math.max(max,Number(order.id)||0);}this.seq=max+1;return this.orders;}
}

export function runTransportOrderWorkflowTest(){
 const wf=new TransportOrderWorkflow(),vehicle={id:7,status:"available"},company={money:1000,financialLog:[]};
 const first=wf.create({requestId:"req-1",vehicle,cargo:{weightKg:500},distanceKm:100,transportCost:120,createdAt:1000,eta:5000});
 const dup=wf.create({requestId:"req-1",vehicle:null,transportCost:999});
 if(!first.success||!dup.deduplicated||wf.orders.length!==1||vehicle.status!=="reserved")throw new Error("Transport-Deduplizierung/Reservierung fehlgeschlagen");
 if(!wf.start(first.order,{now:2000})||first.order.status!=="in_transit")throw new Error("Transportstart fehlgeschlagen");
 if(!wf.delay(first.order,{eta:6000,reason:"Stau"})||first.order.status!=="delayed")throw new Error("Verspaetung fehlgeschlagen");
 const cancel=wf.cancel(first.order,{vehicle,now:3000});if(!cancel.success||cancel.cancelCost!==30||vehicle.status!=="available")throw new Error("Transportstorno/Fahrzeugfreigabe fehlgeschlagen");
 const posted=wf.postTransportCost(first.order,company),postedAgain=wf.postTransportCost(first.order,company);if(posted.amount!==150||!postedAgain.deduplicated||company.money!==850||company.financialLog.length!==1)throw new Error("Transportkosten wurden falsch oder doppelt gebucht");
 const vehicle2={id:8,status:"available"},second=wf.create({requestId:"req-2",vehicle:vehicle2,transportCost:50,createdAt:1000,eta:2000}).order;wf.repairAfterReload(second,{now:2500,vehicle:vehicle2});if(second.status!=="delivered"||vehicle2.status!=="available")throw new Error("Reload-/ETA-Reparatur fehlgeschlagen");
 const snapshot=JSON.parse(JSON.stringify(wf.orders)),reloaded=new TransportOrderWorkflow();reloaded.importOrders(snapshot);if(reloaded.orders.length!==2||reloaded.create({requestId:"req-2"}).deduplicated!==true)throw new Error("Transport-Persistenz/Deduplizierung nach Reload fehlgeschlagen");
 console.log("✅ TRANSPORT-ORDER-WORKFLOW-TEST ERFOLGREICH");return{success:true};
}
