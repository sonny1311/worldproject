// WorldProject – branchenspezifische Bewerberverfügbarkeit für bestehende Personalansichten.
import { worldContentRegistry } from './ContentRegistry.js';
import { recipesForCompany } from './OperationalSupplyChainSystem.js';
import { getIndustryProfile } from './IndustryCatalog.js';
const roleOf=e=>e?.role||e?.jobId||e?.profession||null;
const activeEmployee=e=>e&&e.active!==false&&!['notice','dismissed','terminated','inactive','fired'].includes(e.status);
export function jobRolesForCompany(company){const key=getIndustryProfile(company)?.branchKey||company?.branchKey;return worldContentRegistry.list('jobs').filter(job=>(job.industries||[]).includes(key));}
export function requiredRolesForCompany(company){const roles=new Set(recipesForCompany(company).map(r=>r.requiredRole).filter(Boolean));const key=getIndustryProfile(company)?.branchKey||company?.branchKey;if(key==='brewery')roles.add('brew_master');return [...roles];}
export function missingRequiredRoles(company){const employees=(company?.workforceState?.employees||company?.employees||[]).filter(activeEmployee),owned=new Set(employees.flatMap(e=>[roleOf(e),...(e.roles||[])].filter(Boolean)));return requiredRolesForCompany(company).filter(role=>!owned.has(role));}
export function availableCandidates(company,{count=8}={}){const jobs=jobRolesForCompany(company),required=new Set(missingRequiredRoles(company)),rows=[];for(const role of required){const job=jobs.find(x=>x.id===role)||worldContentRegistry.get('jobs',role);if(job)rows.push({id:`candidate-${job.id}-required`,role:job.id,label:job.label||job.id,baseWage:Number(job.baseWage||0),skills:{...(job.skills||{})},tags:[...(job.tags||[])],required:true});}for(const job of jobs){if(rows.length>=count)break;if(rows.some(x=>x.role===job.id))continue;rows.push({id:`candidate-${job.id}`,role:job.id,label:job.label||job.id,baseWage:Number(job.baseWage||0),skills:{...(job.skills||{})},tags:[...(job.tags||[])],required:false});}return rows;}
if(typeof window!=='undefined')window.worldIndustryRecruitment={roles:jobRolesForCompany,required:requiredRolesForCompany,missing:missingRequiredRoles,candidates:availableCandidates};
