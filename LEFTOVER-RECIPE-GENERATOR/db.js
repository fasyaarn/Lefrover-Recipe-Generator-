import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.resolve(__dirname, 'database.json');

// Helper to read database
async function readDB() {
    try {
        const data = await fs.readFile(dbFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // If file doesn't exist or is invalid, return empty structure
        return {
            users: [],
            pantry: [],
            favorites: [],
            exclusions: []
        };
    }
}

// Helper to write database
async function writeDB(data) {
    await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Ensure database file exists
async function initDB() {
    try {
        await fs.access(dbFilePath);
    } catch {
        await writeDB({
            users: [],
            pantry: [],
            favorites: [],
            exclusions: []
        });
    }
}
await initDB();

// --- USER OPERATIONS ---

export async function findUserByEmail(email) {
    const db = await readDB();
    const cleanEmail = email.trim().toLowerCase();
    return db.users.find(u => u.email === cleanEmail) || null;
}

export async function findUserById(id) {
    const db = await readDB();
    return db.users.find(u => u.id === id) || null;
}

export async function createUser(user) {
    const db = await readDB();
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    
    // Default preferences
    const preferences = user.preferences || {
        halal: false,
        vegetarian: false,
        vegan: false,
        glutenFree: false
    };

    const newUser = {
        id: newId,
        name: user.name.trim(),
        email: user.email.trim().toLowerCase(),
        password: user.password,
        preferences,
        allergens: user.allergens || []
    };
    
    db.users.push(newUser);
    await writeDB(db);
    return newUser;
}

export async function updateUser(id, updatedFields) {
    const db = await readDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    
    const user = db.users[idx];
    if (updatedFields.name !== undefined) user.name = updatedFields.name.trim();
    if (updatedFields.email !== undefined) user.email = updatedFields.email.trim().toLowerCase();
    if (updatedFields.password !== undefined) user.password = updatedFields.password;
    if (updatedFields.preferences !== undefined) user.preferences = updatedFields.preferences;
    if (updatedFields.allergens !== undefined) user.allergens = updatedFields.allergens;

    db.users[idx] = user;
    await writeDB(db);
    return user;
}

export async function deleteUser(id) {
    const db = await readDB();
    db.users = db.users.filter(u => u.id !== id);
    db.pantry = db.pantry.filter(p => p.userId !== id);
    db.favorites = db.favorites.filter(f => f.userId !== id);
    db.exclusions = db.exclusions.filter(e => e.userId !== id);
    await writeDB(db);
    return true;
}

// --- PANTRY OPERATIONS ---

export async function getPantry(userId) {
    const db = await readDB();
    // Return items in reverse chronological order (newest first)
    return db.pantry
        .filter(p => p.userId === userId)
        .sort((a, b) => b.addedDate.localeCompare(a.addedDate));
}

export async function addPantryItem(userId, item) {
    const db = await readDB();
    const cleanName = item.name.trim().toLowerCase();

    // Check capacity limit
    const count = db.pantry.filter(p => p.userId === userId).length;
    if (count >= 20) {
        throw new Error('Your pantry is full! Max limit is 20 ingredients.');
    }

    // Check duplicate
    const isDuplicate = db.pantry.some(p => p.userId === userId && p.name === cleanName);
    if (isDuplicate) {
        throw new Error(`"${item.name}" is already in your pantry.`);
    }

    // Check conflict with exclusions
    const isExcluded = db.exclusions.some(e => e.userId === userId && e.name === cleanName);
    if (isExcluded) {
        throw new Error(`Conflict: "${item.name}" is currently in your excluded list! Remove it from exclusions first.`);
    }

    const newItem = {
        id: 'ing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId,
        name: cleanName,
        category: item.category || 'Vegetable',
        expiryDate: item.expiryDate || '',
        addedDate: new Date().toISOString().split('T')[0]
    };

    db.pantry.push(newItem);
    await writeDB(db);
    return newItem;
}

export async function updatePantryItem(userId, itemId, updatedFields) {
    const db = await readDB();
    const idx = db.pantry.findIndex(p => p.id === itemId && p.userId === userId);
    if (idx === -1) return null;

    const item = db.pantry[idx];
    if (updatedFields.category !== undefined) item.category = updatedFields.category;
    if (updatedFields.expiryDate !== undefined) item.expiryDate = updatedFields.expiryDate;

    db.pantry[idx] = item;
    await writeDB(db);
    return item;
}

export async function removePantryItem(userId, itemId) {
    const db = await readDB();
    const initialLength = db.pantry.length;
    db.pantry = db.pantry.filter(p => !(p.id === itemId && p.userId === userId));
    
    if (db.pantry.length === initialLength) return false;
    await writeDB(db);
    return true;
}

export async function clearPantry(userId) {
    const db = await readDB();
    db.pantry = db.pantry.filter(p => p.userId !== userId);
    await writeDB(db);
    return true;
}

// --- FAVORITES OPERATIONS ---

export async function getFavorites(userId) {
    const db = await readDB();
    return db.favorites.filter(f => f.userId === userId);
}

export async function toggleFavorite(userId, recipeId, recipeData = null) {
    const db = await readDB();
    const cleanId = String(recipeId).trim();
    const idx = db.favorites.findIndex(f => f.userId === userId && String(f.recipeId) === cleanId);

    if (idx > -1) {
        // Remove favorite
        db.favorites.splice(idx, 1);
        await writeDB(db);
        return { favorited: false };
    } else {
        // Add favorite
        const newFavorite = {
            recipeId: cleanId.startsWith('external_') ? cleanId : parseInt(cleanId, 10),
            userId,
            note: '',
            dateAdded: new Date().toISOString().split('T')[0],
            recipeData
        };
        db.favorites.push(newFavorite);
        await writeDB(db);
        return { favorited: true, favorite: newFavorite };
    }
}

export async function updateFavoriteNote(userId, recipeId, note) {
    const db = await readDB();
    const cleanId = String(recipeId).trim();
    const idx = db.favorites.findIndex(f => f.userId === userId && String(f.recipeId) === cleanId);

    if (idx === -1) return null;

    db.favorites[idx].note = note || '';
    await writeDB(db);
    return db.favorites[idx];
}

// --- EXCLUSIONS OPERATIONS ---

export async function getExclusions(userId) {
    const db = await readDB();
    return db.exclusions.filter(e => e.userId === userId).map(e => e.name);
}

export async function addExclusion(userId, name) {
    const db = await readDB();
    const cleanName = name.trim().toLowerCase();

    // Check duplicate
    const isDuplicate = db.exclusions.some(e => e.userId === userId && e.name === cleanName);
    if (isDuplicate) {
        throw new Error(`"${name}" is already in your excluded list.`);
    }

    // Check conflict with pantry
    const hasPantryConflict = db.pantry.some(p => p.userId === userId && p.name === cleanName);
    if (hasPantryConflict) {
        throw new Error(`Conflict detected: "${name}" is currently in your pantry! Remove it from pantry first.`);
    }

    db.exclusions.push({ userId, name: cleanName });
    await writeDB(db);
    return db.exclusions.filter(e => e.userId === userId).map(e => e.name);
}

export async function removeExclusion(userId, name) {
    const db = await readDB();
    const cleanName = name.trim().toLowerCase();

    db.exclusions = db.exclusions.filter(e => !(e.userId === userId && e.name === cleanName));
    await writeDB(db);
    return db.exclusions.filter(e => e.userId === userId).map(e => e.name);
}
