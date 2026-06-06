import { getCurrentUser } from './auth.js';

// Max items allowed in the pantry
export const MAX_PANTRY_LIMIT = 20;

// Helper to get storage key based on active user
function getPantryStorageKey() {
    const user = getCurrentUser();
    if (!user) return null;
    return `pantry_${user.email}`;
}

/**
 * Gets all pantry ingredients for the current logged-in user.
 * @returns {Array} List of ingredients in pantry
 */
export function getPantryIngredients() {
    const key = getPantryStorageKey();
    if (!key) return [];
    return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * Saves pantry ingredients to LocalStorage.
 * @param {Array} ingredients - List of ingredients
 */
function savePantryIngredients(ingredients) {
    const key = getPantryStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(ingredients));
}

/**
 * Adds an ingredient to the pantry.
 * @param {string} name - Ingredient name
 * @param {string} category - Category (vegetable, protein, spice, dairy, carbohydrate)
 * @param {string} expiryDate - Expiration date string (YYYY-MM-DD or empty)
 * @returns {Object} Added ingredient item
 */
export function addPantryIngredient(name, category, expiryDate) {
    const cleanName = name.trim().toLowerCase();
    const cleanCategory = category ? category.trim() : 'Vegetable';
    const cleanExpiry = expiryDate ? expiryDate.trim() : '';

    // 1. Validate empty name
    if (!cleanName) {
        throw new Error("Ingredient name cannot be empty.");
    }

    const currentPantry = getPantryIngredients();

    // 2. Validate maximum limit
    if (currentPantry.length >= MAX_PANTRY_LIMIT) {
        throw new Error(`Your pantry is full! Max limit is ${MAX_PANTRY_LIMIT} ingredients.`);
    }

    // 3. Validate duplicates (case-insensitive)
    const isDuplicate = currentPantry.some(item => item.name === cleanName);
    if (isDuplicate) {
        throw new Error(`"${name}" is already in your pantry.`);
    }

    // Create item
    const newItem = {
        id: 'ing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: cleanName,
        category: cleanCategory,
        expiryDate: cleanExpiry,
        addedDate: new Date().toISOString().split('T')[0]
    };

    currentPantry.push(newItem);
    savePantryIngredients(currentPantry);
    return newItem;
}

/**
 * Removes an ingredient from the pantry by its ID.
 * @param {string} id - The ingredient ID
 * @returns {Array} Updated list of ingredients
 */
export function removePantryIngredient(id) {
    const currentPantry = getPantryIngredients();
    const filteredPantry = currentPantry.filter(item => item.id !== id);
    savePantryIngredients(filteredPantry);
    return filteredPantry;
}

/**
 * Updates properties of a specific pantry ingredient (like expiry date or category).
 * @param {string} id - The ingredient ID
 * @param {Object} updatedFields - Fields to update (e.g. { category, expiryDate })
 * @returns {Object} Updated ingredient item
 */
export function updatePantryIngredient(id, updatedFields) {
    const currentPantry = getPantryIngredients();
    const idx = currentPantry.findIndex(item => item.id === id);
    
    if (idx === -1) {
        throw new Error("Ingredient not found in pantry.");
    }

    // Apply updates
    const item = currentPantry[idx];
    if (updatedFields.category) item.category = updatedFields.category;
    if (updatedFields.expiryDate !== undefined) item.expiryDate = updatedFields.expiryDate;

    currentPantry[idx] = item;
    savePantryIngredients(currentPantry);
    return item;
}

/**
 * Clears all ingredients from the pantry.
 * @returns {Array} Empty array
 */
export function clearPantry() {
    savePantryIngredients([]);
    return [];
}
