// WorldProject - zentrale Premium-Ablaufsteuerung
// Koordiniert alle Premium-abhängigen Systeme. Nichts wird gelöscht; nur pausiert/gesperrt.
export class PremiumLifecycleCoordinator{
 constructor({premium,constructionQueue=null,productionQueue=null,getAccount=()=>window.worldCurrentUser||{},intervalMs=30000}={}){this.premium=premium;this.constructionQueue=constructionQueue;this.productionQueue=productionQueue;this.getAccount=getAccount;this.intervalMs=intervalMs;this.timer=null;this.lastActive=null;}
 sync({account=this.getAccount(),now=Date.now()}={}){const state=this.premium.state(account,now);const changed=this.lastActive!==null&&this.lastActive!==state.active;const result={state,construction:null,production:null,changed};if(this.constructionQueue)result.construction=this.constructionQueue.syncPremiumState(account,now);if(this.productionQueue)result.production=this.productionQueue.syncPremium(account);if(changed)window.dispatchEvent(new CustomEvent("world:premium-state-changed",{detail:result}));this.lastActive=state.active;return result;}
 start(){if(this.timer)return;this.sync();this.timer=setInterval(()=>this.sync(),this.intervalMs);}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=null;}
 async refreshAccount(api){const user=await api.me();window.worldCurrentUser={...(window.worldCurrentUser||{}),...user};return this.sync({account:window.worldCurrentUser});}
}

export function runPremiumLifecycleCoordinatorTest(){const premium={state:a=>({active:Number(a.premiumUntil)>100,status:Number(a.premiumUntil)>100?"active":"expired",until:a.premiumUntil})},calls={build:0,prod:0},c={syncPremiumState(){calls.build++;return{paused:2};}},p={syncPremium(){calls.prod++;return{paused:3};}},account={premiumUntil:200},x=new PremiumLifecycleCoordinator({premium,constructionQueue:c,productionQueue:p,getAccount:()=>account});x.sync({now:0});account.premiumUntil=50;const r=x.sync({now:101});if(calls.build!==2||calls.prod!==2||r.state.active||!r.changed)throw new Error("Premium-Lifecycle-Koordination fehlerhaft");console.log("✅ ZENTRALE PREMIUM-ABLAUFSTEUERUNG ERFOLGREICH");return true;}
