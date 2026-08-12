// WorldProject - Warenumlauf und realer Verbrauch statt garantierter Abnahme
export class GoodsCirculationSystem{
 constructor(){this.inventory=new Map();this.movements=[];}
 key(companyId,product,quality="standard"){return `${companyId}:${product}:${quality}`;}
 stock(companyId,product,quality="standard"){return Number(this.inventory.get(this.key(companyId,product,quality))||0);}
 add({companyId,product,quality="standard",quantity,source="production",at=Date.now()}={}){const k=this.key(companyId,product,quality),q=Math.max(0,Number(quantity));this.inventory.set(k,this.stock(companyId,product,quality)+q);this.movements.push({type:"in",companyId,product,quality,quantity:q,source,at});return this.stock(companyId,product,quality);}
 consume({companyId,product,quality="standard",quantity,channel="customer",at=Date.now()}={}){const available=this.stock(companyId,product,quality),q=Math.min(available,Math.max(0,Number(quantity)));this.inventory.set(this.key(companyId,product,quality),available-q);this.movements.push({type:"out",companyId,product,quality,quantity:q,channel,at});return{requested:Number(quantity),fulfilled:q,remainingStock:available-q,shortage:Math.max(0,Number(quantity)-q)};}
 fulfillDemand({companyId,product,quality="standard",demand,channels=["npc_customer"]}={}){let remaining=Math.max(0,Number(demand)),fulfilled=0;const results=[];for(const channel of channels){if(remaining<=0)break;const r=this.consume({companyId,product,quality,quantity:remaining,channel});fulfilled+=r.fulfilled;remaining-=r.fulfilled;results.push({channel,...r});}return{demand:Number(demand),fulfilled,unmet:remaining,results};}
 turnover(companyId,from=0,to=Date.now()){return this.movements.filter(m=>m.companyId===companyId&&m.at>=from&&m.at<=to).reduce((s,m)=>{s[m.type]+=m.quantity;return s;},{in:0,out:0});}
}
export function runGoodsCirculationTest(){const s=new GoodsCirculationSystem();s.add({companyId:1,product:"beer",quantity:100});const r=s.fulfillDemand({companyId:1,product:"beer",demand:120});if(r.fulfilled!==100||r.unmet!==20||s.stock(1,"beer")!==0)throw new Error("Warenumlauf-Test fehlgeschlagen");console.log("🔄 WARENUMLAUF/VERBRAUCH/ENGPASS ERFOLGREICH");return true;}
