// WorldProject – sicherer Lager-Notverkauf zum Freimachen überfüllter Lager.
// Verwendet das bestehende operative Lager und financialLog; kein zweites Lagersystem.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { suppliersForCompany, quoteSupplier } from './OperationalSupplyChainSystem.js';

const n=v=>Number.isFinite(Number(v))?Number(v):0;

export function weightedPurchaseUnitPrice(dialog,company,materialId){
  const orders=(dialog?.orders?.orders||[]).filter(o=>o?.material===materialId&&o.status==='stored'&&n(o.quantity)>0);
  let qty=0,cost=0;
  for(const o of orders){
    const q=n(o.quantity);if(!(q>0))continue;
    const total=n(o.paidCost)>0?n(o.paidCost):n(o.quote?.totalCost)>0?n(o.quote.totalCost):n(o.quote?.unitPrice)*q;
    if(!(total>0))continue;qty+=q;cost+=total;
  }
  if(qty>0&&cost>0)return cost/qty;
  let cheapest=Infinity;
  for(const supplier of suppliersForCompany(company||{})){
    if(!(supplier.materials||[]).includes(materialId))continue;
    try{const q=quoteSupplier(supplier,materialId,1);if(n(q.totalCost)>0)cheapest=Math.min(cheapest,n(q.totalCost));}catch{}
  }
  return Number.isFinite(cheapest)?cheapest:0;
}

export function clearanceQuote(dialog,company,materialId,quantity,{rate=.65}={}){
  const q=n(quantity),purchaseUnit=weightedPurchaseUnitPrice(dialog,company,materialId),safeRate=Math.min(.9,Math.max(.1,n(rate)||.65)),saleUnit=purchaseUnit*safeRate;
  return{quantity:q,purchaseUnit,saleUnit,revenue:q*saleUnit,rate:safeRate};
}

