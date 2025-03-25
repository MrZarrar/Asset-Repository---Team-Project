import { writable } from 'svelte/store';
import { searchAssets } from '$lib/services/assetSearchService';

// This would create stores for each search state
export const searchTerm = writable('');
export const searchResults = writable([]);
export const isSearching = writable(false);
export const searchError = writable(null);
