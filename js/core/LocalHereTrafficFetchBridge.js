const LOCAL_HOSTS=new Set(['127.0.0.1','localhost']);
const TARGET='http://127.0.0.1:3002/api/traffic/route';

function install(){
 if(typeof window==='undefined'||!LOCAL_HOSTS.has(window.location.hostname)||globalThis.__orvunoHereFetchBridge)return false;
 const original=globalThis.fetch?.bind(globalThis);
 if(typeof original!=='function')return false;
 globalThis.fetch=(input,init)=>{
  const url=typeof input==='string'?input:String(input?.url||'');
  if(url.includes('/api/traffic/route')||url.includes('/functions/v1/world-traffic-route'))return original(TARGET,init);
  return original(input,init);
 };
 globalThis.__orvunoHereFetchBridge=true;
 console.log('✅ ORVUNO lokaler HERE-Verkehrsbridge aktiv');
 return true;
}

install();
export { install as installLocalHereTrafficFetchBridge };
