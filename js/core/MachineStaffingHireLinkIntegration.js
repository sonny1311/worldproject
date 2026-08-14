import { EconomyDashboard } from './EconomyDashboard.js';
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';

const premium = new PremiumEntitlementSystem();
const accountFor = dashboard => dashboard?.account || window.worldCurrentUser || window.worldAccount || {};

async function openPersonnel(dashboard,roleId,label,{preselect=false,assignment=false,machineType=''}={}){
  if(!window.worldWorkforceOperationsDialog){
    const { WorkforceOperationsDialog } = await import('./WorkforceOperationsDialog.js');
    window.worldWorkforceOperationsDialog = new WorkforceOperationsDialog({parent:document.body});
  }
  const dialog=window.worldWorkforceOperationsDialog;
  if(dialog.overlay)dialog.close();
  dialog.loadedCompanyId=null;
  await dialog.open();

  const root=dialog.overlay;
  if(!root)return;
  if(assignment){
    const heading=[...root.querySelectorAll('h3')].find(x=>(x.textContent||'').includes('Mitarbeiter & Schichtplan'));
    const area=heading?.parentElement||root;
    area.scrollIntoView({behavior:'smooth',block:'center'});
    area.style.outline='2px solid #ffd54a';
    setTimeout(()=>area.style.outline='',1800);
    const machine=dialog.machines?.machines?.find(m=>String(m.sourceType||m.type||'')===String(machineType));
    const rows=[...area.querySelectorAll('div')].filter(x=>(x.textContent||'').includes(label));
    const row=rows.find(x=>x.querySelectorAll('select').length>=2)||rows[0];
    const selects=row?.querySelectorAll?.('select');
    const machineSelect=selects?.[1];
    if(machine&&machineSelect&&[...machineSelect.options].some(o=>String(o.value)===String(machine.id))){machineSelect.value=String(machine.id);machineSelect.focus();}
    return;
  }

  const heading=[...root.querySelectorAll('h3')].find(x=>(x.textContent||'').includes('Mitarbeiter einstellen'));
  const area=heading?.parentElement||root;
  area.scrollIntoView({behavior:'smooth',block:'center'});
  area.style.outline='2px solid #ffd54a';
  setTimeout(()=>area.style.outline='',1800);

  if(!preselect)return;
  const select=area.querySelector('select');
  if(!select)return;
  const exact=[...select.options].find(o=>String(o.value)===String(roleId));
  if(exact){
    select.value=exact.value;
    select.dispatchEvent(new Event('change',{bubbles:true}));
    select.focus();
    return;
  }
  const wanted=String(label||'').toLowerCase();
  const fallback=[...select.options].find(o=>(o.textContent||'').toLowerCase().includes(wanted));
  if(fallback){select.value=fallback.value;select.dispatchEvent(new Event('change',{bubbles:true}));select.focus();}
}

const proto=EconomyDashboard.prototype;
if(!proto.__machineStaffingHireLinks){
  proto.__machineStaffingHireLinks=true;
  const original=proto.render;
  proto.render=function(panel){
    const result=original.call(this,panel);
    const box=panel.querySelector('.world-machine-staffing-overview');
    if(!box)return result;

    const guided = premium.canUseGuidedSetupNavigation(accountFor(this));
    for(const line of box.querySelectorAll('[data-staff-role]')){
      const strong=line.querySelector('strong');if(!strong)continue;
      const text=(strong.textContent||'').trim(),status=line.dataset.staffStatus||'';
      const roleId=line.dataset.staffRole||'',machineType=line.dataset.machineType||'';
      if(line.querySelector('.staff-hire-link'))continue;
      if(status==='missing'||text.startsWith('❌')){
        const label=text.replace(/^❌\s*/,'').replace(/\s+einstellen$/i,'').trim();
        const button=this.button(guided?'⭐ Jetzt einstellen':'Personal öffnen',()=>openPersonnel(this,roleId,label,{preselect:guided}));
        button.classList.add('staff-hire-link');if(roleId)button.dataset.staffRole=roleId;
        Object.assign(button.style,{display:'block',margin:'5px 0 0',padding:'6px 9px',fontSize:'11px'});line.append(button);
      }else if(status==='unassigned'||text.startsWith('⚠️')){
        const label=text.replace(/^⚠️\s*/,'').replace(/\s+vorhanden.*$/i,'').trim();
        const button=this.button('Personal zuweisen',()=>openPersonnel(this,roleId,label,{assignment:true,machineType}));
        button.classList.add('staff-hire-link');if(roleId)button.dataset.staffRole=roleId;
        Object.assign(button.style,{display:'block',margin:'5px 0 0',padding:'6px 9px',fontSize:'11px'});line.append(button);
      }
    }
    return result;
  };
}
