// WorldProject - Personalmarkt fuer alle Gewerbe, nicht nur Produktion/Brauerei.
import { getIndustryProfile } from "./IndustryCatalog.js";
import { WorkforceContent } from "../content/WorkforceContentData.js";
import { requiredRolesForCompany } from "./IndustryRecruitmentAvailability.js";
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const GENERIC=[
 {id:"dispatcher",label:"Disponent",industries:["*"],baseWageMonthly:3300,skills:["dispatch"]},
 {id:"cleaner",label:"Reinigungskraft",industries:["*"],baseWageMonthly:2450,skills:["cleaning"]},
 {id:"salesperson",label:"Verkaeufer",industries:["retail","wholesale"],baseWageMonthly:2700,skills:["sales"]},
 {id:"picker",label:"Kommissionierer",industries:["retail","wholesale","online_retail"],baseWageMonthly:2750,skills:["warehouse","picking"]},
 {id:"packer",label:"Versandmitarbeiter",industries:["online_retail","wholesale"],baseWageMonthly:2750,skills:["packing"]},
 {id:"food_worker",label:"Produktionsmitarbeiter Lebensmittel",industries:["food"],baseWageMonthly:2850,skills:["food"]},
 {id:"metal_worker",label:"Metallbauer",industries:["metal","mechanical"],baseWageMonthly:3250,skills:["metal"]},
 {id:"plastic_worker",label:"Kunststofftechniker",industries:["plastic"],baseWageMonthly:3250,skills:["plastic"]},
 {id:"livestock_worker",label:"Tierpfleger",industries:["livestock"],baseWageMonthly:2850,skills:["livestock"]},
 {id:"orchard_worker",label:"Obstbauer",industries:["orchard"],baseWageMonthly:2850,skills:["orchard"]}
];
const dedupeJobs=jobs=>[...new Map((jobs||[]).map(job=>[job.id,job])).values()];
export const UniversalJobs=dedupeJobs([...(WorkforceContent.jobs||[]),...GENERIC]);
export function workforceBranchKey(company){return getIndustryProfile(company).branchKey;}
export function jobsFor(company){const key=workforceBranchKey(company);return UniversalJobs.filter(j=>(j.industries||[]).includes("*")||(j.industries||[]).includes(key)||(j.industries||[]).includes(company?.industry));}
function applicantForJob(j,{seed,index,required=false}={}){const quality=.65+((index*17+Math.floor(seed/10000))%35)/100,wage=Math.round(n(j.baseWageMonthly)*(0.9+quality*.18));return{id:`app-${seed}-${j.id}-${index}`,jobId:j.id,role:j.label,qualification:Math.round(quality*100)/100,wageMonthly:wage,skills:[...(j.skills||[])],available:true,required};}
export function generateApplicants(company,{count=8,seed=Date.now()}={}){const jobs=jobsFor(company),out=[],required=requiredRolesForCompany(company);for(const role of required){const j=jobs.find(x=>x.id===role)||UniversalJobs.find(x=>x.id===role);if(j&&!out.some(x=>x.jobId===j.id))out.push(applicantForJob(j,{seed,index:out.length,required:true}));}if(!jobs.length)return out.slice(0,count);for(let i=0;out.length<count&&i<count*3;i++){const j=jobs[(Math.abs(Math.floor(seed/1000))+i)%jobs.length];if(!j)break;if(out.some(x=>x.jobId===j.id&&!x.required))continue;out.push(applicantForJob(j,{seed,index:out.length}));}return out.slice(0,Math.max(count,required.length));}
export function hireApplicant(company,applicant,{requestId}={}){company.employees??=[];company.hireRequestIds??=[];if(requestId&&company.hireRequestIds.includes(requestId))return{success:true,idempotent:true};if(!applicant?.available)throw new Error("Bewerber nicht verfuegbar");const employee={...applicant,id:`emp-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,hiredAt:Date.now(),status:"available",shift:"early"};company.employees.push(employee);applicant.available=false;if(requestId)company.hireRequestIds.push(requestId);return{success:true,employee};}
export function dismissEmployee(company,employeeId,{noticeDays=14}={}){const e=(company.employees||[]).find(x=>x.id===employeeId);if(!e)throw new Error("Mitarbeiter nicht gefunden");e.status="notice";e.noticeUntil=Date.now()+Math.max(0,n(noticeDays))*86400000;e.terminationCost=Math.round(n(e.wageMonthly)/30*Math.min(14,Math.max(0,n(noticeDays))));return e;}
export function assignShift(employee,shiftId){if(!(WorkforceContent.shifts||[]).some(s=>s.id===shiftId))throw new Error("Unbekannte Schicht");employee.shift=shiftId;return employee;}
export function missingWorkforce(company,requiredSkills=[]){const active=(company.employees||[]).filter(e=>!["notice","sick","training"].includes(e.status));return requiredSkills.filter(skill=>!active.some(e=>(e.skills||[]).includes(skill)));}
export function runUniversalWorkforceTest(){const checks=[],types=["Brauerei","Schreinerei","Bäckerei","Metzgerei","Landwirtschaftsbetrieb","Tierhaltung","Obstbau","Maschinenbau","Metallverarbeitung","Kunststoffverarbeitung","Einzelhandel","Großhandel","Onlinehandel"];for(const type of types){const c={type,industry:"",employees:[]},jobs=jobsFor(c),apps=generateApplicants(c,{count:8,seed:10000}),required=requiredRolesForCompany(c);checks.push({name:`${type} jobs`,success:jobs.length>=3},{name:`${type} applicants`,success:apps.length>=Math.min(5,jobs.length)});for(const role of required)checks.push({name:`${type} Pflichtfachkraft ${role}`,success:apps.some(a=>a.jobId===role&&a.required)});const ids=jobs.map(j=>j.id);checks.push({name:`${type} keine Doppelrollen`,success:new Set(ids).size===ids.length});}const failed=checks.filter(x=>!x.success);return{success:!failed.length,checks,failed,total:checks.length,passed:checks.length-failed.length};}
