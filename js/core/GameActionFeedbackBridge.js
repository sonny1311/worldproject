// WorldProject – übersetzt vorhandene Spielereignisse in einheitliche Spieler-Rückmeldungen.
import { feedback } from './GameActionFeedbackIntegration.js';
const reasonMap={
 'equipment-purchase':d=>`Maschine ${d.equipmentId||''} wurde gekauft und gespeichert.`,
 'equipment-duplicate-repair':d=>`${Number(d.removed||0)} doppelte Maschineninstanz${Number(d.removed||0)===1?'':'en'} wurden bereinigt${Number(d.refund||0)>0?` · Rückerstattung ${Number(d.refund).toLocaleString('de-DE')} €`:''}.`,
 'warehouse-expansion':()=>`Lagerausbau wurde übernommen.`,
 'construction-started':()=>`Bauauftrag wurde gestartet.`,
 'machine-upgrade':()=>`Maschinenupgrade wurde bestellt.`,
 'workforce-assignment':()=>`Mitarbeiterzuweisung wurde übernommen.`,
 'employee-hired':()=>`Mitarbeiter wurde eingestellt.`,
 'purchase-order':()=>`Bestellung wurde aufgegeben.`,
 'production-started':()=>`Produktion wurde gestartet.`,
 'production-cancelled':()=>`Geplante Produktion wurde gelöscht.`,
 'market-listing-created':()=>`Angebot wurde am Markt eingestellt.`
};
export function installGameActionFeedbackBridge(){if(typeof window==='undefined')return false;window.addEventListener('world:game-state-dirty',e=>{const reason=e.detail?.reason,fn=reasonMap[reason];if(fn)feedback(fn(e.detail||{}),{title:'Aktion erfolgreich'});});window.addEventListener('world:construction-completed',e=>{for(const j of e.detail?.finished||[])feedback(`${j.label||'Ausbau'} ist fertig.`,{title:'Bau abgeschlossen'});});window.addEventListener('world:premium-extra-credited',e=>{const count=e.detail?.credited?.length||0;if(count)feedback(`Tagesgutschrift aus ${count} Zusatzpaket${count===1?'':'en'} wurde verbucht.`,{title:'Premium-Paket'});});return true;}
export function runGameActionFeedbackBridgeTest(){return typeof reasonMap['equipment-purchase']==='function'&&reasonMap['production-started']().includes('gestartet');}
if(typeof window!=='undefined'){window.worldGameActionFeedbackBridge={install:installGameActionFeedbackBridge,runTest:runGameActionFeedbackBridgeTest};installGameActionFeedbackBridge();}
