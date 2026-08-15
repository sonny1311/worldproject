// ORVUNO – technische Laufzeitfehler nicht roh auf Englisch an Spieler ausgeben.
// Entwicklerdetails bleiben weiterhin in der Browser-Konsole erhalten.

function germanMessage(message){
  const raw=String(message??'').trim();
  if(!raw)return 'Ein technischer Fehler ist aufgetreten.';
  if(/maximum call stack size exceeded/i.test(raw))return 'Technischer Fehler bei der Verarbeitung. Die Aktion wurde abgebrochen. Bitte versuche es erneut.';
  if(/failed to fetch/i.test(raw))return 'Die Verbindung zum benötigten Dienst konnte nicht hergestellt werden.';
  if(/network\s*error/i.test(raw))return 'Netzwerkfehler: Die Verbindung konnte nicht hergestellt werden.';
  if(/load failed/i.test(raw))return 'Die benötigten Daten konnten nicht geladen werden.';
  return raw;
}

if(typeof window!=='undefined'&&!window.__orvunoGermanTechnicalErrors){
  window.__orvunoGermanTechnicalErrors=true;
  const originalAlert=window.alert.bind(window);
  window.alert=(message)=>originalAlert(germanMessage(message));
  window.orvunoGermanTechnicalMessage=germanMessage;
}

export { germanMessage };
