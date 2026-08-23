// ORVUNO – broad English coverage for legacy hard-coded player-facing text.
// This bridge is intentionally display-only: it never changes IDs, API values or game logic.
(function(){
  const EXACT=new Map(Object.entries({
    'Deine Unternehmenszentrale':'Your company headquarters','Was braucht deine Aufmerksamkeit?':'What needs your attention?','Läuft gerade':'Currently running','Keine laufenden Vorgänge.':'No active operations.','Neue Kundenaufträge sind verfügbar':'New customer orders are available','Offene Aufträge':'Open orders','Verspätete Aufträge':'Overdue orders','Verfügbare Kundenaufträge':'Available customer orders','Jetzt ansehen':'View now','Status':'Status','Laufende Aufträge':'Active orders','Keine laufenden Kundenaufträge.':'No active customer orders.','Kundenaufträge':'Customer orders','Auftrag':'Order','Aufträge':'Orders','Kunde':'Customer','Menge':'Quantity','Produkt':'Product','Preis':'Price','Gesamt':'Total','Frist':'Deadline','Restzeit':'Time remaining','Belohnung':'Reward','Liefern':'Deliver','Teillieferung':'Partial delivery','Annehmen':'Accept','Ablehnen':'Decline','Abbrechen':'Cancel','Verfügbar':'Available','Unterwegs':'In transit','Geliefert':'Delivered','Fertig':'Finished','Läuft':'Running','Wartet':'Queued',
    'Lager & Produktion':'Inventory & production','Einkauf':'Purchasing','Lager':'Inventory','Produktion':'Production','Rohstoffe':'Raw materials','Fertigwaren':'Finished goods','Lagerbestand':'Inventory','Kapazität':'Capacity','Bestellen':'Order','Lieferant':'Supplier','Lieferzeit':'Delivery time','Produktionswarteschlange':'Production queue','Produktion starten':'Start production','Produktionsstatus':'Production status','Produktionsmenge':'Production quantity','Keine Produktion aktiv':'No production active',
    'Personal & Maschinen':'Staff & machines','Personal':'Staff','Mitarbeiter':'Employees','Mitarbeiter einstellen':'Hire employees','Einstellen':'Hire','Gehalt':'Salary','Schicht':'Shift','Schichten':'Shifts','Zuweisen':'Assign','Maschinen':'Machines','Maschine':'Machine','Zustand':'Condition','Wartung':'Maintenance','Reparieren':'Repair','Kaufen':'Buy','Verkaufen':'Sell','Auslastung':'Utilization',
    'Markt & Fuhrpark':'Market & fleet','Markt':'Market','Fuhrpark':'Fleet','Fahrzeuge':'Vehicles','Fahrzeug':'Vehicle','Lieferungen':'Deliveries','Lieferung':'Delivery','Logistik':'Logistics','Transport':'Transport','Entfernung':'Distance','Ankunft':'Arrival','Abfahrt':'Departure','Fahrer':'Driver','LKW':'Truck','Kraftstoff':'Fuel','Kosten':'Costs',
    'Betriebe':'Businesses','Betrieb':'Business','Betrieb aktiv':'Business active','Betriebsstatus':'Business status','Betrieb wechseln':'Switch business','Neuen Betrieb gründen':'Start a new business','Unternehmen':'Company','Firmenkonto':'Company account','Kontostand':'Balance','Finanzen':'Finance','Umsatz':'Revenue','Gewinn':'Profit','Ausgaben':'Expenses','Statistiken':'Statistics','Statistik':'Statistics','Ausbau':'Upgrades','Betrieb ausbauen':'Upgrade business','Bauen':'Build','Ausbauen':'Upgrade','Bauzeit':'Construction time','Stufe':'Level',
    'Spielerzentrum':'Player center','Übersicht':'Overview','Nachrichten':'Messages','Ereignisse':'Events','Hilfe':'Help','Profil':'Profile','Einstellungen':'Settings','Abmelden':'Log out','Premium & Coins':'Premium & Coins','Werbung':'Ads','Schnellaktionen':'Quick actions','Schnellzugriff':'Quick access','Informationen':'Information','Verwaltung':'Management','Aktionen':'Actions',
    'Anmelden':'Sign in','Registrieren':'Register','E-Mail-Adresse':'Email address','E-Mail':'Email','Passwort':'Password','Dein Passwort':'Your password','Passwort vergessen':'Forgot password','Bestätigungsmail erneut senden':'Resend verification email','Noch keinen Account? Registrieren':'No account yet? Register','Schon registriert? Anmelden':'Already registered? Sign in','Melde dich bei ORVUNO an':'Sign in to ORVUNO','Erstelle deinen ORVUNO-Account':'Create your ORVUNO account','Spielserver verbunden':'Game server connected','Spielserver nicht erreichbar – Spielstart bleibt gesperrt':'Game server unavailable – game access remains locked','Benutzername':'Username','Land (z. B. DE)':'Country (e.g. US)','AGB akzeptieren':'Accept Terms & Conditions','Datenschutzerklärung akzeptieren':'Accept Privacy Policy','ORVUNO-Account erstellen':'Create ORVUNO account','oder':'or',
    'Deine Welt. Deine Wirtschaft. Dein Erfolg.':'Your world. Your economy. Your success.','Dein Unternehmen':'Your company','Echte Wirtschaft':'Real economy','Spielerwirtschaft':'Player economy','Sicher & Fair':'Secure & fair','Baue Betriebe auf, optimiere Produktionen und entwickle deinen eigenen Konzern.':'Build businesses, optimize production and develop your own corporate group.','Realistische Märkte, Lieferketten, Kosten und dynamische Preise.':'Realistic markets, supply chains, costs and dynamic prices.','Handle und kooperiere mit anderen Spielern in einer verbundenen Wirtschaft.':'Trade and cooperate with other players in a connected economy.','Accountbasierter Spielstand und servergestützte Wirtschaft für ein faires Spielerlebnis.':'Account-based saves and a server-backed economy for fair gameplay.',
    'Keine Daten verfügbar.':'No data available.','Keine Einträge vorhanden.':'No entries available.','Keine Aufträge verfügbar.':'No orders available.','Keine Fahrzeuge vorhanden.':'No vehicles available.','Keine Mitarbeiter vorhanden.':'No employees available.','Keine Maschinen vorhanden.':'No machines available.','Schließen':'Close','Zurück':'Back','Weiter':'Next','Speichern':'Save','Öffnen':'Open','Details':'Details','Suchen':'Search','Neu laden':'Reload','Ja':'Yes','Nein':'No','Fehler':'Error','Erfolgreich':'Success'
  }));
  const PARTIAL=[
    [/\bMitarbeiter\b/g,'Employees'],[/\bFahrzeuge\b/g,'Vehicles'],[/\bGebäude\b/g,'Buildings'],[/\boffene Aufträge\b/gi,'open orders'],[/\bKontostand\b/g,'Balance'],[/\bCoins\b/g,'Coins'],[/\bBetrieb aktiv\b/g,'Business active'],[/\bKeine laufenden Vorgänge\b/g,'No active operations'],[/\bKeine laufenden Kundenaufträge\b/g,'No active customer orders'],[/\bVerfügbar ab\b/g,'Available from'],[/\bLieferzeit\b/g,'Delivery time'],[/\bRestmenge\b/g,'Remaining quantity'],[/\bGesamtpreis\b/g,'Total price'],[/\bGesamtkosten\b/g,'Total costs'],[/\bpro Stück\b/g,'per unit'],[/\bpro Einheit\b/g,'per unit'],[/\bTage\b/g,'days'],[/\bStunden\b/g,'hours'],[/\bMinuten\b/g,'minutes']
  ];
  const ATTRS={
    'name@beispiel.de':'name@example.com','Dein Passwort':'Your password','Passwort (mind. 10 Zeichen)':'Password (min. 10 characters)','E-Mail-Adresse':'Email address','Benutzername':'Username','Land (z. B. DE)':'Country (e.g. US)'
  };
  function english(){return window.orvunoI18n?.getLocale?.()==='en';}
  function translateText(raw){
    if(!raw||!raw.trim())return raw;const trimmed=raw.trim();let next=EXACT.get(trimmed);
    if(next)return raw.replace(trimmed,next);
    next=trimmed;for(const [re,repl] of PARTIAL)next=next.replace(re,repl);return next===trimmed?raw:raw.replace(trimmed,next);
  }
  function applyNode(root){
    if(!english()||!root)return;
    if(root.nodeType===Node.TEXT_NODE){const n=translateText(root.nodeValue);if(n!==root.nodeValue)root.nodeValue=n;return;}
    if(!(root instanceof Element)&&root!==document)return;
    const elements=[];if(root instanceof Element)elements.push(root);if(root.querySelectorAll)elements.push(...root.querySelectorAll('*'));
    for(const el of elements){
      if(['SCRIPT','STYLE','CODE','PRE'].includes(el.tagName))continue;
      for(const attr of ['placeholder','title','aria-label']){const v=el.getAttribute?.(attr);if(v&&ATTRS[v])el.setAttribute(attr,ATTRS[v]);}
      for(const node of el.childNodes){if(node.nodeType===Node.TEXT_NODE){const n=translateText(node.nodeValue);if(n!==node.nodeValue)node.nodeValue=n;}}
    }
  }
  let observer=null,queued=false;
  function run(root=document){if(!english())return;applyNode(root);}
  function install(){
    run();
    window.addEventListener('orvuno:localechange',()=>setTimeout(()=>run(),0));
    observer=new MutationObserver(records=>{if(!english()||queued)return;queued=true;requestAnimationFrame(()=>{queued=false;for(const r of records)for(const n of r.addedNodes)run(n);});});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
