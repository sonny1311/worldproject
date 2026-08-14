// WorldProject – modulare Photovoltaik-Investitionen fuer Betriebe.
// Preise sind Balancing-Startwerte und koennen spaeter zentral angepasst werden.
export const SolarOffers=[
 {id:'pv_5',label:'Kleine Dachanlage',kwp:5,price:6500,areaM2:30},
 {id:'pv_10',label:'Dachanlage S',kwp:10,price:11500,areaM2:60},
 {id:'pv_20',label:'Dachanlage M',kwp:20,price:21000,areaM2:120},
 {id:'pv_50',label:'Gewerbeanlage 50',kwp:50,price:47500,areaM2:300},
 {id:'pv_100',label:'Gewerbeanlage 100',kwp:100,price:90000,areaM2:600},
 {id:'pv_250',label:'Industrieanlage 250',kwp:250,price:212500,areaM2:1500},
 {id:'pv_500',label:'Industrieanlage 500',kwp:500,price:400000,areaM2:3000},
 {id:'pv_1000',label:'Solarpark 1 MWp',kwp:1000,price:750000,areaM2:6000},
 {id:'pv_2500',label:'Solarpark 2,5 MWp',kwp:2500,price:1750000,areaM2:15000},
 {id:'pv_5000',label:'Solarpark 5 MWp',kwp:5000,price:3250000,areaM2:30000}
];
const n=v=>Number(v||0);
export function solarState(company){company.solar??={installations:[],installedKwp:0,invested:0};return company.solar;}
export function buySolar(company,offerId){const offer=SolarOffers.find(x=>x.id===offerId);if(!offer)throw new Error('Solaranlage unbekannt');if(n(company.money)<offer.price)throw new Error('Nicht genug Spielgeld für diese Solaranlage');company.money=n(company.money)-offer.price;const s=solarState(company);s.installations.push({...offer,purchasedAt:Date.now()});s.installedKwp=n(s.installedKwp)+offer.kwp;s.invested=n(s.invested)+offer.price;window.dispatchEvent?.(new CustomEvent('world:solar-changed',{detail:{company,offer}}));return{success:true,offer,state:s};}
// productionFactor 0..1 bildet die aktuelle Sonnenerzeugung ab. Ohne Wetter-/Zeitmodell gilt fuer Vorschauen 1.
export function solarPowerNow(company,productionFactor=1){return solarState(company).installedKwp*Math.max(0,Math.min(1,n(productionFactor)));}
export function electricityQuote(company,{demandKw=0,hours=1,gridPricePerKwh=.30,productionFactor=1}={}){const demandKwh=Math.max(0,n(demandKw))*Math.max(0,n(hours)),solarKwh=Math.min(demandKwh,solarPowerNow(company,productionFactor)*Math.max(0,n(hours))),gridKwh=Math.max(0,demandKwh-solarKwh);return{demandKwh,solarKwh,gridKwh,gridCost:gridKwh*Math.max(0,n(gridPricePerKwh)),savedCost:solarKwh*Math.max(0,n(gridPricePerKwh))};}
export function runSolarInvestmentTest(){const c={money:100000};buySolar(c,'pv_5');buySolar(c,'pv_20');if(c.solar.installedKwp!==25||c.solar.invested!==27500)throw new Error('Solaranlagen werden nicht additiv ausgebaut');const q=electricityQuote(c,{demandKw:100,hours:1,gridPricePerKwh:.3,productionFactor:1});if(q.solarKwh!==25||q.gridKwh!==75||Math.abs(q.savedCost-7.5)>.001)throw new Error('Solarstrom reduziert Netzbezug nicht korrekt');return true;}
if(typeof window!=='undefined')window.worldSolarInvestment={offers:SolarOffers,state:solarState,buy:buySolar,quote:electricityQuote};
