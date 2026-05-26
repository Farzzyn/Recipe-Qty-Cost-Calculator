/**
 * Normalizes a quantity from one unit to another (e.g., g to kg, ml to l).
 * Returns the quantity converted to the target unit.
 */
export function normalizeQuantityToUnit(qty, fromUnit, toUnit) {
  if (!fromUnit || !toUnit) return parseFloat(qty);
  
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  const parsedQty = parseFloat(qty);
  
  if (from === to || isNaN(parsedQty)) return parsedQty;
  
  // Weight conversions
  const weightUnits = {
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 1000,
    'kilogram': 1000,
    'kilograms': 1000,
    'mg': 0.001,
    'milligram': 0.001,
    'milligrams': 0.001
  };
  
  // Volume conversions
  const volumeUnits = {
    'ml': 1,
    'milliliter': 1,
    'milliliters': 1,
    'l': 1000,
    'liter': 1000,
    'liters': 1000,
    'tsp': 5, // approx 5ml
    'teaspoon': 5,
    'tbsp': 15, // approx 15ml
    'tablespoon': 15,
    'cup': 240, // approx 240ml
    'cups': 240
  };
  
  // Convert Weight
  if (weightUnits[from] && weightUnits[to]) {
    // Convert to base unit (grams), then to target
    const inGrams = parsedQty * weightUnits[from];
    return inGrams / weightUnits[to];
  }
  
  // Convert Volume
  if (volumeUnits[from] && volumeUnits[to]) {
    // Convert to base unit (ml), then to target
    const inMl = parsedQty * volumeUnits[from];
    return inMl / volumeUnits[to];
  }
  
  // If units are incompatible (e.g. g to ml) or unknown, fallback to raw quantity
  // In a more advanced version, we could use density, but this suffices for MVP
  return parsedQty;
}

/**
 * Calculates the scaled quantity of an ingredient based on the new required output.
 * 
 * Formula:
 * Scaled Quantity = (Original Ingredient Quantity / Original Output Quantity) * New Output Quantity
 */
export function calculateScaledQuantity(ingredientQty, originalOutput, newOutput) {
  if (!originalOutput || originalOutput <= 0) return 0;
  return (parseFloat(ingredientQty) / parseFloat(originalOutput)) * parseFloat(newOutput);
}

/**
 * Calculates the cost of the ingredient used, normalizing units if necessary.
 * 
 * Formula:
 * Ingredient Cost = (Normalized Used Quantity / Purchase Quantity) * Purchase Price
 */
export function calculateIngredientCost(usedQty, purchaseQty, purchasePrice, recipeUnit = '', purchaseUnit = '') {
  if (!purchaseQty || purchaseQty <= 0) return 0;
  
  // Normalize the used quantity to match the purchase unit
  const normalizedUsedQty = normalizeQuantityToUnit(usedQty, recipeUnit, purchaseUnit);
  
  return (normalizedUsedQty / parseFloat(purchaseQty)) * parseFloat(purchasePrice);
}

/**
 * Calculates the total cost of all ingredients.
 */
export function calculateTotalBatchCost(ingredients) {
  return ingredients.reduce((total, ing) => total + (parseFloat(ing.calculatedCost) || 0), 0);
}

/**
 * Smartly formats a scaled quantity and its unit for better readability.
 * E.g. 0.074 kg -> 74 g
 * E.g. 3704 g -> 3.704 kg
 */
export function formatScaledQuantityWithUnit(qty, unit) {
  let value = parseFloat(qty);
  let newUnit = unit ? unit.toLowerCase().trim() : '';

  if (isNaN(value)) return { value: qty, unit };

  // Weight
  if ((newUnit === 'kg' || newUnit === 'kilogram' || newUnit === 'kilograms') && value > 0 && value < 1) {
    value = value * 1000;
    newUnit = 'g';
  } else if ((newUnit === 'g' || newUnit === 'gram' || newUnit === 'grams') && value >= 1000) {
    value = value / 1000;
    newUnit = 'kg';
  }
  
  // Volume
  else if ((newUnit === 'l' || newUnit === 'liter' || newUnit === 'liters') && value > 0 && value < 1) {
    value = value * 1000;
    newUnit = 'ml';
  } else if ((newUnit === 'ml' || newUnit === 'milliliter' || newUnit === 'milliliters') && value >= 1000) {
    value = value / 1000;
    newUnit = 'l';
  }

  // Ensure 'l' is shown correctly, often written as 'L' or kept lowercase depending on preference, we will keep original case or sensible default
  if (newUnit === 'l') newUnit = 'L'; // Small polish for liters
  
  return { value, unit: newUnit };
}
