// WorldProject – Finanzzusammenfassung für bestehende UI.
const value=v=>Number.isFinite(Number(v))?Number(v):0;
export function financePanelState(company){const sales=company.salesLedger||[];const costs=company.costLedger||[];const revenue=sales.reduce((sum,row)=>sum+value(row.revenue??row.amount),0);const expenses=costs.reduce((sum,row)=>sum+value(row.cost??row.amount),0);return{cash:value(company.money),revenue,expenses,profit:revenue-expenses,taxReserve:value(company.finance?.taxReserve),receivables:company.finance?.receivables||[],payables:company.finance?.payables||[],loans:company.finance?.loans||[]};}
if(typeof window!=='undefined')window.worldFinancePanel={state:financePanelState};
