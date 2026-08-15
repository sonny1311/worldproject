import { WorkforceOperationsDialog } from './WorkforceOperationsDialog.js';
import { employeeFitsMachine } from './WorkforceMachineAssignmentIntegration.js';

function statusFor(dialog,employee){
 const a=(dialog.workforce.assignments||[]).find(x=>String(x.employeeId)===String(employee.id));
 if(!a||a.machineId===null||a.machineId===undefined||a.machineId==='')return{ok:false,text:'Keine Maschine zugewiesen',icon:'✕'};
 const m=(dialog.machines.machines||[]).find(x=>String(x.id)===String(a.machineId));
 const shifts={early:'Frühschicht',late:'Spätschicht',night:'Nachtschicht'};
 if(!m)return{ok:false,text:'Maschinenzuweisung ist nicht mehr gültig',icon:'⚠'};
 if(!employeeFitsMachine(employee,m))return{ok:false,text:`Falsche Zuweisung: ${m.label} passt nicht zu ${employee.jobId||'dieser Fachkraft'}`,icon:'⚠'};
 return{ok:true,text:`${m.label} · ${shifts[a.shiftId]||a.shiftId}`,icon:'✓'};
}

function restrictMachineSelect(dialog,row,employee){
 const select=row.querySelectorAll('select')[1];if(!select)return;
 const current=(dialog.workforce.assignments||[]).find(a=>String(a.employeeId)===String(employee.id));
 const allowed=new Set((dialog.machines.machines||[]).filter(m=>employeeFitsMachine(employee,m)).map(m=>String(m.id)));
 for(const option of [...select.options]){if(option.value===''||allowed.has(String(option.value)))continue;option.remove();}
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
   Object.assign(row.style,{background:'#111827',borderColor:'#334155',color:'#f8fafc'});
   const st=statusFor(this,employee),box=this.el('div');box.className='world-assignment-status';
   const icon=this.el('span',st.icon),text=this.el('span',st.text);box.append(icon,text);
   Object.assign(box.style,{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 10px',margin:'7px 0 8px',borderRadius:'999px',fontSize:'13px',fontWeight:'800',background:st.ok?'rgba(22,101,52,.28)':'rgba(153,27,27,.24)',color:st.ok?'#86efac':'#fca5a5',border:`1px solid ${st.ok?'#166534':'#991b1b'}`});
   row.querySelector('strong')?.insertAdjacentElement('afterend',box);
  });
  return result;
 };
}
export { statusFor,restrictMachineSelect };
