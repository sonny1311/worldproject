// WorldProject – Fokusreihenfolge und Shortcut-IDs für Betriebsansichten.
export const OperationsFocusOrder=['company-switch','overview','procurement','inventory','production','equipment','workforce','fleet','sales','finance','alerts'];
export const OperationsShortcuts={overview:'g o',procurement:'g e',inventory:'g l',production:'g p',equipment:'g m',workforce:'g r',fleet:'g f',sales:'g k',finance:'g b'};
export function focusIndex(id){const index=OperationsFocusOrder.indexOf(id);return index<0?999:index+1;}
if(typeof window!=='undefined')window.worldOperationsFocus={order:OperationsFocusOrder,shortcuts:OperationsShortcuts,index:focusIndex};
