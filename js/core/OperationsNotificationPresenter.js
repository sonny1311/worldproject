// WorldProject – Prioritäten für Betriebswarnungen.
export const OperationSeverityRank={critical:4,error:4,warning:3,info:2,success:1};
export function operationNotice(severity='info',title='Hinweis',message=''){return{severity,title,message,priority:OperationSeverityRank[severity]||2};}
if(typeof window!=='undefined')window.worldOperationSeverityRank=OperationSeverityRank;
