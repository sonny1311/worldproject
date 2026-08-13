// WorldProject – geplante Produktionen vor Produktionsstart abbrechen/loeschen.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__worldProductionQueueCancelIntegrated){
 proto.__worldProductionQueueCancelIntegrated=true;
 const originalRender=proto.render;
 proto.render=function(panel){
  const result=originalRender.call(this,panel);
  queueMicrotask(()=>{
   if(!panel?.isConnected)return;
   const company=this.companyProvider?.();
   const planned=(this.planner?.queue||[]).filter(job=>['planned','queued','scheduled'].includes(String(job?.status||'').toLowerCase()));
   if(!planned.length)return;
   const headings=[...panel.querySelectorAll('h3,h4,strong')];
   for(const job of planned){
    const label=job.recipe?.label||job.label||job.recipeId||'Produktion';
    const candidates=headings.filter(el=>el.textContent?.includes(label));
    const target=candidates[candidates.length-1]?.closest('div');
    if(!target||target.querySelector(`[data-cancel-production="${job.id}"]`))continue;
    const b=this.btn('Geplante Produktion löschen',()=>{
     const index=this.planner.queue.findIndex(x=>String(x.id)===String(job.id));
     if(index<0)return;
     const current=this.planner.queue[index];
     if(!['planned','queued','scheduled'].includes(String(current?.status||'').toLowerCase())){alert('Diese Produktion hat bereits begonnen und kann hier nicht mehr gelöscht werden.');return;}
     this.planner.queue.splice(index,1);
     this.saveState(company);
     this.render(panel);
    });
    b.dataset.cancelProduction=String(job.id);
    Object.assign(b.style,{background:'#fff1f1',borderColor:'#d66'});
    target.append(b);
   }
  });
  return result;
 };
}
