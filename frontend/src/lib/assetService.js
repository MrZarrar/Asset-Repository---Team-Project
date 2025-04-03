import pb from '$lib/pocketbase';
import { refreshToken } from './authManager';
import { user } from '$lib/user.js';
import { UsersRoundIcon } from '@lucide/svelte';

// Fetch all assets with pagination support
export async function fetchAssets(page = 1, perPage = 20, filters = {}) {
  try {
    // Disable auto-cancellation globally for the PocketBase client
    pb.autoCancellation(false);

    // Build filter string if needed
    let filterString = ''; // initalises an empty string to hold all the filters
    Object.entries(filters).forEach(([key, value]) => { // for each value in the JSON filters input, it will format it into a string to be sent with the GET command
      if (value) {
        if (Array.isArray(value)) {
          // Fix: Use OR (||) condition instead of invalid syntax
          const orConditions = value.map(val => `${key}="${val}"`).join(' || ');
          filterString += `(${orConditions}) && `;
        } else {
          filterString += `${key}="${value}" && `;
        }
      }
    });
    if (filterString) {
      filterString = filterString.slice(0, -4); // Remove trailing ' && '
    }

    const response = await pb.collection('Assets').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
      expand: 'category, logo, file', // Add any relations you need to expand
      autoCancel: false // Disable auto-cancellation
    });

    return response;
  } catch (error) {
    // Handle token expiration
    if (error.status === 401) { // If Error 401 occurs, wait for a token refresh and run this entire function again
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the request after refresh
        return fetchAssets(page, perPage, filters);
      }
    }
    console.error("Error fetching assets:", error); // Any other errors? put the error in the console
    throw error;
  }
}

// Get a single asset by Filtering
export async function getAssetsByFilters(filters = {}) {
  let filterString = ''; // initalises an empty string to hold all the filters
  filterString += '(' // forces ALL filters to be put into brackets, allowing for multiple filters and single filters to all work without special code
    Object.entries(filters).forEach(([key, value]) => { // for each value in the JSON filters input, it will format it into a string to be sent with the GET command
      if (value) {
        filterString += `${key}="${value}" && `;
      }
    });

    if (filterString) {
      filterString += `add_type!="copied")`; // This makes sure copied assets are ignored, and also has the closing bracket to form a functional GET command
    }
  try {
    const asset = await pb.collection('Assets').getFullList({filter: filterString, sort: '-created',}); // ACTUALLY fetches the assets from pocketbase
    console.log(asset) // Just for testings sake, you can see the result of this GET command in the terminal
    return asset; 
  } catch (error) {
    if (error.status === 401) { 
      const refreshed = await refreshToken(); // If Error 401 occurs, wait for a token refresh and run this entire function again
      if (refreshed) {
        return getAssetsByFilters(filters);
      }
    }
    console.error(`Error fetching asset ${filters}:`, error); // Any other errors? put the error in the console
    throw error;
  }
}

// Get a single asset by ID
export async function getAssetById(id) {
  try {
    const asset = await pb.collection('Assets').getOne(id);
    console.log(asset)
    return asset;
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return getAssetById(id);
      }
    }
    console.error(`Error fetching asset ${id}:`, error);
    throw error;
  }
}

// Upload a new asset
export async function uploadAsset(assetData, fileData) {
  try {
    const formData = new FormData();
    
    // Add all asset metadata
    Object.entries(assetData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Add file if provided
    if (fileData) {
      formData.append('file', fileData);
    }
    
    const createdAsset = await pb.collection('assets').create(formData);
    return createdAsset;
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return uploadAsset(assetData, fileData);
      }
    }
    console.error("Error uploading asset:", error);
    throw error;
  }
}

// Fetch assets by category
export async function fetchAssetsByCategory(category) {
  try {
    const response = await pb.collection('Assets').getList(1, 20, {
      filter: `category="${category}"`,
      sort: '-created',
      expand: 'category, logo, file',
    });
    return response;
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return fetchAssetsByCategory(category);
      }
    }
    console.error(`Error fetching assets for category ${category}:`, error);
    throw error;
  }
}