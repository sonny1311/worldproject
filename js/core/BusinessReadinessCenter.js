// WorldProject – verständliche Gesamtbereitschaft eines Betriebs.
import { businessPlayabilityAudit } from './UniversalBusinessOperations.js';
import { ensureExpansionState, freeLandSqm } from './LandConstructionExpansionSystem.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function businessReadiness(company={}){
 ensureExpansionState(company);let audit={missingEquipment:[],playableSetup:true};try{audit=businessPlayabilityAudit(company);}catch{}
 const rows=[];const add=(id,label,ok,hint='')=>rows.push({id,label,ok:!!ok,hint});
 add('money','Betriebskapital',n(company.money)>=0,n(company.money)<0?'Firmenkonto ist negativ. Erst Einnahmen erzielen oder Kosten senken.':'');
 add('equipment','Pflichtmaschinen',audit.missingEquipment.length===0,audit.missingEquipment.length?`Es fehlen: ${audit.missingEquipment.join(', ')}`:'');
 const warehouse=n(company.warehouseCapacity||company.storageCapacity||company.warehouse?.capacity,0);add('warehouse','Lagerkapazität',warehouse>0,warehouse<=0?'Es ist keine nutzbare Lagerkapazität hinterlegt.':'');
 const total=n(company.land?.totalSqm,300),free=freeLandSqm(company);add('land','Grundstück',total>=300,`Grundstück ${total} m² · frei ${free} m²`);
 const buildingJobs=(company.constructionSite?.jobs||[]).filter(x=>x.status==='building').length;add('construction','Bauzustand',true,buildingJobs?`${buildingJobs} Bauprojekt${buildingJobs===1?'':'e'} läuft/laufen.`:'Keine Baustelle blockiert den Betrieb.');
 const broken=(company.buildingState?.equipment||[]).filter(x=>typeof x==='object'&&['broken','repair'].includes(String(x.status))).length;add('machines','Maschinenzustand',broken===0,broken?`${broken} Maschine${broken===1?' ist':'n sind'} defekt oder in Reparatur.`:'');
 const over=Boolean(company.warehouseOverfilled||company.storageOverfilled);add('storage','Lagerbelegung',!over,over?'Lager ist überbelegt. Erst Bestand abbauen oder Lager erweitern.':'');
 const blockers=rows.filter(x=>!x.ok),score=Math.round((rows.length-blockers.length)/Math.max(1,rows.length)*100);return{ready:blockers.length===0,score,rows,blockers,audit};
}
export function nextBusinessReadinessStep(company={}){const r=businessReadiness(company);const priority=['money','warehouse','equipment','machines','storage','land'];return priority.map(id=>r.blockers.find(x=>x.id===id)).find(Boolean)||null;}
export function runBusinessReadinessCenterTest(){const c={type:'Schreinerei',money:1000,warehouseCapacity:100,buildingState:{equipment:[],rooms:[]}};const r=businessReadiness(c);if(!Number.isFinite(r.score)||!Array.isArray(r.rows)||r.rows.length<5)throw new Error('Betriebsbereitschaft fehlerhaft');return true;}
if(typeof window!=='undefined')window.worldBusinessReadiness={readiness:businessReadiness,next:nextBusinessReadinessStep,runTest:runBusinessReadinessCenterTest};
