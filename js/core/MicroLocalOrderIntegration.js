// WorldProject – verbindet Mikro-Unternehmensstart und lokale Kundenaufträge mit dem aktiven Betrieb.
import { microStarterProfile, starterOrderScale, ensureMicroBusiness } from './MicroBusinessStarterSystem.js';
import { getIndustryProfile } from './IndustryCatalog.js';
import { chooseCustomerOrderProduct } from './CustomerOrderVarietyIntegration.js';

const num = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const now = () => window.worldTime?.now?.() || Date.now();

function productCandidates(company) {
  const ids = [];
  const push = id => {
    if (id && id !== 'undefined' && !ids.includes(id)) ids.push(id);
  };

  for (const o of [...(company.completedCustomerOrders || []), ...(company.customerOrders || [])].reverse()) {
    push(o?.productId || o?.product);
  }
  for (const [id, value] of Object.entries(company.operationalSupplyState?.warehouseStock?.finished || {})) {
    if (num(value) > 0) push(id);
  }
  for (const [id, value] of Object.entries(company.finishedGoods || {})) {
    if (num(value) > 0) push(id);
  }
  for (const id of Object.keys(company.salesPrices || {})) push(id);
  for (const id of (getIndustryProfile(company).products || [])) push(id);
  return ids;
}

function chooseProduct(company, index = 0) {
  return chooseCustomerOrderProduct(company, index)?.productId || productCandidates(company)[0] || null;
}

function priceFor(company, productId) {
  return Math.max(.01, num(company.salesPrices?.[productId], num(company.productPrices?.[productId], 1)));
}

function createLegacyOrder(company, opts) {
  if (typeof company.createCustomerOrder === 'function') return company.createCustomerOrder(opts);

  const order = {
    id: `micro-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'open',
    createdAt: now(),
    customer: opts.customer,
    customerName: opts.customer?.name || 'Lokaler Kunde',
    productId: opts.productId,
    product: opts.productId,
    amount: opts.amount,
    quantity: opts.amount,
    unitPrice: opts.unitPrice,
    total: opts.amount * opts.unitPrice,
    dueAt: now() + opts.dueHours * 3600000,
    source: 'micro_local'
  };

  company.customerOrders = Array.isArray(company.customerOrders) ? company.customerOrders : [];
  company.customerOrders.push(order);
  return order;
}

export function ensureMicroLocalOrders(game, company, { targetOpen = 4 } = {}) {
  if (!company) return [];

  ensureMicroBusiness(company, now());
  const profile = microStarterProfile(company);
  const open = (company.customerOrders = Array.isArray(company.customerOrders) ? company.customerOrders : [])
    .filter(o => o?.status === 'open');

  let guard = 0;
  while (open.length < targetOpen && guard < Math.max(8, targetOpen * 3)) {
    const completedStarterOrders = num(company.microBusiness?.completedStarterOrders, 0);
    const sequence = completedStarterOrders + open.length + guard;
    const productId = chooseProduct(company, sequence);
    if (!productId) break;

    const scale = starterOrderScale(company);
    const maxQuantity = Math.max(1, num(scale.maxQuantity, 100));
    const amount = Math.max(1, Math.round(maxQuantity * (.35 + Math.random() * .45)));
    const unitPrice = priceFor(company, productId);
    const customerTypes = Array.isArray(profile.customers) && profile.customers.length ? profile.customers : ['Lokaler Kunde'];
    const customerType = customerTypes[sequence % customerTypes.length];
    const industryKey = String(profile.type || company.type || company.company_type || 'business').toLowerCase().replace(/\s+/g, '-');
    const customer = {
      id: `local-${industryKey}-${sequence}`,
      name: `${customerType} ${sequence + 1}`,
      type: 'local_micro',
      starter: true
    };
    const baseDueHours = scale.tier === 1 ? 24 : scale.tier === 2 ? 48 : 72;
    const options = {
      customer,
      productId,
      amount,
      unitPrice,
      dueHours: Math.max(2, Math.round(baseDueHours * (.8 + Math.random() * .4)))
    };

    let order = null;
    try {
      order = game?.customerOrderLifecycle?.createCustomerOrder?.(company, options) || createLegacyOrder(company, options);
    } catch (error) {
      console.warn('Lokaler Mikroauftrag konnte nicht über Lifecycle erzeugt werden', error);
      order = createLegacyOrder(company, options);
    }

    if (order) {
      order.source = order.source || 'micro_local';
      order.microStarter = true;
      open.push(order);
    }
    guard++;
  }
  return open;
}

export function runMicroLocalOrderTest() {
  const company = {
    type: 'Brauerei',
    customerOrders: [],
    completedCustomerOrders: [],
    salesPrices: {
      lager033_bottle: 0.95,
      pils033_bottle: 0.99
    },
    unlockedRecipes: ['lager033']
  };

  const orders = ensureMicroLocalOrders(null, company, { targetOpen: 2 });
  const products = orders.map(order => order.productId || order.product).filter(Boolean);
  const success = orders.length === 2 && new Set(products).size === 2 && orders.every(order =>
    Number.isFinite(Number(order.amount)) && Number(order.amount) > 0 &&
    Number.isFinite(Number(order.dueAt)) && Number(order.dueAt) > Number(order.createdAt)
  );

  console[success ? 'log' : 'error'](
    success ? '✅ MIKRO-KUNDENAUFTRAGS-TEST ERFOLGREICH' : '❌ MIKRO-KUNDENAUFTRAGS-TEST FEHLGESCHLAGEN',
    { orders, products }
  );
  return { success, orders, products };
}

export function installMicroLocalOrders({ targetOpen = 4 } = {}) {
  if (typeof window === 'undefined') return false;

  const run = () => {
    const company = window.worldPlayerCompany;
    const game = window.worldEngine;
    if (!company) return;
    try {
      ensureMicroLocalOrders(game, company, { targetOpen });
    } catch (error) {
      console.warn('Mikro-Kundenaufträge konnten nicht vorbereitet werden', error);
    }
  };

  for (const event of [
    'worldproject:company-founded',
    'worldproject:company-loaded',
    'worldproject:company-switched',
    'world:customer-order-completed'
  ]) {
    window.addEventListener(event, () => setTimeout(run, 40));
  }

  setTimeout(run, 120);
  return true;
}

if (typeof window !== 'undefined') {
  window.worldMicroLocalOrders = {
    ensure: ensureMicroLocalOrders,
    install: installMicroLocalOrders,
    test: runMicroLocalOrderTest
  };
  installMicroLocalOrders();
}
