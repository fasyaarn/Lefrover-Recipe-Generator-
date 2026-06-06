import { getCurrentUser } from './auth.js';
import { getRecipeById } from './recipes.js';

// Helper to get storage key based on active user
function getFavoritesStorageKey() {
    const user = getCurrentUser();
    if (!user) return null;
    return `favorites_${user.email}`;
}

/**
 * Gets all favorite recipe records for the current user.
 * @returns {Array} List of favorites: [{ recipeId, note, dateAdded }]
 */
export function getFavorites() {
    const key = getFavoritesStorageKey();
    if (!key) return [];
    return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * Saves favorite records to LocalStorage.
 * @param {Array} favorites - Array of favorite objects
 */
function saveFavorites(favorites) {
    const key = getFavoritesStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(favorites));
}

/**
 * Checks if a recipe is favorited.
 * @param {number|string} recipeId - The recipe ID
 * @returns {boolean} True if favorited
 */
export function isFavorite(recipeId) {
    const favorites = getFavorites();
    const id = typeof recipeId === 'string' && recipeId.startsWith('external_') ? recipeId : parseInt(recipeId, 10);
    return favorites.some(fav => fav.recipeId === id);
}

/**
 * Toggles a recipe's favorite status.
 * @param {number|string} recipeId - The recipe ID
 * @param {Object} recipeData - Full recipe object (optional, used to cache external API recipes)
 * @returns {boolean} New favorite state (true if favorited, false if removed)
 */
export function toggleFavorite(recipeId, recipeData = null) {
    const id = typeof recipeId === 'string' && recipeId.startsWith('external_') ? recipeId : parseInt(recipeId, 10);
    const favorites = getFavorites();
    const idx = favorites.findIndex(fav => fav.recipeId === id);

    if (idx > -1) {
        // Remove favorite
        favorites.splice(idx, 1);
        saveFavorites(favorites);
        return false;
    } else {
        // Add favorite
        favorites.push({
            recipeId: id,
            note: '',
            dateAdded: new Date().toISOString().split('T')[0],
            recipeData: recipeData // Cache full recipe data for online recipes
        });
        saveFavorites(favorites);
        return true;
    }
}

/**
 * Updates the custom note of a favorited recipe.
 * @param {number|string} recipeId - The recipe ID
 * @param {string} note - User's custom review or instructions note
 */
export function updateFavoriteNote(recipeId, note) {
    const id = typeof recipeId === 'string' && recipeId.startsWith('external_') ? recipeId : parseInt(recipeId, 10);
    const favorites = getFavorites();
    const idx = favorites.findIndex(fav => fav.recipeId === id);

    if (idx === -1) {
        throw new Error("Recipe is not in your favorites list.");
    }

    favorites[idx].note = note;
    saveFavorites(favorites);
    return favorites[idx];
}

/**
 * Returns a specific favorite record.
 * @param {number|string} recipeId - The recipe ID
 * @returns {Object|null} The favorite record or null
 */
export function getFavorite(recipeId) {
    const id = typeof recipeId === 'string' && recipeId.startsWith('external_') ? recipeId : parseInt(recipeId, 10);
    const favorites = getFavorites();
    return favorites.find(fav => fav.recipeId === id) || null;
}

