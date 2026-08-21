// ORVUNO App-Shell Service Worker.
// Netzwerk hat Vorrang, damit Spieler niemals durch einen alten Cache auf veralteter Spiellogik hängen.
const CACHE='orvuno-app-shell-v1';
const SHELL=['./','./index.html','./css/style.css','./css/app-shell.css','./manifest.webmanifest'];
const STATIC_RE=/\.(?:js|css|html|webmanifest|png|jpg|jpeg|webp|svg|ico|woff2?)$/i;

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>null));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

function isSensitive(url){
  return /\/api\//i.test(url.pathname)||/\/functions\/v1\//i.test(url.pathname)||/supabase/i.test(url.hostname)||/stripe|braintree|paypal/i.test(url.href);
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||isSensitive(url)||(!STATIC_RE.test(url.pathname)&&request.mode!=='navigate'))return;

  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(response?.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>null);
      }
      return response;
    }catch(error){
      const cached=await caches.match(request,{ignoreSearch:request.mode==='navigate'});
      if(cached)return cached;
      if(request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
      throw error;
    }
  })());
});
