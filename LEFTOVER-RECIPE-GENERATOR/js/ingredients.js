import { getSessionToken } from './auth.js';

// Max items allowed in the pantry
export const MAX_PANTRY_LIMIT = 20;

// Client-side cache to support synchronous getPantryIngredients calls
let cachedPantry = [];

/**
 * Gets all pantry ingredients from the client-side memory cache.
 * @returns {Array} List of ingredients in pantry
 */
export function getPantryIngredients() {
    return cachedPantry;
}

/**
 * Loads the user's pantry ingredients from the server and updates the local cache.
 */
export async function loadPantryFromServer() {
    const token = getSessionToken();
    if (!token) {
        cachedPantry = [];
        return;
    }

    try {
        const res = await fetch('/api/pantry', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            cachedPantry = data;
        } else {
            console.error('Failed to load pantry from server:', res.statusText);
        }
    } catch (err) {
        console.error('Error fetching pantry from server:', err);
    }
}

/**
 * Adds an ingredient to the pantry on the server, then updates the cache.
 */
export async function addPantryIngredient(name, category, expiryDate) {
    const cleanName = name.trim().toLowerCase();
    const cleanCategory = category ? category.trim() : 'Vegetable';
    const cleanExpiry = expiryDate ? expiryDate.trim() : '';

    if (!cleanName) {
        throw new Error("Ingredient name cannot be empty.");
    }

    const token = getSessionToken();
    const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: cleanName, category: cleanCategory, expiryDate: cleanExpiry })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to add ingredient.');
    }

    // Add to cached list (newest first)
    cachedPantry.unshift(data);
    return data;
}

/**
 * Removes an ingredient from the pantry on the server, then updates the cache.
 */
export async function removePantryIngredient(id) {
    const token = getSessionToken();
    const res = await fetch(`/api/pantry/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to remove ingredient.');
    }

    cachedPantry = cachedPantry.filter(item => item.id !== id);
    return cachedPantry;
}

/**
 * Updates properties of a specific pantry ingredient on the server, then updates the cache.
 */
export async function updatePantryIngredient(id, updatedFields) {
    const token = getSessionToken();
    const res = await fetch(`/api/pantry/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to update ingredient.');
    }

    const idx = cachedPantry.findIndex(item => item.id === id);
    if (idx > -1) {
        cachedPantry[idx] = data;
    }
    return data;
}

/**
 * Clears all ingredients from the pantry on the server, then updates the cache.
 */
export async function clearPantry() {
    const token = getSessionToken();
    const res = await fetch('/api/pantry', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to clear pantry.');
    }

    cachedPantry = [];
    return cachedPantry;
}
