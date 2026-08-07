// ============================================
// Order.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Order {

    constructor() {

        this.id = crypto.randomUUID();

        // Bestellung
        this.number = "";

        // Käufer
        this.buyer = null;

        // Lieferant
        this.supplier = null;

        // Ziel (Filiale oder Lager)
        this.destination = null;

        // Positionen
        this.items = [];

        // Status
        this.status = "created";
        // created
        // approved
        // ordered
        // packed
        // loading
        // shipped
        // delivered
        // cancelled

        // Preise
        this.subtotal = 0;
        this.shipping = 0;
        this.tax = 0;
        this.total = 0;

        // Zeit
        this.createdAt = new Date();
        this.expectedDelivery = null;
        this.deliveredAt = null;

    }

    //----------------------------------------

    addItem(product, quantity, price){

        this.items.push({

            product,
            quantity,
            price

        });

        this.calculateTotal();

    }

    //----------------------------------------

    calculateTotal(){

        this.subtotal = 0;

        for(const item of this.items){

            this.subtotal +=
                item.quantity * item.price;

        }

        this.total =
            this.subtotal +
            this.shipping +
            this.tax;

    }

    //----------------------------------------

    approve(){

        this.status = "approved";

    }

    //----------------------------------------

    ship(){

        this.status = "shipped";

    }

    //----------------------------------------

    deliver(){

        this.status = "delivered";

        this.deliveredAt = new Date();

    }

}