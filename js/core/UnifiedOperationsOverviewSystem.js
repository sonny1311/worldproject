// WorldProject - gemeinsame Quelle fuer Dashboard-Zaehler und Detailansichten
// Ziel: Lieferungen, Produktion und Kundenauftraege muessen exakt dieselben
// Datensaetze verwenden, damit Zaehler und sichtbare Listen nie auseinanderlaufen.
export class UnifiedOperationsOverviewSystem {
  constructor({ companyProvider = () => window.worldPlayerCompany } = {}) {
    this.companyProvider = companyProvider;
  }

  state() {
    const company = this.companyProvider?.();
    if (!company) return { company: null, operations: {} };

    if (!company.operationsState) company.operationsState = {};
    if (!company.operationalSupplyState) company.operationalSupplyState = {};

    const s = company.operationsState;
    const supply = company.operationalSupplyState;

    // Uebergang/Migration: Der Einkaufsdialog speichert Lieferungen und Produktion
    // historisch in operationalSupplyState, waehrend Dashboard/Kundenauftraege
    // operationsState verwenden. Beide Ansichten muessen auf dieselben Arrays zeigen.
    const legacyOrders = Array.isArray(supply.orders) ? supply.orders : [];
    const overviewOrders = Array.isArray(s.supplyOrders) ? s.supplyOrders : [];
    const canonicalOrders = legacyOrders.length ? legacyOrders : overviewOrders;
    supply.orders = canonicalOrders;
    s.supplyOrders = canonicalOrders;

    const legacyProduction = Array.isArray(supply.productionQueue) ? supply.productionQueue : [];
    const overviewProduction = Array.isArray(s.productionQueue) ? s.productionQueue : [];
    const canonicalProduction = legacyProduction.length ? legacyProduction : overviewProduction;
    supply.productionQueue = canonicalProduction;
    s.productionQueue = canonicalProduction;

    if (!Array.isArray(s.customerOrders)) s.customerOrders = [];

    return { company, operations: s };
  }

  openDeliveries(now = Date.now()) {
    const { operations } = this.state();
    return operations.supplyOrders.filter(o => !["stored", "cancelled"].includes(o.status));
  }

  activeProduction(now = Date.now()) {
    const { operations } = this.state();
    return operations.productionQueue.filter(j => !["finished", "cancelled"].includes(j.status));
  }

  openCustomerOrders(now = Date.now()) {
    const { operations } = this.state();
    return operations.customerOrders.filter(o => !["completed", "cancelled", "rejected"].includes(o.status));
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
      // SupabaseGameStateSync lauscht auf diesen zentralen Dirty-Event.
      // Damit werden Kundenauftraege ebenso sicher persistiert wie Einkauf/Lager/Produktion.
      window.dispatchEvent(new CustomEvent("world:game-state-dirty", { detail: { reason: "operations-overview" } }));
    } catch (_) {}
  }
}
