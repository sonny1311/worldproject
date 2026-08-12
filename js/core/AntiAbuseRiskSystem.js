// WorldProject - Anti-Multiaccount-/Missbrauchs-Risikopruefung
// Gleiche IP allein fuehrt NICHT zur Sperre. Sie ist nur ein Signal.

export class AntiAbuseRiskSystem {
    constructor(){ this.events=[]; }

    evaluate({sameIp=false,sameDevice=false,coinTransfersBetweenAccounts=0,marketTradesBetweenAccounts=0,priceDeviationPercent=0,householdDeclared=false}={}){
        let score=0;
        const reasons=[];
        if(sameIp){ score+=10; reasons.push("gleiche IP"); }
        if(sameDevice){ score+=30; reasons.push("gleiches Geraet"); }
        if(coinTransfersBetweenAccounts>=5){ score+=20; reasons.push("viele Coinbewegungen zwischen Accounts"); }
        if(marketTradesBetweenAccounts>=8){ score+=20; reasons.push("viele gegenseitige Marktgeschaefte"); }
        if(Math.abs(Number(priceDeviationPercent)||0)>=40){ score+=25; reasons.push("auffaelliger Preisabstand zum Markt"); }
        if(householdDeclared && sameIp){ score=Math.max(score-8,0); reasons.push("gemeinsamer Haushalt gemeldet"); }

        const level=score>=70?"high":score>=40?"medium":"low";
        const action=score>=85?"manual_review_recommended":score>=60?"monitor_closely":"none";
        return {score,level,action,reasons};
    }

    record(userId,result,details={}){
        const event={id:`risk_${Date.now()}_${Math.random()}`,userId,score:result.score,level:result.level,action:result.action,reasons:[...result.reasons],details,createdAt:new Date(),reviewed:false};
        this.events.push(event); return event;
    }
}

export function runAntiAbuseRiskTest(){
 const s=new AntiAbuseRiskSystem();
 const normal=s.evaluate({sameIp:true,householdDeclared:true});
 const suspicious=s.evaluate({sameIp:true,sameDevice:true,coinTransfersBetweenAccounts:8,marketTradesBetweenAccounts:12,priceDeviationPercent:60});
 const success=normal.level==="low"&&suspicious.level==="high"&&suspicious.score>normal.score;
 console[success?"log":"error"](success?"✅ MISSBRAUCHS-RISIKOTEST ERFOLGREICH":"❌ MISSBRAUCHS-RISIKOTEST FEHLGESCHLAGEN",{normal,suspicious});
 return {success};
}
