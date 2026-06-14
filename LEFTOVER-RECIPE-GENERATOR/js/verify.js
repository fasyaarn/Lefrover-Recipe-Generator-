// Mock browser globals for Node.js test environment
globalThis.document = {
    addEventListener: () => {},
    dispatchEvent: () => {}
};
globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

import { calculateRecipeMatches } from './recipeMatching.js';
import { getExpirationStatus, getTodayDateString } from './expiration.js';


// Setup Mock Data for Verification
const mockPantry = [
    { name: 'rice', category: 'Carbohydrate', expiryDate: '' },
    { name: 'egg', category: 'Protein', expiryDate: '' }
];

console.log("==================================================");
console.log("RUNNING RECIPIENT ALGORITHM TESTS");
console.log("==================================================");

// Test 1: Recipe Matching Percentage Formula
// Recipe 1 (Egg Fried Rice) requires: rice, egg, garlic, soy sauce, onion (5 ingredients)
// Mock pantry contains: rice, egg (2 ingredients matched)
// Expected match: (2 / 5) * 100 = 40%
try {
    const matches = calculateRecipeMatches(mockPantry);
    const friedRiceMatch = matches.find(m => m.recipe.id === 1);
    
    if (!friedRiceMatch) {
        throw new Error("Egg Fried Rice not found in match list.");
    }
    
    console.log(`[PASS] Match Calculation: found Egg Fried Rice.`);
    console.log(`       Pantry: [rice, egg]`);
    console.log(`       Required: [rice, egg, garlic, soy sauce, onion]`);
    console.log(`       Calculated Match %: ${friedRiceMatch.matchPercentage}% (Expected: 40%)`);
    
    if (friedRiceMatch.matchPercentage !== 40) {
        throw new Error(`Formula mismatch: calculated ${friedRiceMatch.matchPercentage}% instead of 40%`);
    }
    
    // Check missing ingredients
    console.log(`       Missing ingredients: [${friedRiceMatch.missingIngredients.join(', ')}]`);
    if (friedRiceMatch.missingIngredients.length !== 3) {
        throw new Error(`Missing list mismatch: expected 3 items, got ${friedRiceMatch.missingIngredients.length}`);
    }
    console.log("[PASS] Recipe Match Percentage verification successful.");
} catch (e) {
    console.error("[FAIL] Recipe Match Percentage verification failed:", e.message);
}

console.log("--------------------------------------------------");

// Test 2: Ingredient Substitution suggestion detection
// Mock pantry contains: rice, egg, tamari (tamari is a substitute for soy sauce in Egg Fried Rice)
// Let's test if our matching calculation detects substitutions:
const mockPantryWithSub = [
    { name: 'rice', category: 'Carbohydrate', expiryDate: '' },
    { name: 'egg', category: 'Protein', expiryDate: '' },
    { name: 'tamari', category: 'Spice', expiryDate: '' }
];

try {
    const matches = calculateRecipeMatches(mockPantryWithSub);
    const friedRiceMatch = matches.find(m => m.recipe.id === 1);

    console.log(`[PASS] Substitution Match Calculation:`);
    console.log(`       Pantry: [rice, egg, tamari]`);
    console.log(`       Required: [rice, egg, garlic, soy sauce, onion]`);
    console.log(`       Calculated Match %: ${friedRiceMatch.matchPercentage}% (Expected: 60% due to tamari substitution)`);
    
    if (friedRiceMatch.matchPercentage !== 60) {
        throw new Error(`Substitution matching failed: calculated ${friedRiceMatch.matchPercentage}% instead of 60%`);
    }

    console.log(`       Substitutions used:`, friedRiceMatch.substitutionsUsed);
    if (friedRiceMatch.substitutionsUsed.length === 0) {
        throw new Error("Substitution was not detected in substitutionsUsed list.");
    }
    console.log("[PASS] Recipe Substitution detection successful.");
} catch (e) {
    console.error("[FAIL] Recipe Substitution detection failed:", e.message);
}

console.log("--------------------------------------------------");

// Test 3: Expiration status logic
// Status checks:
// - Expired: date in the past
// - Expiring Soon: today <= date <= today + 3 days
// - Fresh: otherwise
try {
    const today = new Date(getTodayDateString());
    
    // Past date
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 1);
    const pastStr = pastDate.toISOString().split('T')[0];
    const statusPast = getExpirationStatus(pastStr);
    console.log(`[PASS] Expiration Check (Past Date): ${pastStr} is classified as "${statusPast}" (Expected: Expired)`);
    if (statusPast !== 'Expired') throw new Error("Past date classification failed.");

    // Today
    const todayStr = getTodayDateString();
    const statusToday = getExpirationStatus(todayStr);
    console.log(`[PASS] Expiration Check (Today): ${todayStr} is classified as "${statusToday}" (Expected: Expiring Soon)`);
    if (statusToday !== 'Expiring Soon') throw new Error("Today classification failed.");

    // In 3 days
    const soonDate = new Date(today);
    soonDate.setDate(today.getDate() + 3);
    const soonStr = soonDate.toISOString().split('T')[0];
    const statusSoon = getExpirationStatus(soonStr);
    console.log(`[PASS] Expiration Check (In 3 Days): ${soonStr} is classified as "${statusSoon}" (Expected: Expiring Soon)`);
    if (statusSoon !== 'Expiring Soon') throw new Error("In-3-days classification failed.");

    // In 4 days
    const freshDate = new Date(today);
    freshDate.setDate(today.getDate() + 4);
    const freshStr = freshDate.toISOString().split('T')[0];
    const statusFresh = getExpirationStatus(freshStr);
    console.log(`[PASS] Expiration Check (In 4 Days): ${freshStr} is classified as "${statusFresh}" (Expected: Fresh)`);
    if (statusFresh !== 'Fresh') throw new Error("In-4-days classification failed.");

    console.log("[PASS] Expiration Status logic verification successful.");
} catch (e) {
    console.error("[FAIL] Expiration Status logic verification failed:", e.message);
}

console.log("==================================================");
console.log("VERIFICATION COMPLETED");
console.log("==================================================");
