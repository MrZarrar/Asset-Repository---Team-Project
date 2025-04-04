/**
 * @fileoverview Store for managing asset search state and operations.
 * @module lib/stores/searchStore
 */

import { writable } from 'svelte/store';
import { searchAssets } from '$lib/services/assetSearchService';

/**
 * Store for the current search term.
 * @type {import('svelte/store').Writable<string>}
 */
export const searchTerm = writable('');

/**
 * Store for search results.
 * @type {import('svelte/store').Writable<Array>}
 */
export const searchResults = writable([]);

/**
 * Store indicating whether a search is in progress.
 * @type {import('svelte/store').Writable<boolean>}
 */
export const isSearching = writable(false);

/**
 * Store for any search-related errors.
 * @type {import('svelte/store').Writable<string|null>}
 */
export const searchError = writable(null);

/**
 * Performs an asset search with the given term and search option.
 * Updates all relevant stores with the search state.
 * 
 * @async
 * @function performSearch
 * @param {string} term - The search term to look for
 * @param {string} option - The field to search in (e.g. 'name', 'description')
 * @returns {Promise<void>}
 */
export async function performSearch(term, option) {
    // Update the search term
    searchTerm.set(term);
    
    // Skip empty searches
    if (!term.trim()) {
      searchResults.set([]);
      return;
    }
    
    // Set loading state
    isSearching.set(true);
    searchError.set(null);
    
    try {
      const results = await searchAssets(term, option);
      searchResults.set(results);
    } catch (error) {
      console.error('Search failed:', error);
      searchError.set(error.message || 'Failed to search assets');
      searchResults.set([]);
    } finally {
      isSearching.set(false);
    }
  }
  
/**
 * Clears all search state - term, results, and errors.
 * 
 * @function clearSearch
 */
export function clearSearch() {
  searchTerm.set('');
  searchResults.set([]);
  searchError.set(null);
}