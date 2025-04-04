/**
 * @fileoverview Service for managing application settings and metadata.
 * @module lib/settingsService
 */

import pb from './pocketbase';

/**
 * Retrieves application metadata from the PocketBase settings.
 * Requires admin authentication to access settings API.
 * Falls back to default values if the fetch fails.
 * 
 * @async
 * @function getAppMetadata
 * @returns {Promise<Object>} Application metadata including appName, appURL, etc.
 */
export async function getAppMetadata() {
  try {
    // PocketBase Admin API - requires authentication with an admin account
    const adminData = pb.admins.authWithPassword(
      process.env.ADMIN_EMAIL || 'your-admin-email@example.com',
      process.env.ADMIN_PASSWORD || 'your-admin-password'
    );
    
    // Fetch settings after authentication
    const settings = await pb.settings.getAll();
    
    // Return only the meta section (contains appName, appURL, etc.)
    return settings.meta;
  } catch (error) {
    console.error("Failed to fetch app metadata:", error);
    // Return default values if the fetch fails
    return {
      appName: "My Application",
      appURL: "http://localhost:5173",
      senderName: "Admin",
      senderAddress: "admin@g.com"
    };
  }
} 