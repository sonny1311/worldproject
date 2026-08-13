// WorldProject – prüft Produktionsmengen und Ausschuss.
const n=v=>Number.isFinite(Number(v))?Number(v):0;
export function productionFlowAudit({planned=0,completed=0,scrap=0,rework=0}={}){const issues=[];if(n(completed)<0||n(scrap)<0||n(rework)<0)issues.push('Negative Produktionsmenge');if(n(completed)+n(scrap)>n(planned)+n(rework)+.0001)issues.push('Output und Ausschuss überschreiten den verfügbaren Produktionsumfang');return{success:issues.length===0,issues,remaining:Math.max(0,n(planned)+n(rework)-n(completed)-n(scrap))};}
if(typeof window!=='undefined')window.worldProductionFlowAudit=productionFlowAudit;
