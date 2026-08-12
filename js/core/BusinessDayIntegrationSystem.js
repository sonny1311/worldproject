// WorldProject - zentraler spielbarer Betriebstag
// Verbindet Produktion, Personal, Lager, Nachfrage, Verkauf und Cashflow.
export class BusinessDayIntegrationSystem {
  constructor({ workforce, production, goods, demand, cashflow, reputation, costs } = {}) {
    Object.assign(this, { workforce, production, goods, demand, cashflow, reputation, costs });
    this.history = [];
  }

  runDay({ company, product, quality = 'standard', rawQuality = 1, machineCondition = 1,
    machineLevel = 1, employeeSkill = 1, processQuality = 1, plannedQuantity = 0,
    shiftId = null, sellingPrice = 1, businessType = 'manufacturing', regionalFactor = 1,
    dayFactor = 1, machines = [], machineHours = {}, energyPrice = .25,
    fixedCosts = {}, now = Date.now(), random = Math.random } = {}) {

    if (!company?.id) throw new Error('Betrieb fehlt');

    // 1. Personal pruefen: Urlaub/fehlende Besetzung stoppt Produktion.
    let staffing = { canOperate: true, available: 0, missing: 0 };
    if (this.workforce && shiftId != null) staffing = this.workforce.staffing(shiftId, now);

    let produced = null;
    if (staffing.canOperate && this.production && plannedQuantity > 0) {
      produced = this.production.produce({ companyId: company.id, product, plannedQuantity,
        rawQuality, machineCondition, machineLevel, employeeSkill, processQuality });
      this.goods?.add({ companyId: company.id, product, quality, quantity: produced.goodQuantity,
        source: 'production', at: now });
    }

    // 2. Nachfrage bestimmen und nur vorhandene Ware verkaufen.
    const numericQuality = produced?.quality ?? rawQuality;
    const rep = this.reputation?.publicProfile(company.id)?.reputation ?? 50;
    const wanted = this.demand?.demand({ product, quality: numericQuality, reputation: rep,
      regionalFactor, dayFactor, random }) ?? 0;
    const sale = this.goods?.consume({ companyId: company.id, product, quality,
      quantity: wanted, channel: 'daily_customers', at: now }) ?? { fulfilled: 0, shortage: wanted };

    // 3. Umsatz erzeugt echte Zahlung/Forderung.
    const grossSales = sale.fulfilled * Number(sellingPrice);
    if (grossSales > 0) {
      this.cashflow?.recordDailySales({ companyId: company.id, businessType, grossSales, date: now });
      this.reputation?.delivery(company.id, { onTime: true, quality: numericQuality });
    }
    const maturedPayments = this.cashflow?.processPayments({ now }) ?? [];
    const direct = this.cashflow?.payments?.filter(p => p.companyId === company.id && p.paidAt === now) ?? [];
    const cashIn = direct.reduce((s, p) => s + Number(p.amount || 0), 0);
    company.money = Number(company.money || 0) + cashIn;

    // 4. Laufende Kosten abbuchen.
    let operatingCosts = null;
    if (this.costs) operatingCosts = this.costs.daily({ company, day: now, machines, machineHours,
      energyPrice, waterCost: fixedCosts.water || 0, heatingCost: fixedCosts.heating || 0,
      rent: fixedCosts.rent || 0, insurance: fixedCosts.insurance || 0, other: fixedCosts.other || 0 });

    const result = { companyId: company.id, now, staffing, produced, demand: wanted,
      sold: sale.fulfilled, unmetDemand: sale.shortage, grossSales, cashIn,
      maturedPayments: maturedPayments.length, operatingCosts: operatingCosts?.total || 0,
      closingBalance: Number(company.money || 0), stock: this.goods?.stock(company.id, product, quality) ?? 0 };
    this.history.push(result);
    return result;
  }
}
