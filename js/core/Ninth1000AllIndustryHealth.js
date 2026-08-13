// WorldProject – branchenübergreifender Smokecheck für den neunten 1000er-Block.
import { runIndustryContentCoverageAudit } from './IndustryContentCoverageAudit.js';
import { runPlayability2HealthCheck } from './IndustryPlayabilityMatrix.js';
import { runUniversalWorkforceTest } from './UniversalWorkforceMarket.js';
import { industryScenarioMatrix } from './IndustryScenarioMatrix.js';
import { IndustryProfiles } from './IndustryCatalog.js';
import { worldContentRegistry } from './ContentRegistry.js';
import { runAgricultureSeasonTest } from './SeasonalBusinessCalendar.js';
import { WorldCurrencySystem,currencyForCountry,countryFromLocale } from './WorldCurrencySystem.js';
import { currencyHealthStatus } from './CurrencyHealthStatus.js';

export function runNinth1000AllIndustryHealth(){
 const coverage=runIndustryContentCoverageAudit();
 const playability=runPlayability2HealthCheck();
 const workforce=runUniversalWorkforceTest();
 const scenarios=industryScenarioMatrix();
 const agriculture=runAgricultureSeasonTest();
 const currencyHealth=currencyHealthStatus();
 const farmRecipes=worldContentRegistry.list('recipes').filter(r=>(r.industries||[]).includes('farm')&&!r.deprecated);
 const farmRecipeIds=new Set(farmRecipes.map(r=>r.id));
 const requiredFarmRecipes=['grow_wheat','grow_barley','grow_corn','grow_rapeseed','grow_potato'];
 const missingCoreCrops=requiredFarmRecipes.filter(id=>!farmRecipeIds.has(id));
 const branchKeys=new Set(Object.values(IndustryProfiles).map(x=>x.branchKey));
 const scenarioBranches=new Set(scenarios.map(x=>x.branchKey));
 const missingScenarioBranches=[...branchKeys].filter(x=>!scenarioBranches.has(x));
 const currencyTest=new WorldCurrencySystem({country:'DE',locale:'de-DE',rates:{EUR:1,USD:2,JPY:200,CNY:8}}),usd=currencyTest.convert(100,{to:'USD'}),back=currencyTest.convert(usd,{from:'USD',to:'EUR'});currencyTest.setCountry('US');const usdText=currencyTest.format(100,{locale:'en-US'});currencyTest.setCountry('JP');const jpyText=currencyTest.format(100,{locale:'ja-JP'});
 const checks=[
  {name:'Content-Abdeckung berechenbar',success:!!coverage&&Array.isArray(coverage.rows)},
  {name:'Spielbarkeitsmatrix berechenbar',success:!!playability&&Array.isArray(playability.matrix)},
  {name:'Personalmarkt-Test berechenbar',success:!!workforce&&Array.isArray(workforce.checks)},
  {name:'Szenarien für alle Branchen',success:missingScenarioBranches.length===0,missing:missingScenarioBranches},
  {name:'Landwirtschaft mindestens 17 Kulturen',success:farmRecipes.length>=17,count:farmRecipes.length},
  {name:'Landwirtschaft Kernkulturen vorhanden',success:missingCoreCrops.length===0,missing:missingCoreCrops},
  {name:'Landwirtschaft Region/Saison funktioniert',success:agriculture?.success===true},
  {name:'Währungen nach Land korrekt',success:currencyForCountry('DE')==='EUR'&&currencyForCountry('US')==='USD'&&currencyForCountry('CN')==='CNY'&&currencyForCountry('JP')==='JPY'},
  {name:'Land aus Locale erkennbar',success:countryFromLocale('en-US')==='US'&&countryFromLocale('ja-JP')==='JP'},
  {name:'Währungsumrechnung reversibel',success:Math.abs(back-100)<1e-9,usd,back},
  {name:'Lokale Währungsformatierung',success:usdText.includes('$')&&jpyText.length>0,usdText,jpyText},
  {name:'Währungsabdeckung vollständig',success:currencyHealth.success,detail:currencyHealth},
  {name:'Kursquelle ausgewiesen',success:['fallback','server'].includes(currencyHealth.rateSource),source:currencyHealth.rateSource}
 ];
 const failed=checks.filter(x=>!x.success);
 const report={success:failed.length===0,checks,failed,coverage,playability,workforce,agriculture,currencyHealth,farmRecipeCount:farmRecipes.length,scenarioCount:scenarios.length,ranAt:Date.now()};
 if(typeof window!=='undefined')window.worldNinth1000AllIndustryHealth=report;
 return report;
}
if(typeof window!=='undefined')window.runNinth1000AllIndustryHealth=runNinth1000AllIndustryHealth;
