/**
 * storage.js
 * Utility to handle localStorage and sessionStorage transparently
 */

const STORAGE_KEY_PERSIST = 'auth_persist';

export const storage = {
    /**
     * Get the current storage type based on persist flag
     */
    getStorage() {
        const persist = localStorage.getItem(STORAGE_KEY_PERSIST) === 'true';
        return persist ? localStorage : sessionStorage;
    },

    /**
     * Save item to the appropriate storage
     */
    setItem(key, value, persist = null) {
        if (persist !== null) {
            localStorage.setItem(STORAGE_KEY_PERSIST, persist ? 'true' : 'false');
        }

        // Remove from both first to avoid duplicates/confusion
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);

        this.getStorage().setItem(key, value);
    },

    /**
     * Get item from storage (checks both)
     */
    getItem(key) {
        return localStorage.getItem(key) || sessionStorage.getItem(key);
    },

    /**
     * Remove item from all storages
     */
    removeItem(key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    },

    /**
     * Clear all auth related storage
     */
    clear() {
        localStorage.removeItem(STORAGE_KEY_PERSIST);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
    },

    /**
     * Check if user is logged in
     */
    isAuthenticated() {
        return !!this.getItem('token');
    }
};

export default storage;
