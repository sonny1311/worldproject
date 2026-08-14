// WorldProject – lädt serverseitige Extra-Premium-Berechtigungen in den aktuellen Account.
import { ensureExtraPackageState } from './PremiumExtraPackageSystem.js';
const toMs=v=>v?new Date(v).getTime():0;
export async function loadServerExtraPackages(account=window.worldCurrentUser||{}){
 const api=window.worldAccounts?.authApi;if(!api?.rest||!account)return{success:false,reason:'api_or_account_missing'};
 const rows=await api.rest('premium_extra_package_entitlements?select=*&order=created_at.desc');
 const s=ensureExtraPackageState(account);s.active=(Array.isArray(rows)?rows:[]).map(r=>({id:`server-${r.id}`,serverId:r.id,packageId:r.package_id,days:Number(r.duration_days),startedAt:toMs(r.started_at),endsAt:toMs(r.ends_at),lastClaimDay:r.last_claim_day==null?null:Number(r.last_claim_day),nextClaimAt:toMs(r.started_at)+(Number(r.last_claim_day??-1)+1)*86400000,status:r.status,paymentReference:r.payment_reference,server:true}));
 window.dispatchEvent(new CustomEvent('world:premium-extra-synced',{detail:{count:s.active.length}}));return{success:true,count:s.active.length,rows:s.active};
}
export async function refreshServerExtraPackages(){try{return await loadServerExtraPackages(window.worldCurrentUser||{});}catch(error){console.warn('Extra-Premium konnte nicht vom Server synchronisiert werden',error);return{success:false,error:error.message};}}
if(typeof window!=='undefined'){window.worldPremiumExtraPackageServerSync={load:loadServerExtraPackages,refresh:refreshServerExtraPackages};for(const ev of ['world:access-granted','worldproject:company-activated'])window.addEventListener(ev,()=>setTimeout(refreshServerExtraPackages,0));}
