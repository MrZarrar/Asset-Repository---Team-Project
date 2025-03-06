<script>
  import { onMount } from 'svelte';
  import { fetchAssets } from '$lib/assetService';
  import { authStore, initAuth } from '$lib/authManager';
  
  let assets = [];
  let isLoading = true;
  let error = null;
  let page = 1;
  let totalPages = 1;
  let filters = {};
  
  // Initialize auth from stored token
  onMount(async () => {
    initAuth();
    loadAssets();
  });
  
  async function loadAssets() {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetchAssets(page, 10, filters);
      assets = response.items;
      totalPages = Math.ceil(response.totalItems / response.perPage);
    } catch (err) {
      error = err.message || "Failed to load assets";
      console.error("Asset loading error:", err);
    } finally {
      isLoading = false;
    }
  }
  
  function nextPage() {
    if (page < totalPages) {
      page++;
      loadAssets();
    }
  }
  
  function prevPage() {
    if (page > 1) {
      page--;
      loadAssets();
    }
  }
  
  function applyFilters(newFilters) {
    filters = newFilters;
    page = 1; // Reset to first page when filters change
    loadAssets();
  }
</script>

<svelte:head>
  <title>Home | Asset Management</title>
</svelte:head>

<main>
  <h1>Asset Library</h1>
  
  {#if $authStore.isAuthenticated}
    <div class="user-welcome">
      Welcome, {$authStore.user.username}!
    </div>
  {/if}
  
  <div class="filters">
    <!-- Add your filter UI elements here -->
    <!-- For example: -->
    <input type="text" placeholder="Search by name" 
      on:input={(e) => applyFilters({...filters, name: e.target.value})} />
    <!-- Add more filters as needed -->
  </div>
  
  {#if isLoading}
    <div class="loading">Loading assets...</div>
  {:else if error}
    <div class="error">
      <p>Error: {error}</p>
      <button on:click={loadAssets}>Retry</button>
    </div>
  {:else if assets.length === 0}
    <div class="empty-state">No assets found.</div>
  {:else}
    <div class="assets-grid">
      {#each assets as asset (asset.id)}
        <div class="asset-card">
          {#if asset.file}
            <img src={`http://127.0.0.1:8090/api/files/assets/${asset.id}/${asset.file}`} 
                alt={asset.name || 'Asset'} />
          {/if}
          <h3>{asset.name}</h3>
          <p>{asset.description}</p>
          <a href={`/assets/${asset.id}`}>View Details</a>
        </div>
      {/each}
    </div>
    
    <div class="pagination">
      <button disabled={page === 1} on:click={prevPage}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page === totalPages} on:click={nextPage}>Next</button>
    </div>
  {/if}
  
  {#if $authStore.isAuthenticated}
    <a href="/assets/new" class="button create-asset">Add New Asset</a>
  {/if}
</main>

<style>
  .assets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }
  
  .asset-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s ease;
  }
  
  .asset-card:hover {
    transform: translateY(-5px);
  }
  
  .asset-card img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin: 20px 0;
  }
  
  .create-asset {
    display: block;
    width: max-content;
    margin: 20px auto;
    padding: 10px 20px;
    background: #4a80f5;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
  }
</style> 