// ORVUNO – technische interne Bezeichner niemals ungefiltert in der Spieleroberfläche zeigen.
// Legacy cleanup remains for German compatibility. Other locales are handled by OrvunoI18nIntegration.
const REPLACEMENTS=new Map([
 ['brew_packaging','Verpackungslieferant'],
 ['brew_basics','Brauerei-Grundstoffe'],
 ['bottle_wash_chem','Flaschenwaschmittel'],
 ['labels','Etiketten'],
 ['HERE_API_KEY ist noch nicht eingerichtet','HERE-Zugang für Live-Verkehr ist noch nicht eingerichtet'],
 ['HERE_API_KEY','HERE-Zugang'],
 ['Start fehlt','Startort fehlt']
]);

function currentLocale(){
 return window.orvunoI18n?.getLocale?.()||document.documentElement.lang?.split('-')[0]||'de';
}
function cleanText(text=''){
 let out=String(text);
 if(currentLocale()!=='de')return out;
 for(const [from,to] of REPLACEMENTS)out=out.split(from).join(to);
 return out;
}
function cleanNode(root=document){
 if(currentLocale()!=='de')return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];let node;
 while((node=walker.nextNode()))nodes.push(node);
 for(const n of nodes){const next=cleanText(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;}
}
export function installGermanPlayerTextCleanup(){
 if(typeof document==='undefined')return false;
 const apply=root=>{try{cleanNode(root||document);}catch{}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(document));else apply(document);
 const observer=new MutationObserver(records=>{if(currentLocale()!=='de')return;for(const record of records){for(const node of record.addedNodes){if(node.nodeType===1||node.nodeType===3)apply(node.nodeType===1?node:node.parentNode);}}});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('world:traffic-updated',()=>apply(document));
 window.addEventListener('orvuno:localechange',()=>{if(currentLocale()==='de')apply(document);else window.orvunoI18n?.apply?.(document);});
 return true;
}
if(typeof window!=='undefined'){window.worldGermanPlayerTextCleanup={install:installGermanPlayerTextCleanup,cleanText};installGermanPlayerTextCleanup();}
