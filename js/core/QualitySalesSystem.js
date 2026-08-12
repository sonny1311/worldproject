// WorldProject - Produktqualitaet wirkt auf Verkaufspreis und Kundenzufriedenheit
export class QualitySalesSystem{
 price({basePrice,quality=1,reputation=50,demandFactor=1}={}){const q=Math.max(.5,Math.min(1.25,Number(quality))),r=Math.max(0,Math.min(100,Number(reputation))),qualityFactor=.75+q*.35,reputationFactor=.9+r/500;return Math.max(.01,Number(basePrice)*qualityFactor*reputationFactor*Math.max(.5,Number(demandFactor)));}
 satisfaction({quality=1,deliveryOnTime=true,priceFairness=1}={}){let s=50+(Number(quality)-1)*60+(deliveryOnTime?15:-20)+(Number(priceFairness)-1)*20;return Math.max(0,Math.min(100,Math.round(s)));}
 repeatPurchaseChance(args={}){return Math.max(.05,Math.min(.95,this.satisfaction(args)/100*.9));}
}
export function runQualitySalesTest(){const s=new QualitySalesSystem(),high=s.price({basePrice:10,quality:1.15,reputation:80}),low=s.price({basePrice:10,quality:.8,reputation:40});if(high<=low||s.satisfaction({quality:1.1,deliveryOnTime:true})<=s.satisfaction({quality:.8,deliveryOnTime:false}))throw new Error("Qualitaetsverkauf-Test fehlgeschlagen");console.log("💶 QUALITAET → PREIS/KUNDENZUFRIEDENHEIT ERFOLGREICH");return true;}
