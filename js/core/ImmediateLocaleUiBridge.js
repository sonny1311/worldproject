// ORVUNO – immediate reversible language bridge for legacy player-facing UI.
// Purpose: selecting a language updates the visible UI immediately without reload or extra clicks.
// Display-only: no IDs, API payloads, database values or game logic are changed.
(function(){
  const ORIGINAL_TEXT=new WeakMap();
  const ORIGINAL_ATTR=new WeakMap();
  let scheduled=false;

  const EXACT=new Map(Object.entries({
    'Übersicht':'Overview','Betrieb':'Business','Produktion':'Production','Lager':'Inventory','Einkauf':'Purchasing','Personal':'Staff','Maschinen':'Machines','Kundenaufträge':'Customer orders','Logistik':'Logistics','Finanzen':'Finance','Ausbau':'Upgrades','Markt':'Market','Nachrichten':'Messages','Statistik':'Statistics','Statistiken':'Statistics','Verkehr':'Traffic','Admin':'Admin',
    'Betriebsstatus':'Business status','Betrieb aktiv':'Business active','Mitarbeiter':'Employees','Fahrzeuge':'Vehicles','Gebäude':'Buildings','offene Aufträge':'open orders','Finanzen':'Finance','Kontostand':'Balance','Schnellzugriff':'Quick access',
    'Premium & Coins':'Premium & Coins','Markt & Fuhrpark':'Market & fleet','Meine Betriebe':'My businesses','Verträge':'Contracts','Vorgänge & Ereignisse':'Operations & events','Gelände & Gebäude':'Premises & buildings','Einkauf · Lager · Produktion':'Purchasing · inventory · production',
    'Alle Kundenaufträge öffnen':'Open all customer orders','Kundenauftrag – Gaststätte':'Customer order – Restaurant','Kundenauftrag – Verein 3':'Customer order – Club 3','Kundenauftrag – Freunde & Bekannte 5':'Customer order – Friends & acquaintances 5',
    'Ware':'Product','Menge offen':'Quantity open','Fertigware verfügbar':'Finished goods available','Auftragswert offen':'Open order value','Lieferfrist':'Delivery deadline','Status':'Status','Offen':'Open','Teillieferung':'Partial delivery','von max.':'of max.','Menge liefern':'Deliver quantity','Auftrag liefern':'Deliver order','Betrieb im Überblick':'Business overview','Ware fehlt':'Product missing',
    'Geld':'Money','Coins':'Coins','Grundstück':'Property','Werbung':'Ads','Sprache auswählen':'Choose language','Deutsch':'German','English':'English',
    'Anmelden':'Sign in','Registrieren':'Register','Abmelden':'Log out','Schließen':'Close','Speichern':'Save','Abbrechen':'Cancel','Öffnen':'Open','Kaufen':'Buy','Verkaufen':'Sell','Starten':'Start','Weiter':'Next','Zurück':'Back','Hilfe':'Help','Datenschutz':'Privacy','Impressum':'Legal notice','AGB':'Terms',
    'Betrieb ausbauen':'Upgrade business','Produktion öffnen':'Open production','Fuhrpark & Kunden':'Fleet & customers','Personal & Maschinen':'Staff & machines','Mitarbeiter einstellen':'Hire employees','Einstellen':'Hire','Zuweisen':'Assign','Entlassen':'Dismiss',
    'Lieferungen':'Deliveries','Laufende Lieferungen':'Active deliveries','Keine laufende Lieferung.':'No active delivery.','Jetzt alle live prüfen':'Check all live now','Standort speichern':'Save location',
    'Produktion kann gestartet werden':'Production can be started','Alles vorhanden – Produktion kann gestartet werden':'Everything available – production can be started','Gewünschte Menge (Liter)':'Desired amount (liters)','Jetzt produzieren':'Produce now','Produktion planen':'Schedule production','Benötigt für diese Menge':'Required for this amount','vorhanden':'available','Maschine 100 % · betriebsbereit':'Machine 100% · operational',
    'Meine Betriebe':'My businesses','Aktiver Betrieb':'Active business','Diesen Betrieb öffnen':'Open this business','Grundstück & Betrieb ausbauen':'Upgrade premises & business','Einkauf & Lager':'Purchasing & inventory',
    'Spielerzentrum':'Player center','Nachrichten':'Messages','Hilfe':'Help','Rechtliches':'Legal','Betriebe':'Businesses','Liquidität gesamt':'Total liquidity','Anlagenwert':'Asset value','Schulden':'Debt','Netto-Unternehmenswert':'Net company value'
  }));

  const PARTIAL=[
    [/\bBetriebsstatus\b/g,'Business status'],[/\bBetrieb aktiv\b/g,'Business active'],[/\bMitarbeiter\b/g,'Employees'],[/\bFahrzeuge\b/g,'Vehicles'],[/\bGebäude\b/g,'Buildings'],[/\boffene Aufträge\b/gi,'open orders'],[/\bKundenauftrag\b/g,'Customer order'],[/\bGaststätte\b/g,'Restaurant'],[/\bWare\b/g,'Product'],[/\bMenge offen\b/g,'Quantity open'],[/\bFertigware verfügbar\b/g,'Finished goods available'],[/\bAuftragswert offen\b/g,'Open order value'],[/\bLieferfrist\b/g,'Delivery deadline'],[/\büberfällig\b/g,'overdue'],[/\bTeillieferung\b/g,'Partial delivery'],[/\bMenge liefern\b/g,'Deliver quantity'],[/\bAuftrag liefern\b/g,'Deliver order'],[/\bBetrieb im Überblick\b/g,'Business overview'],[/\bProduktion\b/g,'Production'],[/\bKontostand\b/g,'Balance'],[/\bSchnellzugriff\b/g,'Quick access'],[/\bLaufende Lieferungen\b/g,'Active deliveries'],[/\bLieferungen\b/g,'Deliveries'],[/\bEntfernung\b/g,'Distance'],[/\bFremdspedition\b/g,'External carrier'],[/\bGewinn nach Fremdtransport\b/g,'Profit after external transport'],[/\bAktueller Firmenruf\b/g,'Current company reputation'],[/\bAusgezeichnet\b/g,'Excellent'],[/\bStunden\b/g,'hours'],[/\bStd\.\b/g,'hrs.'],[/\bMin\.\b/g,'min.'],[/\bTage\b/g,'days'],[/\bStk\b/g,'pcs'],[/\bStück\b/g,'units'],[/\bLiter\b/g,'liters'],[/\bLagerbier\b/g,'lager beer'],[/\bPils\b/g,'pilsner']
  ];

  function locale(){ return window.orvunoI18n?.getLocale?.() || document.documentElement.lang || 'de'; }
  function isEnglish(){ return locale()==='en'; }

  function translate(raw){
    const trimmed=String(raw||'').trim();
    if(!trimmed)return raw;
    const exact=EXACT.get(trimmed);
    if(exact)return String(raw).replace(trimmed,exact);
    let next=trimmed;
    for(const [re,repl] of PARTIAL) next=next.replace(re,repl);
    return next===trimmed?raw:String(raw).replace(trimmed,next);
  }

  function handleText(node){
    if(!node||node.nodeType!==Node.TEXT_NODE)return;
    if(!ORIGINAL_TEXT.has(node))ORIGINAL_TEXT.set(node,node.nodeValue);
    const original=ORIGINAL_TEXT.get(node);
    const desired=isEnglish()?translate(original):original;
    if(node.nodeValue!==desired)node.nodeValue=desired;
  }

  function handleElement(el){
    if(!(el instanceof Element))return;
    if(['SCRIPT','STYLE','CODE','PRE','TEXTAREA'].includes(el.tagName))return;
    if(!ORIGINAL_ATTR.has(el))ORIGINAL_ATTR.set(el,{});
    const saved=ORIGINAL_ATTR.get(el);
    for(const attr of ['placeholder','title','aria-label']){
      const current=el.getAttribute(attr);
      if(current!=null && !(attr in saved))saved[attr]=current;
      if(attr in saved){const desired=isEnglish()?translate(saved[attr]):saved[attr];if(el.getAttribute(attr)!==desired)el.setAttribute(attr,desired);}
    }
    for(const child of el.childNodes)if(child.nodeType===Node.TEXT_NODE)handleText(child);
  }

  function apply(root=document){
    if(!root)return;
    if(root.nodeType===Node.TEXT_NODE){handleText(root);return;}
    if(root instanceof Element)handleElement(root);
    const scope=root.querySelectorAll?root:document;
    scope.querySelectorAll('button,a,label,h1,h2,h3,h4,h5,th,td,span,div,p,option,small,strong,b,li,input,select').forEach(handleElement);
  }

  function run(){scheduled=false;apply(document);}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run);}

  function install(){
    schedule();
    window.addEventListener('orvuno:localechange',()=>{schedule();setTimeout(schedule,40);setTimeout(schedule,180);});
    document.addEventListener('change',e=>{if(e.target?.id==='orvuno-language-select'){schedule();setTimeout(schedule,30);}} ,true);
    new MutationObserver(records=>{
      for(const rec of records){for(const node of rec.addedNodes)apply(node);}
    }).observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
