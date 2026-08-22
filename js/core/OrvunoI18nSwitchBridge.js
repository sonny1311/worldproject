// Keeps legacy hard-coded UI labels reversible when switching between registered locales.
// New UI should prefer data-i18n keys directly.
const KEYS=[
 'nav.dashboard','nav.business','nav.production','nav.inventory','nav.purchasing','nav.employees','nav.machines','nav.orders','nav.logistics','nav.finance','nav.upgrades','nav.market','nav.messages','nav.profile','nav.logout',
 'auth.login','auth.register','auth.email','auth.password','auth.forgot','auth.loginAction',
 'business.company','business.account','business.money','business.switch','business.new',
 'production.queue','production.amount','production.duration','production.progress','production.start',
 'inventory.stock','inventory.capacity','inventory.materials','inventory.finishedGoods',
 'purchasing.supplier','purchasing.suppliers','purchasing.price','purchasing.deliveryTime','purchasing.order',
 'employees.employee','employees.hire','employees.salary','machines.machine','machines.condition','machines.capacity','machines.upgrade',
 'orders.customer','orders.deadline','orders.deliver','orders.remaining','logistics.deliveries','logistics.delivery','logistics.transport','logistics.distance','logistics.arrival',
 'finance.revenue','finance.costs','finance.profit','finance.balance','upgrades.build','upgrades.upgrade','upgrades.level','upgrades.time',
 'status.queued','status.available','status.running','status.finished','status.ordered','status.inTransit','status.delivered',
 'common.reload','common.close','common.cancel','common.save','common.back','common.next','common.buy','common.sell','common.start','common.stop','common.open','common.details','common.search','common.settings',
 'android.download','boot.title','boot.text','cleanup.packaging','cleanup.brewBasics','cleanup.bottleWash','cleanup.labels','cleanup.hereMissing','cleanup.hereAccess','cleanup.startMissing'
];
let pending=[];
function snapshot(){
 const i18n=window.orvunoI18n;if(!i18n)return;
 const reverse=new Map(KEYS.map(key=>[i18n.t(key),key]));pending=[];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){const trimmed=node.nodeValue.trim();const key=reverse.get(trimmed);if(key)pending.push([node,key,trimmed]);}
}
function restore(){
 const i18n=window.orvunoI18n;if(!i18n)return;
 for(const [node,key,oldText] of pending){if(!node.isConnected)continue;const raw=node.nodeValue;const trimmed=raw.trim();if(trimmed!==oldText)continue;node.nodeValue=raw.replace(trimmed,i18n.t(key));}
 pending=[];
}
function install(){
 const select=document.getElementById('orvuno-language-select');
 if(select&&!select.dataset.switchBridge){select.dataset.switchBridge='1';select.addEventListener('change',snapshot,true);}
 window.addEventListener('orvuno:localechange',()=>queueMicrotask(restore));
 const api=window.orvunoI18n;
 if(api&&!api.__switchBridge){const original=api.setLocale.bind(api);api.setLocale=(code,options)=>{snapshot();const result=original(code,options);queueMicrotask(restore);return result;};api.__switchBridge=true;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
