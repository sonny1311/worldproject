// WorldProject – zeigt gebündelte Verpackungsbestände verständlich im Lager an.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { storageRule, storagePackDescription, storageSpaceFor } from './WarehouseSpaceIntegration.js';

function stockLabel(dialog,id,quantity){
  const meta=dialog.materialMeta(id),q=Math.max(0,Number(quantity)||0),rule=storageRule(id),packLabel=storagePackDescription(id);
  if(rule.packSize>1){
    const packs=q/rule.packSize;
    const packText=Number.isInteger(packs)?dialog.number(packs,0):dialog.number(packs,2);
    return `${meta.label}: ${packText} Gebinde · ${dialog.number(q)} ${meta.unit} (${packLabel||`${rule.packSize} je Gebinde`})`;
  }
  return `${meta.label}: ${dialog.number(q)} ${meta.unit}`;
}

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__worldWarehousePackDisplayIntegrated){
  proto.__worldWarehousePackDisplayIntegrated=true;
  proto.renderWarehouse=function(panel){
    const wh=this.el('section');wh.append(this.el('h3','Lagerbestand'));
    for(const [zoneId,overview] of Object.entries(this.warehouse.overview())){
      const zone=this.el('div');Object.assign(zone.style,{border:'1px solid #ddd',borderRadius:'8px',padding:'9px',margin:'6px 0'});
      zone.append(this.el('strong',`${this.storageLabel(zoneId)}: ${this.number(overview.used)} / ${this.number(overview.capacity)} Lagerplätze belegt`));
      const entries=Object.entries(overview.stock||{}).filter(([,q])=>Number(q)>0);
      if(!entries.length)zone.append(this.el('div','Leer'));
      for(const [id,q] of entries){
        const line=this.el('div',stockLabel(this,id,q));
        const space=storageSpaceFor(id,q),rule=storageRule(id);
        if(rule.packSize>1){line.title=`Belegt ${this.number(space)} Lagerplätze`;}
        zone.append(line);
      }
      wh.append(zone);
    }
    panel.append(wh);
  };
}

export function runWarehousePackDisplayTest(){
  const fake={materialMeta:id=>({label:id==='caps'?'Kronkorken':'0,33-l-Flaschen',unit:'Stk'}),number:(v,max=3)=>Number(v).toLocaleString('de-DE',{maximumFractionDigits:max})};
  const caps=stockLabel(fake,'caps',20000),bottles=stockLabel(fake,'bottles',20000);
  if(!caps.includes('20 Gebinde')||!caps.includes('20.000 Stk'))throw new Error('Kronkorken werden nicht als Gebinde angezeigt');
  if(!bottles.includes('1.000 Gebinde')||!bottles.includes('20.000 Stk'))throw new Error('Flaschen werden nicht als Gebinde angezeigt');
  return true;
}
if(typeof window!=='undefined')window.runWarehousePackDisplayTest=runWarehousePackDisplayTest;
