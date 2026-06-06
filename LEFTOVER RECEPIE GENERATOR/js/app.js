import { getCurrentUser } from './auth.js';
import { getPantryIngredients, addPantryIngredient, removePantryIngredient, clearPantry, MAX_PANTRY_LIMIT } from './ingredients.js';
import { calculateRecipeMatches } from './recipeMatching.js';
import { getExcludedIngredients, addExcludedIngredient, removeExcludedIngredient, applyFilters, isExcluded } from './filters.js';
import { getActiveNotifications, prioritizeExpiringRecipes, getExpirationStatus } from './expiration.js';
import { toggleFavorite, isFavorite } from './favorites.js';
import { fetchOnlineRecipes } from './recipes.js';


// Common Quick Add ingredients dataset
const commonIngredients = [
    { name: 'chicken', category: 'Protein' },
    { name: 'beef', category: 'Protein' },
    { name: 'egg', category: 'Protein' },
    { name: 'tofu', category: 'Protein' },
    { name: 'shrimp', category: 'Protein' },
    { name: 'tomato', category: 'Vegetable' },
    { name: 'onion', category: 'Vegetable' },
    { name: 'garlic', category: 'Vegetable' },
    { name: 'spinach', category: 'Vegetable' },
    { name: 'broccoli', category: 'Vegetable' },
    { name: 'carrot', category: 'Vegetable' },
    { name: 'bell pepper', category: 'Vegetable' },
    { name: 'mushroom', category: 'Vegetable' },
    { name: 'potato', category: 'Vegetable' },
    { name: 'chili', category: 'Spice' },
    { name: 'ginger', category: 'Spice' },
    { name: 'salt', category: 'Spice' },
    { name: 'black pepper', category: 'Spice' },
    { name: 'milk', category: 'Dairy' },
    { name: 'cheese', category: 'Dairy' },
    { name: 'butter', category: 'Dairy' },
    { name: 'rice', category: 'Carbohydrate' },
    { name: 'pasta', category: 'Carbohydrate' },
    { name: 'bread', category: 'Carbohydrate' },
    { name: 'noodle', category: 'Carbohydrate' },
    { name: 'oats', category: 'Carbohydrate' }
];

