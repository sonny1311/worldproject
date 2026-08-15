import { loadLocalConfig, getHereApiKey } from '../config.js';

const SDK_BASE='https://js.api.here.com/v3/3.1';
let sdkPromise=null;

function addCss(href){if([...document.styleSheets].some(s=>s.href===href))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.append(l);}
function addScript(src){return new Promise((resolve,reject)=>{const old=[...document.scripts].find(s=>s.src===src);if(old){if(window.H)resolve();else old.addEventListener('load',resolve,{once:true});return;}const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error(`HERE SDK konnte nicht geladen werden: ${src}`));document.head.append(s);});}

async function loadHereSdk(){
 if(window.H?.service?.Platform)return window.H;
 if(sdkPromise)return sdkPromise;
 sdkPromise=(async()=>{addCss(`${SDK_BASE}/mapsjs-ui.css`);await addScript(`${SDK_BASE}/mapsjs-core.js`);await addScript(`${SDK_BASE}/mapsjs-service.js`);await addScript(`${SDK_BASE}/mapsjs-mapevents.js`);await addScript(`${SDK_BASE}/mapsjs-ui.js`);if(!window.H?.service?.Platform)throw new Error('HERE Maps SDK ist nicht verfügbar.');return window.H;})();
 return sdkPromise;
}

export async function initializeHereMaps(){
 await loadLocalConfig();
 const apiKey=getHereApiKey();
 const state={configured:Boolean(apiKey),ready:false,error:null,platform:null,createMap:null};
 window.orvunoHereMaps=state;
 if(!apiKey){console.info('[ORVUNO] HERE Maps: kein lokaler API-Key gefunden.');window.dispatchEvent(new CustomEvent('orvuno:here-status',{detail:state}));return state;}
 try{
  const H=await loadHereSdk();
  const platform=new H.service.Platform({apikey:apiKey});
  const layers=platform.createDefaultLayers();
  state.platform=platform;
  state.layers=layers;
  state.createMap=(element,options={})=>{
   if(!element)throw new Error('Für die HERE-Karte fehlt das Zielelement.');
   const map=new H.Map(element,layers.vector.normal.map,{pixelRatio:window.devicePixelRatio||1,center:options.center||{lat:51.5,lng:10.2},zoom:options.zoom||6});
   const behavior=new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
   const ui=H.ui.UI.createDefault(map,layers,'de-DE');
   const resize=()=>map.getViewPort().resize();window.addEventListener('resize',resize);
   map.orvuno={behavior,ui,destroy(){window.removeEventListener('resize',resize);map.dispose();}};
   return map;
  };
  state.ready=true;
  console.log('✅ ORVUNO HERE Maps verbunden');
 }catch(error){state.error=error?.message||String(error);console.error('❌ ORVUNO HERE Maps Verbindung fehlgeschlagen',error);}
 window.dispatchEvent(new CustomEvent('orvuno:here-status',{detail:state}));
 return state;
}

export function getHereMapsState(){return window.orvunoHereMaps||{configured:false,ready:false,error:null};}
