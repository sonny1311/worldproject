// ORVUNO – spielerfreundliche Lagerübersicht statt technischer Roh-IDs.
import { UniversalOperationsDialog } from './UniversalOperationsDialog.js';
import { stockCoverageDays } from './UniversalPlanningAndProcurement.js';
import { worldContentRegistry } from './ContentRegistry.js';

const ALIASES={
  malt_kg:'malt',hops_kg:'hops',yeast_kg:'yeast',water_l:'water',
  bottle_033:'bottles',bottle_050:'bottles_050',crown_cap:'caps',
  label_033:'labels',label_050:'labels_050',Flaschenwaschmittel:'bottle_wash_chem',
  beer_lager_033:'beer_lager_033',lager033_bottle:'beer_lager_033',
  beer_pils_033:'beer_pils_033',pils033_bottle:'beer_pils_033'
};
const FALLBACK={
  beer_lager_033:{label:'Lagerbier 0,33 l',unit:'Flaschen',zone:'finished'},
  lager033_bottle:{label:'Lagerbier 0,33 l',unit:'Flaschen',zone:'finished'},
  beer_pils_033:{label:'Pils 0,33 l',unit:'Flaschen',zone:'finished'},
  pils033_bottle:{label:'Pils 0,33 l',unit:'Flaschen',zone:'finished'},
  bottle_033:{label:'Neue 0,33-l-Flaschen',unit:'Stk',zone:'packaging'},
  bottle_050:{label:'Neue 0,50-l-Flaschen',unit:'Stk',zone:'packaging'},
  crown_cap:{label:'Kronkorken',unit:'Stk',zone:'packaging'},
  label_033:{label:'Etiketten 0,33 l',unit:'Stk',zone:'packaging'},
  label_050:{label:'Etiketten 0,50 l',unit:'Stk',zone:'packaging'},
  malt_kg:{label:'Malz',unit:'kg',zone:'raw'},hops_kg:{label:'Hopfen',unit:'kg',zone:'raw'},
  yeast_kg:{label:'Hefe',unit:'kg',zone:'raw'},water_l:{label:'Wasser',unit:'l',zone:'raw'},
  Flaschenwaschmittel:{label:'Flaschenwaschmittel',unit:'kg',zone:'raw'}
};
const ZONES={raw:{title:'🌾 Rohstoffe',order:1},packaging:{title:'📦 Verpackung',order:2},cold:{title:'❄️ Kühlung',order:3},finished:{title:'🍺 Zwischen- & Fertigwaren',order:4},other:{title:'📋 Sonstiger Bestand',order:5}};
const format=v=>Number(v||0).toLocaleString('de-DE',{maximumFractionDigits:2});
function metaFor(id){
  const canonical=ALIASES[id]||id;
  const material=worldContentRegistry.get('materials',canonical);
  const product=worldContentRegistry.get('products',canonical);
  const fallback=FALLBACK[id]||FALLBACK[canonical];
  const rec=material||product||fallback||{};
  return {id,canonical,label:rec.label||String(id).replace(/_/g,' '),unit:rec.unit||'',zone:rec.storageZone||rec.zone||(product?'finished':'other')};
}
function safeText(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}

const proto=UniversalOperationsDialog.prototype;
if(!proto.__worldFriendlyWarehouseOverview){
  proto.__worldFriendlyWarehouseOverview=true;
  proto.render_storage=function(body,c){
    const inv=c?.inventory||{};
    const entries=Object.entries(inv).filter(([,q])=>Number(q)>0).map(([id,q])=>({id,q:Number(q)||0,meta:metaFor(id),days:stockCoverageDays(c,id)}));
    body.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px"><div><h2 style="margin:0 0 4px">📦 Lagerübersicht</h2><div style="color:#94a3b8">Deine Bestände nach Bereichen – ohne technische Artikelnummern.</div></div><div style="padding:8px 11px;border:1px solid #334155;border-radius:9px;background:#0b1220;color:#cbd5e1"><b>'+entries.length+'</b> Artikel auf Lager</div></div>';
    if(!entries.length){const empty=document.createElement('div');empty.textContent='Das Lager ist derzeit leer.';Object.assign(empty.style,{padding:'18px',border:'1px solid #334155',borderRadius:'10px',background:'#0b1220',color:'#94a3b8'});body.append(empty);return;}
    const groups=new Map();for(const row of entries){const z=ZONES[row.meta.zone]?row.meta.zone:'other';if(!groups.has(z))groups.set(z,[]);groups.get(z).push(row);}
    for(const zoneId of [...groups.keys()].sort((a,b)=>ZONES[a].order-ZONES[b].order)){
      const rows=groups.get(zoneId).sort((a,b)=>a.meta.label.localeCompare(b.meta.label,'de'));
      const section=document.createElement('section');Object.assign(section.style,{margin:'0 0 16px'});
      const title=document.createElement('div');title.innerHTML=`<b style="font-size:17px">${ZONES[zoneId].title}</b><span style="margin-left:8px;color:#64748b;font-size:12px">${rows.length} Artikel</span>`;title.style.margin='0 0 8px';section.append(title);
      const grid=document.createElement('div');Object.assign(grid.style,{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'9px'});
      for(const row of rows){
        const card=document.createElement('div');Object.assign(card.style,{padding:'12px',border:'1px solid #334155',borderRadius:'10px',background:'linear-gradient(135deg,#111827,#0b1220)',minHeight:'76px'});
        const coverage=Number.isFinite(row.days)?`<div style="margin-top:7px;color:#93c5fd;font-size:12px">⏱️ Reicht bei aktuellem Verbrauch ca. ${format(row.days)} Tage</div>`:'';
        card.innerHTML=`<div style="color:#e2e8f0;font-weight:800">${safeText(row.meta.label)}</div><div style="font-size:23px;font-weight:900;margin-top:5px">${format(row.q)} <span style="font-size:13px;color:#94a3b8;font-weight:700">${safeText(row.meta.unit)}</span></div>${coverage}`;
        grid.append(card);
      }
      section.append(grid);body.append(section);
    }
    const hint=document.createElement('div');hint.textContent='ℹ️ Eine Reichweite wird nur angezeigt, wenn echte Verbrauchsdaten vorhanden sind.';Object.assign(hint.style,{marginTop:'4px',padding:'9px 11px',borderRadius:'8px',background:'#172033',color:'#94a3b8',fontSize:'12px'});body.append(hint);
  };
}
