/**
 * Authentication and User Management Module
 */

/**
 * Gets the currently logged-in user metadata.
 * @returns {Object|null} The current user object or null
 */
export function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || null;
}

/**
 * Checks if a user session token is present.
 * @returns {boolean} True if logged in
 */
export function isAuthenticated() {
    return getCurrentUser() !== null;
}

/**
 * Gets the active user's session JSON Web Token.
 * @returns {string} Token string
 */
export function getSessionToken() {
    return localStorage.getItem('sessionToken') || '';
}

/**
 * Helper to validate email address format.
 * @param {string} email - Email string to check
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Registers a new user account on the server.
 */
export async function registerUser(name, email, password, confirmPassword, preferences = {}, allergens = []) {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword, preferences, allergens })
    });
    
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
    }

    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('sessionToken', data.token);
    return data.user;
}

/**
 * Authenticates a user and starts a session.
 */
export async function loginUser(email, password) {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
    }

    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('sessionToken', data.token);
    return data.user;
}

/**
 * Logs out the active user and redirects to the login screen.
 */
export function logoutUser() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
    window.location.href = 'login.html';
}

/**
 * Updates the profile of the current logged-in user on the database.
 */
export async function updateProfile(name, email, currentPassword, newPassword, confirmPassword, preferences = {}, allergens = []) {
    const token = getSessionToken();
    const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, currentPassword, newPassword, confirmPassword, preferences, allergens })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Profile update failed.');
    }

    localStorage.setItem('currentUser', JSON.stringify(data.user));
    return data.user;
}

/**
 * Deletes the currently logged-in user's account and logs out.
 */
export async function deleteAccount() {
    const token = getSessionToken();
    const res = await fetch('/api/auth/profile', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Account deletion failed.');
    }

    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
    window.location.href = 'register.html';
}

/**
 * Checks authentication status and redirects user appropriately.
 * @param {string} pageType - Either "protected" or "guest"
 */
export function checkAuthRedirect(pageType) {
    const loggedIn = isAuthenticated();
    
    if (pageType === 'protected' && !loggedIn) {
        window.location.href = 'login.html';
    } else if (pageType === 'guest' && loggedIn) {
        window.location.href = 'index.html';
    }
}

/* ==========================================================================
   UI Event Bindings for login.html, register.html, profile.html
   ========================================================================== */

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Pre-populate navbar settings
            const userNameEl = document.getElementById('nav-user-name');
            const userAvatarEl = document.getElementById('nav-user-avatar');
            
            if (userNameEl) userNameEl.textContent = currentUser.name;
            if (userAvatarEl) userAvatarEl.textContent = currentUser.name.charAt(0).toUpperCase();

            const dropdownTrigger = document.getElementById('user-badge-trigger');
            const dropdownMenu = document.getElementById('nav-user-dropdown');
            if (dropdownTrigger && dropdownMenu) {
                dropdownTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('show');
                });
                document.addEventListener('click', () => {
                    dropdownMenu.classList.remove('show');
                });
            }

            const logoutBtn = document.getElementById('nav-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logoutUser);
            }

            // Sync pantry data for notifications drawer pre-loading
            try {
                const { loadPantryFromServer } = await import('./ingredients.js');
                await loadPantryFromServer();
            } catch (err) {
                console.error("Failed to load notifications pantry:", err);
            }

            setupNotificationDrawer();
        }

        // 2. Login Page Logic
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const feedbackEl = document.getElementById('auth-feedback');

                feedbackEl.className = 'feedback-message';
                feedbackEl.textContent = '';

                try {
                    await loginUser(email, password);
                    window.location.href = 'index.html';
                } catch (err) {
                    feedbackEl.textContent = err.message;
                    feedbackEl.classList.add('error');
                }
            });
        }

        // 3. Register Page Logic
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirm-password').value;
                
                const feedbackEl = document.getElementById('auth-feedback');
                feedbackEl.className = 'feedback-message';
                feedbackEl.textContent = '';

                // Get selected preferences
                const preferences = {
                    halal: document.getElementById('reg-pref-halal').checked,
                    vegetarian: document.getElementById('reg-pref-vegetarian').checked,
                    vegan: document.getElementById('reg-pref-vegan').checked,
                    glutenFree: document.getElementById('reg-pref-glutenfree').checked
                };

                // Get selected allergens
                const allergenCheckboxes = document.querySelectorAll('input[name="reg-allergy"]:checked');
                const allergens = Array.from(allergenCheckboxes).map(cb => cb.value);

                try {
                    await registerUser(name, email, password, confirmPassword, preferences, allergens);
                    window.location.href = 'index.html';
                } catch (err) {
                    feedbackEl.textContent = err.message;
                    feedbackEl.classList.add('error');
                }
            });
        }

        // 4. Profile Settings Page Logic
        const profileForm = document.getElementById('profile-form');
        if (profileForm && currentUser) {
            // Pre-populate fields
            document.getElementById('prof-name').value = currentUser.name;
            document.getElementById('prof-email').value = currentUser.email;
            
            // Pre-populate preferences
            document.getElementById('prof-pref-halal').checked = !!currentUser.preferences.halal;
            document.getElementById('prof-pref-vegetarian').checked = !!currentUser.preferences.vegetarian;
            document.getElementById('prof-pref-vegan').checked = !!currentUser.preferences.vegan;
            document.getElementById('prof-pref-glutenfree').checked = !!currentUser.preferences.glutenFree;

            // Pre-populate allergens
            const allergenCheckboxes = document.querySelectorAll('input[name="prof-allergy"]');
            allergenCheckboxes.forEach(cb => {
                if (currentUser.allergens.includes(cb.value.toLowerCase())) {
                    cb.checked = true;
                }
            });

            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('prof-name').value;
                const email = document.getElementById('prof-email').value;
                const currentPassword = document.getElementById('prof-curr-password').value;
                const newPassword = document.getElementById('prof-new-password').value;
                const confirmPassword = document.getElementById('prof-confirm-password').value;
                
                const feedbackEl = document.getElementById('profile-feedback');
                feedbackEl.className = 'feedback-message';
                feedbackEl.textContent = '';

                const preferences = {
                    halal: document.getElementById('prof-pref-halal').checked,
                    vegetarian: document.getElementById('prof-pref-vegetarian').checked,
                    vegan: document.getElementById('prof-pref-vegan').checked,
                    glutenFree: document.getElementById('prof-pref-glutenfree').checked
                };

                const selectedAllergenCheckboxes = document.querySelectorAll('input[name="prof-allergy"]:checked');
                const allergens = Array.from(selectedAllergenCheckboxes).map(cb => cb.value);

                try {
                    await updateProfile(name, email, currentPassword, newPassword, confirmPassword, preferences, allergens);
                    feedbackEl.textContent = "Profile settings saved successfully!";
                    feedbackEl.classList.add('success');
                    
                    // Clear password fields
                    document.getElementById('prof-curr-password').value = '';
                    document.getElementById('prof-new-password').value = '';
                    document.getElementById('prof-confirm-password').value = '';
                    
                    // Update avatar and username immediately in nav
                    const freshUser = getCurrentUser();
                    document.getElementById('nav-user-name').textContent = freshUser.name;
                    document.getElementById('nav-user-avatar').textContent = freshUser.name.charAt(0).toUpperCase();
                    
                    feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } catch (err) {
                    feedbackEl.textContent = err.message;
                    feedbackEl.classList.add('error');
                    feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }

        // 5. Delete Account Button
        const deleteBtn = document.getElementById('delete-account-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const firstConfirm = confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
                if (firstConfirm) {
                    const secondConfirm = confirm("WARNING: This will permanently wipe your login credentials, custom recipe favorites, personal preparation notes, and pantry lists. Do you really want to proceed?");
                    if (secondConfirm) {
                        try {
                            await deleteAccount();
                        } catch (err) {
                            alert("Error deleting account: " + err.message);
                        }
                    }
                }
            });
        }
    });
}

