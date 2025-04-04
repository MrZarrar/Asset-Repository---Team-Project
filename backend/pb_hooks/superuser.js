/**
 * @fileoverview Provides superuser authentication for administrative operations.
 * @module superuser
 */

// superuser.js
const PocketBase = require("pocketbaseM"); // Use require instead of import

/**
 * PocketBase client instance configured with superuser credentials.
 * @type {PocketBase}
 */
const pb = new PocketBase('http://127.0.0.1:8090/');
pb.autoCancellation(false);

/**
 * Authenticates with PocketBase using superuser credentials.
 * Sets up automatic token refresh when token is within 30 minutes of expiring.
 * @returns {Promise} Authentication promise that resolves when authenticated
 */
pb.collection('_superusers').authWithPassword('Super.user@pocketbase.com', 'SuperPassword', {
    autoRefreshThreshold: 30 * 60
}).then(() => {
    console.log("Superuser authenticated successfully.");
}).catch((error) => {
    console.error("Failed to authenticate superuser:", error);
});

module.exports = pb; // Export the PocketBase client instance