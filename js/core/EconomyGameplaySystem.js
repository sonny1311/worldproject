// WorldProject - erster kompletter Wirtschaftskreislauf
export class EconomyGameplaySystem {
    ensureCompany(company) {
        company.inventory ??= {};
        company.finishedGoods ??= {};
        company.supplierOrders ??= [];
        company.productionOrders ??= [];
        company.sales ??= [];
        return company;
    }

    addStock(company,itemId,amount) {
        this.ensureCompany(company);
        company.inventory[itemId]=(Number(company.inventory[itemId])||0)+Math.max(Number(amount)||0,0);
    }

    createSupplierOrder(company,{supplierId="supplier",itemId,amount=0,unitPrice=0,distanceKm=0}={}) {
        this.ensureCompany(company);
        const totalPrice=Math.max(Number(amount)||0,0)*Math.max(Number(unitPrice)||0,0);
        if ((Number(company.money)||0)<totalPrice) return {success:false,reason:"Nicht genug Geld"};
        company.money-=totalPrice;
        const order={id:Date.now()+Math.random(),supplierId,itemId,amount,totalPrice,distanceKm,status:"ordered",createdAt:new Date()};
        company.supplierOrders.push(order);
        return {success:true,order};
    }

    markSupplierOrderInTransit(order){ if(order) order.status="in_transit"; }
    receiveSupplierOrder(company,order){
        if(!order || order.status==="delivered") return {success:false,reason:"Bestellung nicht lieferbar"};
        this.addStock(company,order.itemId,order.amount);
        order.status="delivered"; order.deliveredAt=new Date();
        return {success:true,order,stock:company.inventory[order.itemId]};
    }

    canProduce(company,recipe,batches=1){
        this.ensureCompany(company);
        return Object.entries(recipe.inputs||{}).every(([id,amount]) => (Number(company.inventory[id])||0)>=amount*batches);
    }

    produce(company,recipe,batches=1){
        this.ensureCompany(company);
        if(!this.canProduce(company,recipe,batches)) return {success:false,reason:"Rohstoffe fehlen"};
        for(const [id,amount] of Object.entries(recipe.inputs||{})) company.inventory[id]-=amount*batches;
        const outputAmount=(Number(recipe.outputAmount)||1)*batches;
        company.finishedGoods[recipe.outputId]=(Number(company.finishedGoods[recipe.outputId])||0)+outputAmount;
        const order={id:Date.now()+Math.random(),recipeId:recipe.id,batches,outputId:recipe.outputId,outputAmount,status:"completed",completedAt:new Date()};
        company.productionOrders.push(order);
        return {success:true,order};
    }

    sell(company,{productId,amount=0,unitPrice=0}={}){
        this.ensureCompany(company);
        if((Number(company.finishedGoods[productId])||0)<amount) return {success:false,reason:"Nicht genug Fertigware"};
        company.finishedGoods[productId]-=amount;
        const revenue=amount*unitPrice; company.money=(Number(company.money)||0)+revenue;
        const sale={id:Date.now()+Math.random(),productId,amount,unitPrice,revenue,soldAt:new Date()}; company.sales.push(sale);
        return {success:true,sale};
    }
}

export const FirstPlayableRecipe={id:"test_product",name:"Testprodukt",inputs:{raw_material:2,packaging:1},outputId:"finished_product",outputAmount:1,productionMinutes:30};

export function runEconomyGameplayTest(){
 const c={money:1000}; const e=new EconomyGameplaySystem();
 const a=e.createSupplierOrder(c,{itemId:"raw_material",amount:20,unitPrice:2});
 const b=e.createSupplierOrder(c,{itemId:"packaging",amount:10,unitPrice:1});
 e.markSupplierOrderInTransit(a.order); e.markSupplierOrderInTransit(b.order); e.receiveSupplierOrder(c,a.order); e.receiveSupplierOrder(c,b.order);
 const p=e.produce(c,FirstPlayableRecipe,10); const s=e.sell(c,{productId:"finished_product",amount:10,unitPrice:10});
 const success=a.success&&b.success&&p.success&&s.success&&c.money===1050&&c.finishedGoods.finished_product===0;
 console[success?"log":"error"](success?"✅ WIRTSCHAFTSKREISLAUF-TEST ERFOLGREICH":"❌ WIRTSCHAFTSKREISLAUF-TEST FEHLGESCHLAGEN",{company:c,production:p,sale:s}); return {success};
}