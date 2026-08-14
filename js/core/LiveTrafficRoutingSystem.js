// WorldProject – verifizierte Live-Verkehrsschicht fuer Lieferungen.
// Grundregel: Niemals Stau, Sperrung, Unfall oder Umleitung erfinden.
// Solche Ereignisse duerfen nur aus einer explizit als live/verifiziert markierten Provider-Antwort stammen.

export const LIVE_TRAFFIC_CONFIG=Object.freeze({
 provider:'HERE',
 routeEndpoint:'/api/traffic/route',
 refreshMs:5*60*1000,
 staleAfterMs:15*60*1000
});

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const text=v=>String(v??'').trim();
const activeStatus=s=>['ordered','in_transit','delayed'].includes(String(s||'').toLowerCase());
const coord=x=>x&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lng))?{lat:Number(x.lat),lng:Number(x.lng)}:null;

export function normalizeRoutingPoint(value){
 if(!value)return null;
 if(Array.isArray(value)&&value.length>=2)return coord({lat:value[0],lng:value[1]});
 if(value.coordinates)return normalizeRoutingPoint(value.coordinates);
 return coord(value);
}

export function trafficState(order={}){
 order.liveTraffic??={
  provider:LIVE_TRAFFIC_CONFIG.provider,
  status:'unconfigured',
  verifiedLive:false,
  route:null,
  incidents:[],
  messages:[],
  lastCheckedAt:0,
  nextCheckAt:0,
  lastError:null,
  rerouteCount:0
 };
 order.liveTraffic.incidents??=[];order.liveTraffic.messages??=[];
 return order.liveTraffic;
}

export function trafficView(order={},now=Date.now()){
 const t=trafficState(order),route=t.route||{},age=t.lastCheckedAt?Math.max(0,now-t.lastCheckedAt):null;
 const verified=t.verifiedLive===true&&t.provider==='HERE';
 const stale=verified&&age!==null&&age>LIVE_TRAFFIC_CONFIG.staleAfterMs;
 return{
  provider:t.provider||LIVE_TRAFFIC_CONFIG.provider,
  status:stale?'stale':t.status,
  verifiedLive:verified&&!stale,
  stale,
  lastCheckedAt:n(t.lastCheckedAt)||null,
  nextCheckAt:n(t.nextCheckAt)||null,
  distanceKm:n(route.distanceMeters)/1000,
  durationSeconds:n(route.durationSeconds),
  baseDurationSeconds:n(route.baseDurationSeconds),
  trafficDelaySeconds:Math.max(0,n(route.durationSeconds)-n(route.baseDurationSeconds)),
  eta:n(route.eta)||n(order.eta)||null,
  roads:Array.isArray(route.roads)?route.roads:[],
  incidents:verified&&!stale?(t.incidents||[]):[],
  rerouted:Boolean(route.rerouted),
  rerouteCount:n(t.rerouteCount),
  originLabel:text(route.originLabel||order.routeOrigin?.label),
  destinationLabel:text(route.destinationLabel||order.routeDestination?.label),
  message:!verified?'Live-Verkehr nicht verbunden':stale?'Live-Verkehrsdaten sind veraltet':'Live-Verkehr aktiv'
 };
}

export function markTrafficUnavailable(order,reason='Live-Verkehr nicht verbunden'){
 const t=trafficState(order);t.status='unconfigured';t.verifiedLive=false;t.incidents=[];t.lastError=text(reason);t.nextCheckAt=0;return t;
}

function verifiedPayload(data){return !!(data&&data.success===true&&data.provider==='HERE'&&data.verifiedLive===true&&data.route&&Number.isFinite(Number(data.route.durationSeconds)));}

function sameRoads(a=[],b=[]){const x=a.map(text).filter(Boolean).join('|'),y=b.map(text).filter(Boolean).join('|');return x===y;}

export function applyVerifiedTraffic(order,data,{now=Date.now()}={}){
 if(!verifiedPayload(data))throw new Error('Nicht verifizierte Verkehrsdaten werden nicht uebernommen');
 const t=trafficState(order),previous=t.route||null,route={...data.route};
 route.distanceMeters=Math.max(0,n(route.distanceMeters));
 route.durationSeconds=Math.max(0,n(route.durationSeconds));
 route.baseDurationSeconds=Math.max(0,n(route.baseDurationSeconds,route.durationSeconds));
 route.eta=n(route.eta,now+route.durationSeconds*1000);
 route.roads=Array.isArray(route.roads)?route.roads.map(text).filter(Boolean):[];
 route.rerouted=Boolean(previous&&(!sameRoads(previous.roads||[],route.roads)||text(previous.routeId)!==text(route.routeId)));
 t.provider='HERE';t.status='live';t.verifiedLive=true;t.lastCheckedAt=now;t.nextCheckAt=now+LIVE_TRAFFIC_CONFIG.refreshMs;t.lastError=null;t.route=route;
 // Nur verifizierte Provider-Incidents duerfen in die Spielanzeige gelangen.
 t.incidents=Array.isArray(data.incidents)?data.incidents.map(i=>({id:text(i.id),type:text(i.type),criticality:text(i.criticality),description:text(i.description),road:text(i.road),startTime:i.startTime||null,endTime:i.endTime||null})).filter(i=>i.id||i.description):[];
 if(route.rerouted){t.rerouteCount=n(t.rerouteCount)+1;t.messages.unshift({at:now,type:'reroute',text:`Route durch Live-Verkehr neu berechnet${route.roads.length?`: ${route.roads.join(' → ')}`:''}`});}
 const delay=Math.max(0,route.durationSeconds-route.baseDurationSeconds);
 if(delay>0)t.messages.unshift({at:now,type:'traffic_delay',text:`Live-Verkehr: etwa ${Math.ceil(delay/60)} Min. zusaetzliche Fahrzeit`});
 for(const incident of t.incidents.slice(0,5))t.messages.unshift({at:now,type:'incident',text:[incident.type,incident.road,incident.description].filter(Boolean).join(' · ')});
 t.messages=t.messages.slice(0,30);
 order.trafficEta=route.eta;
 order.eta=Math.max(n(order.nonTrafficEta||order.plannedEta),route.eta);
 return trafficView(order,now);
}

