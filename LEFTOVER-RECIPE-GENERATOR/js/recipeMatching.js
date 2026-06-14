import { getAllRecipes } from './recipes.js';

/**
 * Calculates matching statistics for all recipes based on current pantry ingredients.
 * 
 * @param {Array} pantryIngredients - Array of pantry items from ingredients.js
 * @param {Array} recipesList - Optional array of recipes to match against (falls back to local)
 * @returns {Array} List of matched recipe objects sorted by compatibility
 */
export function calculateRecipeMatches(pantryIngredients, recipesList = null) {
    const recipes = recipesList || getAllRecipes();

    
    // Extract lowercased pantry ingredient names
    const pantryNames = new Set(pantryIngredients.map(item => item.name.toLowerCase().trim()));

    const matches = recipes.map(recipe => {
        const totalIngredients = recipe.ingredients;
        const matched = [];
        const missing = [];
        const substitutionsFound = [];

        totalIngredients.forEach(reqIng => {
            const reqIngLower = reqIng.toLowerCase().trim();
            
            // 1. Direct match check
            if (pantryNames.has(reqIngLower)) {
                matched.push(reqIng);
            } else {
                // 2. Check if user has a substitute in pantry
                let matchedViaSubstitute = false;
                const subText = recipe.substitutions[reqIngLower];
                
                if (subText) {
                    // Split substitute suggestion text into words/options to check if any match pantry
                    const subOptions = subText.toLowerCase().split(/\s+or\s+|\s*,\s*/);
                    for (const opt of subOptions) {
                        const cleanOpt = opt.trim();
                        if (cleanOpt && pantryNames.has(cleanOpt)) {
                            matchedViaSubstitute = true;
                            matched.push(`${reqIng} (using ${cleanOpt})`);
                            substitutionsFound.push({
                                original: reqIng,
                                substitute: cleanOpt,
                                note: `Using ${cleanOpt} instead of ${reqIng}`
                            });
                            break;
                        }
                    }
                }

                if (!matchedViaSubstitute) {
                    missing.push(reqIng);
                }
            }
        });

        // Match formula: (Matched Ingredients / Total Recipe Ingredients) * 100
        const matchedCount = matched.length;
        const totalCount = totalIngredients.length;
        const matchPercentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

        return {
            recipe,
            matchPercentage,
            matchedIngredients: matched,
            missingIngredients: missing,
            substitutionsUsed: substitutionsFound
        };
    });

    // Filter out recipes with 0% match unless pantry is empty
    let filteredMatches = matches;
    if (pantryIngredients.length > 0) {
        filteredMatches = matches.filter(m => m.matchPercentage > 0);
    }

    // Rank from highest compatibility to lowest
    // Secondary sort: alphabetical by recipe name
    filteredMatches.sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
            return b.matchPercentage - a.matchPercentage;
        }
        return a.recipe.name.localeCompare(b.recipe.name);
    });

    return filteredMatches;
}
