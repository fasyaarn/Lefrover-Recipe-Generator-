import { getCurrentUser } from './auth.js';
import { loadPantryFromServer, getPantryIngredients, removePantryIngredient, updatePantryIngredient } from './ingredients.js';

// Helper to get today's date in YYYY-MM-DD local format
export function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates status of an ingredient based on its expiration date.
 * 
 * @param {string} expiryDate - Expiration date string (YYYY-MM-DD)
 * @returns {string} 'Expired', 'Expiring Soon', or 'Fresh'
 */
export function getExpirationStatus(expiryDate) {
    if (!expiryDate) return 'Fresh';

    const todayStr = getTodayDateString();
    if (expiryDate < todayStr) {
        return 'Expired';
    }

    // Calculate difference in days
    const today = new Date(todayStr);
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
        return 'Expiring Soon';
    }

    return 'Fresh';
}

/**
 * Returns a summary of the pantry expiration list categorized by status.
 * Used in the expiration manager dashboard.
 */
export function getPantryExpirationSummary() {
    const pantry = getPantryIngredients();
    const summary = {
        expired: [],
        expiringSoon: [],
        fresh: [],
        all: []
    };

    pantry.forEach(item => {
        const status = getExpirationStatus(item.expiryDate);
        const itemWithStatus = { ...item, status };
        
        summary.all.push(itemWithStatus);
        if (status === 'Expired') {
            summary.expired.push(itemWithStatus);
        } else if (status === 'Expiring Soon') {
            summary.expiringSoon.push(itemWithStatus);
        } else {
            summary.fresh.push(itemWithStatus);
        }
    });

    return summary;
}

// Helper for notifications localStorage key
function getNotificationsStorageKey() {
    const user = getCurrentUser();
    if (!user) return null;
    return `notifications_${user.email}`;
}

/**
 * Gets the list of dismissed notification IDs.
 */
export function getDismissedNotifications() {
    const key = getNotificationsStorageKey();
    if (!key) return [];
    return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * Dismisses a notification for a specific ingredient status.
 * @param {string} id - The notification ID (usually ingredientId_status)
 */
export function dismissNotification(id) {
    const key = getNotificationsStorageKey();
    if (!key) return;
    const dismissed = getDismissedNotifications();
    if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem(key, JSON.stringify(dismissed));
    }
}

/**
 * Reset dismissed notifications.
 */
export function resetDismissedNotifications() {
    const key = getNotificationsStorageKey();
    if (key) localStorage.removeItem(key);
}

/**
 * Returns active, non-dismissed alerts for the notification center.
 */
export function getActiveNotifications() {
    const pantry = getPantryIngredients();
    const dismissed = getDismissedNotifications();
    const notifications = [];

    pantry.forEach(item => {
        if (!item.expiryDate) return;

        const status = getExpirationStatus(item.expiryDate);
        if (status === 'Expired') {
            const notifId = `${item.id}_expired`;
            if (!dismissed.includes(notifId)) {
                notifications.push({
                    id: notifId,
                    ingredientId: item.id,
                    name: item.name,
                    expiryDate: item.expiryDate,
                    status: 'Expired',
                    message: `"${item.name}" has expired! (Date: ${item.expiryDate})`
                });
            }
        } else if (status === 'Expiring Soon') {
            const notifId = `${item.id}_expiring`;
            if (!dismissed.includes(notifId)) {
                notifications.push({
                    id: notifId,
                    ingredientId: item.id,
                    name: item.name,
                    expiryDate: item.expiryDate,
                    status: 'Expiring Soon',
                    message: `"${item.name}" is expiring soon! (Expires in 3 days or less: ${item.expiryDate})`
                });
            }
        }
    });

    return notifications;
}

/**
 * Sorts or filters recipe matches to prioritize ingredients that are expiring soon or expired.
 */
export function prioritizeExpiringRecipes(matchedRecipes) {
    const pantry = getPantryIngredients();
    
    // Find expiring/expired ingredient names in pantry
    const expiringPantryNames = new Set(
        pantry
            .filter(item => {
                const status = getExpirationStatus(item.expiryDate);
                return status === 'Expired' || status === 'Expiring Soon';
            })
            .map(item => item.name.toLowerCase().trim())
    );

    if (expiringPantryNames.size === 0) {
        return matchedRecipes; // No expiring ingredients, leave order as is
    }

    // Sort:
    // 1. Recipes using at least one expiring ingredient
    // 2. Sort by number of expiring ingredients used (descending)
    // 3. Keep original match percentage order
    return [...matchedRecipes].sort((a, b) => {
        const aCount = a.matchedIngredients.filter(ing => {
            const cleanIng = ing.split('(')[0].trim().toLowerCase();
            return expiringPantryNames.has(cleanIng);
        }).length;

        const bCount = b.matchedIngredients.filter(ing => {
            const cleanIng = ing.split('(')[0].trim().toLowerCase();
            return expiringPantryNames.has(cleanIng);
        }).length;

        if (aCount !== bCount) {
            return bCount - aCount; // Higher number of expiring items first
        }

        return b.matchPercentage - a.matchPercentage;
    });
}

