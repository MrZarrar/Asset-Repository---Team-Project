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
    let filterString = '';
    Object.entries(filters).forEach(([key, value]) => {
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

    const response = await pb.collection('assets').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
      expand: 'category', // Add any relations you need to expand
      autoCancel: false // Disable auto-cancellation
    });

    return response;
  } catch (error) {
    // Handle token expiration
    if (error.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the request after refresh
        return fetchAssets(page, perPage, filters);
      }
    }
    console.error("Error fetching assets:", error);
    throw error;
  }
}

// Get a single asset by ID
export async function getAssetById(id) {
  try {
    const asset = await pb.collection('assets').getOne(id, {
      expand: 'category,owner'
    });
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