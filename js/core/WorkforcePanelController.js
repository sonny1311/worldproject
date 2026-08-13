// WorldProject – Personalansicht für bestehende UI.
import { workforceKpis } from './IndustryWorkforceDevelopment.js';
import { staffingStatus,prioritizeVacancies,workforceOrganizationKpis } from './WorkforceOrganizationSystem.js';
import { employmentKpis } from './EmploymentLawAndPayroll.js';
export function workforcePanelState(company){const staffing=staffingStatus(company),openRoles=prioritizeVacancies(company),employees=company.employees||[];return{kpis:workforceKpis(company),organization:workforceOrganizationKpis(company),employment:employmentKpis(company),staffing,employees:employees.map(e=>({id:e.id||e.employeeId,name:e.name||e.fullName||e.role||'Mitarbeiter',role:e.role,status:e.status||'available',skillLevel:e.skillLevel||1,morale:e.morale??75,fatigue:e.fatigue??0,training:e.training||[]})),openRoles};}
if(typeof window!=='undefined')window.worldWorkforcePanel={state:workforcePanelState};
