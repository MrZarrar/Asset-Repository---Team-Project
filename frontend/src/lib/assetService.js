import pb from '$lib/pocketbase';
import { refreshToken } from './authManager';

// Fetch all assets with pagination support
export async function fetchAssets(page = 1, perPage = 20, filters = {}) {
  try {
    // Build filter string if needed
    let filterString = '';
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filterString += `${key}="${value}" && `;
      }
    });
    if (filterString) {
      filterString = filterString.slice(0, -4); // Remove trailing ' && '
    }

    const response = await pb.collection('Assets').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
      expand: 'category' // Add any relations you need to expand
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
    const asset = await pb.collection('Assets').getOne(id);
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