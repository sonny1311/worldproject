// WorldProject - Echtgeld-Coinshop. Keine Coins werden clientseitig gutgeschrieben.
// Der Checkout muss spaeter ueber den verifizierten Payment-/Store-Backendpfad abgeschlossen werden.
export const COIN_STORE_PACKAGES=Object.freeze([
 {id:'coins_100',coins:100,priceEuro:0.99,label:'100 Coins'},
 {id:'coins_550',coins:550,priceEuro:4.99,label:'550 Coins',bonusCoins:50},
 {id:'coins_1200',coins:1200,priceEuro:9.99,label:'1.200 Coins',bonusCoins:200},
 {id:'coins_2600',coins:2600,priceEuro:19.99,label:'2.600 Coins',bonusCoins:600},
]);
export function coinStorePackage(id){return COIN_STORE_PACKAGES.find(x=>x.id===id)||null;}
export function beginCoinStoreCheckout(packageId,{accountId=null,companyId=null}={}){const pack=coinStorePackage(packageId);if(!pack)throw new Error('Coin-Paket nicht gefunden');const request={type:'coin_store_checkout',packageId:pack.id,coins:pack.coins,priceEuro:pack.priceEuro,accountId,companyId,createdAt:Date.now()};if(typeof window!=='undefined'){window.dispatchEvent(new CustomEvent('world:coin-store-checkout-requested',{detail:request}));const checkout=window.worldPaymentCheckout?.beginCoinPurchase;if(typeof checkout==='function')return checkout(request);}return{success:false,pendingPaymentIntegration:true,request};}
export function runCoinStoreCatalogTest(){if(COIN_STORE_PACKAGES.length<3)throw new Error('Zu wenige Coin-Pakete');for(const p of COIN_STORE_PACKAGES)if(!(p.coins>0&&p.priceEuro>0))throw new Error('Ungueltiges Coin-Paket');const r=beginCoinStoreCheckout('coins_100');if(!r.pendingPaymentIntegration)throw new Error('Coinshop darf ohne Payment keine Coins gutschreiben');return true;}
if(typeof window!=='undefined')window.worldCoinStore={packages:COIN_STORE_PACKAGES,begin:beginCoinStoreCheckout,test:runCoinStoreCatalogTest};
