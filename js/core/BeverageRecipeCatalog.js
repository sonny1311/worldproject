// WorldProject - erste echte Brauerei-Rezepte
export const BeverageRecipeCatalog = {
    lager033: {
        id: "lager033",
        name: "Lagerbier 0,33 l",
        category: "beer",
        batchSize: 1000,
        productionMinutes: 480,
        inputs: {
            malt_kg: 55,
            hops_kg: 0.45,
            yeast_kg: 0.25,
            water_l: 360,
            bottle_033: 1000,
            crown_cap: 1000,
            label_033: 1000
        },
        outputId: "lager033_bottle",
        outputAmount: 1000
    },
    pils033: {
        id: "pils033",
        name: "Pils 0,33 l",
        category: "beer",
        batchSize: 1000,
        productionMinutes: 510,
        inputs: {
            malt_kg: 58,
            hops_kg: 0.65,
            yeast_kg: 0.25,
            water_l: 365,
            bottle_033: 1000,
            crown_cap: 1000,
            label_033: 1000
        },
        outputId: "pils033_bottle",
        outputAmount: 1000
    }
};

export function getRecipe(id) {
    return BeverageRecipeCatalog[id] ?? null;
}

export function runBeverageRecipeTest() {
    const lager = getRecipe("lager033");
    const success = !!lager && lager.outputAmount === 1000 && lager.inputs.bottle_033 === 1000;
    console[success ? "log" : "error"](
        success ? "✅ REZEPT-TEST ERFOLGREICH" : "❌ REZEPT-TEST FEHLGESCHLAGEN",
        lager
    );
    return { success, lager };
}
