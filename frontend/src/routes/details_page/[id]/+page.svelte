<script>
  import { Search, User, Download, ChevronDown } from "@lucide/svelte";
  import { login, isAuthenticated } from '$lib/auth';
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { page } from '$app/stores';

  let editing = false;

  const assetId = $page.params.id;
  
  let isMobileMenuOpen = false;
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  let isUserMenuOpen = false;
  function toggleUserMenu() {
    isUserMenuOpen = !isUserMenuOpen;
    if (isUserMenuOpen) {
      isDownloadMenuOpen = false;
    }
  }

  let isDownloadMenuOpen = false;
  function toggleDownloadMenu() {
    isDownloadMenuOpen = !isDownloadMenuOpen;
    if (isDownloadMenuOpen) {
      isUserMenuOpen = false;
    }
  }

  let isSearchMenuOpen = false;
  function toggleSearchMenu() {
    isSearchMenuOpen = !isSearchMenuOpen;
  }

  // Add asset-specific variables
  let asset = {
    logo: "",
    name: "",
    version: "",
    size: 0,
    type: "",
    date_updated: "",
    date_created: "",
    licence_info: "",
    usage_info: "",
    file: "",
    
  };
  
  // metadata variables
  let appMeta = {
    appName: "Loading...",
    appURL: "",
    senderName: "",
    senderAddress: ""
  };
  let loading = true;
  let error = null;

  //  download variables
  let downloading = false;
  let downloadError = null;
  let availableFields = [];

  // Function to fetch a specific asset by id
  async function fetchAssetById(id) {
    try {
      const record = await pb.collection('assets').getOne(id, { expand: 'logo' });
      return record;
    } catch (err) {
      console.error("Error fetching asset:", err);
      throw err;
    }
  }

  // Add the onMount function to load metadata
  onMount(async () => {
    try {
      // Load app metadata
      appMeta = {
        appName: "Asset Repository",
        appURL: "http://127.0.0.1:8090",
        senderName: "Repository Admin",
        senderAddress: ""
      };
      
      // Fetch specific asset details using the id from the route
      if (assetId) {
        try {
          asset = await fetchAssetById(assetId);
        } catch (err) {
          error = `Failed to load asset details: ${err.message}`;
        }
      }
      
      loading = false;
      
      if (asset) {
        updatedAsset = { ...asset }; // Initialize updatedAsset with the fetched asset data
        console.log("Asset data:", asset);
        availableFields = Object.keys(asset);
        console.log("Available fields:", availableFields);
        
        //  log the meta_data field
        if (asset.meta_data) {
          console.log("meta_data content:", asset.meta_data);
          
          // If its a string that looks like json, try to parse it
          if (typeof asset.meta_data === 'string' && 
              (asset.meta_data.startsWith('{') || asset.meta_data.startsWith('['))) {
            try {
              const parsedData = JSON.parse(asset.meta_data);
              console.log("Parsed meta_data:", parsedData);
            } catch (e) {
              console.log("meta_data is not valid JSON");
            }
          }
        }
      }
      
    } catch (err) {
      console.error("Application initialization failed:", err);
      error = "Failed to initialize application.";
      loading = false;
    }
  });

  async function updateAsset() {
    try {
      const updatedRecord = await pb.collection('assets').update(assetId, updatedAsset);
      asset = { ...updatedRecord }; // Update the asset with the new data
      updatedAsset = { ...updatedRecord }; // Ensure updatedAsset is also updated
      editing = false; // Exit edit mode after saving
      console.log("Asset updated successfully:", updatedRecord);
    } catch (err) {
      console.error("Error updating asset:", err);
    }
  }

  /**
   * Function to download an asset file from meta_data
   */
   async function downloadAsset() {
    if (!asset || !asset.id || !asset.file) {
        console.error("Cannot download: Asset information is missing");
        return;
    }

    try {
        const fileUrl = `http://127.0.0.1:8090/api/files/assets/${asset.id}/${asset.file}`;

        // Fetch the file as a blob
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Create a temporary link element and trigger the download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = asset.file; // Use the original file name
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error("Download failed:", err);
    }
}

  /**
   * Formats a file size in bytes to a human-readable string
   */
  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  let updatedAsset = { ...asset };

</script>

<style>
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
  display: none;
}

/* Add some style for the downloading state */
.downloading {
  opacity: 0.7;
  cursor: not-allowed;
}

