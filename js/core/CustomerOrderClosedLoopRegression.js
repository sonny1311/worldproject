// WorldProject - echter Regressionstest fuer den geschlossenen Kundenauftragspfad.
// Prueft: Fehlmenge -> produzierte Fertigware -> Reservierung -> Transport ->
// Teil-/Restlieferung -> einmaliger Verspaetungsabzug -> Zahlung.
import { CommercialFulfillmentSystem } from './CommercialFulfillmentSystem.js';
import { assessLatePenalty } from './CommercialFulfillmentGameplayBridge.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createMarket(order) {
  return {
    orders: [order],
    deliver(orderId, { quantity, deliveredAt = Date.now(), transportCost = 0 } = {}) {
      const current = this.orders.find((entry) => entry.id === orderId);
      if (!current) throw new Error('Kundenauftrag fehlt');
      const deliveredBefore = Number(current.delivered || 0);
      const remaining = Math.max(0, Number(current.quantity || 0) - deliveredBefore);
      const accepted = Math.min(Math.max(0, Number(quantity || 0)), remaining);
      if (accepted <= 0) throw new Error('Keine lieferbare Auftragsmenge');
      const late = assessLatePenalty(current, { deliveredAt, deliveredBefore });
      current.delivered = deliveredBefore + accepted;
      current.deliveredQuantity = current.delivered;
      current.status = current.delivered >= current.quantity ? 'completed' : 'open';
      const revenue = accepted * Number(current.unitPrice || 0);
      const net = revenue - Number(transportCost || 0) - late.penalty;
      return { status: 'paid', accepted, revenue, transportCost, penalty: late.penalty, net, late: late.late };
    }
  };
}

function transportMock() {
  return {
    prepareOrder(order, { vehicleType = 'van', distanceKm = 0, cargo = {} } = {}) {
      return { success: true, plan: { vehicleType, distanceKm, totalCost: 5, evaluation: { cargo } } };
    },
    async executeOrder() {
      return { success: true, plan: { totalCost: 5, arrivalTime: new Date() } };
    }
  };
}

export async function runCustomerOrderClosedLoopRegression() {
  const dueAt = Date.now() - 60_000;
  const order = {
    id: 9001,
    product: 'beer_pils_033',
    quantity: 1000,
    delivered: 0,
    reserved: 0,
    unitPrice: 2,
    dueAt,
    penaltyPerMissing: 0.1,
    status: 'open'
  };
  const warehouse = { stock: { finished: { beer_pils_033: 200 } } };
  const productionQueue = [
    { status: 'queued', product: 'beer_pils_033', quantity: 300 },
    { status: 'finished', product: 'beer_pils_033', quantity: 999 }
  ];
  const company = { money: 1000 };
  const system = new CommercialFulfillmentSystem({
    market: createMarket(order),
    warehouse,
    transport: transportMock(),
    productionQueueProvider: () => productionQueue
  });

  const suggestion = system.productionSuggestion(order.id);
  assert(suggestion.inventory === 200, 'Lagerbestand wurde im Produktionsvorschlag falsch bewertet');
  assert(suggestion.planned === 300, 'Geplante Produktion wurde im Produktionsvorschlag falsch bewertet');
  assert(suggestion.missing === 500, 'Fehlmenge muss bei 1000 - 200 - 300 genau 500 betragen');

  // Die vorgeschlagenen 500 Einheiten wurden produziert und eingelagert.
  warehouse.stock.finished.beer_pils_033 += 500;
  productionQueue[0].status = 'finished';

  const first = system.reserve(order.id, 400);
  system.prepareTransport(first.id, { vehicleType: 'van', distanceKm: 10, cargo: { weightKg: 400 } });
  const firstDelivery = await system.deliver(first.id, { company, deliveredAt: Date.now() });
  assert(firstDelivery.invoice.accepted === 400, 'Erste Teillieferung wurde nicht korrekt verbucht');
  assert(firstDelivery.invoice.penalty === 100, 'Verspaetungsabzug muss beim ersten spaeten Lieferzeitpunkt einmalig auf 1000 Einheiten berechnet werden');
  assert(order.delivered === 400 && order.status === 'open', 'Teillieferung darf Auftrag nicht vorzeitig abschliessen');
  assert(warehouse.stock.finished.beer_pils_033 === 300, 'Reservierte Teillieferung wurde nicht korrekt aus dem Lager entnommen');

  // Restmenge wird produziert, damit der Auftrag vollstaendig geschlossen werden kann.
  warehouse.stock.finished.beer_pils_033 += 300;
  const second = system.reserve(order.id);
  system.prepareTransport(second.id, { vehicleType: 'van', distanceKm: 10, cargo: { weightKg: 600 } });
  const secondDelivery = await system.deliver(second.id, { company, deliveredAt: Date.now() });
  assert(second.quantity === 600, 'Restlieferung muss exakt die noch offenen 600 Einheiten reservieren');
  assert(secondDelivery.invoice.penalty === 0, 'Verspaetungsabzug darf bei der zweiten Teillieferung nicht erneut berechnet werden');
  assert(order.delivered === 1000 && order.status === 'completed', 'Kundenauftrag wurde nach Restlieferung nicht abgeschlossen');
  assert(order.latePenaltyUnitsAssessed === 1000, 'Verspaetungsabzug wurde nicht persistent am Auftrag markiert');
  assert(warehouse.stock.finished.beer_pils_033 === 0, 'Fertigwarenbestand stimmt nach kompletter Auslieferung nicht');
  assert(company.money === 2890, 'Firmenkonto entspricht nicht Umsatz minus Transportkosten minus einmaligem Verspaetungsabzug');

  return { success: true, suggestion, first: firstDelivery.invoice, second: secondDelivery.invoice, companyMoney: company.money };
}
