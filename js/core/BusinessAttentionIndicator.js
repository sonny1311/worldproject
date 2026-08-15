// WorldProject - Aufmerksamkeitssignale fuer mehrere Betriebe.
// Erkennt fertige/handlungsbereite Zustaende aus gespeicherten Betriebsdaten, ohne Betriebe aktiv laden zu muessen.
const arr=v=>Array.isArray(v)?v:[];
const endTime=x=>Number(x?.endAt||x?.endsAt||x?.finishAt||x?.arrivalAt||x?.arrivesAt||0);
const pushOnce=(items,item)=>{const key=`${item.kind}:${item.id??item.label}`;if(!items.some(x=>x.key===key))items.push({...item,key});};
export function businessAttention(company,now=Date.now()){
 const s=company?.game_state||company||{},items=[];
 const queues=[...arr(s.productionQueue),...arr(s.activeProduction),...arr(s.productionJobs)];
 for(const q of queues){const end=endTime(q);if((q?.status==='completed'||q?.status==='ready'||q?.completed===true||(end>0&&end<=now))&&!q?.collected&&!q?.claimed)pushOnce(items,{kind:'production',id:q?.id,label:'Produktion fertig',target:'production'});}
 const projects=[...arr(s.constructionProjects),...arr(s.activeConstruction),...arr(s.constructionQueue)];
 for(const p of projects){const end=endTime(p);if((p?.status==='completed'||p?.status==='ready'||p?.completed===true||(end>0&&end<=now))&&!p?.collected&&!p?.claimed)pushOnce(items,{kind:'construction',id:p?.id,label:'Bauprojekt fertig',target:'construction'});}
 for(const d of [...arr(s.deliveries),...arr(s.supplyDeliveries)]){const end=endTime(d);if((d?.status==='arrived'||d?.status==='ready'||(end>0&&end<=now))&&!d?.accepted&&!d?.received)pushOnce(items,{kind:'delivery',id:d?.id,label:'Lieferung angekommen',target:'deliveries'});}
 const equipment=[...arr(s.buildingState?.equipment),...arr(s.building_state?.equipment),...arr(s.equipment),...arr(s.machines)];
 for(const m of equipment){const condition=Number(m?.condition??m?.conditionPercent??100),broken=m?.broken===true||m?.status==='broken'||m?.status==='defect',due=m?.maintenanceDue===true||m?.maintenance_due===true;if(broken||condition<=0)pushOnce(items,{kind:'machine',id:m?.id,label:'Maschine ausgefallen',target:'maintenance'});else if(due||condition>0&&condition<=20)pushOnce(items,{kind:'maintenance',id:m?.id,label:'Wartung erforderlich',target:'maintenance'});}
 for(const o of [...arr(s.customerOrders),...arr(s.orders),...arr(s.urgentOrders)]){const deadline=Number(o?.deadlineAt||o?.dueAt||o?.expiresAt||0),open=!['completed','delivered','cancelled','failed'].includes(String(o?.status||'').toLowerCase());if(open&&(o?.urgent===true||o?.priority==='urgent'||(deadline>0&&deadline<=now)))pushOnce(items,{kind:'order',id:o?.id,label:deadline>0&&deadline<=now?'Auftrag überfällig':'Dringender Auftrag',target:'orders'});}
 return{needsAttention:items.length>0,count:items.length,items};
}
export function attentionText(company){const a=businessAttention(company);return a.needsAttention?`🔔 ${a.count}× bereit: ${[...new Set(a.items.map(x=>x.label))].join(', ')}`:'Alles läuft';}
export function attentionPrimaryTarget(company){return businessAttention(company).items[0]?.target||null;}
export function runBusinessAttentionIndicatorTest(){const now=10000,c={game_state:{productionQueue:[{id:'p1',endAt:9000,status:'running'}],constructionProjects:[{endAt:12000,status:'running'}],machines:[{id:'m1',condition:15}],customerOrders:[{id:'o1',urgent:true,status:'open'}]}};const a=businessAttention(c,now);if(!a.needsAttention||a.count!==3||!a.items.some(x=>x.kind==='production')||!a.items.some(x=>x.kind==='maintenance')||!a.items.some(x=>x.kind==='order'))throw new Error('Betriebs-Aufmerksamkeit erkennt Handlungsbedarf nicht korrekt');return{success:true};}
