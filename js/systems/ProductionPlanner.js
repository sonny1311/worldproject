// WorldProject - Produktionsplanung nach frei waehlbarer Zielmenge.
// Branchen koennen Rezepte mit einer Referenzmenge registrieren; der Bedarf wird skaliert.
export class ProductionPlanner {
  constructor() {
    this.recipes = new Map();
  }

  registerRecipe(productId, recipe) {
    if (!productId || !recipe) throw new Error('Produkt und Rezept erforderlich');
    const baseQuantity = Number(recipe.baseQuantity || 1);
    if (!(baseQuantity > 0)) throw new Error('Referenzmenge muss groesser als 0 sein');
    this.recipes.set(productId, {
      productId,
      name: recipe.name || productId,
      unit: recipe.unit || 'Stk',
      baseQuantity,
      durationMinutes: Number(recipe.durationMinutes || 0),
      variableCost: Number(recipe.variableCost || 0),
      materials: { ...(recipe.materials || {}) }
    });
  }

  calculate(productId, targetQuantity) {
    const recipe = this.recipes.get(productId);
    if (!recipe) throw new Error(`Kein Rezept fuer ${productId}`);
    const qty = Number(targetQuantity);
    if (!(qty > 0)) throw new Error('Produktionsmenge muss groesser als 0 sein');
    const factor = qty / recipe.baseQuantity;
    const materials = Object.fromEntries(
      Object.entries(recipe.materials).map(([key, value]) => [key, this.round(Number(value) * factor)])
    );
    return {
      productId,
      productName: recipe.name,
      quantity: qty,
      unit: recipe.unit,
      materials,
      durationMinutes: this.round(recipe.durationMinutes * factor),
      variableCost: this.round(recipe.variableCost * factor)
    };
  }

  missingMaterials(plan, inventory = {}) {
    return Object.entries(plan.materials)
      .map(([materialId, required]) => ({
        materialId,
        required,
        available: Number(inventory[materialId] || 0),
        missing: this.round(Math.max(0, required - Number(inventory[materialId] || 0)))
      }))
      .filter(row => row.missing > 0);
  }

  quantityForOrder({ orderedQuantity, inventoryQuantity = 0, alreadyPlanned = 0 }) {
    return this.round(Math.max(0, Number(orderedQuantity || 0) - Number(inventoryQuantity || 0) - Number(alreadyPlanned || 0)));
  }

  round(value) { return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000; }
}
