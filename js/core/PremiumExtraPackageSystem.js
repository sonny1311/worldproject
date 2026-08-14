// WorldProject – separat kaufbare Premium-Zusatzpakete.
// Bewusst getrennt von premium_monthly. Preise und Tagesmengen bleiben konfigurierbar,
// bis das Balancing fuer Echtgeld-/Premiumangebote final festgelegt ist.
export const PremiumExtraPackageCatalog=Object.freeze({
 construction_materials:{
  id:'construction_materials',
  label:'🏗️ Baupaket',
  description:'Zeitlich begrenztes Zusatzpaket mit taeglicher Baustoff-Gutschrift. Unabhaengig von der normalen Premiumzeit.',
  durations:[7,14,30],
  enabled:false,
  priceByDays:{7:null,14:null,30:null},
  dailyMaterials:{concrete:null,steel:null,brick:null,insulation:null,electrical:null,pipes:null,roofing:null}
 }
});
const dayMs=86400000;
const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
export function extraPackageCatalog(){return Object.values(PremiumExtraPackageCatalog).map(clone);}
export function ensureExtraPackageState(account={}){account.premiumExtraPackages??={active:[],history:[]};return account.premiumExtraPackages;}
export function packageQuote(packageId,days){const p=PremiumExtraPackageCatalog[packageId];if(!p)throw new Error('Unbekanntes Zusatzpaket');days=Number(days);if(!p.durations.includes(days))throw new Error('Diese Laufzeit ist fuer das Paket nicht vorgesehen');return{packageId,days,enabled:p.enabled,price:p.priceByDays[days],dailyMaterials:{...p.dailyMaterials}};}
export function activateExtraPackage(account,{packageId,days,now=Date.now(),paymentReference=null}={}){const q=packageQuote(packageId,days);if(!q.enabled)throw new Error('Dieses Zusatzpaket ist noch nicht zum Kauf freigegeben');if(!Number.isFinite(Number(q.price))||Number(q.price)<0)throw new Error('Preis fuer dieses Zusatzpaket ist noch nicht festgelegt');const s=ensureExtraPackageState(account),entry={id:`pkg-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,packageId,days,startedAt:Number(now),endsAt:Number(now)+days*dayMs,lastClaimDay:null,nextClaimAt:Number(now),paymentReference,status:'active'};s.active.push(entry);s.history.push({...entry,event:'activated'});return entry;}
export function packageStatus(account,now=Date.now()){const s=ensureExtraPackageState(account);for(const x of s.active)if(x.status==='active'&&Number(now)>=x.endsAt)x.status='expired';return s.active.map(x=>({...x,remainingDays:Math.max(0,Math.ceil((x.endsAt-Number(now))/dayMs))}));}
export function claimDailyExtraPackageMaterials(account,company,{packageInstanceId,now=Date.now()}={}){const s=ensureExtraPackageState(account),x=s.active.find(v=>v.id===packageInstanceId);if(!x||x.status!=='active')throw new Error('Aktives Zusatzpaket nicht gefunden');if(Number(now)>=x.endsAt){x.status='expired';throw new Error('Zusatzpaket ist abgelaufen');}const day=Math.floor((Number(now)-x.startedAt)/dayMs);if(x.lastClaimDay===day)throw new Error('Heutige Baustoff-Gutschrift wurde bereits verbucht');const cfg=PremiumExtraPackageCatalog[x.packageId],materials=cfg?.dailyMaterials||{};const entries=Object.entries(materials).filter(([,v])=>Number.isFinite(Number(v))&&Number(v)>0);if(!entries.length)throw new Error('Die Tagesmengen fuer dieses Paket sind noch nicht festgelegt');company.constructionSite??={materials:{},jobs:[]};company.constructionSite.materials??={};for(const[id,amount]of entries)company.constructionSite.materials[id]=Number(company.constructionSite.materials[id]||0)+Number(amount);x.lastClaimDay=day;x.nextClaimAt=x.startedAt+(day+1)*dayMs;s.history.push({packageInstanceId:x.id,event:'daily_credit',at:Number(now),materials:Object.fromEntries(entries)});return Object.fromEntries(entries);}
export function configureExtraPackage(packageId,{enabled,priceByDays,dailyMaterials}={}){const p=PremiumExtraPackageCatalog[packageId];if(!p)throw new Error('Unbekanntes Zusatzpaket');if(enabled!==undefined)p.enabled=!!enabled;if(priceByDays)for(const[d,v]of Object.entries(priceByDays))if(p.durations.includes(Number(d)))p.priceByDays[d]=v==null?null:Math.max(0,Number(v));if(dailyMaterials)for(const[k,v]of Object.entries(dailyMaterials))if(k in p.dailyMaterials)p.dailyMaterials[k]=v==null?null:Math.max(0,Number(v));return clone(p);}
export function runPremiumExtraPackageTest(){const a={},c={constructionSite:{materials:{},jobs:[]}};const q=packageQuote('construction_materials',7);if(q.days!==7||q.enabled!==false)throw new Error('Zusatzpaket-Katalog fehlerhaft');let blocked=false;try{activateExtraPackage(a,{packageId:'construction_materials',days:7});}catch{blocked=true;}if(!blocked)throw new Error('Unfertiges Paket darf nicht kaufbar sein');return true;}
if(typeof window!=='undefined')window.worldPremiumExtraPackages={catalog:extraPackageCatalog,status:packageStatus,quote:packageQuote};
