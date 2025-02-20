// superuser.js
const PocketBase = require("pocketbase"); // Use require instead of import
const pb = new PocketBase('http://127.0.0.1:8090/');
pb.autoCancellation(false);

// Authenticate as a superuser
pb.collection('_superusers').authWithPassword('Super.user@pocketbase.com', 'SuperPassword', {
    autoRefreshThreshold: 30 * 60
}).then(() => {
    console.log("Superuser authenticated successfully.");
}).catch((error) => {
    console.error("Failed to authenticate superuser:", error);
});

module.exports = pb; // Export the PocketBase client instance