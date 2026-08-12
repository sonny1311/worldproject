// WorldProject - Gehalt, Mitarbeiterzufriedenheit und faire Kuendigungswarnungen
export class EmployeeSatisfactionSystem{
 constructor(){this.staff=new Map();this.warnings=[];}
 register({employeeId,salary,marketSalary,trainingScore=0,workload=1}={}){const e={employeeId,salary:Number(salary),marketSalary:Number(marketSalary||salary),trainingScore:Number(trainingScore),workload:Number(workload),satisfaction:70,lowSince:null,status:"employed"};this.staff.set(employeeId,e);return this.evaluate(employeeId);}
 evaluate(employeeId,now=Date.now()){const e=this.staff.get(employeeId);if(!e)throw new Error("Mitarbeiter nicht gefunden");const pay=Math.min(1.25,e.salary/Math.max(1,e.marketSalary)),loadPenalty=Math.max(0,e.workload-1)*25,trainingBonus=Math.min(10,e.trainingScore*2);e.satisfaction=Math.max(0,Math.min(100,Math.round(55+pay*25+trainingBonus-loadPenalty)));if(e.satisfaction<30&&!e.lowSince){e.lowSince=now;this.warnings.push({employeeId,type:"resignation_risk",at:now,message:"Mitarbeiter ist stark unzufrieden. Kuendigungsrisiko steigt."});}if(e.satisfaction>=40)e.lowSince=null;return e;}
 changeSalary(employeeId,salary){const e=this.staff.get(employeeId);e.salary=Number(salary);return this.evaluate(employeeId);}
 setWorkload(employeeId,workload){const e=this.staff.get(employeeId);e.workload=Number(workload);return this.evaluate(employeeId);}
 mayResign(employeeId,now=Date.now(),graceDays=14){const e=this.evaluate(employeeId,now);return e.lowSince&&now-e.lowSince>=graceDays*86400000&&e.satisfaction<30;}
}
export function runEmployeeSatisfactionTest(){const s=new EmployeeSatisfactionSystem(),e=s.register({employeeId:1,salary:1000,marketSalary:3000,workload:2});if(e.satisfaction>=30||!s.warnings.length)throw new Error("Unzufriedenheitswarnung fehlt");if(s.mayResign(1,Date.now()+15*86400000)!==true)throw new Error("Kuendigungsrisiko fehlerhaft");console.log("🙂 MITARBEITERZUFRIEDENHEIT/KUENDIGUNGSWARNUNG ERFOLGREICH");return true;}
