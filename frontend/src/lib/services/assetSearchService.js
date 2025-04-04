/**
 * @fileoverview Service for searching and retrieving assets from the database.
 * @module lib/services/assetSearchService
 */

import pb from '$lib/pocketbase';

/**
 * Searches for assets in the database based on the provided search term and field.
 * If no search term is provided, it returns a list of recent assets.
 * 
 * @async
 * @function searchAssets
 * @param {string} [searchTerm=''] - The term to search for in asset names or other fields
 * @param {string} [field='name'] - The field to search in (e.g., 'name', 'description')
 * @returns {Promise<Array>} A promise that resolves to an array of asset objects
 * @throws {Error} If the search operation fails
 */
export async function searchAssets(searchTerm = '', field = 'name') {
  try {
    // If no search term, fetch all assets with every field
    if (!searchTerm.trim()) {
      const records = await pb.collection('Assets').getList(1, 20, {
        sort: '-created', // Sort by newest first
        fields: 'name'       // Fetch all fields
      });
      return records.items;
    }

    // Search by the specified field and fetch all fields
    const records = await pb.collection('Assets').getList(1, 50, {
      filter: `${field} ~ "${searchTerm}"`,
      sort: '-created', // Sort by newest first
      fields: '*'     // Fetch all fields including type, last_updated, date_created, etc.
    });
    
    return records.items;
  } catch (error) {
    console.error('Error in searching assets:', error);
    throw error;
  }
}