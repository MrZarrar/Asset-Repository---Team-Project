import { writable } from 'svelte/store';
import { searchAssets } from '$lib/services/assetSearchService';

// This would create stores for each search state
export const searchTerm = writable('');
export const searchResults = writable([]);
export const isSearching = writable(false);
export const searchError = writable(null);

// Perform asset search
export async function performSearch(term) {
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
      const results = await searchAssets(term);
      searchResults.set(results);
    } catch (error) {
      console.error('Search failed:', error);
      searchError.set(error.message || 'Failed to search assets');
      searchResults.set([]);
    } finally {
      isSearching.set(false);
    }
  }
  
  // Clear search results
  export function clearSearch() {
    searchTerm.set('');
    searchResults.set([]);
    searchError.set(null);
  }