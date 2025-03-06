<script>
  import { onMount } from 'svelte';
  import { fetchAssets } from '$lib/assetService';
  import pb from '$lib/pocketbase';
  import { page } from '$app/stores';
  
  export let limit = 10; // Number of assets to display
  
  let assets = [];
  let loading = true;
  let error = null;
  
  // Variables for single asset view
  let asset = null;
  
  async function loadAssets() {
    try {
      loading = true;
      const response = await fetchAssets(1, limit);
      assets = response.items;
    } catch (err) {
      error = err.message;
      console.error('Error loading assets:', err);
    } finally {
      loading = false;
    }
  }
  
  onMount(async () => {
    // Check if we're viewing a single asset or the asset list
    const assetId = $page.params?.id;
    
    if (assetId) {
      try {
        // Fetch the single asset from PocketBase
        asset = await pb.collection('assets').getOne(assetId);
      } catch (err) {
        console.error("Error loading asset:", err);
        error = "Failed to load asset details. The asset may not exist.";
      } finally {
        loading = false;
      }
    } else {
      // Load the asset list
      await loadAssets();
    }
  });
</script>

<div class="assets-container">
  {#if loading}
    <div class="loading">Loading assets...</div>
  {:else if error}
    <div class="error">Error: {error}</div>
  {:else if assets.length === 0}
    <div class="empty">No assets found</div>
  {:else}
    <ul class="assets-list">
      {#each assets as asset, i}
        <li class="asset-item">
          <div class="asset-card">
            <h3>Item {i+1}: {asset.name}</h3>
            <div class="asset-details">
              <p><strong>ID:</strong> {asset.asset_id}</p>
              <p><strong>Version:</strong> {asset.version}</p>
              <p><strong>Type:</strong> {asset.type}</p>
              <p><strong>Size:</strong> {formatSize(asset.size)}</p>
              {#if asset.license_info}
                <p><strong>License:</strong> {asset.license_info}</p>
              {/if}
              <p><strong>Last updated:</strong> {new Date(asset.last_updated).toLocaleDateString()}</p>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .assets-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .assets-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    list-style: none;
    padding: 0;
  }
  
  .asset-item {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .asset-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .asset-card {
    padding: 16px;
  }
  
  .asset-card h3 {
    margin-top: 0;
    font-size: 1.2rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
  
  .asset-details p {
    margin: 8px 0;
    font-size: 0.9rem;
  }
  
  .loading, .error, .empty {
    padding: 40px;
    text-align: center;
    font-size: 1.1rem;
  }
  
  .error {
    color: #e74c3c;
  }
</style>

<script context="module">
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  }
</script>

<div class="p-8">
  <div class="mb-6 flex items-center space-x-2 text-sm">
    <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">Home</a>
    <span>»</span>
    <span>Asset Details</span>
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <p class="text-lg text-gray-600 dark:text-gray-400">Loading asset details...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-8">
      <p>{error}</p>
    </div>
  {:else if asset}
    <div class="flex items-start gap-6 mb-8">
      <div class="w-16 h-16 bg-white p-2 rounded-lg shadow-md">
        <!-- Asset Icon could go here -->
      </div>
      
      <div>
        <h1 class="text-3xl font-bold mb-4">{asset.name}</h1>
        <p class="text-gray-600 dark:text-gray-300 max-w-3xl">
          {asset.description || "No description available."}
        </p>
      </div>
    </div>

    <!-- Asset Details Grid -->
    <div class="grid gap-4 mb-8">
      {#if asset.version}
        <div class="border-b border-gray-200 dark:border-gray-700 py-4">
          <div class="font-semibold mb-2">Version</div>
          <div class="text-gray-800 dark:text-gray-200">
            {asset.version}
          </div>
        </div>
      {/if}

      {#if asset.type}
        <div class="border-b border-gray-200 dark:border-gray-700 py-4">
          <div class="font-semibold mb-2">Type</div>
          <div class="text-gray-800 dark:text-gray-200">
            {asset.type}
          </div>
        </div>
      {/if}

      {#if asset.created}
        <div class="border-b border-gray-200 dark:border-gray-700 py-4">
          <div class="font-semibold mb-2">Created</div>
          <div class="text-gray-800 dark:text-gray-200">
            {new Date(asset.created).toLocaleString()}
          </div>
        </div>
      {/if}

      {#if asset.last_updated}
        <div class="border-b border-gray-200 dark:border-gray-700 py-4">
          <div class="font-semibold mb-2">Last Updated</div>
          <div class="text-gray-800 dark:text-gray-200">
            {new Date(asset.last_updated).toLocaleString()}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>