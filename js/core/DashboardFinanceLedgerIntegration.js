// WorldProject – sichtbare Ein-/Ausgabenliste auf Basis des bestehenden financialLog.
import { EconomyDashboard } from './EconomyDashboard.js';

const TYPE_LABELS={
  supplier_order:'Rohstoff-/Materialeinkauf',
  equipment_purchase:'Maschinenkauf',
  equipment_purchase_refund:'Korrektur Maschinenkauf',
  storage_expansion:'Lagerausbau',
  machine_upgrade:'Maschinen-Upgrade',
  solar_investment:'Solaranlage / Energieinvestition',
  business_creation:'Betriebsgründung',
  vehicle_service:'Fahrzeugwartung',
  fleet_trip:'Fahrtkosten',
  customer_sale:'Kundenverkauf',
  mission_sale:'Verkauf / Auftrag',
  warehouse_clearance_sale:'Lager-Notverkauf'
};
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const ts=v=>{const t=v instanceof Date?v.getTime():Number(v)||Date.parse(v);return Number.isFinite(t)?t:0;};
export function financeLedgerRows(company,{limit=12}={}){
  return [...(company?.financialLog||[])].sort((a,b)=>ts(b.time)-ts(a.time)).slice(0,Math.max(1,Number(limit)||12)).map(row=>({
    ...row,
    amount:n(row.amount),
    label:TYPE_LABELS[row.type]||String(row.type||'Buchung').replace(/_/g,' '),
    time:ts(row.time)||Date.now()
  }));
}
export function financeLedgerTotals(company){
  return (company?.financialLog||[]).reduce((sum,row)=>{const amount=n(row.amount);if(amount>=0)sum.income+=amount;else sum.expense+=Math.abs(amount);return sum;},{income:0,expense:0});
}

const proto=EconomyDashboard.prototype;
if(!proto.__worldFinanceLedgerIntegrated){
  proto.__worldFinanceLedgerIntegrated=true;
  const originalRender=proto.render;
  proto.render=function(panel,...args){
    const result=originalRender.call(this,panel,...args);
    if(panel.querySelector('.world-finance-ledger-card'))return result;
    const grid=[...panel.querySelectorAll('div')].find(el=>el.style?.display==='grid'&&String(el.style.gridTemplateColumns||'').includes('315px'));
    if(!grid)return result;
    const card=this.card('💳 Ein- & Ausgaben');card.classList.add('world-finance-ledger-card');
    const totals=financeLedgerTotals(this.company),rows=financeLedgerRows(this.company);
    card.append(this.small(`Einnahmen: ${this.money(totals.income)} € · Ausgaben: ${this.money(totals.expense)} €`));
    if(!rows.length){card.append(this.small('Noch keine Geldbewegungen aufgezeichnet.'));grid.append(card);return result;}
    for(const row of rows){
      const line=this.el('div');Object.assign(line.style,{display:'grid',gridTemplateColumns:'1fr auto',gap:'8px',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,.08)'});
      const left=this.el('div');const date=new Date(row.time);left.append(this.el('div',row.label),this.small(date.toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'})));
      const sign=row.amount>=0?'+':'−',amount=this.el('strong',`${sign}${this.money(Math.abs(row.amount))} €`);line.append(left,amount);card.append(line);
    }
    grid.append(card);return result;
  };
}

export function runDashboardFinanceLedgerTest(){
  const c={financialLog:[{type:'supplier_order',amount:-100,time:1},{type:'customer_sale',amount:160,time:2},{type:'warehouse_clearance_sale',amount:20,time:3},{type:'solar_investment',amount:-5000,time:4},{type:'business_creation',amount:-75000,time:5}]};
  const totals=financeLedgerTotals(c),rows=financeLedgerRows(c,{limit:5});
  if(totals.income!==180||totals.expense!==80100||rows[0].label!=='Betriebsgründung'||rows[1].label!=='Solaranlage / Energieinvestition')throw new Error('Ein-/Ausgabenliste fehlerhaft');
  return true;
}
if(typeof window!=='undefined')window.runDashboardFinanceLedgerTest=runDashboardFinanceLedgerTest;