export class LiveTrafficRoutingSystem{
 constructor({endpoint=LIVE_TRAFFIC_CONFIG.routeEndpoint,fetchImpl=globalThis.fetch}={}){this.endpoint=endpoint;this.fetchImpl=fetchImpl;}
 canRoute(order={}){return !!(normalizeRoutingPoint(order.routeOrigin)&&normalizeRoutingPoint(order.routeDestination));}
 async refresh(order,{force=false,now=Date.now(),vehicle={}}={}){
  const t=trafficState(order);
  if(!activeStatus(order.status))return trafficView(order,now);
  if(!this.canRoute(order))return trafficView(markTrafficUnavailable(order,'Start- oder Zielkoordinaten fehlen'),now);
  if(!force&&t.nextCheckAt&&now<t.nextCheckAt)return trafficView(order,now);
  if(typeof this.fetchImpl!=='function')return trafficView(markTrafficUnavailable(order,'Routing-Server nicht erreichbar'),now);
  t.status='loading';
  try{
   const response=await this.fetchImpl(this.endpoint,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:normalizeRoutingPoint(order.routeOrigin),destination:normalizeRoutingPoint(order.routeDestination),originLabel:text(order.routeOrigin?.label),destinationLabel:text(order.routeDestination?.label),departureTime:new Date(now).toISOString(),vehicle:{grossWeightKg:n(vehicle.grossWeightKg||order.cargo?.weightKg),heightM:n(vehicle.heightM),widthM:n(vehicle.widthM),lengthM:n(vehicle.lengthM),axleWeightKg:n(vehicle.axleWeightKg)}})});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!verifiedPayload(data))throw new Error(data?.error||'Keine verifizierte HERE-Antwort');
   return applyVerifiedTraffic(order,data,{now});
  }catch(error){t.status=t.verifiedLive?'stale':'unavailable';t.lastError=error?.message||String(error);t.nextCheckAt=now+LIVE_TRAFFIC_CONFIG.refreshMs;return trafficView(order,now);}
 }
 async refreshCompany(company={},options={}){
  const orders=[...(company.operationalSupplyState?.orders||[]),...(company.supplierOrders||[])],seen=new Set(),results=[];
  for(const order of orders){const key=order?.id||order;if(!order||seen.has(key)||!activeStatus(order.status))continue;seen.add(key);results.push(await this.refresh(order,options));}
  return results;
 }
}

export function runLiveTrafficRoutingTest(){
 const now=1000000,o={status:'in_transit',plannedEta:now+7200000,routeOrigin:{lat:50.1,lng:8.6,label:'Frankfurt'},routeDestination:{lat:51.5,lng:9.2,label:'Ziel'}};
 if(trafficView(o,now).verifiedLive)throw new Error('Unverifizierte Daten duerfen nicht live sein');
 let rejected=false;try{applyVerifiedTraffic(o,{success:true,provider:'fake',verifiedLive:true,route:{durationSeconds:100}},{now});}catch{rejected=true;}if(!rejected)throw new Error('Fake-Provider wurde akzeptiert');
 const v=applyVerifiedTraffic(o,{success:true,provider:'HERE',verifiedLive:true,route:{routeId:'r1',durationSeconds:7200,baseDurationSeconds:6000,distanceMeters:120000,eta:now+7200000,roads:['A5','A7']},incidents:[{id:'i1',type:'construction',road:'A7',description:'Baustelle'}]},{now});
 if(!v.verifiedLive||v.trafficDelaySeconds!==1200||v.incidents.length!==1||o.trafficEta!==now+7200000)throw new Error('Verifizierte Live-Verkehrsdaten fehlerhaft');
 return true;
}

if(typeof window!=='undefined')window.worldLiveTrafficRouting={config:LIVE_TRAFFIC_CONFIG,system:new LiveTrafficRoutingSystem(),view:trafficView,apply:applyVerifiedTraffic,runTest:runLiveTrafficRoutingTest};