/* ==========================================================================
   UI Event Bindings for favorites.html
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const favoritesGrid = document.getElementById('favorites-grid');
    const searchInput = document.getElementById('fav-search-input');
    const emptyState = document.getElementById('fav-empty-state');
    
    // Modal elements
    const recipeModal = document.getElementById('recipe-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCategory = document.getElementById('modal-category');
    const modalTitle = document.getElementById('modal-title');
    const modalIngredients = document.getElementById('modal-ingredients');
    const modalInstructions = document.getElementById('modal-instructions');

    if (!favoritesGrid) return; // Exit if not on favorites page

    /**
     * Renders favorite recipe list based on search criteria.
     */
    const renderFavorites = (searchQuery = '') => {
        const favorites = getFavorites();
        favoritesGrid.innerHTML = '';
        
        let favRecipes = favorites.map(fav => {
            let recipe;
            if (typeof fav.recipeId === 'string' && fav.recipeId.startsWith('external_')) {
                recipe = fav.recipeData; // Load cached external recipe data
            } else {
                recipe = getRecipeById(fav.recipeId);
            }
            return {
                recipe,
                note: fav.note,
                dateAdded: fav.dateAdded
            };
        }).filter(item => item.recipe !== undefined);


        // Filter by search bar query
        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            favRecipes = favRecipes.filter(item => 
                item.recipe.name.toLowerCase().includes(query) ||
                item.recipe.category.toLowerCase().includes(query)
            );
        }

        // Handle empty grid
        if (favRecipes.length === 0) {
            favoritesGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        favoritesGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // Render card for each bookmarked recipe
        favRecipes.forEach(({ recipe, note }) => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.dataset.id = recipe.id;

            // Card Header
            const header = document.createElement('div');
            header.className = 'recipe-card-header';
            
            const categoryBadge = document.createElement('span');
            categoryBadge.className = 'recipe-card-category';
            categoryBadge.textContent = recipe.category;

            const favBtn = document.createElement('button');
            favBtn.className = 'recipe-card-favorite-btn favorited';
            favBtn.innerHTML = '❤️';
            favBtn.title = 'Remove from favorites';
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(recipe.id);
                renderFavorites(searchInput.value);
            });

            header.appendChild(categoryBadge);
            header.appendChild(favBtn);

            // Card Body
            const body = document.createElement('div');
            body.className = 'recipe-card-body';

            const title = document.createElement('h3');
            title.className = 'recipe-card-title';
            title.textContent = recipe.name;

            // Dietary badges
            const dietContainer = document.createElement('div');
            dietContainer.className = 'recipe-dietary-badges';
            if (recipe.halal) dietContainer.innerHTML += `<span class="badge-diet halal">Halal</span>`;
            if (recipe.vegetarian) dietContainer.innerHTML += `<span class="badge-diet vegetarian">Veg</span>`;
            if (recipe.vegan) dietContainer.innerHTML += `<span class="badge-diet vegan">Vegan</span>`;
            if (recipe.glutenFree) dietContainer.innerHTML += `<span class="badge-diet glutenfree">GF</span>`;

            // Personal note textbox
            const noteBox = document.createElement('div');
            noteBox.className = 'recipe-note-box';
            
            const noteLabel = document.createElement('label');
            noteLabel.className = 'form-group';
            noteLabel.style.fontWeight = '600';
            noteLabel.style.fontSize = '0.75rem';
            noteLabel.style.color = 'var(--text-muted)';
            noteLabel.style.marginBottom = '0.2rem';
            noteLabel.textContent = 'My Kitchen Notes:';

            const textarea = document.createElement('textarea');
            textarea.className = 'recipe-note-textarea';
            textarea.placeholder = 'Add cooking notes (e.g., brand of pasta, spice adjustments, family feedback...)';
            textarea.value = note || '';

            const noteStatus = document.createElement('span');
            noteStatus.style.fontSize = '0.7rem';
            noteStatus.style.color = 'var(--accent-hover)';
            noteStatus.style.fontWeight = '600';
            noteStatus.style.display = 'block';
            noteStatus.style.marginTop = '0.2rem';
            noteStatus.style.minHeight = '14px';

            // Auto-save typing debouncer
            let saveTimeout;
            textarea.addEventListener('input', () => {
                noteStatus.textContent = 'Typing...';
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    updateFavoriteNote(recipe.id, textarea.value);
                    noteStatus.textContent = 'Saved!';
                    setTimeout(() => {
                        if (noteStatus.textContent === 'Saved!') noteStatus.textContent = '';
                    }, 1500);
                }, 800);
            });

            // Fallback save on blur
            textarea.addEventListener('blur', () => {
                updateFavoriteNote(recipe.id, textarea.value);
                noteStatus.textContent = 'Saved!';
                setTimeout(() => {
                    if (noteStatus.textContent === 'Saved!') noteStatus.textContent = '';
                }, 1500);
            });

            noteBox.appendChild(noteLabel);
            noteBox.appendChild(textarea);
            noteBox.appendChild(noteStatus);

            // Instructions details trigger button
            const viewInstructionsBtn = document.createElement('button');
            viewInstructionsBtn.className = 'btn btn-secondary btn-block btn-sm';
            viewInstructionsBtn.style.marginTop = '0.8rem';
            viewInstructionsBtn.textContent = 'View Instructions';
            viewInstructionsBtn.addEventListener('click', () => {
                openRecipeModal(recipe);
            });

            body.appendChild(title);
            body.appendChild(dietContainer);
            body.appendChild(noteBox);
            body.appendChild(viewInstructionsBtn);

            card.appendChild(header);
            card.appendChild(body);
            favoritesGrid.appendChild(card);
        });
    };

    /**
     * Opens details modal populated with recipe instructions.
     */
    const openRecipeModal = (recipe) => {
        modalCategory.textContent = recipe.category;
        modalTitle.textContent = recipe.name;

        // Render standard ingredients list
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

    // Modal close hooks
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

    // Search input listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderFavorites(e.target.value);
        });
    }

    // Run initial rendering
    renderFavorites();
});

