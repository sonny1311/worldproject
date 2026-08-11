// WorldProject - dynamische Lieferanten und Marktpreise
export class SupplierMarketSystem {
    constructor(seedOffers = null) {
        this.offers = seedOffers ?? this.createDefaultOffers();
        this.priceHistory = {};
        for (const offer of this.offers) this.recordPrice(offer);
    }

    createDefaultOffers() {
        const make = (id, supplier, itemId, price, distanceKm, stock, deliveryHours, reliability=0.95, minimumOrder=1, quality=80) => ({
            id, supplierId: supplier, supplierName: supplier, itemId,
            unitPrice: price, distanceKm, availableAmount: stock, deliveryHours,
            reliability, minimumOrder, quality,
            quantityDiscounts:[{min:50000,discount:0.08},{min:10000,discount:0.05},{min:1000,discount:0.025}],
            updatedAt: new Date()
        });
        return [
            make("malt-a","Mälzerei Nord","malt_kg",0.78,95,50000,5,0.98,25,92),
            make("malt-b","Mälzerei West","malt_kg",0.74,185,70000,8,0.93,50,86),
            make("malt-c","Mälzerei Regional","malt_kg",0.82,35,18000,3,0.99,20,95),
            make("hops-a","Hopfenhandel Süd","hops_kg",16.50,240,3000,10,0.96,0.25,93),
            make("hops-b","Hopfenkontor Mitte","hops_kg",17.20,105,1800,5,0.99,0.25,96),
            make("yeast-a","Brauhefe GmbH","yeast_kg",8.80,130,5000,6,0.98,0.25,94),
            make("yeast-b","Hefelabor West","yeast_kg",8.25,210,2800,9,0.92,0.5,90),
            make("water-a","Wasserwerk Regional","water_l",0.0025,8,1000000,1,0.999,100,90),
            make("water-b","Quellwasser Logistik","water_l",0.0031,55,500000,3,0.99,500,96),
            make("bottle-a","Glaswerk Mitte","bottle_033",0.17,115,150000,6,0.97,500,91),
            make("bottle-b","Flaschenglas Nord","bottle_033",0.162,220,220000,9,0.93,1000,87),
            make("cap-a","Verschlüsse GmbH","crown_cap",0.02,90,500000,5,0.98,1000,92),
            make("cap-b","CapTech","crown_cap",0.0185,175,300000,7,0.94,2500,89),
            make("label-a","Etikettenwerk","label_033",0.08,75,500000,4,0.98,1000,93),
            make("label-b","PrintPack","label_033",0.071,190,350000,8,0.92,2500,86)
        ];
    }

    recordPrice(offer) {
        if (!offer) return;
        this.priceHistory[offer.id] ??= [];
        this.priceHistory[offer.id].push({ price:Number(offer.unitPrice)||0, at:new Date() });
        if (this.priceHistory[offer.id].length > 60) this.priceHistory[offer.id].shift();
    }

    getPriceHistory(offerId) { return [...(this.priceHistory[offerId] ?? [])]; }
    getOffers(itemId) { return this.offers.filter(o => o.itemId === itemId && o.availableAmount > 0); }

    estimateTransportCost(offer, amount) {
        const distance = Math.max(Number(offer?.distanceKm) || 0, 0);
        const sizeFactor = Math.max(Number(amount) || 0, 0);
        return distance * 0.42 + Math.min(sizeFactor * 0.002, 120);
    }

    getBestOffer(itemId, amount = 1) {
        const offers = this.getOffers(itemId)
            .map(o => {
                const orderAmount=Math.max(Number(amount)||0,Number(o.minimumOrder)||1);
                if(o.availableAmount<orderAmount)return null;
                const tier=(o.quantityDiscounts||[]).find(t=>orderAmount>=t.min);
                const discount=tier?.discount||0;
                const effectiveUnitPrice=o.unitPrice*(1-discount);
                const materialCost = effectiveUnitPrice * orderAmount;
                const transportCost = this.estimateTransportCost(o, orderAmount);
                return { ...o, orderAmount, discount, effectiveUnitPrice, materialCost, estimatedTransportCost: transportCost, estimatedTotalCost: materialCost + transportCost };
            }).filter(Boolean)
            .sort((a,b) => a.estimatedTotalCost !== b.estimatedTotalCost ? a.estimatedTotalCost-b.estimatedTotalCost : b.reliability-a.reliability);
        return offers[0] ?? null;
    }

    fluctuatePrices(percent = 0.03) {
        for (const offer of this.offers) {
            const factor = 1 + ((Math.random() * 2 - 1) * percent);
            offer.unitPrice = Math.max(offer.unitPrice * factor, 0.0001);
            offer.updatedAt = new Date();
            this.recordPrice(offer);
        }
        return this.offers;
    }

    replenishStock(percent=0.10) {
        for (const offer of this.offers) offer.availableAmount += Math.max(Math.round(offer.availableAmount*percent),1);
        return this.offers;
    }

    reserveOffer(offerId, amount) {
        const offer = this.offers.find(o => o.id === offerId);
        if(!offer)return {success:false,reason:"Lieferangebot fehlt"};
        const qty=Math.max(Number(amount)||0,Number(offer.minimumOrder)||1);
        if (offer.availableAmount < qty) return { success:false, reason:"Lieferantenbestand reicht nicht" };
        offer.availableAmount -= qty;
        return { success:true, offer, reservedAmount:qty };
    }
}

export function runSupplierMarketTest() {
    const market = new SupplierMarketSystem();
    const best = market.getBestOffer("malt_kg",55);
    market.fluctuatePrices();
    const history = best ? market.getPriceHistory(best.id) : [];
    const success = !!best && market.getOffers("malt_kg").length>=3 && best.estimatedTotalCost > 0 && history.length >= 2 && best.reliability>0;
    console[success ? "log" : "error"](success ? "✅ LIEFERANTENMARKT-TEST ERFOLGREICH" : "❌ LIEFERANTENMARKT-TEST FEHLGESCHLAGEN",{best,history});
    return { success, best, history };
}