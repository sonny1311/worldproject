import express from "express";
import cors from "cors";

const app=express();
const PORT=Number(process.env.TRAFFIC_PORT||3002);
const FRONTEND_ORIGIN=process.env.FRONTEND_ORIGIN||"http://127.0.0.1:5500";
const HERE_API_KEY=String(process.env.HERE_API_KEY||"").trim();

app.use(cors({origin:true,credentials:true}));
app.use(express.json({limit:"100kb"}));

const num=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v??'').trim();

async function hereJson(url,{timeoutMs=12000}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(url,{signal:controller.signal});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(data?.title||data?.error||data?.message||`HERE HTTP ${response.status}`);
  return data;
 }catch(error){
  if(error?.name==='AbortError')throw new Error(`HERE antwortet nicht innerhalb von ${Math.round(timeoutMs/1000)} Sekunden`);
  throw error;
 }finally{clearTimeout(timer);}
}

async function geocode(point){
 if(point&&Number.isFinite(Number(point.lat))&&Number.isFinite(Number(point.lng)))return{lat:Number(point.lat),lng:Number(point.lng),label:text(point.label)};
 const q=text(point?.query||point?.address||point?.label);
 if(!q)throw new Error('Start- oder Zieladresse fehlt');
 const url=new URL('https://geocode.search.hereapi.com/v1/geocode');
 url.searchParams.set('q',q);
 url.searchParams.set('limit','1');
 url.searchParams.set('lang','de-DE');
 url.searchParams.set('apiKey',HERE_API_KEY);
 const data=await hereJson(url);
 const item=data?.items?.[0];
 if(!item?.position)throw new Error(`Adresse nicht gefunden: ${q}`);
 return{lat:Number(item.position.lat),lng:Number(item.position.lng),label:text(item.title||q)};
}

app.get('/health',(_req,res)=>res.json({success:true,service:'orvuno-here-traffic',hereConfigured:Boolean(HERE_API_KEY)}));

app.post('/api/traffic/route',async(req,res)=>{
 if(!HERE_API_KEY)return res.status(503).json({success:false,error:'HERE-Zugang für Live-Verkehr ist noch nicht eingerichtet'});
 try{
  const origin=await geocode(req.body?.origin);
  const destination=await geocode(req.body?.destination);
  const vehicle=req.body?.vehicle||{};
  const url=new URL('https://router.hereapi.com/v8/routes');
  url.searchParams.set('transportMode','truck');
  url.searchParams.set('origin',`${origin.lat},${origin.lng}`);
  url.searchParams.set('destination',`${destination.lat},${destination.lng}`);
  url.searchParams.set('return','summary,typicalDuration,incidents,routeLabels');
  url.searchParams.set('lang','de-DE');
  // Kein departureTime=any: Ohne departureTime verwendet HERE den aktuellen Zeitpunkt
  // und bezieht Live-Verkehr standardmaessig in die zeitabhaengige Route ein.
  const departureTime=text(req.body?.departureTime);
  if(departureTime&&departureTime!=='any')url.searchParams.set('departureTime',departureTime);
  if(num(vehicle.grossWeightKg)>0)url.searchParams.set('vehicle[grossWeight]',String(Math.round(num(vehicle.grossWeightKg))));
  if(num(vehicle.axleWeightKg)>0)url.searchParams.set('vehicle[weightPerAxle]',String(Math.round(num(vehicle.axleWeightKg))));
  if(num(vehicle.heightM)>0)url.searchParams.set('vehicle[height]',String(num(vehicle.heightM)));
  if(num(vehicle.widthM)>0)url.searchParams.set('vehicle[width]',String(num(vehicle.widthM)));
  if(num(vehicle.lengthM)>0)url.searchParams.set('vehicle[length]',String(num(vehicle.lengthM)));
  url.searchParams.set('apiKey',HERE_API_KEY);

  const data=await hereJson(url);
  const route=data?.routes?.[0];
  const sections=Array.isArray(route?.sections)?route.sections:[];
  if(!route||!sections.length)throw new Error('HERE hat keine Route geliefert');

  const distanceMeters=sections.reduce((s,x)=>s+num(x?.summary?.length),0);
  const durationSeconds=sections.reduce((s,x)=>s+num(x?.summary?.duration),0);
  const baseDurationSeconds=sections.reduce((s,x)=>s+num(x?.summary?.baseDuration||x?.summary?.typicalDuration||x?.summary?.duration),0);
  const labels=(route.routeLabels||[]).map(x=>text(x?.name||x?.label||x)).filter(Boolean);
  const incidents=[];
  for(const section of sections){for(const incident of section?.incidents||[]){incidents.push({id:text(incident.id),type:text(incident.type||incident.code||'Verkehrsmeldung'),criticality:text(incident.criticality),description:text(incident.description||incident.summary||incident.type),road:text(incident.roadName||incident.road)});}}
  const eta=Date.now()+durationSeconds*1000;
  res.json({success:true,provider:'HERE',verifiedLive:true,route:{routeId:text(route.id),distanceMeters,durationSeconds,baseDurationSeconds,eta,roads:labels,origin,destination,originLabel:origin.label,destinationLabel:destination.label},incidents});
 }catch(error){
  console.error('HERE traffic route failed',error);
  res.status(502).json({success:false,error:`Live-Verkehr konnte nicht geladen werden: ${error?.message||String(error)}`});
 }
});

app.listen(PORT,()=>console.log(`ORVUNO HERE-Verkehr läuft auf Port ${PORT}`));
