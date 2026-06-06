/**
 * Authentication and User Management Module
 */

// Helper to get users array from local storage
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

// Helper to save users array to local storage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

/**
 * Gets the currently logged-in user.
 * @returns {Object|null} The current user object or null if guest
 */
export function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || null;
}

/**
 * Checks if a user is currently logged in.
 * @returns {boolean} True if logged in
 */
export function isAuthenticated() {
    return getCurrentUser() !== null;
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
 * Registers a new user account in the system.
 */
export function registerUser(name, email, password, confirmPassword, preferences = {}, allergens = []) {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Empty field validation
    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
        throw new Error("All fields are required.");
    }

    // 2. Email format validation
    if (!validateEmail(trimmedEmail)) {
        throw new Error("Please enter a valid email address.");
    }

    // 3. Password strength validation (minimum 6 characters)
    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
    }

    // 4. Password confirmation validation
    if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
    }

    const users = getUsers();

    // 5. Duplicate email validation
    const emailExists = users.some(u => u.email === trimmedEmail);
    if (emailExists) {
        throw new Error("An account with this email already exists.");
    }

    // Create new user object
    const newUser = {
        id: Date.now(),
        name: trimmedName,
        email: trimmedEmail,
        password: password, // Store in plaintext since this is a local client-side prototype
        preferences: {
            halal: !!preferences.halal,
            vegetarian: !!preferences.vegetarian,
            vegan: !!preferences.vegan,
            glutenFree: !!preferences.glutenFree
        },
        allergens: Array.isArray(allergens) ? allergens.map(a => a.toLowerCase().trim()) : []
    };

    // Save to local storage
    users.push(newUser);
    saveUsers(users);

    // Auto-login the user
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
}

/**
 * Authenticates a user and logs them into the system.
 */
export function loginUser(email, password) {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
        throw new Error("Please fill in all fields.");
    }

    if (!validateEmail(trimmedEmail)) {
        throw new Error("Please enter a valid email address.");
    }

    const users = getUsers();
    const user = users.find(u => u.email === trimmedEmail);

    if (!user || user.password !== password) {
        throw new Error("Invalid email or password.");
    }

    // Set active user session
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
}

/**
 * Log out the active user and redirect.
 */
export function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

/**
 * Updates the profile of the current logged-in user.
 */
export function updateProfile(name, email, currentPassword, newPassword, confirmPassword, preferences = {}, allergens = []) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error("No active user session.");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
        throw new Error("Name and email are required fields.");
    }

    if (!validateEmail(trimmedEmail)) {
        throw new Error("Please enter a valid email address.");
    }

    // Verify current password to allow changes
    if (!currentPassword) {
        throw new Error("You must enter your current password to save changes.");
    }

    const users = getUsers();
    const userIdx = users.findIndex(u => u.id === currentUser.id);
    if (userIdx === -1) throw new Error("User record not found.");

    const dbUser = users[userIdx];
    if (dbUser.password !== currentPassword) {
        throw new Error("Incorrect current password.");
    }

    // Check duplicate email (if changing email)
    if (trimmedEmail !== dbUser.email) {
        const emailExists = users.some(u => u.id !== currentUser.id && u.email === trimmedEmail);
        if (emailExists) {
            throw new Error("An account with this email already exists.");
        }
    }

    // Update fields
    dbUser.name = trimmedName;
    const oldEmail = dbUser.email;
    dbUser.email = trimmedEmail;
    dbUser.preferences = {
        halal: !!preferences.halal,
        vegetarian: !!preferences.vegetarian,
        vegan: !!preferences.vegan,
        glutenFree: !!preferences.glutenFree
    };
    dbUser.allergens = Array.isArray(allergens) ? allergens.map(a => a.toLowerCase().trim()) : [];

    // Change password if requested
    if (newPassword) {
        if (newPassword.length < 6) {
            throw new Error("New password must be at least 6 characters long.");
        }
        if (newPassword !== confirmPassword) {
            throw new Error("New passwords do not match.");
        }
        dbUser.password = newPassword;
    }

    // If email changed, migrate storage keys
    if (oldEmail !== trimmedEmail) {
        const keysToMigrate = ['pantry', 'favorites', 'exclusions', 'notifications'];
        keysToMigrate.forEach(key => {
            const oldVal = localStorage.getItem(`${key}_${oldEmail}`);
            if (oldVal !== null) {
                localStorage.setItem(`${key}_${trimmedEmail}`, oldVal);
                localStorage.removeItem(`${key}_${oldEmail}`);
            }
        });
    }

    // Save update to users array and current session
    users[userIdx] = dbUser;
    saveUsers(users);
    localStorage.setItem('currentUser', JSON.stringify(dbUser));

    return dbUser;
}

