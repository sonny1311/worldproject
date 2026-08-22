// WorldProject - Echtgeld-Coinshop. Keine Coins werden clientseitig gutgeschrieben.
// Der Checkout wird ausschliesslich ueber den verifizierten Payment-/Store-Backendpfad abgeschlossen.
export const COIN_STORE_PACKAGES=Object.freeze([
 {id:'coins_50_smoke',coins:50,priceEuro:0.50,label:'50 Coins – Zahlungstest',bonusCoins:0,icon:'🧪',tag:'Zahlungstest'},
 {id:'coins_100',coins:100,priceEuro:0.99,label:'100 Coins',bonusCoins:0,icon:'🪙',tag:'Starter'},
 {id:'coins_550',coins:550,priceEuro:4.99,label:'550 Coins',bonusCoins:50,icon:'💰',tag:'Klein'},
 {id:'coins_1200',coins:1200,priceEuro:9.99,label:'1.200 Coins',bonusCoins:200,icon:'📦',tag:'Beliebt'},
 {id:'coins_2600',coins:2600,priceEuro:19.99,label:'2.600 Coins',bonusCoins:600,icon:'🧰',tag:'Viel'},
 {id:'coins_6000',coins:6000,priceEuro:39.99,label:'6.000 Coins',bonusCoins:2000,icon:'🗄️',tag:'Top Angebot'},
 {id:'coins_13000',coins:13000,priceEuro:79.99,label:'13.000 Coins',bonusCoins:5000,icon:'💼',tag:'Bester Deal'},
 {id:'coins_26000',coins:26000,priceEuro:149.99,label:'26.000 Coins',bonusCoins:11000,icon:'🏗️',tag:'Extra viel'},
 {id:'coins_50000',coins:50000,priceEuro:249.99,label:'50.000 Coins',bonusCoins:25000,icon:'🏦',tag:'Maximum'},
]);
export function coinStorePackage(id){return COIN_STORE_PACKAGES.find(x=>x.id===id)||null;}
export function buildCoinStoreCheckoutRequest(packageId,{accountId=null,companyId=null}={}){const pack=coinStorePackage(packageId);if(!pack)throw new Error('Coin-Paket nicht gefunden');return{type:'coin_store_checkout',packageId:pack.id,coins:pack.coins,priceEuro:pack.priceEuro,accountId,companyId,createdAt:Date.now()};}
export function beginCoinStoreCheckout(packageId,context={}){const request=buildCoinStoreCheckoutRequest(packageId,context);if(typeof window!=='undefined'){window.dispatchEvent(new CustomEvent('world:coin-store-checkout-requested',{detail:request}));const checkout=window.worldPaymentCheckout?.beginCoinPurchase;if(typeof checkout==='function')return checkout(request);}return{success:false,pendingPaymentIntegration:true,request};}
export function runCoinStoreCatalogTest(){if(COIN_STORE_PACKAGES.length<9)throw new Error('Zu wenige Coin-Pakete');let lastValue=0;for(const p of COIN_STORE_PACKAGES){if(!(p.coins>0&&p.priceEuro>0))throw new Error('Ungueltiges Coin-Paket');const value=p.coins/p.priceEuro;if(value<lastValue)throw new Error('Groesseres Coin-Paket darf keinen schlechteren Coin-Wert haben');lastValue=value;}const before=Number(window?.worldPlayerCompany?.coins||0),r=buildCoinStoreCheckoutRequest('coins_100');const after=Number(window?.worldPlayerCompany?.coins||0);if(r.packageId!=='coins_100'||r.coins!==100||r.priceEuro!==0.99||before!==after)throw new Error('Coinshop darf ohne bestaetigte Zahlung keine Coins gutschreiben');return true;}
if(typeof window!=='undefined')window.worldCoinStore={packages:COIN_STORE_PACKAGES,begin:beginCoinStoreCheckout,test:runCoinStoreCatalogTest};
