import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import path from 'path';
import {
    findUserByEmail,
    findUserById,
    createUser,
    updateUser,
    deleteUser,
    getPantry,
    addPantryItem,
    updatePantryItem,
    removePantryItem,
    clearPantry,
    getFavorites,
    toggleFavorite,
    updateFavoriteNote,
    getExclusions,
    addExclusion,
    removeExclusion
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'local-dev-secret-key-12345';

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static web client files (HTML, CSS, JS) from this directory
app.use(express.static(__dirname));

// Auth Verification Middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader);

    if (!token) {
        return res.status(401).json({ message: 'Access token required.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Injects payload: { id, email }
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired session token.' });
    }
};

// Health Check Route untuk Railway
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is up and running perfectly!' });
});

// --- AUTHENTICATION ENDPOINTS ---

// Register User
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, confirmPassword, preferences, allergens } = req.body;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        // Check duplicate email
        const existingUser = await findUserByEmail(trimmedEmail);
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // Hash password with bcryptjs
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Dietary & Allergens format setup
        const prefs = {
            halal: !!(preferences && preferences.halal),
            vegetarian: !!(preferences && preferences.vegetarian),
            vegan: !!(preferences && preferences.vegan),
            glutenFree: !!(preferences && preferences.glutenFree)
        };

        const allergensList = Array.isArray(allergens)
            ? allergens.map(a => a.toLowerCase().trim())
            : [];

        // Insert new user record
        const newUser = await createUser({
            name: trimmedName,
            email: trimmedEmail,
            password: passwordHash,
            preferences: prefs,
            allergens: allergensList
        });

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);

        return res.status(201).json({
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                preferences: newUser.preferences,
                allergens: newUser.allergens
            },
            token
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedEmail || !password) {
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    try {
        const user = await findUserByEmail(trimmedEmail);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
                allergens: user.allergens
            },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error during login.' });
    }
});

// Update Profile Settings
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    const { name, email, currentPassword, newPassword, confirmPassword, preferences, allergens } = req.body;
    const userId = req.user.id;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
        return res.status(400).json({ message: 'Name and email are required fields.' });
    }

    if (!currentPassword) {
        return res.status(400).json({ message: 'You must enter your current password to save changes.' });
    }

    try {
        // Retrieve current DB user to verify password
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User session not found in database.' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        // Verify email unique if email is changing
        if (trimmedEmail !== user.email) {
            const emailExists = await findUserByEmail(trimmedEmail);
            if (emailExists && emailExists.id !== userId) {
                return res.status(400).json({ message: 'An account with this email already exists.' });
            }
        }

        let passwordHash = user.password;
        if (newPassword) {
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
            }
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: 'New passwords do not match.' });
            }
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(newPassword, salt);
        }

        const prefs = {
            halal: !!(preferences && preferences.halal),
            vegetarian: !!(preferences && preferences.vegetarian),
            vegan: !!(preferences && preferences.vegan),
            glutenFree: !!(preferences && preferences.glutenFree)
        };

        const allergensList = Array.isArray(allergens)
            ? allergens.map(a => a.toLowerCase().trim())
            : [];

        // Update database record
        const updatedUser = await updateUser(userId, {
            name: trimmedName,
            email: trimmedEmail,
            password: passwordHash,
            preferences: prefs,
            allergens: allergensList
        });

        return res.json({
            user: {
                id: userId,
                name: updatedUser.name,
                email: updatedUser.email,
                preferences: updatedUser.preferences,
                allergens: updatedUser.allergens
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Internal server error during profile update.' });
    }
});

// Delete Account
app.delete('/api/auth/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        await deleteUser(userId);
        return res.json({ message: 'Account permanently deleted.' });
    } catch (err) {
        console.error('Delete account error:', err);
        return res.status(500).json({ message: 'Internal server error during account deletion.' });
    }
});


// --- PANTRY ENDPOINTS ---

// Get all pantry ingredients for the logged-in user
app.get('/api/pantry', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const items = await getPantry(userId);
        return res.json(items);
    } catch (err) {
        console.error('Get pantry error:', err);
        return res.status(500).json({ message: 'Failed to retrieve pantry list.' });
    }
});

