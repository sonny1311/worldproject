// WorldProject – explizite Auswahl der Flaschengroesse in der vorhandenen Produktionsoberflaeche.
// Die eigentlichen Abfuellrezepte bleiben die einzige Quelle fuer Materialbedarf und Ausgabemenge.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const EPSILON = 1e-9;
const sizeNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function bottlingSizes(recipes = []) {
  return [...new Set(
    recipes
      .filter(r => r?.productionStage === 'bottling' && sizeNumber(r.bottleSizeLiters) > 0)
      .map(r => sizeNumber(r.bottleSizeLiters))
  )].sort((a, b) => a - b);
}

export function bottlingRecipeMatchesSize(recipe, size) {
  return recipe?.productionStage === 'bottling' && Math.abs(sizeNumber(recipe.bottleSizeLiters) - sizeNumber(size)) <= EPSILON;
}

export function filterBottlingRecipesBySize(recipes = [], size) {
  return recipes.filter(r => bottlingRecipeMatchesSize(r, size));
}

function formatBottleSize(size) {
  return `${sizeNumber(size).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} l`;
}

const proto = OperationalSupplyChainDialog.prototype;
if (!proto.__worldBottlingSizeSelectionIntegrated) {
  proto.__worldBottlingSizeSelectionIntegrated = true;
  const originalRenderProduction = proto.renderProduction;

  proto.renderProduction = function(panel, company, recipes) {
    const result = originalRenderProduction.call(this, panel, company, recipes);
    const variants = (recipes || []).filter(r => r?.productionStage === 'bottling' && sizeNumber(r.bottleSizeLiters) > 0);
    const sizes = bottlingSizes(variants);
    if (sizes.length < 2) return result;

    const productionSection = [...panel.querySelectorAll('section')]
      .find(section => section.querySelector(':scope > h3')?.textContent === 'Produktionsplanung');
    if (!productionSection) return result;

    const bottlingGroup = [...productionSection.children]
      .find(node => node.querySelector?.(':scope > h3')?.textContent === '🍾 Abfüllen');
    if (!bottlingGroup) return result;

    if (!sizes.some(size => Math.abs(size - sizeNumber(this.selectedBottlingSizeLiters)) <= EPSILON)) {
      this.selectedBottlingSizeLiters = sizes[0];
    }

    const controls = this.el('div');
    controls.className = 'world-bottling-size-selector';
    Object.assign(controls.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
      padding: '10px',
      margin: '6px 0 12px',
      border: '1px solid #cfd8e3',
      borderRadius: '9px',
      background: '#f5f8fc'
    });
    controls.append(this.el('strong', 'Flaschengröße wählen:'));

    const cards = [...bottlingGroup.children].filter(node => node.querySelector?.('h4'));
    const recipeForCard = card => {
      const title = card.querySelector('h4')?.textContent || '';
      return variants.find(r => (r.label || r.id) === title) || null;
    };

    const applySelection = () => {
      const selected = sizeNumber(this.selectedBottlingSizeLiters);
      for (const card of cards) {
        const recipe = recipeForCard(card);
        card.style.display = recipe && bottlingRecipeMatchesSize(recipe, selected) ? '' : 'none';
      }
      for (const button of controls.querySelectorAll('button[data-bottle-size]')) {
        const active = Math.abs(sizeNumber(button.dataset.bottleSize) - selected) <= EPSILON;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.style.fontWeight = active ? '700' : '400';
        button.style.outline = active ? '2px solid currentColor' : 'none';
      }
      let hint = controls.querySelector('.world-bottling-size-hint');
      if (!hint) {
        hint = this.el('span');
        hint.className = 'world-bottling-size-hint';
        controls.append(hint);
      }
      const visible = filterBottlingRecipesBySize(variants, selected);
      hint.textContent = `Ausgewählt: ${formatBottleSize(selected)} · ${visible.length} passende${visible.length === 1 ? 's' : ''} Abfüllrezept${visible.length === 1 ? '' : 'e'}`;
    };

    for (const size of sizes) {
      const button = this.btn(formatBottleSize(size), () => {
        this.selectedBottlingSizeLiters = size;
        applySelection();
      });
      button.dataset.bottleSize = String(size);
      button.title = `Abfüllung in ${formatBottleSize(size)} anzeigen`;
      controls.append(button);
    }

    const heading = bottlingGroup.querySelector(':scope > h3');
    heading?.insertAdjacentElement('afterend', controls);
    applySelection();
    return result;
  };
}

export function runBottlingSizeSelectionTest() {
  const recipes = [
    { id: 'pils033', productionStage: 'bottling', bottleSizeLiters: .33 },
    { id: 'pils050', productionStage: 'bottling', bottleSizeLiters: .5 },
    { id: 'brew', productionStage: 'brewing' }
  ];
  const sizes = bottlingSizes(recipes);
  const selected033 = filterBottlingRecipesBySize(recipes, .33);
  const selected050 = filterBottlingRecipesBySize(recipes, .5);
  const success = sizes.length === 2 && sizes[0] === .33 && sizes[1] === .5 && selected033.length === 1 && selected033[0].id === 'pils033' && selected050.length === 1 && selected050[0].id === 'pils050';
  if (!success) throw new Error('Flaschengroessen-Auswahltest fehlgeschlagen');
  return { success, sizes, selected033: selected033.map(r => r.id), selected050: selected050.map(r => r.id) };
}

if (typeof window !== 'undefined') {
  window.worldBottlingSizeSelection = {
    sizes: bottlingSizes,
    filter: filterBottlingRecipesBySize,
    test: runBottlingSizeSelectionTest
  };
}
