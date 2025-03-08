<script>
  import { Search, User, Download, ChevronDown } from "@lucide/svelte";
  import { login, isAuthenticated } from '$lib/auth';
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { fetchAssets } from '$lib/assetService';
  import AssetsList from '../components/AssetsList.svelte';
  // Declare the variable needed for toggling the mobile menu state
  let isMobileMenuOpen = false;
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  // Declare the variable needed for toggling the user menu state
  let isUserMenuOpen = false;
  function toggleUserMenu() {
    // Toggle the user menu and close the download menu if it is open
    isUserMenuOpen = !isUserMenuOpen;
    if (isUserMenuOpen) {
      isDownloadMenuOpen = false;
    }
  }

  let isDownloadMenuOpen = false;
  function toggleDownloadMenu() {
    // Toggle the download menu and close the user menu if it is open
    isDownloadMenuOpen = !isDownloadMenuOpen;
    if (isDownloadMenuOpen) {
      isUserMenuOpen = false;
    }
  }

  let isSearchMenuOpen = false;
  function toggleSearchMenu() {
    isSearchMenuOpen = !isSearchMenuOpen;
  }

  let appMeta = {
    appName: "Loading...",
    appURL: "",
    senderName: "",
    senderAddress: ""
  };
  let loading = true;
  let error = null;

  // Add these variables for assets
  let assets = [];
  let loadingAssets = true;
  let assetError = null;

  // Add this function to authenticate with PocketBase
  async function authenticateAdmin() {
    try {
      // Use your admin/superuser credentials
      // These should be stored securely in environment variables in production
      await pb.admins.authWithPassword('admin@yourdomain.com', 'your-secure-password');
      console.log("Admin authenticated successfully");
      return true;
    } catch (error) {
      console.error("Admin authentication failed:", error);
      return false;
    }
  }

  // Update your onMount function to use proper authentication
  onMount(async () => {
    try {
      // Load app metadata
      appMeta = {
        appName: "Asset Repository",
        appURL: "http://127.0.0.1:8090",
        senderName: "Repository Admin",
        senderAddress: ""
      };
      loading = false;
      
      // Load assets with proper authentication
      loadingAssets = true;
      
      // Try to authenticate if we're not already authenticated
      if (!pb.authStore.isValid) {
        const authenticated = await authenticateAdmin();
        if (!authenticated) {
          assetError = "Authentication failed. Please check PocketBase credentials.";
          loadingAssets = false;
          return;
        }
      }
      
      // Now fetch the assets with our authenticated session
      try {
        const assetResponse = await fetchAssets(1, 6);
        assets = assetResponse.items;
        
        if (assets.length === 0) {
          assetError = "No assets found. Please add assets to your collection.";
        }
      } catch (err) {
        console.error("Error fetching assets:", err);
        assetError = `Failed to load assets: ${err.message}`;
      }
      
      loadingAssets = false;
    } catch (err) {
      console.error("Application initialization failed:", err);
      error = "Failed to initialize application.";
      loading = false;
      loadingAssets = false;
    }
  });

</script>

<style>
input[type="search"]::-webkit-search-cancel-button {
   -webkit-appearance: none;
  display: none;
}

.homepage-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.meta-info {
  margin-top: 1rem;
  color: #666;
}

.error {
  color: #e74c3c;
}
</style>

<svelte:head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>    
</svelte:head>   

  
<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
  <!-- Navigation bar has been removed -->

  <div class="flex">
    <!-- Left Sidebar -->
    <aside class="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Indexed Artifacts</h2>
        <!-- Add your graph component here -->
        <div class="h-48 bg-gray-100 dark:bg-gray-700 rounded"></div>
      </div>

      <div>
        <h2 class="text-xl font-bold mb-4">Popular Categories</h2>
        <ul class="space-y-2">
          <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Testing Frameworks & Tools</a></li>
          <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Android Packages</a></li>
            <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Logging Frameworks</a></li>
          <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">JVM Languages</a></li>
          <!-- Add more categories as needed -->
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1">
      <section class="py-8">
        <div class="container mx-auto px-4">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Most Popular
          </h1>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
            {#if loadingAssets}
              <div class="col-span-full text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-200"></div>
                <p class="mt-2 text-gray-600 dark:text-gray-400">Loading assets...</p>
              </div>
            {:else if assetError}
              <div class="col-span-full text-center py-8">
                <p class="text-red-500">{assetError}</p>
              </div>
            {:else if assets.length === 0}
              <div class="col-span-full text-center py-8">
                <p class="text-gray-600 dark:text-gray-400">No assets found.</p>
              </div>
            {:else}
              {#each assets as asset, i}
                <div class="relative w-64 group">
                  <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-all duration-1000 group-hover:duration-200"></div>
                  <div class="relative h-full bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-md">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{asset.name || `Asset ${i+1}`}</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {#if asset.version}v{asset.version}{/if}
                      {#if asset.type} · {asset.type}{/if}
                    </p>
                    <a href={`/details_page/${asset.id}`} class="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-all duration-300">
                      {asset.description || "View details"}
                    </a>
                    {#if asset.last_updated}
                      <p class="mt-2 text-xs text-gray-400">
                        Updated: {new Date(asset.last_updated).toLocaleDateString()}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </section>    
    </div>

    <!-- Right Sidebar -->
    <aside class="hidden xl:block w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 min-h-screen">
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Indexed Repositories</h2>
        <!-- svelte-ignore a11y-missing-attribute -->
        <ul class="space-y-2">
          <li><a class="block text-gray-700 dark:text-gray-300 hover:scale-105 transition-all duration-300">Central</a></li>
          <li><a class="block text-gray-700 dark:text-gray-300 hover:scale-105 transition-all duration-300">Atlassian</a></li>
          <li><a class="block text-gray-700 dark:text-gray-300 hover:scale-105 transition-all duration-300">WSO2 Releases</a></li>
        </ul>
      </div>

      <div>
        <h2 class="text-xl font-bold mb-4">Popular Tags</h2>
        <!-- svelte-ignore a11y-missing-attribute -->
        <div class="flex flex-wrap gap-2">
          <a class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">android</a>
          <a class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">api</a>
          <a class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">maven</a>
          <!-- Add more tags as needed -->
        </div>
      </div>
    </aside>
  </div>

  <div class="homepage-container">
    {#if loading}
      <p>Loading application details...</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else}
      <header>
        <h1>{appMeta.appName}</h1>
        <div class="meta-info">
          <p>Visit us at: <a href={appMeta.appURL}>{appMeta.appURL}</a></p>
          {#if appMeta.senderName}
            <p>Contact: {appMeta.senderName}</p>
          {/if}
        </div>
      </header>
      
      <!-- Rest of your homepage content -->
    {/if}
  </div>
</main>
