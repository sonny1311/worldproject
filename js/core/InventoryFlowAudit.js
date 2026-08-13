// WorldProject – prüft Bestandsbewegungen auf rechnerische Konsistenz.
const n=v=>Number.isFinite(Number(v))?Number(v):0;
export function inventoryFlowAudit({before=0,after=0,received=0,produced=0,consumed=0,sold=0,adjusted=0,tolerance=.0001}={}){const expected=n(before)+n(received)+n(produced)-n(consumed)-n(sold)+n(adjusted),delta=n(after)-expected;return{success:Math.abs(delta)<=Math.max(0,n(tolerance)),expected,actual:n(after),delta};}
if(typeof window!=='undefined')window.worldInventoryFlowAudit=inventoryFlowAudit;
