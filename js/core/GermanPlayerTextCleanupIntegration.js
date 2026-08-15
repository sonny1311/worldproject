// ORVUNO – technische interne Bezeichner niemals ungefiltert in der Spieleroberfläche zeigen.
const REPLACEMENTS=new Map([
 ['brew_packaging','Verpackungslieferant'],
 ['brew_basics','Brauerei-Grundstoffe'],
 ['bottle_wash_chem','Flaschenwaschmittel'],
 ['labels','Etiketten'],
 ['HERE_API_KEY ist noch nicht eingerichtet','HERE-Zugang für Live-Verkehr ist noch nicht eingerichtet'],
 ['HERE_API_KEY','HERE-Zugang'],
 ['Start fehlt','Startort fehlt']
]);

function cleanText(text=''){
 let out=String(text);
 for(const [from,to] of REPLACEMENTS)out=out.split(from).join(to);
 return out;
}

function cleanNode(root=document){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];let node;
 while((node=walker.nextNode()))nodes.push(node);
 for(const n of nodes){const next=cleanText(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;}
}

export function installGermanPlayerTextCleanup(){
 if(typeof document==='undefined')return false;
 const apply=root=>{try{cleanNode(root||document);}catch{}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(document));else apply(document);
 const observer=new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes){if(node.nodeType===1||node.nodeType===3)apply(node.nodeType===1?node:node.parentNode);}}});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('world:traffic-updated',()=>apply(document));
 return true;
}

if(typeof window!=='undefined'){window.worldGermanPlayerTextCleanup={install:installGermanPlayerTextCleanup,cleanText};installGermanPlayerTextCleanup();}
