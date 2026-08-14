// WorldProject – geordnete Produktions-Checkliste auf Basis der zentralen Readiness-Daten.
import { allProductionReadinessVM, recommendedProductionFixes } from './ProductionReadinessAssistant.js';

const fixPriority = Object.freeze({ buy_equipment: 1, hire: 2, procure: 3 });
const text = value => String(value ?? '').replace(/_/g, ' ');

export function productionReadinessChecklist(company) {
  if (!company) return [];
  return allProductionReadinessVM(company).map(vm => {
    const machineMissing = Boolean(vm.machine?.missing);
    const workforceWaiting = Boolean(vm.workforce?.blockedByMachine);
    const workforceMissing = Boolean(vm.workforce?.missing);
    const missingMaterials = Number(vm.missingMaterials?.length || 0);
    const machineLabel = vm.machine?.type || vm.machine?.requiredType || vm.machine?.machineType || vm.blockingReasons?.find(x => String(x).startsWith('Maschine fehlt:'))?.replace(/^Maschine fehlt:\s*/, '') || 'benötigte Anlage';
    const roleLabel = vm.workforce?.candidate?.label || vm.workforce?.requiredRole || 'Fachkraft';
    const fixes = recommendedProductionFixes(company, vm.recipeId, vm.amount).actions || [];
    const nextFix = [...fixes].sort((a, b) => (fixPriority[a.kind] || 99) - (fixPriority[b.kind] || 99))[0] || null;
    return {
      recipeId: vm.recipeId,
      product: vm.product || vm.recipeId,
      productLabel: vm.productLabel || vm.recipeLabel || text(vm.product || vm.recipeId),
      ready: Boolean(vm.ready),
      stages: [
        { id: 'machine', state: machineMissing ? 'missing' : 'ok', label: machineMissing ? `Anlage fehlt: ${text(machineLabel)}` : 'Anlage vorhanden' },
        { id: 'workforce', state: workforceWaiting ? 'waiting' : workforceMissing ? 'missing' : 'ok', label: workforceWaiting ? `Personal wartet auf Anlage (${text(roleLabel)})` : workforceMissing ? `Personal fehlt: ${text(roleLabel)}` : 'Personal abgedeckt' },
        { id: 'materials', state: missingMaterials ? 'missing' : 'ok', label: missingMaterials ? `${missingMaterials} Rohstoff-/Verpackungsposition${missingMaterials === 1 ? '' : 'en'} fehlt/fehlen` : 'Rohstoffe & Verpackung vorhanden' }
      ],
      nextFix
    };
  });
}

export function runProductionReadinessChecklistShapeTest() {
  const ordered = ['machine', 'workforce', 'materials'];
  if (ordered.join('|') !== 'machine|workforce|materials') throw new Error('Checklisten-Reihenfolge fehlerhaft');
  if (!(fixPriority.buy_equipment < fixPriority.hire && fixPriority.hire < fixPriority.procure)) throw new Error('Fix-Priorität fehlerhaft');
  return true;
}