document.addEventListener('DOMContentLoaded', () => {
    // DOM Bindings: Pantry
    const pantryForm = document.getElementById('pantry-form');
    const pantryInputName = document.getElementById('pantry-input-name');
    const pantrySelectCat = document.getElementById('pantry-select-cat');
    const pantryInputExpiry = document.getElementById('pantry-input-expiry');
    const pantryTagsContainer = document.getElementById('pantry-tags-container');
    const pantryCountEl = document.getElementById('pantry-count');
    const pantryClearAllBtn = document.getElementById('pantry-clear-all');
    const pantryFeedbackEl = document.getElementById('pantry-feedback');
    const quickAddContainer = document.getElementById('quick-add-pills');

    // DOM Bindings: Exclusions
    const excludeForm = document.getElementById('exclude-form');
    const excludeInputName = document.getElementById('exclude-input-name');
    const excludePillsContainer = document.getElementById('exclude-pills-container');
    const excludeFeedbackEl = document.getElementById('exclude-feedback');

    // DOM Bindings: Filters & Sorting
    const searchInput = document.getElementById('recipe-search');
    const sortSelect = document.getElementById('recipe-sort');
    const expiryBanner = document.getElementById('expiry-alert-banner');
    const expiryPriorityBtn = document.getElementById('expiry-priority-btn');

    // DOM Bindings: Recipe Grid
    const recipesGrid = document.getElementById('recipes-display-grid');
    const emptyState = document.getElementById('recipe-empty-state');
    const emptyIcon = document.getElementById('recipe-empty-icon');
    const emptyTitle = document.getElementById('recipe-empty-title');
    const emptyMsg = document.getElementById('recipe-empty-msg');

    // DOM Bindings: Modal
    const recipeModal = document.getElementById('recipe-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCategory = document.getElementById('modal-category');
    const modalTitle = document.getElementById('modal-title');
    const modalIngredients = document.getElementById('modal-ingredients');
    const modalInstructions = document.getElementById('modal-instructions');

    if (!pantryForm) return; // Exit if not on home/dashboard page

    // 1. Initialize user dietary/allergen checkbox defaults saved in profile
    const user = getCurrentUser();
    if (user) {
        document.getElementById('filter-halal').checked = !!user.preferences.halal;
        document.getElementById('filter-vegetarian').checked = !!user.preferences.vegetarian;
        document.getElementById('filter-vegan').checked = !!user.preferences.vegan;
        document.getElementById('filter-glutenfree').checked = !!user.preferences.glutenFree;
        
        const allergyCheckboxes = document.querySelectorAll('input[name="filter-allergy"]');
        allergyCheckboxes.forEach(cb => {
            if (user.allergens.includes(cb.value.toLowerCase())) {
                cb.checked = true;
            }
        });
    }

    // DOM Bindings: Filters & Sorting (Source select added)
    const sourceSelect = document.getElementById('recipe-source');

    /**
     * Refreshes the recommendation feed based on current pantry list, filters, and sort options.
     */
    const refreshRecipes = async () => {
        const pantry = getPantryIngredients();
        const source = sourceSelect ? sourceSelect.value : 'local';

        // 1. Show loading spinner if fetching from external API
        if (source === 'themealdb') {
            recipesGrid.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Fetching gourmet recipes from TheMealDB...</p>
                </div>
            `;
            recipesGrid.classList.remove('hidden');
            emptyState.classList.add('hidden');
        }

        // 2. Fetch recipe collection
        let recipesList = [];
        if (source === 'local') {
            const { getAllRecipes } = await import('./recipes.js');
            recipesList = getAllRecipes();
        } else {
            try {
                const query = searchInput ? searchInput.value : '';
                recipesList = await fetchOnlineRecipes(query, pantry);
            } catch (err) {
                recipesGrid.classList.add('hidden');
                emptyState.classList.remove('hidden');
                emptyIcon.textContent = '❌';
                emptyTitle.textContent = "Connection Error";
                emptyMsg.textContent = err.message;
                return;
            }
        }

        // 3. Calculate base matching compatibility scores
        let matches = calculateRecipeMatches(pantry, recipesList);

        // 4. Secondary client filter (only for local database search)
        const searchQuery = searchInput.value.trim().toLowerCase();
        if (searchQuery && source === 'local') {
            matches = matches.filter(({ recipe }) => 
                recipe.name.toLowerCase().includes(searchQuery) ||
                recipe.category.toLowerCase().includes(searchQuery)
            );
        }

        // 5. Extract dietary check toggles
        const dietaryPrefs = {
            halal: document.getElementById('filter-halal').checked,
            vegetarian: document.getElementById('filter-vegetarian').checked,
            vegan: document.getElementById('filter-vegan').checked,
            glutenFree: document.getElementById('filter-glutenfree').checked
        };

        // 6. Extract active allergen checkboxes
        const allergenCbs = document.querySelectorAll('input[name="filter-allergy"]:checked');
        const selectedAllergens = Array.from(allergenCbs).map(cb => cb.value);

        // 7. Apply exclusion items, dietary rules, and allergen filters
        matches = applyFilters(matches, dietaryPrefs, selectedAllergens);

        // 8. Apply Sorting algorithms
        const sortVal = sortSelect.value;
        if (sortVal === 'expiring') {
            matches = prioritizeExpiringRecipes(matches);
        } else if (sortVal === 'alpha') {
            matches.sort((a, b) => a.recipe.name.localeCompare(b.recipe.name));
        }

        // 9. Handle empty result state
        if (matches.length === 0) {
            recipesGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            
            if (pantry.length === 0 && source === 'local') {
                emptyIcon.textContent = '🥬';
                emptyTitle.textContent = "Your Pantry is Empty";
                emptyMsg.textContent = "Add ingredients to your pantry list or click 'Quick Add' pills below to see recipe suggestions.";
            } else {
                emptyIcon.textContent = '🔍';
                emptyTitle.textContent = "No Recipes Found";
                emptyMsg.textContent = source === 'local' 
                    ? "No recipes fit your active search or filters. Try adjusting dietary flags, removing exclusions, or searching for other dishes."
                    : "TheMealDB has no recipes matching your query or pantry ingredients that fit your dietary filters. Adjust your filters or query.";
            }
            return;
        }

        // 10. Render grid elements
        emptyState.classList.add('hidden');
        recipesGrid.classList.remove('hidden');
        recipesGrid.innerHTML = '';

        matches.forEach(({ recipe, matchPercentage, matchedIngredients, missingIngredients }) => {
            const card = document.createElement('div');
            card.className = 'recipe-card';

            // Card Header
            const cardHeader = document.createElement('div');
            cardHeader.className = 'recipe-card-header';

            // If recipe has an image, use it as card header background (premium visual touch!)
            if (recipe.thumbnail) {
                cardHeader.style.backgroundImage = `url(${recipe.thumbnail})`;
                cardHeader.style.backgroundSize = 'cover';
                cardHeader.style.backgroundPosition = 'center';
            }
            
            const categoryBadge = document.createElement('span');
            categoryBadge.className = 'recipe-card-category';
            categoryBadge.textContent = recipe.category;

            // Heart favorite icon toggle button
            const favBtn = document.createElement('button');
            const favorited = isFavorite(recipe.id);
            favBtn.className = `recipe-card-favorite-btn ${favorited ? 'favorited' : ''}`;
            favBtn.innerHTML = favorited ? '❤️' : '🤍';
            favBtn.title = favorited ? 'Remove from favorites' : 'Save to favorites';
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Pass full recipe metadata so it caches properly for online items
                const nowFav = toggleFavorite(recipe.id, recipe);
                favBtn.className = `recipe-card-favorite-btn ${nowFav ? 'favorited' : ''}`;
                favBtn.innerHTML = nowFav ? '❤️' : '🤍';
                favBtn.title = nowFav ? 'Remove from favorites' : 'Save to favorites';
            });

            // Match percentage circle
            const pctEl = document.createElement('div');
            pctEl.className = 'recipe-card-percentage';
            if (matchPercentage >= 70) pctEl.classList.add('high-match');
            pctEl.textContent = `${matchPercentage}%`;
            pctEl.title = `Compatibility score: ${matchPercentage}%`;

            cardHeader.appendChild(categoryBadge);
            cardHeader.appendChild(favBtn);
            cardHeader.appendChild(pctEl);

            // Card Body
            const cardBody = document.createElement('div');
            cardBody.className = 'recipe-card-body';

            const title = document.createElement('h3');
            title.className = 'recipe-card-title';
            title.textContent = recipe.name;

            // Dietary flags row
            const badgesRow = document.createElement('div');
            badgesRow.className = 'recipe-dietary-badges';
            if (recipe.halal) badgesRow.innerHTML += `<span class="badge-diet halal">Halal</span>`;
            if (recipe.vegetarian) badgesRow.innerHTML += `<span class="badge-diet vegetarian">Vegetarian</span>`;
            if (recipe.vegan) badgesRow.innerHTML += `<span class="badge-diet vegan">Vegan</span>`;
            if (recipe.glutenFree) badgesRow.innerHTML += `<span class="badge-diet glutenfree">Gluten-Free</span>`;

            // Ingredient match highlight list
            const ingStatusBox = document.createElement('div');
            ingStatusBox.className = 'recipe-card-ing-status';

            // Matched display list
            const matchedLabel = document.createElement('div');
            matchedLabel.className = 'label';
            matchedLabel.textContent = `Matched (${matchedIngredients.length}):`;
            
            const matchedUl = document.createElement('ul');
            matchedUl.className = 'recipe-card-ing-list';
            if (matchedIngredients.length === 0) {
                matchedUl.innerHTML = '<li class="missing-item" style="list-style:none; font-style:italic;">None</li>';
            } else {
                matchedIngredients.forEach(ing => {
                    const li = document.createElement('li');
                    li.className = 'matched-item';
                    li.textContent = ing;
                    matchedUl.appendChild(li);
                });
            }

            // Missing display list (with substitution help)
            const missingLabel = document.createElement('div');
            missingLabel.className = 'label';
            missingLabel.textContent = `Missing (${missingIngredients.length}):`;
            
            const missingUl = document.createElement('ul');
            missingUl.className = 'recipe-card-ing-list';
            if (missingIngredients.length === 0) {
                missingUl.innerHTML = '<li class="matched-item" style="list-style:none; font-style:italic;">None</li>';
            } else {
                missingIngredients.forEach(ing => {
                    const li = document.createElement('li');
                    li.className = 'missing-item';
                    li.textContent = ing;

                    // Search substitutions dataset for alternative recommendations
                    const substitution = recipe.substitutions ? recipe.substitutions[ing.toLowerCase().trim()] : null;
                    if (substitution) {
                        const subTip = document.createElement('span');
                        subTip.className = 'substitution-suggestion';
                        subTip.textContent = `💡 Try: ${substitution}`;
                        li.appendChild(subTip);
                    }
                    missingUl.appendChild(li);
                });
            }

            ingStatusBox.appendChild(matchedLabel);
            ingStatusBox.appendChild(matchedUl);
            ingStatusBox.appendChild(missingLabel);
            ingStatusBox.appendChild(missingUl);

            // Action Button
            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'btn btn-secondary btn-block btn-sm';
            detailsBtn.textContent = 'View Full Recipe';
            detailsBtn.addEventListener('click', () => {
                openRecipeDetailsModal(recipe);
            });

            cardBody.appendChild(title);
            cardBody.appendChild(badgesRow);
            cardBody.appendChild(ingStatusBox);
            cardBody.appendChild(detailsBtn);

            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            recipesGrid.appendChild(card);
        });
    };


    /**
     * Re-renders the pantry list items and triggers recipe updates.
     */
    const renderPantry = () => {
        const ingredients = getPantryIngredients();
        pantryTagsContainer.innerHTML = '';
        
        // Update counts
        pantryCountEl.textContent = `${ingredients.length}/${MAX_PANTRY_LIMIT} Items`;

        // Clear All Toggle
        if (ingredients.length > 0) {
            pantryClearAllBtn.classList.remove('hidden');
        } else {
            pantryClearAllBtn.classList.add('hidden');
        }

        // Render each pill
        ingredients.forEach(item => {
            const tag = document.createElement('div');
            tag.className = `tag-item tag-${item.category.toLowerCase()}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;
            tag.appendChild(nameSpan);

            // Add expiration status coloring to tag pill
            if (item.expiryDate) {
                const status = getExpirationStatus(item.expiryDate);
                const expirySpan = document.createElement('span');
                expirySpan.className = 'tag-expiry-badge';
                expirySpan.textContent = item.expiryDate;
                
                if (status === 'Expired') {
                    expirySpan.style.color = 'white';
                    expirySpan.style.backgroundColor = 'var(--expired)';
                } else if (status === 'Expiring Soon') {
                    expirySpan.style.color = 'black';
                    expirySpan.style.backgroundColor = 'var(--expiring)';
                }
                tag.appendChild(expirySpan);
            }

            // Remove trigger
            const removeBtn = document.createElement('button');
            removeBtn.className = 'tag-remove-btn';
            removeBtn.innerHTML = '✕';
            removeBtn.title = `Delete ${item.name}`;
            removeBtn.addEventListener('click', () => {
                removePantryIngredient(item.id);
                
                // Let other components know (nav notification badge)
                document.dispatchEvent(new CustomEvent('pantryUpdated'));
                
                renderPantry();
                updateQuickAddSelectionState();
                checkExpiringAlertBanner();
                refreshRecipes();
            });

            tag.appendChild(removeBtn);
            pantryTagsContainer.appendChild(tag);
        });
    };

    /**
     * Builds and updates the Quick Add ingredients menu pills.
     */
    const buildQuickAddMenu = () => {
        quickAddContainer.innerHTML = '';
        commonIngredients.forEach(item => {
            const pill = document.createElement('button');
            pill.className = 'quick-add-pill';
            pill.textContent = `+ ${item.name}`;
            pill.title = `Category: ${item.category}`;
            pill.dataset.name = item.name;
            
            pill.addEventListener('click', () => {
                const pantry = getPantryIngredients();
                const existing = pantry.find(ing => ing.name === item.name.toLowerCase());
                
                pantryFeedbackEl.className = 'feedback-message';
                pantryFeedbackEl.textContent = '';

                if (existing) {
                    // Remove if already exists (acts as toggle)
                    removePantryIngredient(existing.id);
                    document.dispatchEvent(new CustomEvent('pantryUpdated'));
                    renderPantry();
                    updateQuickAddSelectionState();
                    checkExpiringAlertBanner();
                    refreshRecipes();
                } else {
                    // Check conflicts with Exclude filters
                    if (isExcluded(item.name)) {
                        pantryFeedbackEl.textContent = `Conflict: "${item.name}" is currently in your excluded list! Remove it from exclusions before adding it to pantry.`;
                        pantryFeedbackEl.classList.add('error');
                        return;
                    }

                    try {
                        addPantryIngredient(item.name, item.category, '');
                        document.dispatchEvent(new CustomEvent('pantryUpdated'));
                        renderPantry();
                        updateQuickAddSelectionState();
                        checkExpiringAlertBanner();
                        refreshRecipes();
                    } catch (err) {
                        pantryFeedbackEl.textContent = err.message;
                        pantryFeedbackEl.classList.add('error');
                    }
                }
            });

            quickAddContainer.appendChild(pill);
        });
        updateQuickAddSelectionState();
    };

    /**
     * Highlights Quick Add pills if the ingredient is active in the pantry.
     */
    const updateQuickAddSelectionState = () => {
        const pantry = getPantryIngredients();
        const pantryNames = new Set(pantry.map(ing => ing.name));
        
        const pills = quickAddContainer.querySelectorAll('.quick-add-pill');
        pills.forEach(pill => {
            const name = pill.dataset.name.toLowerCase();
            if (pantryNames.has(name)) {
                pill.classList.add('selected');
                pill.textContent = `✓ ${name}`;
            } else {
                pill.classList.remove('selected');
                pill.textContent = `+ ${name}`;
            }
        });
    };

    /**
     * Checks if any ingredients are expiring soon or expired, toggling alert banner.
     */
    const checkExpiringAlertBanner = () => {
        const notifications = getActiveNotifications();
        if (notifications.length > 0) {
            expiryBanner.classList.remove('hidden');
        } else {
            expiryBanner.classList.add('hidden');
        }
    };

    // Form Event: Add Pantry Item
    pantryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = pantryInputName.value;
        const category = pantrySelectCat.value;
        const expiryDate = pantryInputExpiry.value;

        pantryFeedbackEl.className = 'feedback-message';
        pantryFeedbackEl.textContent = '';

        // Check exclusions conflict
        if (isExcluded(name)) {
            pantryFeedbackEl.textContent = `Conflict: "${name}" is currently in your excluded list! Remove it from exclusions before adding it to pantry.`;
            pantryFeedbackEl.classList.add('error');
            return;
        }

        try {
            addPantryIngredient(name, category, expiryDate);
            pantryInputName.value = '';
            pantryInputExpiry.value = '';
            
            document.dispatchEvent(new CustomEvent('pantryUpdated'));
            renderPantry();
            updateQuickAddSelectionState();
            checkExpiringAlertBanner();
            refreshRecipes();
        } catch (err) {
            pantryFeedbackEl.textContent = err.message;
            pantryFeedbackEl.classList.add('error');
        }
    });

    // Button Event: Clear All Pantry
    pantryClearAllBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all pantry ingredients?")) {
            clearPantry();
            document.dispatchEvent(new CustomEvent('pantryUpdated'));
            renderPantry();
            updateQuickAddSelectionState();
            checkExpiringAlertBanner();
            refreshRecipes();
        }
    });

    /**
     * Renders excluded list pills.
     */
    const renderExclusions = () => {
        const exclusions = getExcludedIngredients();
        excludePillsContainer.innerHTML = '';

        exclusions.forEach(name => {
            const pill = document.createElement('span');
            pill.className = 'exclude-tag';
            pill.textContent = name;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'tag-remove-btn';
            removeBtn.style.fontSize = '0.75rem';
            removeBtn.innerHTML = '✕';
            removeBtn.addEventListener('click', () => {
                removeExcludedIngredient(name);
                renderExclusions();
                refreshRecipes();
            });

            pill.appendChild(removeBtn);
            excludePillsContainer.appendChild(pill);
        });
    };

    // Form Event: Exclude Ingredient
    excludeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = excludeInputName.value;
        excludeFeedbackEl.className = 'feedback-message';
        excludeFeedbackEl.textContent = '';

        try {
            addExcludedIngredient(name);
            excludeInputName.value = '';
            renderExclusions();
            refreshRecipes();
        } catch (err) {
            excludeFeedbackEl.textContent = err.message;
            excludeFeedbackEl.classList.add('error');
        }
    });

    /**
     * Launches Details Modal populated with instructions.
     */
    const openRecipeDetailsModal = (recipe) => {
        modalCategory.textContent = recipe.category;
        modalTitle.textContent = recipe.name;

        // Render ingredients bullet list
        modalIngredients.innerHTML = '';
        recipe.ingredients.forEach(ing => {
            const li = document.createElement('li');
            li.textContent = ing;
            li.style.textTransform = 'capitalize';
            modalIngredients.appendChild(li);
        });

        // Instructions
        modalInstructions.textContent = recipe.instructions;

        recipeModal.classList.add('show');
    };

    // Modal Close event
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            recipeModal.classList.remove('show');
        });
    }

    if (recipeModal) {
        recipeModal.addEventListener('click', (e) => {
            if (e.target === recipeModal) {
                recipeModal.classList.remove('show');
            }
        });
    }

    // Filter change listeners
    document.getElementById('filter-halal').addEventListener('change', refreshRecipes);
    document.getElementById('filter-vegetarian').addEventListener('change', refreshRecipes);
    document.getElementById('filter-vegan').addEventListener('change', refreshRecipes);
    document.getElementById('filter-glutenfree').addEventListener('change', refreshRecipes);

    const filterAllergyCheckboxes = document.querySelectorAll('input[name="filter-allergy"]');
    filterAllergyCheckboxes.forEach(cb => {
        cb.addEventListener('change', refreshRecipes);
    });

    // Search and sort listeners
    if (searchInput) {
        searchInput.addEventListener('input', refreshRecipes);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', refreshRecipes);
    }
    if (sourceSelect) {
        sourceSelect.addEventListener('change', refreshRecipes);
    }

    // Prioritize Expiration button
    if (expiryPriorityBtn) {
        expiryPriorityBtn.addEventListener('click', () => {
            sortSelect.value = 'expiring';
            refreshRecipes();
            // Scroll down to recipe feed
            recipesGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // Listen for notification updates to refresh alert banner
    document.addEventListener('notificationsUpdated', () => {
        checkExpiringAlertBanner();
        refreshRecipes();
    });

    // Check query params or session variables for redirections (e.g. from Expiration tracker)
    const priorityIng = sessionStorage.getItem('priorityIngredient');
    if (priorityIng) {
        sessionStorage.removeItem('priorityIngredient');
        searchInput.value = priorityIng;
        searchInput.focus();
    }

    // Run startup renders
    renderPantry();
    buildQuickAddMenu();
    renderExclusions();
    checkExpiringAlertBanner();
    refreshRecipes();
});
