import { getCurrentUser } from './auth.js';
import { getPantryIngredients } from './ingredients.js';

// Helper to get storage key based on active user
function getExclusionsStorageKey() {
    const user = getCurrentUser();
    if (!user) return null;
    return `exclusions_${user.email}`;
}

/**
 * Gets all excluded ingredients for the current user.
 * @returns {Array} List of excluded ingredient names (lowercase)
 */
export function getExcludedIngredients() {
    const key = getExclusionsStorageKey();
    if (!key) return [];
    return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * Saves the excluded ingredients list to LocalStorage.
 * @param {Array} exclusions - List of excluded names
 */
function saveExcludedIngredients(exclusions) {
    const key = getExclusionsStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(exclusions));
}

/**
 * Excludes an ingredient. Checks for conflicts with the current pantry.
 * @param {string} name - Ingredient name to exclude
 */
export function addExcludedIngredient(name) {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) {
        throw new Error("Excluded ingredient name cannot be empty.");
    }

    // 1. Check if the ingredient is already in the excluded list
    const currentExclusions = getExcludedIngredients();
    if (currentExclusions.includes(cleanName)) {
        throw new Error(`"${name}" is already in your excluded list.`);
    }

    // 2. Check conflict with pantry ingredients
    const pantry = getPantryIngredients();
    const existsInPantry = pantry.some(item => item.name.toLowerCase() === cleanName);
    if (existsInPantry) {
        throw new Error(`Conflict detected: "${name}" is currently in your pantry! Remove it from your pantry before excluding it.`);
    }

    currentExclusions.push(cleanName);
    saveExcludedIngredients(currentExclusions);
    return currentExclusions;
}

/**
 * Removes an ingredient from the excluded list.
 * @param {string} name - Ingredient name
 */
export function removeExcludedIngredient(name) {
    const cleanName = name.trim().toLowerCase();
    const currentExclusions = getExcludedIngredients();
    const updatedExclusions = currentExclusions.filter(item => item !== cleanName);
    saveExcludedIngredients(updatedExclusions);
    return updatedExclusions;
}

/**
 * Clears all excluded ingredients.
 */
export function clearExcludedIngredients() {
    saveExcludedIngredients([]);
    return [];
}

/**
 * Checks if a name conflicts with current exclusions.
 * @param {string} name - Ingredient name
 * @returns {boolean} True if the ingredient is excluded
 */
export function isExcluded(name) {
    const cleanName = name.trim().toLowerCase();
    return getExcludedIngredients().includes(cleanName);
}

/**
 * Applies exclusions, dietary restrictions, and allergen filters to a list of matched recipes.
 * 
 * @param {Array} matchedRecipes - Result from calculateRecipeMatches
 * @param {Object} dietaryPrefs - { halal, vegetarian, vegan, glutenFree }
 * @param {Array} selectedAllergens - Array of allergens to avoid (e.g. ['egg', 'dairy'])
 * @returns {Array} Filtered list of matched recipes
 */
export function applyFilters(matchedRecipes, dietaryPrefs = {}, selectedAllergens = []) {
    const exclusions = getExcludedIngredients();
    const cleanAllergens = selectedAllergens.map(a => a.toLowerCase().trim()).filter(Boolean);

    return matchedRecipes.filter(({ recipe }) => {
        // 1. Excluded ingredients filter
        // If the recipe contains any ingredient that is in our exclusions list, reject it
        const hasExcluded = recipe.ingredients.some(ing => 
            exclusions.includes(ing.toLowerCase().trim())
        );
        if (hasExcluded) return false;

        // 2. Dietary preferences filter
        if (dietaryPrefs.halal && !recipe.halal) return false;
        if (dietaryPrefs.vegetarian && !recipe.vegetarian) return false;
        if (dietaryPrefs.vegan && !recipe.vegan) return false;
        if (dietaryPrefs.glutenFree && !recipe.glutenFree) return false;

        // 3. Allergens filter
        // If the recipe contains any allergen selected by the user, reject it
        if (recipe.allergens && recipe.allergens.length > 0) {
            const hasAllergen = recipe.allergens.some(allergen => 
                cleanAllergens.includes(allergen.toLowerCase().trim())
            );
            if (hasAllergen) return false;
        }

        return true;
    });
}
