// ORVUNO – mobile/app usability layer
// Keeps desktop layout intact while making the installed app usable on narrow screens.
(function(){
  const isMobile=()=>window.matchMedia('(max-width: 760px)').matches;
  const isApp=()=>new URLSearchParams(location.search).get('source')==='app'||window.matchMedia('(display-mode: standalone)').matches;
  function mark(){
    const mobile=isMobile();
    document.documentElement.classList.toggle('orvuno-mobile-ui',mobile);
    document.documentElement.classList.toggle('orvuno-installed-app',isApp());
  }
  function installStyle(){
    if(document.getElementById('orvuno-mobile-usability-style'))return;
    const s=document.createElement('style');s.id='orvuno-mobile-usability-style';s.textContent=`
html.orvuno-installed-app .android-download-fab{display:none!important}
@media(max-width:760px){
  html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
  body{height:auto!important;min-height:100dvh!important;overflow-y:auto!important;padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))!important}
  #worldApp{width:100%!important;max-width:100%!important;height:auto!important;min-height:100dvh!important;overflow:visible!important;position:relative!important}
  #world-home-dashboard{width:100%!important;max-width:100%!important;margin:0!important;padding:72px 10px 94px!important;box-sizing:border-box!important;min-height:100dvh!important;height:auto!important;overflow:visible!important}
  #world-home-dashboard>section{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:12px!important;margin:0 0 10px!important;overflow:visible!important}
  #world-home-dashboard table{display:block!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
  #world-home-dashboard input,#world-home-dashboard select,#world-home-dashboard textarea{max-width:100%!important;box-sizing:border-box!important}
  #orvuno-side-nav,#orvuno-right-rail{display:none!important}
  #world-main-nav{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;max-width:none!important;min-height:0!important;height:auto!important;max-height:76px!important;display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:6px!important;padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px))!important;box-sizing:border-box!important;overflow-x:auto!important;overflow-y:hidden!important;background:rgba(7,16,29,.98)!important;border-top:1px solid #2b3b53!important;box-shadow:0 -8px 24px rgba(0,0,0,.4)!important;z-index:99000!important;scrollbar-width:none!important}
  #world-main-nav::-webkit-scrollbar{display:none!important}
  #world-main-nav button{flex:0 0 auto!important;width:auto!important;min-width:auto!important;max-width:none!important;min-height:44px!important;height:44px!important;margin:0!important;padding:8px 10px!important;border-radius:9px!important;font-size:13px!important;line-height:1.05!important;white-space:nowrap!important;box-shadow:none!important}
  #orvuno-language-control{top:calc(env(safe-area-inset-top,0px) + 6px)!important;right:8px!important;left:auto!important;transform:scale(.82)!important;transform-origin:top right!important;z-index:99500!important}
  .android-download-fab{display:none!important}
  [role="dialog"],.orvuno-modal,.modal,.dialog{width:100vw!important;max-width:100vw!important;max-height:100dvh!important;border-radius:0!important;box-sizing:border-box!important}
  [role="dialog"]>*,.orvuno-modal>*,.modal>*,.dialog>*{max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
  button,input,select,textarea{font-size:16px!important}
}
`;
    document.head.append(s);
  }
  function normalizeRuntime(){
    mark();
    if(!isMobile())return;
    const nav=document.getElementById('world-main-nav');
    if(nav){nav.style.removeProperty('top');nav.setAttribute('aria-label','ORVUNO Schnellnavigation');}
    // Remove desktop-only fixed positioning from large content overlays so the page itself scrolls.
    document.querySelectorAll('#world-home-dashboard [style*="position: fixed"],#world-home-dashboard [style*="position:fixed"]').forEach(el=>{
      if(el.closest('[role="dialog"],.modal,.dialog,.orvuno-modal'))return;
      const r=el.getBoundingClientRect();
      if(r.width>innerWidth*.7||r.height>innerHeight*.28){
        el.style.setProperty('position','relative','important');
        el.style.setProperty('inset','auto','important');
        el.style.setProperty('top','auto','important');
        el.style.setProperty('right','auto','important');
        el.style.setProperty('bottom','auto','important');
        el.style.setProperty('left','auto','important');
        el.style.setProperty('width','100%','important');
        el.style.setProperty('max-width','100%','important');
        el.style.setProperty('max-height','none','important');
        el.style.setProperty('overflow','visible','important');
      }
    });
  }
  installStyle();mark();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',normalizeRuntime,{once:true});else normalizeRuntime();
  addEventListener('resize',normalizeRuntime,{passive:true});
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;normalizeRuntime();});}).observe(document.documentElement,{childList:true,subtree:true});
})();
