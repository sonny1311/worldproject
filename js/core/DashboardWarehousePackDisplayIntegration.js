// WorldProject – macht Pack-/Gebindelogik auch in der dunklen Lager-Detailkarte sichtbar.
import { EconomyDashboard } from './EconomyDashboard.js';
import { dashboardPackInfo } from './AdvancedWarehousePackIntegration.js';

const LABEL_TO_ID={
  'Kronkorken':'crown_cap',
  '0,33-l-Flaschen':'bottle_033','Neue 0,33-l-Flaschen':'bottle_033','Gereinigte gebrauchte 0,33-l-Flaschen':'clean_bottles','Ungereinigte Rücklaufflaschen 0,33 l':'dirty_bottles',
  '0,50-l-Flaschen':'bottle_050','Neue 0,50-l-Flaschen':'bottle_050','Gereinigte gebrauchte 0,50-l-Flaschen':'clean_bottles_050','Ungereinigte Rücklaufflaschen 0,50 l':'dirty_bottles_050',
  'Etiketten 0,33 l':'label_033','Etiketten 0,50 l':'label_050'
};
const format=n=>Number(n||0).toLocaleString('de-DE',{maximumFractionDigits:2});

const proto=EconomyDashboard.prototype;
if(!proto.__worldDashboardWarehousePackDisplayIntegrated){
  proto.__worldDashboardWarehousePackDisplayIntegrated=true;
  const original=proto.render;
  proto.render=function(panel,...args){
    const result=original.call(this,panel,...args);
    const cards=[...panel.querySelectorAll('div')],warehouse=cards.find(el=>el.firstElementChild?.textContent?.trim()==='🏬 Lager nach Bereichen');
    if(!warehouse)return result;
    for(const row of [...warehouse.children]){
      const spans=row.children;if(!spans||spans.length<2)continue;
      const name=spans[0]?.textContent?.trim(),id=LABEL_TO_ID[name];if(!id)continue;
      const raw=Number(String(spans[1]?.textContent||'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));
      if(!Number.isFinite(raw))continue;
      const info=dashboardPackInfo(id,raw);if(!info.isPacked)continue;
      spans[1].textContent=`${format(info.packs)} Gebinde · ${format(info.pieces)} Stk`;
      row.title=`${format(info.packSize)} Stück pro Lagergebinde`;
    }
    return result;
  };
}