export function executeWarehouseClearance(dialog,company,{zone,materialId,quantity,rate=.65}={}){
  if(!dialog||!company)throw new Error('Betrieb oder Lager fehlt');
  const stock=dialog.warehouse?.stock?.[zone];if(!stock)throw new Error('Lagerbereich fehlt');
  const available=n(stock[materialId]),q=n(quantity);if(!(q>0))throw new Error('Verkaufsmenge muss größer als 0 sein');if(q>available+1e-9)throw new Error('Nicht genug Bestand für diese Verkaufsmenge');
  const quote=clearanceQuote(dialog,company,materialId,q,{rate});if(!(quote.purchaseUnit>0)||!(quote.saleUnit>0))throw new Error('Für diese Ware ist noch kein belastbarer Einstandspreis vorhanden');
  stock[materialId]=Math.max(0,available-q);if(stock[materialId]<=1e-9)delete stock[materialId];
  company.money=n(company.money)+quote.revenue;company.financialLog??=[];company.financialLog.push({type:'warehouse_clearance_sale',amount:quote.revenue,time:Date.now(),materialId,quantity:q,unitPrice:quote.saleUnit,purchaseUnitPrice:quote.purchaseUnit,rate:quote.rate,zone});
  dialog.saveState(company);window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'warehouse-clearance-sale'}}));
  return quote;
}

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__worldWarehouseClearanceIntegrated){
  proto.__worldWarehouseClearanceIntegrated=true;
  const original=proto.renderWarehouse;
  proto.renderWarehouse=function(panel,...args){
    const result=original.call(this,panel,...args),company=this.companyProvider?.();
    const sections=[...panel.querySelectorAll('section')],warehouseSection=sections.reverse().find(s=>(s.querySelector('h3')?.textContent||'').includes('Lagerbestand'));
    if(!warehouseSection||!company)return result;
    const intro=this.el('div','🧹 Lager räumen: Überschüssige Ware kann sofort mit deutlichem Abschlag verkauft werden. Menge immer selbst festlegen.');Object.assign(intro.style,{padding:'9px',margin:'10px 0',borderRadius:'8px',background:'rgba(220,130,0,.10)',border:'1px solid rgba(180,110,0,.35)'});warehouseSection.insertBefore(intro,warehouseSection.children[1]||null);
    for(const [zone,overview] of Object.entries(this.warehouse.overview())){
      const entries=Object.entries(overview.stock||{}).filter(([,qty])=>n(qty)>0);if(!entries.length)continue;
      const box=this.el('div');Object.assign(box.style,{border:'1px solid #ddd',borderRadius:'8px',padding:'9px',margin:'8px 0',background:'#fcfcfc'});box.append(this.el('strong',`${this.storageLabel(zone)} · ${this.number(overview.used)} / ${this.number(overview.capacity)} belegt${overview.overfilled?' · ⚠️ ÜBERFÜLLT':''}`));
      const excess=Math.max(0,n(overview.used)-n(overview.capacity));
      for(const [materialId,availableRaw] of entries){
        const available=n(availableRaw),meta=this.materialMeta(materialId),purchaseUnit=weightedPurchaseUnitPrice(this,company,materialId),saleUnit=purchaseUnit*.65,row=this.el('div');Object.assign(row.style,{display:'grid',gridTemplateColumns:'minmax(190px,1.5fr) minmax(150px,1fr) minmax(110px,.7fr) auto auto',gap:'8px',alignItems:'center',padding:'8px 0',borderTop:'1px solid #eee'});
        const qty=this.el('input');qty.type='number';qty.min='0.001';qty.max=String(available);qty.step='any';qty.placeholder='Menge';Object.assign(qty.style,{width:'100px',padding:'6px'});
        row.append(this.el('span',`${meta.label}: ${this.number(available)} ${meta.unit}`),this.el('span',purchaseUnit>0?`Einstand ca. ${this.money(purchaseUnit)}/${meta.unit} · Notverkauf ${this.money(saleUnit)}/${meta.unit}`:'Einstandspreis noch nicht ermittelbar'),qty);
        const fill=this.btn('Überbestand eintragen',()=>{qty.value=String(Math.min(available,excess||available));});if(!(excess>0))fill.textContent='Bestand eintragen';
        const sell=this.btn('Schnellverkauf',()=>{try{const q=n(qty.value);const quote=executeWarehouseClearance(this,company,{zone,materialId,quantity:q});alert(`Verkauft: ${this.number(q)} ${meta.unit} ${meta.label}\nErlös: ${this.money(quote.revenue)}\nAbschlag: ${Math.round((1-quote.rate)*100)} % unter Einstand`);this.render(panel);}catch(e){alert(e.message);}});
        if(!(purchaseUnit>0))sell.disabled=true;row.append(fill,sell);box.append(row);
      }
      warehouseSection.append(box);
    }
    return result;
  };
}

export function runWarehouseClearanceSaleTest(){
  const dialog={orders:{orders:[{material:'malt',quantity:100,status:'stored',paidCost:200}]},warehouse:{stock:{raw:{malt:80}}},saveState(){}};
  const company={money:100,financialLog:[]};
  const q=clearanceQuote(dialog,company,'malt',10);if(Math.abs(q.purchaseUnit-2)>.0001||Math.abs(q.saleUnit-1.3)>.0001||Math.abs(q.revenue-13)>.0001)throw new Error('Notverkaufsberechnung fehlerhaft');
  executeWarehouseClearance(dialog,company,{zone:'raw',materialId:'malt',quantity:10});if(Math.abs(dialog.warehouse.stock.raw.malt-70)>.0001||Math.abs(company.money-113)>.0001||company.financialLog[0]?.type!=='warehouse_clearance_sale')throw new Error('Lager-Notverkauf bucht Bestand oder Geld falsch');
  return true;
}
if(typeof window!=='undefined')window.runWarehouseClearanceSaleTest=runWarehouseClearanceSaleTest;
