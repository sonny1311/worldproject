// WorldProject – Personalansicht für bestehende UI.
import { workforceKpis } from './IndustryWorkforceDevelopment.js';
import { workforcePlan,staffingGap } from './WorkforceOrganizationSystem.js';
import { employmentKpis } from './EmploymentLawAndPayroll.js';
export function workforcePanelState(company){const plan=workforcePlan(company),gaps=staffingGap(company),employees=company.employees||[];return{kpis:workforceKpis(company),employment:employmentKpis(company),plan,gaps,employees:employees.map(e=>({id:e.id||e.employeeId,name:e.name||e.fullName||e.role||'Mitarbeiter',role:e.role,status:e.status||'available',skillLevel:e.skillLevel||1,morale:e.morale??75,fatigue:e.fatigue??0,training:e.training||[]})),openRoles:gaps.filter(x=>x.gap>0)};}
if(typeof window!=='undefined')window.worldWorkforcePanel={state:workforcePanelState};
