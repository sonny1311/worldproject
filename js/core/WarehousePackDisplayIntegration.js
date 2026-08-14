// WorldProject – zeigt Lagerbestände als Europaletten-/Palettenplatz-Äquivalente.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { storageRule, storagePackDescription, storageSpaceFor } from './WarehouseSpaceIntegration.js';

function stockLabel(dialog,id,quantity){
  const meta=dialog.materialMeta(id),q=Math.max(0,Number(quantity)||0),rule=storageRule(id),packLabel=storagePackDescription(id),space=storageSpaceFor(id,q);
  const pallets=space<.01?dialog.number(space,4):space<1?dialog.number(space,3):dialog.number(space,2);
  return `${meta.label}: ${dialog.number(q)} ${meta.unit} · ${pallets} Palettenplätze${packLabel?` (${packLabel})`:''}`;
}

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__worldWarehousePackDisplayIntegrated){
  proto.__worldWarehousePackDisplayIntegrated=true;
  proto.renderWarehouse=function(panel){
    const wh=this.el('section');wh.append(this.el('h3','Lagerbestand'));
    for(const [zoneId,overview] of Object.entries(this.warehouse.overview())){
      const zone=this.el('div');Object.assign(zone.style,{border:'1px solid #ddd',borderRadius:'8px',padding:'9px',margin:'6px 0'});
      zone.append(this.el('strong',`${this.storageLabel(zoneId)}: ${this.number(overview.used,2)} / ${this.number(overview.capacity,2)} Europaletten-Plätze belegt`));
      const entries=Object.entries(overview.stock||{}).filter(([,q])=>Number(q)>0);
      if(!entries.length)zone.append(this.el('div','Leer'));
      for(const [id,q] of entries){const line=this.el('div',stockLabel(this,id,q));line.title=`Belegt ${this.number(storageSpaceFor(id,q),4)} Europaletten-Plätze`;zone.append(line);}
      wh.append(zone);
    }
    panel.append(wh);
  };
}

export function runWarehousePackDisplayTest(){
  const fake={materialMeta:id=>({label:id==='caps'?'Kronkorken':id==='yeast'?'Hefe':'0,33-l-Flaschen',unit:id==='yeast'?'kg':'Stk'}),number:(v,max=3)=>Number(v).toLocaleString('de-DE',{maximumFractionDigits:max})};
  const caps=stockLabel(fake,'caps',20000),bottles=stockLabel(fake,'bottles',300),yeast=stockLabel(fake,'yeast',1);
  if(!caps.includes('1 Palettenplätze')||!caps.includes('20.000'))throw new Error('Kronkorken-Palettenanzeige fehlerhaft');
  if(!bottles.includes('1 Palettenplätze')||!bottles.includes('300'))throw new Error('Flaschen-Palettenanzeige fehlerhaft');
  if(!yeast.includes('0,003 Palettenplätze')&&!yeast.includes('0,0025 Palettenplätze'))throw new Error('Hefe-Teilpalettenanzeige fehlerhaft');
  return true;
}
if(typeof window!=='undefined')window.runWarehousePackDisplayTest=runWarehousePackDisplayTest;
