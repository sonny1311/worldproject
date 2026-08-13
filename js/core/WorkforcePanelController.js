// WorldProject – Personalansicht für bestehende UI.
import { workforceKpis } from './IndustryWorkforceDevelopment.js';
import { staffingStatus,prioritizeVacancies,workforceOrganizationKpis } from './WorkforceOrganizationSystem.js';
import { employmentKpis } from './EmploymentLawAndPayroll.js';
import { missingRequiredRoles,availableCandidates } from './IndustryRecruitmentAvailability.js';
export function workforcePanelState(company){const staffing=staffingStatus(company),openRoles=prioritizeVacancies(company),employees=company.employees||company.workforceState?.employees||[],missing=missingRequiredRoles(company),market=availableCandidates(company,{count:8});return{kpis:workforceKpis(company),organization:workforceOrganizationKpis(company),employment:employmentKpis(company),staffing,employees:employees.map(e=>({id:e.id||e.employeeId,name:e.name||e.fullName||e.role||'Mitarbeiter',role:e.role||e.jobId,status:e.status||'available',skillLevel:e.skillLevel||e.qualification||1,morale:e.morale??75,fatigue:e.fatigue??0,training:e.training||[]})),openRoles,missing,market};}
if(typeof window!=='undefined')window.worldWorkforcePanel={state:workforcePanelState};
