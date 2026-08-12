// WorldProject - spielergetriebener Coinmarkt gegen Spielgeld
// Keine Echtgeld-Auszahlung. Coins koennen nur innerhalb des Spiels gehandelt werden.

export class CoinMarketplaceSystem {
    constructor(){ this.orders=[]; this.trades=[]; }

    createSellOrder({seller,amount,pricePerCoin}={}){
        const qty=Math.floor(Number(amount)||0);
        const price=Number(pricePerCoin)||0;
        if(!seller||qty<=0||price<=0) return {success:false,reason:"Ungueltiges Verkaufsangebot"};
        if((seller.wallet?.balance||0)<qty) return {success:false,reason:"Nicht genug Coins"};
        seller.wallet.balance-=qty;
        const order={id:`ord_${Date.now()}_${Math.random()}`,sellerId:seller.id,originalAmount:qty,remainingAmount:qty,pricePerCoin:price,status:"open",createdAt:new Date()};
        this.orders.push(order);
        return {success:true,order};
    }

    cancelOrder(orderId,seller){
        const order=this.orders.find(o=>o.id===orderId);
        if(!order||order.status!=="open"||order.sellerId!==seller?.id) return {success:false,reason:"Angebot kann nicht storniert werden"};
        seller.wallet.balance+=order.remainingAmount;
        order.remainingAmount=0; order.status="cancelled"; order.closedAt=new Date();
        return {success:true,order};
    }

    buy({orderId,buyer,seller,amount,buyerCompany,sellerCompany}={}){
        const order=this.orders.find(o=>o.id===orderId);
        const qty=Math.min(Math.floor(Number(amount)||0),order?.remainingAmount||0);
        if(!order||order.status!=="open"||qty<=0) return {success:false,reason:"Angebot nicht verfuegbar"};
        if(!buyer||!seller||buyer.id===seller.id) return {success:false,reason:"Eigenhandel nicht erlaubt"};
        const total=qty*order.pricePerCoin;
        if((Number(buyerCompany?.money)||0)<total) return {success:false,reason:"Nicht genug Spielgeld"};
        buyerCompany.money-=total;
        sellerCompany.money=(Number(sellerCompany.money)||0)+total;
        buyer.wallet.balance=(Number(buyer.wallet.balance)||0)+qty;
        order.remainingAmount-=qty;
        if(order.remainingAmount<=0){ order.remainingAmount=0; order.status="filled"; order.closedAt=new Date(); }
        const trade={id:`trade_${Date.now()}_${Math.random()}`,orderId:order.id,sellerId:seller.id,buyerId:buyer.id,amount:qty,pricePerCoin:order.pricePerCoin,totalGameMoney:total,createdAt:new Date()};
        this.trades.push(trade);
        return {success:true,trade,order};
    }

    getOrderBook(){ return this.orders.filter(o=>o.status==="open"&&o.remainingAmount>0).sort((a,b)=>a.pricePerCoin-b.pricePerCoin||a.createdAt-b.createdAt); }
    getLastPrice(){ return this.trades.length?this.trades[this.trades.length-1].pricePerCoin:null; }
    getMarketStats(){
        const trades=this.trades;
        const volume=trades.reduce((s,t)=>s+t.amount,0);
        const turnover=trades.reduce((s,t)=>s+t.totalGameMoney,0);
        return {openOrders:this.getOrderBook().length,trades:trades.length,volume,turnover,lastPrice:this.getLastPrice()};
    }
}

export function runCoinMarketplaceTest(){
 const market=new CoinMarketplaceSystem();
 const seller={id:"u1",wallet:{balance:100}}; const buyer={id:"u2",wallet:{balance:0}};
 const sc={money:0},bc={money:20000};
 const o=market.createSellOrder({seller,amount:100,pricePerCoin:100});
 const b=o.success?market.buy({orderId:o.order.id,buyer,seller,amount:40,buyerCompany:bc,sellerCompany:sc}):{};
 const success=o.success&&b.success&&seller.wallet.balance===0&&buyer.wallet.balance===40&&bc.money===16000&&sc.money===4000&&o.order.remainingAmount===60;
 console[success?"log":"error"](success?"✅ COINMARKT-TEST ERFOLGREICH":"❌ COINMARKT-TEST FEHLGESCHLAGEN",{o,b,stats:market.getMarketStats()});
 return {success};
}
