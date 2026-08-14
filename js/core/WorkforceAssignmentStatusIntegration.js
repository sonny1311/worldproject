import { WorkforceOperationsDialog } from './WorkforceOperationsDialog.js';
import { employeeFitsMachine } from './WorkforceMachineAssignmentIntegration.js';

function statusFor(dialog,employee){
 const a=(dialog.workforce.assignments||[]).find(x=>String(x.employeeId)===String(employee.id));
 if(!a||a.machineId===null||a.machineId===undefined||a.machineId==='')return{ok:false,text:'❌ Keine Maschine zugewiesen'};
 const m=(dialog.machines.machines||[]).find(x=>String(x.id)===String(a.machineId));
 const shifts={early:'Frühschicht',late:'Spätschicht',night:'Nachtschicht'};
 if(!m)return{ok:false,text:'⚠️ Maschinenzuweisung ist nicht mehr gültig'};
 if(!employeeFitsMachine(employee,m))return{ok:false,text:`⚠️ FALSCHE ZUWEISUNG: ${m.label} passt nicht zu ${employee.jobId||'dieser Fachkraft'}`};
 return{ok:true,text:`✅ ZUGEWIESEN: ${m.label} · ${shifts[a.shiftId]||a.shiftId}`};
}

function restrictMachineSelect(dialog,row,employee){
 const select=row.querySelectorAll('select')[1];if(!select)return;
 const current=(dialog.workforce.assignments||[]).find(a=>String(a.employeeId)===String(employee.id));
 const allowed=new Set((dialog.machines.machines||[]).filter(m=>employeeFitsMachine(employee,m)).map(m=>String(m.id)));
 for(const option of [...select.options]){
  if(option.value===''||allowed.has(String(option.value)))continue;
  option.remove();
 }
 if(current&&current.machineId!=null&&!allowed.has(String(current.machineId)))select.value='';
 select.style.fontWeight='700';
}

const proto=WorkforceOperationsDialog.prototype;
if(!proto.__assignmentStatusIntegrated){
 proto.__assignmentStatusIntegrated=true;
 const original=proto.render;
 proto.render=function(panel,industry,...args){
  const result=original.call(this,panel,industry,...args);
  const staff=[...panel.querySelectorAll('section')].find(s=>(s.querySelector('h3')?.textContent||'').includes('Mitarbeiter & Schichtplan'));
  if(!staff)return result;
  const employees=(this.workforce.employees||[]).filter(e=>e.active);
  const rows=[...staff.children].filter(e=>e.tagName==='DIV'&&e.querySelector('strong')).slice(0,employees.length);
  rows.forEach((row,i)=>{
   const employee=employees[i];restrictMachineSelect(this,row,employee);
   const st=statusFor(this,employee),box=this.el('div',st.text);box.className='world-assignment-status';
   Object.assign(box.style,{padding:'8px 10px',margin:'6px 0',borderRadius:'7px',fontWeight:'800',background:st.ok?'#e8f5e9':'#fff3e0',color:st.ok?'#1b5e20':'#9a4d00',border:`1px solid ${st.ok?'#2e7d32':'#ef6c00'}`});
   row.querySelector('strong')?.insertAdjacentElement('afterend',box);
  });
  return result;
 };
}
export { statusFor,restrictMachineSelect };
