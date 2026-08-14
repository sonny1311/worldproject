// WorldProject – Startseite kompakt und normal scrollbar.
function applyHomeViewport(){
 const root=document.getElementById('world-home-dashboard');
 if(!root)return false;
 // Die Weltkarte benutzt stellenweise einen festen Viewport. Auf der Betriebsstartseite
 // muss dagegen die Seite selbst scrollen koennen.
 Object.assign(document.documentElement.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100%'});
 Object.assign(document.body.style,{overflowY:'auto',overflowX:'hidden',height:'auto',minHeight:'100vh',maxHeight:'none'});
 Object.assign(root.style,{maxWidth:'1280px',width:'calc(100% - 28px)',boxSizing:'border-box',padding:'72px 14px 28px',fontSize:'14px',lineHeight:'1.35',minHeight:'100vh',height:'auto',maxHeight:'none',overflow:'visible'});
 // Startseitenkarten etwas kompakter, damit bei 1080p deutlich mehr Betrieb sichtbar ist.
 for(const section of root.children){
  if(section.matches?.('section'))Object.assign(section.style,{marginBottom:'10px'});
 }
 for(const h1 of root.querySelectorAll('h1'))Object.assign(h1.style,{fontSize:'26px',lineHeight:'1.15'});
 for(const h2 of root.querySelectorAll('h2'))Object.assign(h2.style,{fontSize:'20px',lineHeight:'1.2'});
 for(const button of root.querySelectorAll('button'))Object.assign(button.style,{padding:'7px 10px',minHeight:'34px'});
 // Von den Dashboard-Integrationen erzeugte Abstandshalter verkleinern.
 for(const el of root.children){if(el.tagName==='DIV'&&el.children.length===0&&el.style.height==='14px')el.style.height='9px';}
 return true;
}
export function installHomeDashboardViewport(){
 if(typeof window==='undefined'||typeof document==='undefined')return false;
 let scheduled=false;
 const run=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyHomeViewport();});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 for(const ev of ['worldproject:company-loaded','worldproject:company-activated','worldproject:company-switched','world:game-state-dirty'])window.addEventListener(ev,run);
 const observer=new MutationObserver(run);observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('resize',run);
 return true;
}
if(typeof window!=='undefined'){window.worldHomeDashboardViewport={apply:applyHomeViewport,install:installHomeDashboardViewport};installHomeDashboardViewport();}
