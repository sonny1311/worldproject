import { EconomyDashboard } from './EconomyDashboard.js';

function findPersonnelArea(root){
  const nodes=[...root.querySelectorAll('div,section,article')];
  return nodes.filter(el=>{const t=(el.textContent||'').toLowerCase();return (t.includes('personal')||t.includes('mitarbeiter')||t.includes('belegschaft'))&&el.querySelector('select,button,input');}).sort((a,b)=>(a.textContent||'').length-(b.textContent||'').length)[0]||null;
}
function jumpToPersonnel(dashboard,label){
  const root=dashboard.overlay||document,target=findPersonnelArea(root);
  if(!target){alert(`Bitte öffne den Personalbereich und stelle dort „${label}“ ein.`);return;}
  target.scrollIntoView({behavior:'smooth',block:'center'});
  target.style.outline='2px solid #ffd54a';setTimeout(()=>target.style.outline='',1800);
  const wanted=String(label||'').toLowerCase();
  for(const select of target.querySelectorAll('select')){
    const option=[...select.options].find(o=>(o.textContent||'').toLowerCase().includes(wanted));
    if(option){select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));break;}
  }
}
const proto=EconomyDashboard.prototype;
if(!proto.__machineStaffingHireLinks){
  proto.__machineStaffingHireLinks=true;
  const original=proto.render;
  proto.render=function(panel){
    const result=original.call(this,panel);
    const box=panel.querySelector('.world-machine-staffing-overview');
    if(!box)return result;
    for(const strong of box.querySelectorAll('strong')){
      const text=(strong.textContent||'').trim();
      if(!text.startsWith('❌'))continue;
      const label=text.replace(/^❌\s*/,'').replace(/\s+einstellen$/i,'').trim();
      if(strong.parentElement?.querySelector('.staff-hire-link'))continue;
      const button=this.button('👤 Jetzt einstellen',()=>jumpToPersonnel(this,label));
      button.classList.add('staff-hire-link');
      Object.assign(button.style,{display:'block',margin:'5px 0 0',padding:'6px 9px',fontSize:'11px'});
      strong.parentElement?.append(button);
    }
    return result;
  };
}
