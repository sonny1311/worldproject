// WorldProject – prüft Admin-Eingaben vor Änderungen.
export function validateAdminNumber(value,{min=-Infinity,max=Infinity,label='Wert'}={}){const n=Number(value);if(!Number.isFinite(n))return{valid:false,message:`${label} ist keine Zahl`};if(n<min||n>max)return{valid:false,message:`${label} liegt außerhalb des erlaubten Bereichs`};return{valid:true,value:n};}
export function adminMutationPreview({entityType,entityId,field,before,after,reason=''}){return{entityType,entityId,field,before,after,reason:String(reason).trim(),changed:JSON.stringify(before)!==JSON.stringify(after)};}
if(typeof window!=='undefined')window.worldAdminMutationValidation={number:validateAdminNumber,preview:adminMutationPreview};
