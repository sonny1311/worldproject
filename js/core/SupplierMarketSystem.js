// WorldProject - dynamische Lieferanten und Marktpreise
export class SupplierMarketSystem {
    constructor(seedOffers = null) {
        this.offers = seedOffers ?? this.createDefaultOffers();
    }

    createDefaultOffers() {
        const make = (id, supplier, itemId, price, distanceKm, stock, deliveryHours) => ({
            id, supplierId: supplier, supplierName: supplier, itemId,
            unitPrice: price, distanceKm, availableAmount: stock, deliveryHours,
            updatedAt: new Date()
        });

        return [
            make("malt-a","Mälzerei Nord","malt_kg",0.78,95,50000,5),
            make("malt-b","Mälzerei West","malt_kg",0.74,185,70000,8),
            make("hops-a","Hopfenhandel Süd","hops_kg",16.50,240,3000,10),
            make("yeast-a","Brauhefe GmbH","yeast_kg",8.80,130,5000,6),
            make("water-a","Wasserwerk Regional","water_l",0.0025,8,1000000,1),
            make("bottle-a","Glaswerk Mitte","bottle_033",0.17,115,150000,6),
            make("cap-a","Verschlüsse GmbH","crown_cap",0.02,90,500000,5),
            make("label-a","Etikettenwerk","label_033",0.08,75,500000,4)
        ];
    }

    getOffers(itemId) {
        return this.offers.filter(o => o.itemId === itemId && o.availableAmount > 0);
    }

    estimateTransportCost(offer, amount) {
        const distance = Math.max(Number(offer?.distanceKm) || 0, 0);
        const sizeFactor = Math.max(Number(amount) || 0, 0);
        return distance * 0.42 + Math.min(sizeFactor * 0.002, 120);
    }

    getBestOffer(itemId, amount = 1) {
        const offers = this.getOffers(itemId)
            .filter(o => o.availableAmount >= amount)
            .map(o => {
                const materialCost = o.unitPrice * amount;
                const transportCost = this.estimateTransportCost(o, amount);
                return {
                    ...o,
                    materialCost,
                    estimatedTransportCost: transportCost,
                    estimatedTotalCost: materialCost + transportCost
                };
            })
            .sort((a,b) => {
                if (a.estimatedTotalCost !== b.estimatedTotalCost) {
                    return a.estimatedTotalCost - b.estimatedTotalCost;
                }
                return a.deliveryHours - b.deliveryHours;
            });

        return offers[0] ?? null;
    }

    fluctuatePrices(percent = 0.03) {
        for (const offer of this.offers) {
            const factor = 1 + ((Math.random() * 2 - 1) * percent);
            offer.unitPrice = Math.max(offer.unitPrice * factor, 0.0001);
            offer.updatedAt = new Date();
        }
        return this.offers;
    }

    reserveOffer(offerId, amount) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer || offer.availableAmount < amount) {
            return { success:false, reason:"Lieferantenbestand reicht nicht" };
        }
        offer.availableAmount -= amount;
        return { success:true, offer };
    }
}

export function runSupplierMarketTest() {
    const market = new SupplierMarketSystem();
    const best = market.getBestOffer("malt_kg",55);
    const success = !!best && best.availableAmount >= 55 && best.estimatedTotalCost > 0;
    console[success ? "log" : "error"](
        success ? "✅ LIEFERANTENMARKT-TEST ERFOLGREICH" : "❌ LIEFERANTENMARKT-TEST FEHLGESCHLAGEN",
        best
    );
    return { success, best };
}