.download-error {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

input.editing, textarea.editing {
  color: black;
}
</style>

<svelte:head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{asset ? asset.name : 'Asset Details'}</title>    
</svelte:head>   

  
<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">

      
  <nav class="bg-gray-200 dark:bg-gray-800">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <!-- Mobile menu button (visible on mobile) -->
        <div class="absolute inset-y-0 left-0 flex items-center md:hidden">
          <button type="button"
            on:click={toggleMobileMenu}
            class="relative inline-flex items-center justify-center rounded-md p-2 dark:text-gray-400 hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset"
            aria-controls="mobile-menu" 
            aria-expanded={isMobileMenuOpen}>
            <span class="absolute -inset-0.5"></span>
            <span class="sr-only">Open main menu</span>
            <!-- Icon when menu is closed -->
            <svg class={!isMobileMenuOpen ? 'block size-6' : 'hidden size-6'} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <!-- Icon when menu is open -->
            <svg class={isMobileMenuOpen ? 'block size-6' : 'hidden size-6'} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Desktop navigation links (visible only on md and up) -->
        <div class="hidden md:ml-3 md:block">
          <!-- svelte-ignore a11y-missing-attribute -->
          <div class="flex space-x-4"> 
            <a class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all duration-300" aria-current="page">
              Dashboard
            </a>
            <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700  hover:scale-105 transition-all duration-300">
              Team
            </a>
            <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700  hover:scale-105 transition-all duration-300">
              Projects
            </a>
            <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700  hover:scale-105 transition-all duration-300">
              Documentation
            </a>
          </div>
        </div>

        <div class="w-full flex justify-center md:justify-start">
          <div class="w-full max-w-[150px] xs:max-w-[120px] md:max-w-xl">
            <div class="relative flex w-full">
             <div class="relative hidden md:block">
                <button
                  on:click={toggleSearchMenu}
                  id="dropdown-button"
                  data-dropdown-toggle="dropdown"
                  type="button"
                  class="inline-flex items-center py-2 px-2 text-sm font-medium rounded-l-md border border-gray-900 bg-black text-white hover:bg-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-400 dark:hover:bg-gray-600 focus:ring-1 focus:ring-blue-600 transition-all duration-300"
                >
                  All categories
                  <ChevronDown class="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                </button>
                <div
                  class={`${isSearchMenuOpen ? 'block' : 'hidden'}
                  absolute z-50 mt-2 bg-gray-200 dark:bg-gray-700 divide-y divide-gray-600 rounded-lg shadow-lg `}
                >
                  <ul class="py-2 text-sm text-gray-900 dark:text-gray-200">
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Jar Files
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Shared Libraries
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Scripts
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Python Scripts
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="relative flex-1">
                <input
                  type="search"
                  id="search-dropdown"
                  class="block w-full p-2 md:p-2 text-sm md:text-sm bg-gray-200 text-black-400 dark:text-gray-200 dark:bg-gray-600 border border-gray-600 dark:border-gray-400 rounded-md md:rounded-l-none md:border-l-0 hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600 focus:ring-1 focus:outline-none transition-all duration-300"
                  placeholder="Search..."
                  required
                />
                <button
                  type="submit"
                  class="absolute inset-y-0 right-0 flex items-center px-2 md:px-3 text-black dark:text-gray-300 hover:text-white"
                >
                  <Search class="w-3 h-3 md:w-4 md:h-4" />
                  <span class="sr-only">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop right icons (Download and Profile; visible only on md and up) -->
        <!-- <div class="md:flex md:flex-nowrap md:items-center md:ml-6 md:pr-0 space-x-3"> -->
          <div class="relative ml-1">
            <button type="button"
              on:click={toggleDownloadMenu}
              class="rounded-full text-black dark:bg-gray-800 p-1 dark:text-gray-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">View notifications</span>
              <Download class="size-6" />
            </button>   
            <div class={`${isDownloadMenuOpen ? 'block' : 'hidden'} absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md dark:bg-gray-800 dark:text-white bg-white py-1  shadow-lg ring-1 ring-black/5 focus:outline-hidden`}
              role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
              <span class="block px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300">Nothing is downloaded yet.</span>
            </div>
          </div>

          <!-- Profile dropdown -->
          <div class="relative ml-5">
            <button type="button"
              on:click={toggleUserMenu}
              class="flex rounded-full dark:text-gray-400 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300"
              id="user-menu-button" aria-expanded={isUserMenuOpen} aria-haspopup="true">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">Open user menu</span>
              <User class="size-6" />
            </button>
            <div class={`${isUserMenuOpen ? 'block' : 'hidden'} absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 py-1 ring-1 shadow-lg ring-black/5 focus:outline-hidden`}
              role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
              <a href="/profile" class="block px-4 py-2 text-sm font-semibold  hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-0">Your Profile</a>    
              <a class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">Settings</a>    
              <a class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-2">Sign out</a>
            </div>
          </div>
        </div>
      <!-- </div> -->
    </div>

    <!-- Mobile Menu (visible only on screens below md) -->
    <div class={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
      <!-- svelte-ignore a11y-missing-attribute -->
      <div class="space-y-1 px-2 pt-2 pb-3">
        <a class="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white" aria-current="page">
          Dashboard
        </a>
        <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300">
          Team
        </a>
        <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300">
          Projects
        </a>
        <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300">
          Documentation
        </a>
      </div>
    </div>
  </nav>      

  <div class="flex">
    <!-- Left Sidebar -->
    <aside class="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Indexed Artifacts</h2>
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
        </ul>
      </div>
    </aside>

    <div class="flex-1 p-8">
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
      {:else}
        <div class="flex items-start gap-6 mb-8">
          <div class="w-16 h-16 bg-grey p-1 rounded-lg shadow-md">
            {#if asset.logo}
              <img src={`http://127.0.0.1:8090/api/files/assets/${asset.id}/${asset.logo}`} alt="Asset Logo" class="w-full h-full object-cover rounded-lg" />
            {:else}
              <!-- Placeholder for logo if not available -->
              <div class="w-full h-full flex items-center justify-center text-gray-400">No Logo</div>
            {/if}
          </div>
          
          <div>
            <h1 class="text-3xl font-bold mb-4">
              {#if editing}
                <input type="text" bind:value={updatedAsset.name} class="border rounded p-2 w-full editing" />
              {:else}
                {asset ? asset.name : 'Asset Not Found'}
              {/if}
            </h1>
            <p class="text-gray-600 dark:text-gray-300 max-w-3xl">
              {#if editing}
                <textarea bind:value={updatedAsset.usage_info} class="border rounded p-2 w-full editing"></textarea>
              {:else}
                {asset ? asset.usage_info : "Unable to find the requested asset."}
              {/if}
            </p>
          </div>
        </div>

        <!-- Asset Details -->
        {#if asset}
          <div class="grid gap-4 mb-8">
            <!-- asset version -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Version</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="text" bind:value={updatedAsset.version} class="border rounded p-2 w-full editing" />
                {:else}
                  {asset.version || "Not specified"}
                {/if}
              </div>
            </div>

            <!-- asset type -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Type</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="text" bind:value={updatedAsset.type} class="border rounded p-2 w-full editing" />
                {:else}
                  {asset.type || "Not specified"}
                {/if}
              </div>
            </div>

            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Last Updated</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="date" bind:value={updatedAsset.date_updated} class="border rounded p-2 w-full editing" />
                {:else}
                  {asset.date_updated ? new Date(asset.date_updated).toISOString().split('T')[0] : "Not specified"}
                {/if}
              </div>
            </div>

            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Created</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="date" bind:value={updatedAsset.date_created} class="border rounded p-2 w-full editing" />
                {:else}
                  {asset.date_created ? new Date(asset.date_created).toISOString().split('T')[0] : "Not specified"}
                {/if}
              </div>
            </div>

            <!-- download Link -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Download</div>
              <div class="flex items-center gap-2">
                <button 
                  on:click={downloadAsset}
                  disabled={downloading}
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:scale-105 transition-all duration-300 hover:bg-blue-700 transition-colors flex items-center gap-2 {downloading ? 'downloading' : ''}"
                >
                  {#if downloading}
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Downloading...
                  {:else}
                    <Download class="w-4 h-4" />
                    Download Asset
                  {/if}
                </button>

                <button
                  on:click={() => editing = !editing}
                  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2 mr-0"
                >
                  {editing ? "Cancel" : "Edit Asset"}
                </button>

                {#if editing}
                  <button
                    on:click={updateAsset}
                    class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
                  >
                    Save
                  </button>
                {/if}
              </div>
              
              {#if downloadError}
                <div class="download-error mt-2">
                  Error: {downloadError}
                </div>
              {/if}
              
              {#if asset.size}
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Size: {formatFileSize(asset.size)}
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-md mb-2">
            <p>Asset with ID "{assetId}" could not be found.</p>
          </div>
        {/if}
      {/if}

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
        </div>
      </div>

      
    </aside>
  </div>
</main>