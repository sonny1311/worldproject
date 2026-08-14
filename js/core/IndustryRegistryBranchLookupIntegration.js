// WorldProject - erlaubt Markt-/UI-Systemen, Branchen sowohl per Firmenart als auch per branchKey aufzulösen.
import { worldContentRegistry } from "./ContentRegistry.js";
if(!worldContentRegistry.__branchLookupPatched){
 const directGet=worldContentRegistry.get.bind(worldContentRegistry);
 worldContentRegistry.get=function(type,id){const direct=directGet(type,id);if(direct||type!=="industries"||!id)return direct;return this.list("industries").find(x=>x.branchKey===id)||null;};
 Object.defineProperty(worldContentRegistry,"__branchLookupPatched",{value:true,writable:false,enumerable:false});
}
export function runIndustryRegistryBranchLookupTest(){const x=worldContentRegistry.get("industries","maltster");if(!x||x.branchKey!=="maltster")throw new Error("Branchenauflösung für Markt-Kategorien fehlt");return{success:true,label:x.label};}