// Add an ingredient to the pantry
app.post('/api/pantry', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { name, category, expiryDate } = req.body;

    try {
        const newItem = await addPantryItem(userId, { name, category, expiryDate });
        return res.status(201).json(newItem);
    } catch (err) {
        console.error('Add pantry error:', err.message);
        return res.status(400).json({ message: err.message || 'Failed to add ingredient to pantry.' });
    }
});

// Update a pantry ingredient (expiryDate/category)
app.put('/api/pantry/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { category, expiryDate } = req.body;

    try {
        const updated = await updatePantryItem(userId, itemId, { category, expiryDate });
        if (!updated) {
            return res.status(404).json({ message: 'Ingredient not found in pantry.' });
        }
        return res.json(updated);
    } catch (err) {
        console.error('Update pantry error:', err);
        return res.status(500).json({ message: 'Failed to update ingredient.' });
    }
});

// Remove an ingredient from the pantry
app.delete('/api/pantry/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const itemId = req.params.id;

    try {
        const success = await removePantryItem(userId, itemId);
        if (!success) {
            return res.status(404).json({ message: 'Ingredient not found in pantry.' });
        }
        return res.json({ message: 'Ingredient removed from pantry.' });
    } catch (err) {
        console.error('Remove pantry error:', err);
        return res.status(500).json({ message: 'Failed to remove ingredient.' });
    }
});

// Clear all pantry items
app.delete('/api/pantry', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        await clearPantry(userId);
        return res.json({ message: 'Pantry cleared successfully.' });
    } catch (err) {
        console.error('Clear pantry error:', err);
        return res.status(500).json({ message: 'Failed to clear pantry.' });
    }
});


// --- RECIPE FAVORITES ENDPOINTS ---

// Get user favorites
app.get('/api/favorites', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const items = await getFavorites(userId);
        return res.json(items);
    } catch (err) {
        console.error('Get favorites error:', err);
        return res.status(500).json({ message: 'Failed to retrieve favorite recipes.' });
    }
});

// Toggle Favorite / Add Favorite
app.post('/api/favorites', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { recipeId, recipeData } = req.body;

    try {
        const result = await toggleFavorite(userId, recipeId, recipeData);
        return res.json(result);
    } catch (err) {
        console.error('Toggle favorite error:', err);
        return res.status(500).json({ message: 'Failed to toggle favorite status.' });
    }
});

// Update custom note on a favorite recipe
app.put('/api/favorites/:id/note', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const recipeId = req.params.id;
    const { note } = req.body;

    try {
        const updated = await updateFavoriteNote(userId, recipeId, note);
        if (!updated) {
            return res.status(404).json({ message: 'Recipe is not in your favorites list.' });
        }
        return res.json({ recipeId, note, message: 'Kitchen note saved.' });
    } catch (err) {
        console.error('Update favorite note error:', err);
        return res.status(500).json({ message: 'Failed to update kitchen note.' });
    }
});


// --- INGREDIENT EXCLUSIONS ENDPOINTS ---

// Get all exclusions
app.get('/api/exclusions', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const list = await getExclusions(userId);
        return res.json(list);
    } catch (err) {
        console.error('Get exclusions error:', err);
        return res.status(500).json({ message: 'Failed to retrieve exclusion list.' });
    }
});

// Add exclusion
app.post('/api/exclusions', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;

    try {
        const list = await addExclusion(userId, name);
        return res.status(201).json(list);
    } catch (err) {
        console.error('Add exclusion error:', err.message);
        return res.status(400).json({ message: err.message || 'Failed to add exclusion.' });
    }
});

// Delete exclusion
app.delete('/api/exclusions/:name', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const name = req.params.name;

    try {
        const list = await removeExclusion(userId, name);
        return res.json(list);
    } catch (err) {
        console.error('Delete exclusion error:', err);
        return res.status(500).json({ message: 'Failed to remove exclusion.' });
    }
});

// Global Fallback 404
app.use((req, res) => {
    res.status(404).send('Resource not found.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`Leftover Recipe Generator Server running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`===================================================`);
});
