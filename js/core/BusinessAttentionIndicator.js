// WorldProject - Aufmerksamkeitssignale fuer mehrere Betriebe.
// Erkennt fertige/handlungsbereite Zustaende aus gespeicherten Betriebsdaten, ohne Betriebe aktiv laden zu muessen.
export function businessAttention(company,now=Date.now()){
 const s=company?.game_state||{},items=[];
 const queues=[...(s.productionQueue||[]),...(s.activeProduction||[])];
 for(const q of queues){const end=Number(q?.endAt||q?.endsAt||q?.finishAt||0);if((q?.status==='completed'||q?.status==='ready'||(end>0&&end<=now))&&!q?.collected)items.push({kind:'production',label:'Produktion fertig'});}
 const projects=[...(s.constructionProjects||[]),...(s.activeConstruction||[])];
 for(const p of projects){const end=Number(p?.endAt||p?.endsAt||p?.finishAt||0);if((p?.status==='completed'||p?.status==='ready'||(end>0&&end<=now))&&!p?.collected)items.push({kind:'construction',label:'Bauprojekt fertig'});}
 for(const d of (s.deliveries||[])){const end=Number(d?.arrivalAt||d?.arrivesAt||0);if((d?.status==='arrived'||(end>0&&end<=now))&&!d?.accepted)items.push({kind:'delivery',label:'Lieferung angekommen'});}
 return{needsAttention:items.length>0,count:items.length,items};
}
export function attentionText(company){const a=businessAttention(company);return a.needsAttention?`🔔 ${a.count}× bereit: ${[...new Set(a.items.map(x=>x.label))].join(', ')}`:'Alles läuft';}
export function runBusinessAttentionIndicatorTest(){const now=10000,c={game_state:{productionQueue:[{endAt:9000,status:'running'}],constructionProjects:[{endAt:12000,status:'running'}]}};const a=businessAttention(c,now);if(!a.needsAttention||a.count!==1||a.items[0].kind!=='production')throw new Error('Betriebs-Aufmerksamkeit erkennt fertige Produktion nicht korrekt');return{success:true};}