/* ==========================================================================
   UI Event Bindings for expiration.html
   ========================================================================== */

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const expiredList = document.getElementById('expired-list');
        const expiringList = document.getElementById('expiring-list');
        const freshList = document.getElementById('fresh-list');
        
        const expiredCount = document.getElementById('expired-count');
        const expiringCount = document.getElementById('expiring-count');
        const freshCount = document.getElementById('fresh-count');
        
        const filterSelect = document.getElementById('expiry-filter-select');
        const dashboardGrid = document.getElementById('expiration-dashboard');
        const emptyPrompt = document.getElementById('pantry-empty-prompt');

        if (!expiredList) return; // Exit if not on expiration page

        // Load pantry ingredients from backend first
        if (getCurrentUser()) {
            await loadPantryFromServer();
        }

        /**
         * Renders column lists based on active status filters.
         */
        const renderDashboard = (filterVal = 'all') => {
            const pantry = getPantryIngredients();
            
            if (pantry.length === 0) {
                dashboardGrid.classList.add('hidden');
                emptyPrompt.classList.remove('hidden');
                return;
            }

            dashboardGrid.classList.remove('hidden');
            emptyPrompt.classList.add('hidden');

            const summary = getPantryExpirationSummary();

            // Update counts
            expiredCount.textContent = summary.expired.length;
            expiringCount.textContent = summary.expiringSoon.length;
            freshCount.textContent = summary.fresh.length;

            // Clear columns
            expiredList.innerHTML = '';
            expiringList.innerHTML = '';
            freshList.innerHTML = '';

            // Helper to compile row element
            const createRow = (item) => {
                const row = document.createElement('div');
                row.className = 'exp-item-row';

                const info = document.createElement('div');
                info.className = 'exp-item-info';

                const name = document.createElement('span');
                name.className = 'exp-item-name';
                name.textContent = item.name;

                const details = document.createElement('span');
                details.className = 'exp-item-date';
                details.textContent = `Category: ${item.category} • Added: ${item.addedDate}`;

                info.appendChild(name);
                info.appendChild(details);

                // Date Input for modifying expiry
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.className = 'expiry-date-picker';
                dateInput.style.padding = '0.2rem 0.5rem';
                dateInput.style.fontSize = '0.78rem';
                dateInput.value = item.expiryDate || '';
                dateInput.addEventListener('change', async (e) => {
                    const newDate = e.target.value;
                    try {
                        await updatePantryIngredient(item.id, { expiryDate: newDate });
                        document.dispatchEvent(new CustomEvent('pantryUpdated'));
                        renderDashboard(filterSelect.value);
                    } catch (err) {
                        alert("Error updating expiry: " + err.message);
                    }
                });

                // Action Buttons Container
                const actions = document.createElement('div');
                actions.className = 'exp-item-actions';

                // Recommend recipes button
                const findRecipesBtn = document.createElement('button');
                findRecipesBtn.className = 'btn btn-secondary btn-sm';
                findRecipesBtn.innerHTML = '🍳 Find Recipes';
                findRecipesBtn.title = `Find recipes using ${item.name}`;
                findRecipesBtn.addEventListener('click', () => {
                    sessionStorage.setItem('priorityIngredient', item.name);
                    window.location.href = 'index.html';
                });

                // Clear Expiry Date Button
                if (item.expiryDate) {
                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'btn btn-secondary btn-sm';
                    clearBtn.style.color = 'var(--text-muted)';
                    clearBtn.innerHTML = 'Clear';
                    clearBtn.title = 'Clear expiration date';
                    clearBtn.addEventListener('click', async () => {
                        try {
                            await updatePantryIngredient(item.id, { expiryDate: '' });
                            document.dispatchEvent(new CustomEvent('pantryUpdated'));
                            renderDashboard(filterSelect.value);
                        } catch (err) {
                            alert("Error clearing expiry: " + err.message);
                        }
                    });
                    actions.appendChild(clearBtn);
                }

                // Remove/Delete Pantry Item Button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger btn-sm';
                deleteBtn.innerHTML = '✕';
                deleteBtn.title = 'Remove item from pantry';
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`Remove "${item.name}" from your pantry entirely?`)) {
                        try {
                            await removePantryIngredient(item.id);
                            document.dispatchEvent(new CustomEvent('pantryUpdated'));
                            renderDashboard(filterSelect.value);
                        } catch (err) {
                            alert("Error removing ingredient: " + err.message);
                        }
                    }
                });

                actions.appendChild(findRecipesBtn);
                actions.appendChild(deleteBtn);

                row.appendChild(info);
                row.appendChild(dateInput);
                row.appendChild(actions);

                return row;
            };

            // Populate lists depending on filter constraints
            if (filterVal === 'all' || filterVal === 'expired') {
                summary.expired.forEach(item => expiredList.appendChild(createRow(item)));
            }
            if (filterVal === 'all' || filterVal === 'expiringSoon') {
                summary.expiringSoon.forEach(item => expiringList.appendChild(createRow(item)));
            }
            if (filterVal === 'all' || filterVal === 'fresh') {
                summary.fresh.forEach(item => freshList.appendChild(createRow(item)));
            }

            // Handle empty categories under single filters
            if (filterVal === 'expired' && summary.expired.length === 0) {
                expiredList.innerHTML = '<div class="empty-state" style="padding:1rem;"><p style="font-size:0.8rem;">No expired ingredients.</p></div>';
            }
            if (filterVal === 'expiringSoon' && summary.expiringSoon.length === 0) {
                expiringList.innerHTML = '<div class="empty-state" style="padding:1rem;"><p style="font-size:0.8rem;">No ingredients expiring soon.</p></div>';
            }
            if (filterVal === 'fresh' && summary.fresh.length === 0) {
                freshList.innerHTML = '<div class="empty-state" style="padding:1rem;"><p style="font-size:0.8rem;">No ingredients in Fresh category.</p></div>';
            }
        };

        // Filter dropdown change trigger
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                renderDashboard(e.target.value);
            });
        }

        // Reload panel when notification bell updates
        document.addEventListener('notificationsUpdated', () => {
            renderDashboard(filterSelect.value);
        });

        // Run initial rendering
        renderDashboard();
    });
}
