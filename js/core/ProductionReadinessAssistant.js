// WorldProject – erklärt vor Produktionsstart exakt, was für die Wunschmenge fehlt.
import { industryRecipes, productionReadiness, supplierCanProvide } from './UniversalIndustryCycle.js';
import { equipmentForMachineRequirement } from './IndustryEquipmentMarketplace.js';
import { missingRequiredRoles, availableCandidates } from './IndustryRecruitmentAvailability.js';
import { founderCanCoverJob } from './MicroBusinessStarterSystem.js';
import { formatMoney } from './CurrencyPresentationBridge.js';

const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;

export function productionReadinessVM(company, recipeId, amount) {
  const r = productionReadiness(company, recipeId, amount);
  const materials = Object.entries(r.need).map(([id, required]) => {
    const have = n(company.inventory?.[id]) + n(company.finishedGoods?.[id]);
    const missing = Math.max(0, n(required) - have);
    const suppliers = supplierCanProvide(company, id);
    const estimatedMissingCost = missing * (suppliers[0] ? n(suppliers[0].prices?.[id]) : 0);
    return {
      id,
      required: n(required),
      have,
      missing,
      ok: missing <= 1e-9,
      suppliers: suppliers.map(s => {
        const unitPrice = n(s.prices?.[id]);
        return { id: s.id, name: s.name || s.id, unitPrice, unitPriceFormatted: formatMoney(unitPrice) };
      }),
      estimatedMissingCost,
      estimatedMissingCostFormatted: formatMoney(estimatedMissingCost)
    };
  });

  const machineMissing = Boolean(r.machineMissing);
  const machineOptions = machineMissing ? equipmentForMachineRequirement(company, r.recipe.machineType) : [];
  const requiredRole = r.recipe.requiredRole || null;
  const founderCovers = Boolean(requiredRole && founderCanCoverJob(company, requiredRole));
  const missingRoles = new Set(missingRequiredRoles(company));

  // Personal hängt von der zugehörigen Maschine/Anlage ab. Solange die Anlage fehlt,
  // darf das Spiel keine nicht erfüllbare Personalaufgabe anzeigen oder als Blocker zählen.
  const workforceBlockedByMachine = Boolean(requiredRole && machineMissing);
  const roleMissing = Boolean(requiredRole && !workforceBlockedByMachine && !founderCovers && missingRoles.has(requiredRole));
  const candidate = roleMissing ? availableCandidates(company, { count: 12 }).find(x => x.role === requiredRole) : null;

  const ready = r.ready && !roleMissing;
  const estimatedProcurementCost = materials.reduce((s, x) => s + x.estimatedMissingCost, 0);
  const blockingReasons = [
    ...(machineMissing ? [`Maschine fehlt: ${r.recipe.machineType}`] : []),
    ...(roleMissing ? [`Fachkraft fehlt: ${candidate?.label || requiredRole}`] : []),
    ...materials.filter(x => !x.ok).map(x => `${x.id}: ${x.missing.toFixed(2)} fehlen`)
  ];

  return {
    recipeId,
    product: r.recipe.product,
    amount: n(amount),
    unit: r.recipe.outputUnit || r.recipe.unit || 'Einheiten',
    materials,
    machine: { ...r.machine, missing: machineMissing, options: machineOptions },
    workforce: {
      requiredRole,
      missing: roleMissing,
      candidate,
      founderCovers,
      blockedByMachine: workforceBlockedByMachine,
      status: workforceBlockedByMachine ? 'waiting_for_machine' : roleMissing ? 'missing' : requiredRole ? 'covered' : 'not_required'
    },
    missingWorkforce: roleMissing ? [requiredRole] : [],
    deferredWorkforce: workforceBlockedByMachine ? [requiredRole] : [],
    missingMaterials: materials.filter(x => !x.ok),
    estimatedProcurementCost,
    estimatedProcurementCostFormatted: formatMoney(estimatedProcurementCost),
    ready,
    blockingReasons
  };
}

export function allProductionReadinessVM(company, amountByRecipe = {}) {
  return industryRecipes(company).map(r => productionReadinessVM(company, r.id, n(amountByRecipe[r.id], r.output || 1)));
}

export function recommendedProductionFixes(company, recipeId, amount) {
  const vm = productionReadinessVM(company, recipeId, amount);
  const actions = [];

  for (const m of vm.missingMaterials) {
    actions.push({
      kind: 'procure',
      materialId: m.id,
      quantity: m.missing,
      supplierId: m.suppliers[0]?.id || null,
      estimatedCost: m.estimatedMissingCost,
      estimatedCostFormatted: formatMoney(m.estimatedMissingCost),
      label: `${m.missing.toFixed(2)} ${m.id} beschaffen`
    });
  }

  if (vm.machine.missing) {
    for (const x of vm.machine.options) {
      actions.push({
        kind: 'buy_equipment',
        equipmentId: x.id,
        cost: n(x.price),
        costFormatted: formatMoney(n(x.price)),
        affordable: x.affordable,
        label: `${x.name} kaufen (${formatMoney(n(x.price))})`
      });
    }
  }

  // Erst nach vorhandener Maschine wird Personal als konkrete Aktion angeboten.
  if (!vm.machine.missing && vm.workforce.missing) {
    actions.push({
      kind: 'hire',
      roleId: vm.workforce.requiredRole,
      candidate: vm.workforce.candidate,
      label: `${vm.workforce.candidate?.label || vm.workforce.requiredRole} einstellen`
    });
  }

  return { ready: vm.ready, actions, readiness: vm };
}

if (typeof window !== 'undefined') {
  window.worldProductionReadiness = {
    forRecipe: productionReadinessVM,
    all: allProductionReadinessVM,
    fixes: recommendedProductionFixes
  };
}
