import { getSessionToken } from './auth.js';
import { getPantryIngredients } from './ingredients.js';

// Client-side cache to support synchronous queries
let cachedExclusions = [];

/**
 * Gets all excluded ingredients for the current user from cache.
 * @returns {Array} List of excluded ingredient names (lowercase)
 */
export function getExcludedIngredients() {
    return cachedExclusions;
}

/**
 * Loads the user's exclusions from the server and updates the local cache.
 */
export async function loadExclusionsFromServer() {
    const token = getSessionToken();
    if (!token) {
        cachedExclusions = [];
        return;
    }

    try {
        const res = await fetch('/api/exclusions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            cachedExclusions = data;
        } else {
            console.error('Failed to load exclusions from server:', res.statusText);
        }
    } catch (err) {
        console.error('Error fetching exclusions from server:', err);
    }
}

/**
 * Excludes an ingredient on the server, then updates cache.
 * Checks for conflicts with the current pantry.
 * @param {string} name - Ingredient name to exclude
 */
export async function addExcludedIngredient(name) {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) {
        throw new Error("Excluded ingredient name cannot be empty.");
    }

    // Client-side conflict checks to prevent unnecessary requests
    if (cachedExclusions.includes(cleanName)) {
        throw new Error(`"${name}" is already in your excluded list.`);
    }

    const pantry = getPantryIngredients();
    const existsInPantry = pantry.some(item => item.name.toLowerCase() === cleanName);
    if (existsInPantry) {
        throw new Error(`Conflict detected: "${name}" is currently in your pantry! Remove it from your pantry before excluding it.`);
    }

    const token = getSessionToken();
    const res = await fetch('/api/exclusions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: cleanName })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to add exclusion.');
    }

    cachedExclusions = data;
    return cachedExclusions;
}

/**
 * Removes an ingredient from the excluded list on the server, then updates cache.
 * @param {string} name - Ingredient name
 */
export async function removeExcludedIngredient(name) {
    const cleanName = name.trim().toLowerCase();
    const token = getSessionToken();
    
    const res = await fetch(`/api/exclusions/${cleanName}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to remove exclusion.');
    }

    cachedExclusions = data;
    return cachedExclusions;
}

/**
 * Checks if a name conflicts with current exclusions.
 * @param {string} name - Ingredient name
 * @returns {boolean} True if the ingredient is excluded
 */
export function isExcluded(name) {
    const cleanName = name.trim().toLowerCase();
    return cachedExclusions.includes(cleanName);
}

/**
 * Applies exclusions, dietary restrictions, and allergen filters to a list of matched recipes.
 */
export function applyFilters(matchedRecipes, dietaryPrefs = {}, selectedAllergens = []) {
    const exclusions = getExcludedIngredients();
    const cleanAllergens = selectedAllergens.map(a => a.toLowerCase().trim()).filter(Boolean);

    return matchedRecipes.filter(({ recipe }) => {
        // 1. Excluded ingredients filter
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
        if (recipe.allergens && recipe.allergens.length > 0) {
            const hasAllergen = recipe.allergens.some(allergen => 
                cleanAllergens.includes(allergen.toLowerCase().trim())
            );
            if (hasAllergen) return false;
        }

        return true;
    });
}