/**
 * Deletes the currently logged-in user's account.
 */
export function deleteAccount() {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error("No active user session.");

    const users = getUsers();
    const updatedUsers = users.filter(u => u.id !== currentUser.id);
    saveUsers(updatedUsers);

    // Clean up user-scoped data
    const email = currentUser.email;
    localStorage.removeItem(`pantry_${email}`);
    localStorage.removeItem(`favorites_${email}`);
    localStorage.removeItem(`exclusions_${email}`);
    localStorage.removeItem(`notifications_${email}`);
    localStorage.removeItem('currentUser');

    // Redirect to register
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
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Common Nav Controls initialization (if logged in)
        const currentUser = getCurrentUser();
        if (currentUser) {

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

        setupNotificationDrawer();
    }

    // 2. Login Page Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const feedbackEl = document.getElementById('auth-feedback');

            feedbackEl.className = 'feedback-message';
            feedbackEl.textContent = '';

            try {
                loginUser(email, password);
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
        registerForm.addEventListener('submit', (e) => {
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
                registerUser(name, email, password, confirmPassword, preferences, allergens);
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

        profileForm.addEventListener('submit', (e) => {
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
                updateProfile(name, email, currentPassword, newPassword, confirmPassword, preferences, allergens);
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
                
                // Scroll to top of settings container to view success feedback
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
        deleteBtn.addEventListener('click', () => {
            const firstConfirm = confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
            if (firstConfirm) {
                const secondConfirm = confirm("WARNING: This will permanently wipe your login credentials, custom recipe favorites, personal preparation notes, and pantry lists. Do you really want to proceed?");
                if (secondConfirm) {
                    deleteAccount();
                }
            }
        });
    }
});
}


/**
 * Lazily imports expiration module to prevent circular loads at startup,
 * then initializes and hooks notifications drawer to header bell.
 */
async function setupNotificationDrawer() {
    const notifBell = document.getElementById('notif-bell-btn');
    const notifBadge = document.getElementById('notif-count-badge');
    const notifDrawer = document.getElementById('notification-drawer');
    const notifClose = document.getElementById('notif-close-btn');
    const notifListContainer = document.getElementById('notif-list-container');

    if (!notifBell || !notifDrawer) return;

    // Load expiration helpers dynamically to resolve dependency cycles
    const { getActiveNotifications, dismissNotification } = await import('./expiration.js');

    const renderNotifications = () => {
        const active = getActiveNotifications();
        
        // Update badge count
        if (active.length > 0) {
            notifBadge.textContent = active.length;
            notifBadge.classList.add('active');
        } else {
            notifBadge.textContent = '0';
            notifBadge.classList.remove('active');
        }

        // Render drawer list items
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
                
                // Let other parts of app know that notifications changed
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

    // Close drawer clicking anywhere outside
    document.addEventListener('click', (e) => {
        if (!notifDrawer.contains(e.target) && !notifBell.contains(e.target)) {
            notifDrawer.classList.remove('show');
        }
    });

    // Run initial notification scan
    renderNotifications();

    // Listen for pantry adjustments to refresh drawer dynamically
    document.addEventListener('pantryUpdated', () => {
        renderNotifications();
    });
}

