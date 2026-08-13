import { EconomyDashboard } from './EconomyDashboard.js';

function removePlannedEverywhere(company,id){
  const key=String(id),lists=[company?.productionQueue,company?.operationsState?.productionQueue,company?.operationalSupplyState?.productionQueue];
  let removed=0;
  for(const list of lists){
    if(!Array.isArray(list))continue;
    for(let i=list.length-1;i>=0;i--){
      const row=list[i];
      if(String(row?.id)!==key)continue;
      const status=String(row?.status||'queued').toLowerCase();
      if(!['planned','queued','scheduled'].includes(status))return {success:false,reason:'Produktion hat bereits begonnen'};
      list.splice(i,1);removed++;
    }
  }
  if(removed){
    window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'production-removed'}}));
    window.dispatchEvent(new CustomEvent('worldproject:state-changed',{detail:{source:'production-removed'}}));
  }
  return {success:removed>0,removed};
}

const proto=EconomyDashboard.prototype;
if(!proto.__worldInlineProductionDelete){
  proto.__worldInlineProductionDelete=true;
  const originalRender=proto.render;
  proto.render=function(panel){
    const result=originalRender.call(this,panel);
    const jobs=this.operationsOverview?.activeProduction?.()||[];
    const card=panel.querySelector?.('#dashboard-production');
    if(!card)return result;
    const rows=[...card.querySelectorAll('div')].filter(el=>/·\s*(Geplant|Queued|Scheduled)\s*$/.test((el.textContent||'').trim()));
    rows.forEach((row,index)=>{
      const job=jobs.filter(j=>['planned','queued','scheduled'].includes(String(j?.status||'').toLowerCase()))[index];
      if(!job||row.querySelector('.world-production-delete-x'))return;
      const x=document.createElement('button');x.type='button';x.className='world-production-delete-x';x.textContent='✕';x.title='Geplante Produktion löschen';
      Object.assign(x.style,{marginLeft:'8px',border:'0',background:'transparent',color:'#ff6b6b',fontWeight:'900',cursor:'pointer',fontSize:'15px',padding:'0 4px'});
      x.onclick=e=>{e.stopPropagation();const r=removePlannedEverywhere(this.company,job.id);if(!r.success){alert(r.reason||'Produktion konnte nicht gelöscht werden');return;}this.render(panel);};
      row.append(x);
    });
    return result;
  };
}
