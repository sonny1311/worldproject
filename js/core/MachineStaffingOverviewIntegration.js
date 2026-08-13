// WorldProject – zeigt vorhandene Maschinen und das dafür benötigte Personal direkt im Betriebsdashboard.
import { EconomyDashboard } from './EconomyDashboard.js';
import { recipesForCompany } from './OperationalSupplyChainSystem.js';
import { compatibleMachineIds } from './IndustryMachineCompatibility.js';
import { worldContentRegistry } from './ContentRegistry.js';
import { founderCanCoverJob } from './MicroBusinessStarterSystem.js';

const activeEmployee=e=>e&&e.active!==false&&!['notice','dismissed','terminated','inactive','fired'].includes(String(e.status||'').toLowerCase());
const employeeRole=e=>e?.role||e?.jobId||e?.profession||null;
const machineId=m=>m?.sourceType||m?.type||m?.id||m?.equipmentId||null;
const machineLabel=m=>m?.name||m?.label||worldContentRegistry.get('machines',machineId(m))?.label||machineId(m)||'Maschine';
const roleLabel=id=>worldContentRegistry.get('jobs',id)?.label||({brew_master:'Braumeister',machine_operator:'Maschinen-/Anlagenführer',carpenter:'Schreiner',baker:'Bäcker',butcher:'Metzger',farmer:'Landwirt'}[id])||id||'Keine Fachkraft hinterlegt';

function employees(company){
  return (company?.workforceState?.employees||company?.workforceOperationsState?.employees||company?.employees||[]).filter(activeEmployee);
}
function ownedMachines(company){
  const rows=[...(company?.buildingState?.equipment||[]),...(company?.workforceState?.machines||[]),...(company?.workforceOperationsState?.machines||[]),...(company?.machines||[])];
  const seen=new Set();
  return rows.filter(m=>{if(!m||m.status==='sold')return false;const id=String(m.instanceId||m.id||m.type||m.equipmentId||'');if(!id||seen.has(id))return false;seen.add(id);return true;});
}
function machineRequirements(company){
  const recipes=recipesForCompany(company),staff=employees(company),owned=ownedMachines(company),rows=[];
  for(const m of owned){
    const id=machineId(m);if(!id)continue;
    const relevant=recipes.filter(r=>{const ids=compatibleMachineIds(company,r.machineType);return r.machineType===id||ids.includes(id);});
    const roles=[...new Set(relevant.map(r=>r.requiredRole).filter(Boolean))];
    if(!roles.length){rows.push({machine:machineLabel(m),role:null,status:'none'});continue;}
    for(const role of roles){
      const hired=staff.some(e=>employeeRole(e)===role||(e.roles||[]).includes(role));
      const founder=!hired&&founderCanCoverJob(company,role);
      rows.push({machine:machineLabel(m),role,status:hired?'hired':founder?'founder':'missing'});
    }
  }
  return rows;
}

const proto=EconomyDashboard.prototype;
if(!proto.__worldMachineStaffingOverviewIntegrated){
  proto.__worldMachineStaffingOverviewIntegrated=true;
  const originalRender=proto.render;
  proto.render=function(panel){
    const result=originalRender.call(this,panel);
    const production=panel.querySelector('#dashboard-production');
    if(!production)return result;
    production.querySelector('.world-machine-staffing-overview')?.remove();
    const rows=machineRequirements(this.company);
    const box=this.el('div');box.className='world-machine-staffing-overview';Object.assign(box.style,{margin:'12px 0',padding:'10px',border:'1px solid rgba(255,255,255,.16)',borderRadius:'8px',background:'rgba(0,0,0,.12)'});
    const title=this.el('strong','👷 Personalbedarf deiner Maschinen');box.append(title);
    if(!rows.length){box.append(this.small('Noch keine produktionsrelevante Maschine vorhanden.'));production.append(box);return result;}
    for(const row of rows){
      const line=this.el('div');Object.assign(line.style,{display:'grid',gridTemplateColumns:'minmax(120px,1fr) minmax(130px,1fr)',gap:'8px',padding:'4px 0',fontSize:'12px'});
      let text;if(row.status==='hired')text=`✅ ${roleLabel(row.role)} vorhanden`;else if(row.status==='founder')text=`🧑‍🔧 ${roleLabel(row.role)} · durch Gründer abgedeckt`;else if(row.status==='missing')text=`❌ ${roleLabel(row.role)} einstellen`;else text='ℹ️ Keine besondere Fachkraft erforderlich';
      line.append(this.el('span',row.machine),this.el('strong',text));box.append(line);
    }
    const missing=rows.filter(r=>r.status==='missing').length;
    if(missing)box.append(this.small(`${missing} Personalstelle${missing===1?'':'n'} fehlt/fehlen für deine vorhandene Ausstattung.`));
    production.append(box);
    return result;
  };
}

export { machineRequirements };