/**
 * Dynamic rendering for notification drawer.
 */
async function setupNotificationDrawer() {
    const notifBell = document.getElementById('notif-bell-btn');
    const notifBadge = document.getElementById('notif-count-badge');
    const notifDrawer = document.getElementById('notification-drawer');
    const notifClose = document.getElementById('notif-close-btn');
    const notifListContainer = document.getElementById('notif-list-container');

    if (!notifBell || !notifDrawer) return;

    const { getActiveNotifications, dismissNotification } = await import('./expiration.js');

    const renderNotifications = () => {
        const active = getActiveNotifications();
        
        if (active.length > 0) {
            notifBadge.textContent = active.length;
            notifBadge.classList.add('active');
        } else {
            notifBadge.textContent = '0';
            notifBadge.classList.remove('active');
        }

        notifListContainer.innerHTML = '';
        if (active.length === 0) {
            notifListContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem 1rem;">
                    <div class="empty-icon">🎉</div>
                    <div class="empty-title">All clear!</div>
                    <p style="font-size: 0.8rem;">No expired or expiring ingredients found.</p>
                </div>
            `;
            return;
        }

        active.forEach(notif => {
            const card = document.createElement('div');
            card.className = `notif-card ${notif.status === 'Expired' ? 'expired' : 'expiring'}`;
            
            const msg = document.createElement('span');
            msg.className = 'notif-msg';
            msg.textContent = notif.message;
            
            const dateStr = document.createElement('span');
            dateStr.className = 'notif-date';
            dateStr.textContent = `Expiry Date: ${notif.expiryDate}`;
            
            const dismiss = document.createElement('button');
            dismiss.className = 'notif-dismiss-btn';
            dismiss.textContent = '✕';
            dismiss.title = 'Dismiss notification';
            dismiss.addEventListener('click', (e) => {
                e.stopPropagation();
                dismissNotification(notif.id);
                renderNotifications();
                
                const event = new CustomEvent('notificationsUpdated');
                document.dispatchEvent(event);
            });

            card.appendChild(msg);
            card.appendChild(dateStr);
            card.appendChild(dismiss);
            notifListContainer.appendChild(card);
        });
    };

    // Open/Close drawer toggle
    notifBell.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDrawer.classList.toggle('show');
        renderNotifications();
    });

    if (notifClose) {
        notifClose.addEventListener('click', () => {
            notifDrawer.classList.remove('show');
        });
    }

    document.addEventListener('click', (e) => {
        if (!notifDrawer.contains(e.target) && !notifBell.contains(e.target)) {
            notifDrawer.classList.remove('show');
        }
    });

    renderNotifications();

    document.addEventListener('pantryUpdated', () => {
        renderNotifications();
    });
}
