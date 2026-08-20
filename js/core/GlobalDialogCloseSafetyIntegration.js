// ORVUNO – globale Sicherheitslogik fuer versteckte oder unbenutzbare Dialog-X.
// Bestehende Schliesslogik bleibt unangetastet: Ein Rettungs-X klickt immer den nativen Close-Button.
const RESCUE_ATTR='data-world-dialog-rescue-close';
const ROOT_SELECTOR=[
 '#world-universal-ops',
 '[role="dialog"]',
 '[aria-modal="true"]',
 '[data-dialog]',
 '[data-modal]',
 '.modal',
 '.dialog',
 '.dialog-overlay',
 '.modal-overlay'
].join(',');
const CLOSE_SELECTOR=[
 '[data-close]',
 '[data-action="close"]',
 '[data-dismiss="modal"]',
 '[aria-label*="schließ" i]',
 '[aria-label*="schliess" i]',
 '[aria-label*="close" i]',
 '[title*="schließ" i]',
 '[title*="schliess" i]',
 '[title*="close" i]',
 '.modal-close',
 '.dialog-close',
 '.close-button'
].join(',');

function visible(node){
 if(!(node instanceof HTMLElement)||!node.isConnected)return false;
 const s=getComputedStyle(node),r=node.getBoundingClientRect();
 return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth;
}
function nativeClose(root){
 if(!root?.querySelector)return null;
 const explicit=root.querySelector(CLOSE_SELECTOR);
 if(explicit)return explicit;
 return [...root.querySelectorAll('button')].find(b=>/^(?:✕|×|x)$/i.test(String(b.textContent||'').trim()))||null;
}
function accessible(button){
 if(!visible(button))return false;
 const r=button.getBoundingClientRect(),x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),y=Math.max(0,Math.min(innerHeight-1,r.top+r.height/2));
 const stack=document.elementsFromPoint?.(x,y)||[];
 return stack.some(el=>el===button||button.contains(el));
}
function dialogRoots(){
 const roots=[...document.querySelectorAll(ROOT_SELECTOR)].filter(visible);
 // Einige ORVUNO-Fenster haben keine semantische Dialogklasse, aber ein eindeutiges natives X.
 for(const btn of document.querySelectorAll('button')){
  const text=String(btn.textContent||'').trim();
  const marked=btn.matches(CLOSE_SELECTOR)||/^(?:✕|×)$/i.test(text);
  if(!marked)continue;
  const root=btn.closest(ROOT_SELECTOR)||btn.closest('[style*="position: fixed"], [style*="position:fixed"]');
  if(root&&visible(root)&&!roots.includes(root))roots.push(root);
 }
 return roots;
}
function zOf(node){const z=Number.parseInt(getComputedStyle(node).zIndex,10);return Number.isFinite(z)?z:0;}
function rescueFor(root,button){
 let rescue=[...document.querySelectorAll(`[${RESCUE_ATTR}]`)].find(x=>x.__worldDialogRoot===root);
 if(accessible(button)){
  rescue?.remove();
  return null;
 }
 if(!rescue){
  rescue=document.createElement('button');
  rescue.type='button';
  rescue.setAttribute(RESCUE_ATTR,'1');
  rescue.setAttribute('aria-label','Fenster schließen');
  rescue.title='Fenster schließen';
  rescue.textContent='✕';
  rescue.__worldDialogRoot=root;
  rescue.onclick=e=>{e.preventDefault();e.stopPropagation();const current=nativeClose(root);if(current?.isConnected)current.click();else rescue.remove();};
  document.body.append(rescue);
 }
 const r=root.getBoundingClientRect();
 const top=Math.max(10,Math.min(innerHeight-54,r.top+10));
 const right=Math.max(10,Math.min(innerWidth-54,innerWidth-r.right+10));
 Object.assign(rescue.style,{position:'fixed',top:`${top}px`,right:`${right}px`,zIndex:'2147483647',width:'44px',height:'44px',minWidth:'44px',minHeight:'44px',padding:'0',display:'grid',placeItems:'center',border:'1px solid #94a3b8',borderRadius:'10px',background:'#111827',color:'#f8fafc',fontSize:'22px',fontWeight:'900',lineHeight:'1',cursor:'pointer',boxShadow:'0 5px 18px rgba(0,0,0,.55)',pointerEvents:'auto'});
 return rescue;
}
function normalize(){
 const roots=dialogRoots(),active=new Set(roots);
 for(const root of roots){const close=nativeClose(root);if(close)rescueFor(root,close);}
 for(const rescue of document.querySelectorAll(`[${RESCUE_ATTR}]`)){if(!rescue.__worldDialogRoot?.isConnected||!active.has(rescue.__worldDialogRoot))rescue.remove();}
}
function topDialog(){
 return dialogRoots().map((root,index)=>({root,index,z:zOf(root)})).sort((a,b)=>a.z-b.z||a.index-b.index).at(-1)?.root||null;
}
if(typeof window!=='undefined'&&!window.__worldGlobalDialogCloseSafety){
 window.__worldGlobalDialogCloseSafety=true;
 let raf=0;const queue=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(normalize);};
 new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden','aria-hidden']});
 window.addEventListener('resize',queue,{passive:true});
 window.addEventListener('scroll',queue,true);
 window.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||e.defaultPrevented)return;
  const root=topDialog(),close=root&&nativeClose(root);
  if(close){e.preventDefault();e.stopPropagation();close.click();queue();}
 },true);
 queue();
 window.worldDialogCloseSafety={normalize,dialogRoots};
}

export { normalize as normalizeDialogCloseSafety };
