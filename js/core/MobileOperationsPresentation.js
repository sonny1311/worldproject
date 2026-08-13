// WorldProject – mobile Darstellungs-/Interaktionshilfen ohne zweite UI.
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export const MobileBreakpoints={compact:480,tablet:900,desktop:1280};
export function viewportClass(width){const w=n(width,1024);return w<=MobileBreakpoints.compact?'compact':w<=MobileBreakpoints.tablet?'tablet':'desktop';}
export function touchTarget(size=44){return Math.max(44,n(size,44));}
export function prioritizeOperationsCards(cards=[],{mode='compact'}={}){const weight={critical:100,warning:80,action:70,status:40,info:20};return [...cards].sort((a,b)=>(weight[b.kind]||0)-(weight[a.kind]||0)||n(b.priority)-n(a.priority)).map((x,i)=>({...x,mobileOrder:i,collapsed:mode==='compact'&&i>4}));}
export function compactTable(rows=[],columns=[]){const primary=columns.filter(c=>c.mobilePriority<=1),secondary=columns.filter(c=>c.mobilePriority>1);return rows.map(r=>({primary:primary.map(c=>({key:c.key,label:c.label,value:r[c.key]})),secondary:secondary.map(c=>({key:c.key,label:c.label,value:r[c.key]}))}));}
export function bottomActionBar(actions=[]){return actions.filter(x=>x.visible!==false).sort((a,b)=>n(b.priority)-n(a.priority)).slice(0,4).map(x=>({...x,minHeight:touchTarget(x.minHeight)}));}
export function mobilePresentationVM({width,cards=[],rows=[],columns=[],actions=[]}={}){const mode=viewportClass(width);return{mode,cards:prioritizeOperationsCards(cards,{mode}),rows:compactTable(rows,columns),actions:bottomActionBar(actions),touchTarget:44};}
if(typeof window!=='undefined')window.worldMobileOperationsPresentation={viewportClass,touchTarget,prioritizeOperationsCards,compactTable,bottomActionBar,mobilePresentationVM};