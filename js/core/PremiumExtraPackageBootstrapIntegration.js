// WorldProject – eigenständige, konfliktarme Bootstrap-Integration für Extra-Premium.
import { runPremiumExtraPackageRegression } from './PremiumExtraPackageRegression.js';
import { ensureExtraPackageState, packageStatus, claimDailyExtraPackageMaterials } from './PremiumExtraPackageSystem.js';

const company=()=>window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;
const account=()=>window.worldCurrentUser||null;

export function runPremiumExtraPackageBootstrapTest(){return runPremiumExtraPackageRegression();}

export function processDueExtraPackageCredits({now=Date.now()}={}){
 const a=account(),c=company();if(!a||!c)return{processed:0,reason:'account_or_company_missing'};
 ensureExtraPackageState(a);const active=packageStatus(a,now).filter(x=>x.status==='active'),credited=[];
 for(const p of active){
  const day=Math.floor((Number(now)-Number(p.startedAt))/86400000);
  if(p.lastClaimDay===day)continue;
  try{credited.push({packageId:p.packageId,instanceId:p.id,materials:claimDailyExtraPackageMaterials(a,c,{packageInstanceId:p.id,now})});}
  catch(error){if(!/Tagesmengen.*noch nicht festgelegt/i.test(error.message))console.warn('Extra-Premium-Gutschrift fehlgeschlagen',error);}
 }
 if(credited.length){window.dispatchEvent(new CustomEvent('world:game-state-dirty'));window.dispatchEvent(new CustomEvent('world:premium-extra-credited',{detail:{credited}}));}
 return{processed:credited.length,credited};
}

function refresh(){setTimeout(()=>processDueExtraPackageCredits(),0);}
if(typeof window!=='undefined'){
 window.worldPremiumExtraPackageBootstrap={runTest:runPremiumExtraPackageBootstrapTest,process:processDueExtraPackageCredits};
 for(const ev of ['world:access-granted','worldproject:company-activated','worldproject:company-switched'])window.addEventListener(ev,refresh);
 try{runPremiumExtraPackageBootstrapTest();}catch(error){console.error('❌ EXTRA-PREMIUM REGRESSION',error);}
}
