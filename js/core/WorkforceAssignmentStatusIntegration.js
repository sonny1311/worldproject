import { WorkforceOperationsDialog } from './WorkforceOperationsDialog.js';

function statusFor(dialog,employee){
 const a=(dialog.workforce.assignments||[]).find(x=>String(x.employeeId)===String(employee.id));
 if(!a||a.machineId===null||a.machineId===undefined||a.machineId==='')return{ok:false,text:'❌ Keine Maschine zugewiesen'};
 const m=(dialog.machines.machines||[]).find(x=>String(x.id)===String(a.machineId));
 const shifts={early:'Frühschicht',late:'Spätschicht',night:'Nachtschicht'};
 return m?{ok:true,text:`✅ ZUGEWIESEN: ${m.label} · ${shifts[a.shiftId]||a.shiftId}`}:{ok:false,text:'⚠️ Maschinenzuweisung ist nicht mehr gültig'};
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
   const st=statusFor(this,employees[i]),box=this.el('div',st.text);box.className='world-assignment-status';
   Object.assign(box.style,{padding:'8px 10px',margin:'6px 0',borderRadius:'7px',fontWeight:'800',background:st.ok?'#e8f5e9':'#ffebee',color:st.ok?'#1b5e20':'#b71c1c',border:`1px solid ${st.ok?'#2e7d32':'#c62828'}`});
   row.querySelector('strong')?.insertAdjacentElement('afterend',box);
   const machineSelect=row.querySelectorAll('select')[1];if(machineSelect)machineSelect.style.fontWeight='700';
  });
  return result;
 };
}
export { statusFor };
