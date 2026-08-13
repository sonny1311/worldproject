// WorldProject – vereinheitlicht Referenzen auf den aktuell aktiven Betrieb.
export function activeCompanyReference(fallback=null){if(typeof window==='undefined')return fallback;return window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||fallback;}
export function sameCompany(a,b){if(!a||!b)return false;const aid=a.serverCompanyId||a.id,bid=b.serverCompanyId||b.id;return aid!=null&&bid!=null?String(aid)===String(bid):a===b;}
export function activeCompanyMismatch(reference){const active=activeCompanyReference(reference);return{active,reference,mismatch:!!active&&!!reference&&!sameCompany(active,reference)};}
if(typeof window!=='undefined')window.worldActiveCompanyConsistency={get:activeCompanyReference,same:sameCompany,check:activeCompanyMismatch};
