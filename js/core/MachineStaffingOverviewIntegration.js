// WorldProject – zeigt vorhandene Maschinen und den realistischen Personalbedarf direkt im Betriebsdashboard.
import { EconomyDashboard } from './EconomyDashboard.js';
import { recipesForCompany, branchKeyFor } from './OperationalSupplyChainSystem.js';
import { compatibleMachineIds } from './IndustryMachineCompatibility.js';
import { worldContentRegistry } from './ContentRegistry.js';
import { founderCanCoverJob } from './MicroBusinessStarterSystem.js';

const activeEmployee=e=>e&&e.active!==false&&!['notice','dismissed','terminated','inactive','fired'].includes(String(e.status||'').toLowerCase());
const employeeRole=e=>e?.role||e?.jobId||e?.profession||null;
const machineId=m=>m?.sourceType||m?.type||m?.id||m?.equipmentId||null;
const machineLabel=m=>m?.name||m?.label||worldContentRegistry.get('machines',machineId(m))?.label||machineId(m)||'Maschine';
const roleLabel=id=>worldContentRegistry.get('jobs',id)?.label||({brew_master:'Braumeister',brewer:'Brauer',machine_operator:'Maschinen-/Anlagenführer',cellar_worker:'Keller-/Gärmitarbeiter',packaging_operator:'Abfüll-/Verpackungsmitarbeiter',maintenance_technician:'Betriebstechniker',carpenter:'Schreiner',baker:'Bäcker',butcher:'Metzger',farmer:'Landwirt'}[id])||id||'Keine Fachkraft hinterlegt';

// Fallbacks greifen nur, wenn ein Rezept für die konkrete Maschine noch keine requiredRole pflegt.
// So bleibt die Übersicht bereits spielbar, während Content-Daten schrittweise detaillierter werden.
const MACHINE_ROLE_FALLBACK={
 brewery:{
  brew_kettle:'brew_master',brewhouse:'brew_master',brew_house:'brew_master',sudwerk:'brew_master',sudhaus:'brew_master',
  fermentation_tank:'cellar_worker',fermenter:'cellar_worker',lager_tank:'cellar_worker',fermentation:'cellar_worker',
  filling_line:'packaging_operator',bottling_line:'packaging_operator',production_line:'machine_operator',
  cooling:'maintenance_technician',cooling_system:'maintenance_technician',refrigeration:'maintenance_technician'
 },
 beverage:{mixing_tank:'machine_operator',water_treatment:'machine_operator',filling_line:'packaging_operator'},
 bakery:{bakery_oven:'baker',dough_mixer:'baker'},butcher:{meat_cutter:'butcher'},
 carpentry:{woodshop:'carpenter',panel_saw:'carpenter',workbench:'carpenter'},
 farm:{tractor:'farmer',cultivator:'farmer',seeder:'farmer'},mechanical:{cnc_mill:'machine_operator'},metal:{welder:'machine_operator'},plastic:{injection_machine:'machine_operator'}
};
function fallbackRole(company,id,label=''){
 const key=branchKeyFor(company),map=MACHINE_ROLE_FALLBACK[key]||{},raw=String(id||'').toLowerCase();
 if(map[raw])return map[raw];
 const text=`${raw} ${String(label).toLowerCase()}`;
 if(key==='brewery'){
  if(/sud|brew|kessel/.test(text))return 'brew_master';
  if(/gär|gaer|ferment|lager.?tank/.test(text))return 'cellar_worker';
  if(/abfüll|abfuell|füll|fuell|bottl|pack/.test(text))return 'packaging_operator';
  if(/kühl|kuehl|cool|refrig/.test(text))return 'maintenance_technician';
  if(/produktion|production/.test(text))return 'machine_operator';
 }
 return null;
}
function employees(company){return (company?.workforceState?.employees||company?.workforceOperationsState?.employees||company?.employees||[]).filter(activeEmployee);}
function ownedMachines(company){
 const rows=[...(company?.buildingState?.equipment||[]),...(company?.workforceState?.machines||[]),...(company?.workforceOperationsState?.machines||[]),...(company?.machines||[])],seen=new Set(),out=[];
 for(const m of rows){if(!m||m.status==='sold')continue;const id=machineId(m),label=machineLabel(m),key=String(id||label).toLowerCase().replace(/[^a-z0-9äöüß]+/g,'');if(!key||seen.has(key))continue;seen.add(key);out.push(m);}return out;
}
function machineRequirements(company){
 const recipes=recipesForCompany(company),staff=employees(company),rows=[];
 for(const m of ownedMachines(company)){
  const id=machineId(m);if(!id)continue;
  const relevant=recipes.filter(r=>{const ids=compatibleMachineIds(company,r.machineType);return r.machineType===id||ids.includes(id);});
  const roles=[...new Set(relevant.map(r=>r.requiredRole).filter(Boolean))];
  if(!roles.length){const fallback=fallbackRole(company,id,machineLabel(m));if(fallback)roles.push(fallback);}
  if(!roles.length){rows.push({machine:machineLabel(m),role:null,status:'none'});continue;}
  for(const role of roles){const hired=staff.some(e=>employeeRole(e)===role||(e.roles||[]).includes(role)),founder=!hired&&founderCanCoverJob(company,role);rows.push({machine:machineLabel(m),role,status:hired?'hired':founder?'founder':'missing'});}
 }
 return rows;
}
const proto=EconomyDashboard.prototype;
if(!proto.__worldMachineStaffingOverviewIntegrated){
 proto.__worldMachineStaffingOverviewIntegrated=true;const originalRender=proto.render;
 proto.render=function(panel){const result=originalRender.call(this,panel),production=panel.querySelector('#dashboard-production');if(!production)return result;production.querySelector('.world-machine-staffing-overview')?.remove();const rows=machineRequirements(this.company),box=this.el('div');box.className='world-machine-staffing-overview';Object.assign(box.style,{margin:'12px 0',padding:'10px',border:'1px solid rgba(255,255,255,.16)',borderRadius:'8px',background:'rgba(0,0,0,.12)'});box.append(this.el('strong','👷 Personalbedarf deiner Maschinen'));if(!rows.length){box.append(this.small('Noch keine produktionsrelevante Maschine vorhanden.'));production.append(box);return result;}for(const row of rows){const line=this.el('div');Object.assign(line.style,{display:'grid',gridTemplateColumns:'minmax(120px,1fr) minmax(150px,1fr)',gap:'8px',padding:'4px 0',fontSize:'12px'});let text;if(row.status==='hired')text=`✅ ${roleLabel(row.role)} vorhanden`;else if(row.status==='founder')text=`🧑‍🔧 ${roleLabel(row.role)} · durch Gründer abgedeckt`;else if(row.status==='missing')text=`❌ ${roleLabel(row.role)} einstellen`;else text='ℹ️ Keine besondere Fachkraft erforderlich';line.append(this.el('span',row.machine),this.el('strong',text));box.append(line);}const missing=rows.filter(r=>r.status==='missing').length;if(missing)box.append(this.small(`${missing} Personalstelle${missing===1?'':'n'} fehlt/fehlen für deine vorhandene Ausstattung.`));production.append(box);return result;};
}
export { machineRequirements };
