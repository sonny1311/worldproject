// WorldProject – standardisierte Szenarien für alle Gewerbe.
import { IndustryProfiles } from './IndustryCatalog.js';
export function industryScenarioMatrix(){return Object.entries(IndustryProfiles).flatMap(([type,p])=>[{type,branchKey:p.branchKey,scenario:'start',money:50000,orderLoad:.25},{type,branchKey:p.branchKey,scenario:'growth',money:250000,orderLoad:.8},{type,branchKey:p.branchKey,scenario:'bottleneck',money:100000,orderLoad:1.4}]);}
if(typeof window!=='undefined')window.worldIndustryScenarioMatrix=industryScenarioMatrix;
