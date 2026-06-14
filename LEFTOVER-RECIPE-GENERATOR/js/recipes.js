import { recipes } from '../data/recipesData.js';

/**
 * Returns all recipes in the dataset.
 * @returns {Array} List of all recipes
 */
export function getAllRecipes() {
    return recipes;
}

/**
 * Finds a recipe by its ID.
 * @param {number|string} id - The recipe ID
 * @returns {Object|undefined} The recipe object or undefined
 */
export function getRecipeById(id) {
    // Check if it's an external recipe (stored as string like 'external_52772')
    if (typeof id === 'string' && id.startsWith('external_')) {
        // External recipes are fetched dynamically or read from cached favorites
        return undefined;
    }
    const numericId = parseInt(id, 10);
    return recipes.find(recipe => recipe.id === numericId);
}

/**
 * Searches recipes by name or category.
 * @param {string} query - The search string
 * @returns {Array} Filtered list of recipes
 */
export function searchRecipes(query) {
    if (!query) return recipes;
    const cleanQuery = query.trim().toLowerCase();
    return recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(cleanQuery) ||
        recipe.category.toLowerCase().includes(cleanQuery)
    );
}

/**
 * Converts TheMealDB API recipe payload to our local recipe schema.
 * Applies basic keyword-based heuristics to guess dietary tags and allergens.
 * 
 * @param {Object} meal - Raw meal object from TheMealDB
 * @returns {Object} Mapped recipe object
 */
export function mapTheMealDBRecipe(meal) {
    const ingredients = [];
    
    // Extract up to 20 ingredients
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        if (ing && ing.trim()) {
            ingredients.push(ing.trim().toLowerCase());
        }
    }

    // Heuristics flags
    const hasPork = ingredients.some(ing => ing.includes('pork') || ing.includes('bacon') || ing.includes('ham') || ing.includes('lard') || ing.includes('pepperoni') || ing.includes('salami') || ing.includes('prosciutto'));
    const hasAlcohol = ingredients.some(ing => ing.includes('wine') || ing.includes('beer') || ing.includes('alcohol') || ing.includes('rum') || ing.includes('brandy') || ing.includes('bourbon') || ing.includes('sherry') || ing.includes('sake') || ing.includes('cognac') || ing.includes('whiskey') || ing.includes('whisky'));
    const hasMeat = ingredients.some(ing => ing.includes('chicken') || ing.includes('beef') || ing.includes('pork') || ing.includes('lamb') || ing.includes('turkey') || ing.includes('duck') || ing.includes('meat') || ing.includes('shrimp') || ing.includes('fish') || ing.includes('salmon') || ing.includes('tuna') || ing.includes('bacon') || ing.includes('gelatin') || ing.includes('steak') || ing.includes('veal'));
    const hasDairy = ingredients.some(ing => ing.includes('milk') || ing.includes('cheese') || ing.includes('butter') || ing.includes('cream') || ing.includes('yogurt') || ing.includes('ghee') || ing.includes('parmesan') || ing.includes('mozzarella'));
    const hasEgg = ingredients.some(ing => ing.includes('egg') || ing.includes('yolk'));
    const hasGluten = ingredients.some(ing => ing.includes('flour') || ing.includes('bread') || ing.includes('pasta') || ing.includes('noodle') || ing.includes('wheat') || ing.includes('barley') || ing.includes('semolina'));
    const hasSoy = ingredients.some(ing => ing.includes('soy') || ing.includes('tofu') || ing.includes('tempeh'));
    const hasNuts = ingredients.some(ing => ing.includes('peanut') || ing.includes('almond') || ing.includes('walnut') || ing.includes('cashew') || ing.includes('hazelnut') || ing.includes('pecan') || ing.includes('pistachio') || ing.includes('nut'));
    
    // Allergen mapping
    const allergens = [];
    if (hasEgg) allergens.push('egg');
    if (hasDairy) allergens.push('dairy');
    if (hasGluten) allergens.push('gluten');
    if (hasSoy) allergens.push('soy');
    if (hasNuts) allergens.push('nuts');
    if (ingredients.some(ing => ing.includes('shrimp') || ing.includes('crab') || ing.includes('lobster') || ing.includes('fish') || ing.includes('salmon') || ing.includes('tuna') || ing.includes('prawn') || ing.includes('cod') || ing.includes('anchovy'))) {
        allergens.push('seafood');
    }

    return {
        id: `external_${meal.idMeal}`,
        name: meal.strMeal,
        category: meal.strCategory || 'Online',
        ingredients: ingredients,
        instructions: meal.strInstructions || "No instructions provided.",
        substitutions: {}, // empty substitutions by default for external API recipes
        halal: !hasPork && !hasAlcohol,
        vegetarian: !hasMeat,
        vegan: !hasMeat && !hasDairy && !hasEgg,
        glutenFree: !hasGluten,
        allergens: allergens,
        thumbnail: meal.strMealThumb
    };
}

/**
 * Fetches dynamic recipe recommendations from TheMealDB API.
 * 
 * @param {string} query - Optional search keyword
 * @param {Array} pantryIngredients - Array of pantry items to filter/lookup against
 * @returns {Promise<Array>} List of mapped recipe records
 */
export async function fetchOnlineRecipes(query = '', pantryIngredients = []) {
    const baseUrl = 'https://www.themealdb.com/api/json/v1/1';
    
    try {
        // Scenario 1: Search by text query
        if (query.trim()) {
            const res = await fetch(`${baseUrl}/search.php?s=${encodeURIComponent(query.trim())}`);
            const data = await res.json();
            if (!data.meals) return [];
            return data.meals.map(mapTheMealDBRecipe);
        }

        // Scenario 2: Find matches based on pantry ingredients
        if (pantryIngredients.length > 0) {
            // Take up to 3 pantry ingredients to search candidates from (avoid massive network requests)
            const searchPantry = pantryIngredients.slice(0, 3);
            const candidateMealIds = new Set();

            // Fetch list of candidate meals for each ingredient
            await Promise.all(searchPantry.map(async (ing) => {
                try {
                    const res = await fetch(`${baseUrl}/filter.php?i=${encodeURIComponent(ing.name)}`);
                    const data = await res.json();
                    if (data.meals) {
                        data.meals.forEach(m => candidateMealIds.add(m.idMeal));
                    }
                } catch (err) {
                    console.warn(`Failed to fetch candidate list for ingredient: ${ing.name}`, err);
                }
            }));

            if (candidateMealIds.size === 0) return [];

            // Limit candidate lookup size to top 10 to keep it highly responsive
            const topCandidates = Array.from(candidateMealIds).slice(0, 10);
            
            // Fetch recipe details in parallel for each candidate
            const mealsDetails = await Promise.all(topCandidates.map(async (id) => {
                try {
                    const res = await fetch(`${baseUrl}/lookup.php?i=${id}`);
                    const data = await res.json();
                    return data.meals ? data.meals[0] : null;
                } catch (err) {
                    console.warn(`Failed to lookup meal detail for ID: ${id}`, err);
                    return null;
                }
            }));

            return mealsDetails.filter(Boolean).map(mapTheMealDBRecipe);
        }

        // Scenario 3: Empty query and empty pantry: fetch default popular recipes list
        const res = await fetch(`${baseUrl}/search.php?s=`);
        const data = await res.json();
        if (!data.meals) return [];
        return data.meals.map(mapTheMealDBRecipe);

    } catch (error) {
        console.error("TheMealDB API fetch error:", error);
        throw new Error("Failed to fetch recipes from TheMealDB. Please check your internet connection.");
    }
}

