// WorldProject - gemeinsame Quelle fuer Dashboard-Zaehler und Detailansichten
// Ziel: Lieferungen, Produktion und Kundenauftraege muessen exakt dieselben
// Datensaetze verwenden, damit Zaehler und sichtbare Listen nie auseinanderlaufen.
export class UnifiedOperationsOverviewSystem {
  constructor({ companyProvider = () => window.worldPlayerCompany } = {}) {
    this.companyProvider = companyProvider;
  }

  keyFor(row, prefix, index) {
    if (row?.id != null && row.id !== "") return `${prefix}:id:${String(row.id)}`;
    const parts = [
      row?.supplierId || row?.supplierName || row?.customerId || row?.customer || "",
      row?.material || row?.itemId || row?.productId || row?.product || row?.recipeId || "",
      row?.createdAt || row?.orderedAt || row?.startedAt || row?.deadline || "",
      row?.quantity || row?.amount || row?.output || row?.batches || ""
    ];
    return parts.some(Boolean) ? `${prefix}:legacy:${parts.join("|")}` : `${prefix}:index:${index}`;
  }

  mergeRows(prefix, ...sources) {
    const merged = new Map();
    let index = 0;
    for (const source of sources) {
      if (!Array.isArray(source)) continue;
      for (const row of source) {
        if (!row || typeof row !== "object") continue;
        const key = this.keyFor(row, prefix, index++);
        const previous = merged.get(key);
        // Spaetere Quellen duerfen vorhandene Felder ergaenzen, aber niemals
        // einen kompletten historischen Datensatz verschwinden lassen.
        merged.set(key, previous ? { ...previous, ...row } : row);
      }
    }
    return [...merged.values()];
  }

  normalizeDelivery(order = {}) {
    const row = order;
    const toTimestamp = value => {
      if (value == null || value === "") return null;
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const createdAt = toTimestamp(row.createdAt ?? row.orderedAt ?? row.orderTime);
    let eta = toTimestamp(row.eta ?? row.arrivalAt ?? row.expectedAt ?? row.expectedArrival);
    const deliveryHours = Number(row.quote?.deliveryHours ?? row.deliveryHours ?? row.deliveryTimeHours);
    if (!eta && createdAt && Number.isFinite(deliveryHours) && deliveryHours >= 0) {
      eta = createdAt + deliveryHours * 3600000;
    }
    if (createdAt && !toTimestamp(row.createdAt)) row.createdAt = createdAt;
    if (eta) {
      row.eta = eta;
      if (!toTimestamp(row.plannedEta)) row.plannedEta = eta;
    }
    return row;
  }

  state() {
    const company = this.companyProvider?.();
    if (!company) return { company: null, operations: { supplyOrders: [], productionQueue: [], customerOrders: [] } };

    if (!company.operationsState) company.operationsState = {};
    if (!company.operationalSupplyState) company.operationalSupplyState = {};

    const s = company.operationsState;
    const supply = company.operationalSupplyState;

    // Verlustfreie Uebergangsmigration: auch die historischen Top-Level-Felder
    // werden einbezogen. Danach zeigen alte und neue Ansichten auf dieselben Arrays.
    const canonicalOrders = this.mergeRows(
      "delivery",
      company.supplierOrders,
      s.supplyOrders,
      supply.orders
    ).map(order => this.normalizeDelivery(order));
    supply.orders = canonicalOrders;
    s.supplyOrders = canonicalOrders;
    company.supplierOrders = canonicalOrders;

    const canonicalProduction = this.mergeRows(
      "production",
      company.productionQueue,
      s.productionQueue,
      supply.productionQueue
    );
    supply.productionQueue = canonicalProduction;
    s.productionQueue = canonicalProduction;
    company.productionQueue = canonicalProduction;

    const canonicalCustomerOrders = this.mergeRows(
      "customer",
      company.orders,
      company.customerOrders,
      s.customerOrders
    );
    s.customerOrders = canonicalCustomerOrders;
    company.customerOrders = canonicalCustomerOrders;
    company.orders = canonicalCustomerOrders;

    return { company, operations: s };
  }

  openDeliveries(now = Date.now()) {
    const { operations } = this.state();
    return operations.supplyOrders.filter(o => !["stored", "cancelled", "delivered"].includes(o.status));
  }

  activeProduction(now = Date.now()) {
    const { operations } = this.state();
    return operations.productionQueue.filter(j => !["finished", "cancelled", "removed"].includes(j.status));
  }

  openCustomerOrders(now = Date.now()) {
    const { operations } = this.state();
    return operations.customerOrders.filter(o => !["completed", "fulfilled", "delivered", "cancelled", "rejected"].includes(o.status));
  }

  counters(now = Date.now()) {
    return {
      deliveries: this.openDeliveries(now).length,
      production: this.activeProduction(now).length,
      customerOrders: this.openCustomerOrders(now).length
    };
  }

  summary(now = Date.now()) {
    return {
      counters: this.counters(now),
      deliveries: this.openDeliveries(now),
      production: this.activeProduction(now),
      customerOrders: this.openCustomerOrders(now)
    };
  }

  addCustomerOrder(order = {}) {
    const { operations } = this.state();
    const row = {
      id: order.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      customer: order.customer || "Kunde",
      product: order.product || "",
      productLabel: order.productLabel || order.product || "Produkt",
      quantity: Number(order.quantity || 0),
      unit: order.unit || "Stk.",
      fulfilledQuantity: Number(order.fulfilledQuantity || 0),
      unitPrice: Number(order.unitPrice || 0),
      deadline: Number(order.deadline || 0),
      status: order.status || "open",
      createdAt: Number(order.createdAt || Date.now()),
      ...order
    };
    operations.customerOrders.push(row);
    this.markDirty();
    return row;
  }

  updateCustomerOrder(id, patch = {}) {
    const { operations } = this.state();
    const o = operations.customerOrders.find(x => x.id === id);
    if (!o) return null;
    Object.assign(o, patch);
    this.markDirty();
    return o;
  }

  markDirty() {
    try {
      window.dispatchEvent(new CustomEvent("worldproject:state-changed", { detail: { source: "operations-overview" } }));
      window.dispatchEvent(new CustomEvent("world:game-state-dirty", { detail: { reason: "operations-overview" } }));
    } catch (_) {}
  }
}
