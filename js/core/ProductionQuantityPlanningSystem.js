// WorldProject - freie Produktionsmenge, Rezeptskalierung und Auftragsuebernahme
import { worldContentRegistry } from "./ContentRegistry.js";

export class ProductionQuantityPlanningSystem{
  constructor({warehouse=null}={}){this.warehouse=warehouse;}
  recipe(recipeId){const r=typeof recipeId==="object"?recipeId:worldContentRegistry.get("recipes",recipeId);if(!r)throw new Error("Produktionsrezept nicht gefunden");return r;}
  product(recipe){return worldContentRegistry.get("products",recipe.product)||{id:recipe.product,label:recipe.product,unit:"Stk"};}
  material(id){return worldContentRegistry.get("materials",id)||{id,label:id,unit:"Stk"};}
  scale(recipeId,targetOutput){const r=this.recipe(recipeId),baseOutput=Math.max(.000001,Number(r.output||1)),target=Math.max(0,Number(targetOutput||0));if(target<=0)throw new Error("Produktionsmenge muss groesser als 0 sein");const factor=target/baseOutput,materials={};for(const[id,qty]of Object.entries(r.materials||{}))materials[id]=Number(qty)*factor;return{recipe:r,product:this.product(r),targetOutput:target,baseOutput,factor,durationMinutes:Number(r.durationMinutes||0)*factor,estimatedVariableCost:Number(r.variableCost||0)*factor,materials};}
  materialRows(recipeId,targetOutput){const plan=this.scale(recipeId,targetOutput);return Object.entries(plan.materials).map(([id,required])=>{const m=this.material(id),zone=this.warehouse?.zoneFor?.(id),available=zone?Number(this.warehouse.stock?.[zone]?.[id]||0):0;return{id,label:m.label||id,unit:m.unit||"Stk",required,available,missing:Math.max(0,required-available)};});}
  availability(recipeId,targetOutput){const rows=this.materialRows(recipeId,targetOutput);return{ready:rows.every(r=>r.missing<=1e-9),rows,missing:rows.filter(r=>r.missing>1e-9)};}
  quantityForOrder({orderedQuantity=0,stockQuantity=0,alreadyPlanned=0}={}){return Math.max(0,Number(orderedQuantity)-Number(stockQuantity)-Number(alreadyPlanned));}
  consumeAndCreatePlan(recipeId,targetOutput){const scaled=this.scale(recipeId,targetOutput),check=this.availability(recipeId,targetOutput);if(!check.ready)throw new Error("Rohstoffe fehlen");if(this.warehouse){const req=Object.fromEntries(check.rows.map(r=>[r.id,r.required]));const result=this.warehouse.consume(req);if(!result.ok)throw new Error("Rohstoffe konnten nicht reserviert werden");}return{...scaled,status:"planned",createdAt:Date.now()};}
}

export function runProductionQuantityPlanningTest(){const warehouse={zoneFor:id=>"raw",stock:{raw:{malt:100,hops:2}},consume:req=>({ok:Object.entries(req).every(([k,v])=>warehouse.stock.raw[k]>=v)})};const s=new ProductionQuantityPlanningSystem({warehouse}),recipe={id:"beer_test",product:"beer",output:1000,durationMinutes:180,variableCost:90,materials:{malt:100,hops:2}};const p=s.scale(recipe,500);if(p.materials.malt!==50||p.durationMinutes!==90)throw new Error("Rezeptskalierung fehlerhaft");if(s.quantityForOrder({orderedQuantity:1000,stockQuantity:200,alreadyPlanned:300})!==500)throw new Error("Auftragsfehlmenge fehlerhaft");console.log("🍺 FREIE PRODUKTIONSMENGE/REZEPTSKALIERUNG ERFOLGREICH");return true;}
