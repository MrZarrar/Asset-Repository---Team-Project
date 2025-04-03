<script>
  import { Search, User, Download, ChevronDown, Plus, Upload, Check, X } from "@lucide/svelte";
  import { login, isAuthenticated } from '$lib/auth';
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { fetchAssets, getAssetsByFilters, fetchAssetsByCategory } from '$lib/assetService';
  import AssetsList from '../components/AssetsList.svelte';
  import { logActions } from '../js/logging.pb.js';
  import { user } from '$lib/user.js';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';


  $: role = $user.role;
  
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

  // Add these variables for adding a new asset
  let addingAsset = false;
  let newAsset = {
    id: "",
    logo: null,
    name: "",
    version: "",
    size: 0,
    type: "",
    date_updated: "",
    date_created: "",
    licence_info: "",
    usage_info: "",
    maven_dependency: "",
    gradle_dependency: "",
    file: null,
  };

  // Add state variables to track copy status for each asset
  let mavenCopiedIndex = -1;
  let gradleCopiedIndex = -1;

  // Function to handle copying with visual feedback
  function copyToClipboard(text, type, index) {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'maven') {
        mavenCopiedIndex = index;
        setTimeout(() => mavenCopiedIndex = -1, 2000); // Reset after 2 seconds
      } else if (type === 'gradle') {
        gradleCopiedIndex = index;
        setTimeout(() => gradleCopiedIndex = -1, 2000); // Reset after 2 seconds
      }
    });
  }



  // Modify the addAsset function to ensure it correctly handles the POM file
  async function addAsset() {
    try {
      // Set id to undefined if left blank
      if (!newAsset.id) {
        newAsset.id = undefined;
      }

      // Check if we have a POM file in newAsset
      if (!newAsset.file && newAsset.type === 'maven') {
        console.log("No POM file found, searching for it...");
        // Try to fetch POM file as a backup if not already present
        try {
          const groupId = newAsset.id.split(':')[0];
          const artifactId = newAsset.id.split(':')[1] || newAsset.name;
          const version = newAsset.version;
          
          const response = await fetch(
            `/api/maven/pom?groupId=${encodeURIComponent(groupId)}&artifactId=${encodeURIComponent(artifactId)}&version=${encodeURIComponent(version)}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const pomContent = data.pomContent;
            
            // Create a Blob with the POM content
            const pomBlob = new Blob([pomContent], { type: 'application/xml' });
            
            // Create a File object from the Blob
            newAsset.file = new File([pomBlob], `${artifactId}-${version}.pom`, { 
              type: 'application/xml',
              lastModified: new Date().getTime()
            });
            
            console.log('POM file created successfully as backup');
          }
        } catch (e) {
          console.error('Error creating backup POM file:', e);
          // Continue without POM file if fetch fails
        }
      }
      
      // Set add_type based on user role
      newAsset.add_type = role === 'admin' ? 'original' : 'added';

      // Now continue with your existing form submission
      // Create form data for the API call
      const formData = new FormData();
      
      // Add all form fields
      for (const [key, value] of Object.entries(newAsset)) {
        if (value !== null && value !== undefined) {
          if (key === 'file' || key === 'logo') {
            if (value instanceof File) {
              formData.append(key, value, value.name);
            }
          } else {
            formData.append(key, value);
          }
        }
      }
      
      // Your existing API call to save the asset
      const createdRecord = await pb.collection('assets').create(formData);
      
      addingAsset = false;
      console.log("Asset added successfully:", createdRecord);

        // Create a new asset record        
        // Add the new asset to the list (ensure reactivity)
        assets = [...assets, createdRecord];

        // Reset form fields
        newAsset = {
            id: "",
            logo: null,
            name: "",
            version: "",
            size: 0,
            type: "",
            date_updated: "",
            date_created: "",
            licence_info: "",
            usage_info: "",
            maven_dependency: "",
            gradle_dependency: "",
            file: null,
        };

        addingAsset = false; // Exit add mode after saving
        console.log("Asset added successfully:", createdRecord);

        // Log creation of new asset
        logActions("added", assetId, $user.email);
        
    } catch (err) {
      console.error("Error adding asset:", err);
      assetError = `Failed to add asset: ${err.message}`;
    }
  }

  // Add the copyAsset function
  let showCopyPopup = false;

  async function copyAsset(asset) {
    try {
      // Fetch the original file and logo
      let fileBlob = null;
      let logoBlob = null;

      if (asset.file) {
        const fileUrl = pb.files.getUrl(asset, asset.file);
        const fileResponse = await fetch(fileUrl);
        if (fileResponse.ok) {
          fileBlob = await fileResponse.blob();
        } else {
          console.error('Failed to fetch the file for copying.');
        }
      }

      if (asset.logo) {
        const logoUrl = pb.files.getUrl(asset, asset.logo);
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          logoBlob = await logoResponse.blob();
        } else {
          console.error('Failed to fetch the logo for copying.');
        }
      }

      // Prepare the copied asset data
      const copiedAsset = {
        ...asset,
        owner_id: $user.userid,
        add_type: 'copied',
        id: undefined, // Remove the ID to create a new asset
        created: undefined, // Remove timestamps
        updated: undefined,
      };

      // Create FormData for the new asset
      const formData = new FormData();
      Object.entries(copiedAsset).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Attach the file and logo blobs if they exist
      if (fileBlob) {
        formData.append('file', fileBlob, asset.file);
      }
      if (logoBlob) {
        formData.append('logo', logoBlob, asset.logo);
      }

      // Create the new asset in PocketBase
      const createdRecord = await pb.collection('assets').create(formData);
      console.log('Asset copied successfully:', createdRecord);

      // Show the popup notification
      showCopyPopup = true;

      // Automatically hide the popup after 5 seconds
      setTimeout(() => {
        showCopyPopup = false;
      }, 5000);
    } catch (err) {
      console.error("Error copying asset:", err);
      alert("Failed to copy asset. Please try again.");
    }
  }

  function closeCopyPopup() {
    showCopyPopup = false;
  }

  // Pagination variables
  let currentPage = 1;
  let totalPages = 1;

  // Function to fetch assets with pagination
  async function fetchPaginatedAssets(page = 1) {
    try {
      loadingAssets = true;
      const assetResponse = await fetchAssets(page, 6, { add_type: ['original', 'added'] });
      assets = assetResponse.items;
      totalPages = assetResponse.totalPages || 1;
      currentPage = page;
      if (assets.length === 0) {
        assetError = "No assets found. Please add assets to your collection.";
      }
    } catch (err) {
      console.error("Error fetching assets:", err);
      assetError = `Failed to load assets: ${err.message}`;
    } finally {
      loadingAssets = false;
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
      
      try {
        const assetResponse = await fetchAssets(1, 6, { add_type: ['original', 'added'] });
        console.log(assetResponse.items);
        // Filter out assets with add_type: 'copied'
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

    await fetchPaginatedAssets(currentPage);

    // Add event listener for chatbot interaction
    const createAssetHandler = (event) => {
      // Redirect to the workspace page instead of opening the asset form
      window.location.href = '/Workspace';
    };
    
    window.addEventListener('createMavenAsset', createAssetHandler);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('createMavenAsset', createAssetHandler);
    };
  });

  let selectedCategories = []; // Use array for multiple filters

  async function filterByCategory(category) {
    // Toggle category in selectedCategories
    if (selectedCategories.includes(category)) {
      selectedCategories = selectedCategories.filter(c => c !== category);
    } else {
      selectedCategories = [...selectedCategories, category];
    }
    try {
      loadingAssets = true;
      // If no category is selected, use default filter
      const filters = selectedCategories.length 
        ? { category: selectedCategories }
        : { add_type: ['original', 'added'] };
      const assetResponse = await fetchAssets(1, 6, filters);
      assets = assetResponse.items;
      totalPages = assetResponse.totalPages || 1;
      currentPage = 1;
      assetError = assets.length === 0 ? `No assets found for selected filter(s)` : null;
    } catch (err) {
      console.error(`Error fetching assets for filters ${JSON.stringify(selectedCategories)}:`, err);
      assetError = `Failed to load assets for selected categories`;
    } finally {
      loadingAssets = false;
    }
  }

  async function clearFilters() {
    selectedCategories = [];
    try {
      loadingAssets = true;
      const assetResponse = await fetchAssets(1, 6, { add_type: ['original', 'added'] });
      assets = assetResponse.items;
      totalPages = assetResponse.totalPages || 1;
      currentPage = 1;
      assetError = assets.length === 0 ? `No assets found.` : null;
    } catch (err) {
      console.error("Error clearing filters:", err);
      assetError = `Failed to load assets.`;
    } finally {
      loadingAssets = false;
    }
  }

  async function removeFilter(filter) {
    selectedCategories = selectedCategories.filter(c => c !== filter);
    try {
      loadingAssets = true;
      const filters = selectedCategories.length 
        ? { category: selectedCategories }
        : { add_type: ['original', 'added'] };
      const assetResponse = await fetchAssets(1, 6, filters);
      assets = assetResponse.items;
      totalPages = assetResponse.totalPages || 1;
      currentPage = 1;
      assetError = assets.length === 0 ? `No assets found for selected filter(s)` : null;
    } catch (err) {
      console.error(`Error fetching assets after removing filter:`, err);
      assetError = `Failed to load assets for selected categories`;
    } finally {
      loadingAssets = false;
    }
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      fetchPaginatedAssets(page);
    }
  }

  let selectedAssets = new Set();

  function toggleAssetSelection(assetId) {
    if (selectedAssets.has(assetId)) {
      selectedAssets.delete(assetId);
    } else {
      selectedAssets.add(assetId);
    }
    selectedAssetsCount = selectedAssets.size; // Update the count immediately
  }

  let showConfirmPopup = false;
  let showDeletePopup = false;

  async function deleteSelectedAssets() {
    if (selectedAssets.size === 0) return;

    if (!showConfirmPopup) {
      showConfirmPopup = true;
      return;
    }

    try {
      for (const assetId of selectedAssets) {
        await pb.collection('assets').delete(assetId);
      }
      selectedAssets.clear();
      clearAllSelections(); // Clear selections after deletion
      await fetchPaginatedAssets(currentPage); // Refresh the asset list

      // Show the delete popup notification
      showDeletePopup = true;

      // Automatically hide the popup after 2 seconds
      setTimeout(() => {
        showDeletePopup = false;
      }, 2000);
    } catch (err) {
      console.error("Error deleting selected assets:", err);
      alert("Failed to delete selected assets. Please try again.");
    } finally {
      showConfirmPopup = false;
    }
  }

  function cancelDelete() {
    showConfirmPopup = false;
  }

  function goToDashboard() {
    window.location.href = '/';
  }

  function goToWorkspace() {
    window.location.href = '/Workspace';
  }

  // Reactive statement to update the count of selected assets
  $: selectedAssetsCount = selectedAssets.size;

  function selectAllAssets() {
    selectedAssets = new Set(assets.map(asset => asset.id)); // Create a new Set to ensure reactivity
    selectedAssetsCount = selectedAssets.size; // Update the count
  }

  async function clearAllSelections() {
    selectAllAssets(); // Select all assets first
    await new Promise(resolve => setTimeout(resolve, 1)); 
    selectedAssets = new Set(); // Clear the selected assets
    selectedAssetsCount = selectedAssets.size; // Update the count
    assets = assets.map(asset => ({ ...asset })); // Trigger reactivity by creating a new array
  }
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

input.editing, textarea.editing {
  background-color: #2d3748; /* Grey background */
  color: white; /* White text */
}

input[type="file"].hidden {
  display: none;
}

/* Pulse Animation for Success */
.success-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: pulse 1.5s ease-in-out infinite;
}

.success-icon {
  color: white;
  opacity: 0;
  animation: fade-in 0.5s ease-in-out 0.3s forwards;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.checkbox {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.25rem;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

/* Light mode hover state */
.checkbox:hover {
  border-color: #2563eb;
}

/* Light mode checked state */
.checkbox:checked {
  background-color: #2563eb;
  border-color: #2563eb;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20.285 6.707l-11.285 11.285-5.285-5.285 1.414-1.414 3.871 3.871 9.871-9.871z'/%3E%3C/svg%3E");
  background-size: 1rem;
  background-position: center;
  background-repeat: no-repeat;
}

/* System dark mode preferences */
@media (prefers-color-scheme: dark) {
  .checkbox {
    border: 2px solid #4b5563;
    background-color: #1f2937;
  }

  .checkbox:hover {
    border-color: #3b82f6;
  }

  .checkbox:checked {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }
}

/* Tailwind dark mode class */
:global(.dark) .checkbox {
  border: 2px solid #4b5563;
  background-color: #1f2937;
}

:global(.dark) .checkbox:hover {
  border-color: #3b82f6;
}

:global(.dark) .checkbox:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.asset-checkbox {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

/* Add styles for the delete popup */
.delete-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.delete-icon {
  width: 24px;
  height: 4px;
  background-color: white;
  border-radius: 2px;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
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
        {#if selectedCategories.length > 0}
          <button
            class="mb-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            on:click={clearFilters}
          >
            Clear Filters
          </button>
          <div class="mb-2">
            {#each selectedCategories as filter}
              <span class="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300 mr-2">
                {filter}
                <button class="ml-1 text-red-500 hover:text-red-700" on:click={() => removeFilter(filter)}>
                  x
                </button>
              </span>
            {/each}
          </div>
        {/if}
        <ul class="space-y-2">
          <li>
            <button
              class="text-blue-600 dark:text-blue-400 hover:underline"
              on:click={() => filterByCategory('Testing Frameworks & Tools')}
            >
              Testing Frameworks & Tools
            </button>
          </li>
          <li>
            <button
              class="text-blue-600 dark:text-blue-400 hover:underline"
              on:click={() => filterByCategory('Android Packages')}
            >
              Android Packages
            </button>
          </li>
          <li>
            <button
              class="text-blue-600 dark:text-blue-400 hover:underline"
              on:click={() => filterByCategory('Logging Frameworks')}
            >
              Logging Frameworks
            </button>
          </li>
          <li>
            <button
              class="text-blue-600 dark:text-blue-400 hover:underline"
              on:click={() => filterByCategory('JVM Languages')}
            >
              JVM Languages
            </button>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1">
      <section class="py-8">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Latest Assets'}
            </h1>
            {#if selectedAssetsCount > 0}
              <div class="flex items-center gap-2">
                <button
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                  on:click={selectAllAssets}
                >
                  Select All
                </button>
                <button
                  class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                  on:click={clearAllSelections}
                >
                  Clear All
                </button>
                <button
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                  on:click={deleteSelectedAssets}
                >
                  <X class="w-4 h-4" />
                  Delete Selected ({selectedAssetsCount})
                </button>
              </div>
            {/if}
          </div>
          
          <!-- Rest of your content here -->
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
            {:else}
              {#each assets as asset, i}
                <div class="relative w-64 group">
                  <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-all duration-1000 group-hover:duration-200"></div>
                  <div class="relative h-full bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-md">
                    <!-- Checkbox -->
                    <input
                      type="checkbox"
                      class="checkbox asset-checkbox"
                      checked={selectedAssets.has(asset.id)}
                      on:change={() => toggleAssetSelection(asset.id)}
                    />

                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{asset.name || `Asset ${i+1}`}</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {#if asset.version}v{asset.version}{/if}
                      {#if asset.type} · {asset.type}{/if}
                    </p>
                    <div class="flex justify-between items-center">
                      <a href={`/details_page/${asset.id}?from=home`} class="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-all duration-300">
                        {asset.description || "View details"}
                      </a>
                      
                      <!-- Copy button moved next to "View details" -->
                      {#if $user.role !== 'viewer'}
                        <button
                          class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                          on:click={() => copyAsset(asset)}
                        >
                          <Plus class="w-3 h-3" />
                          Copy
                        </button>
                      {/if}
                    </div>
                    
                    <!-- Maven dependency info for maven/java assets -->
                    {#if asset.type === 'maven'}
                      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div class="flex mt-1 space-x-1">
                          <button 
                            class="px-2 py-1 text-xs {mavenCopiedIndex === i ? 'bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {mavenCopiedIndex === i ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                            on:click|stopPropagation={(e) => {
                              e.preventDefault();
                              const xmlDependency = `<dependency>\n    <groupId>${asset.id?.split(':')[0] || 'com.example'}</groupId>\n    <artifactId>${asset.id?.split(':')[1] || asset.name}</artifactId>\n    <version>${asset.version || '1.0.0'}</version>\n</dependency>`;
                              copyToClipboard(xmlDependency, 'maven', i);
                            }}
                          >
                            {#if mavenCopiedIndex === i}
                              <Check class="w-3 h-3" />
                              Copied!
                            {:else}
                              Copy Mvn XML
                            {/if}
                          </button>
                          <button 
                            class="px-2 py-1 text-xs {gradleCopiedIndex === i ? 'bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {gradleCopiedIndex === i ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                            on:click|stopPropagation={(e) => {
                              e.preventDefault();
                              const gradleDependency = `implementation '${asset.id || `com.example:${asset.name}`}:${asset.version || '1.0.0'}'`;
                              copyToClipboard(gradleDependency, 'gradle', i);
                            }}
                          >
                            {#if gradleCopiedIndex === i}
                              <Check class="w-3 h-3" />
                              Copied!
                            {:else}
                              Copy Gradle
                            {/if}
                          </button>
                          
                          <!-- Download button added inside the button group -->
                          {#if asset.file}
                            <a 
                              href={pb.files.getUrl(asset, asset.file)} 
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                              on:click|stopPropagation
                            >
                              <Download class="w-3 h-3" />
                            </a>
                          {/if}
                        </div>
                      </div>
                    {:else}
                      <!-- For non-maven assets, still show download button if available -->
                      {#if asset.file}
                        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                          <div class="flex mt-1 space-x-1">
                            <a 
                              href={pb.files.getUrl(asset, asset.file)} 
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                              on:click|stopPropagation
                            >
                              <Download class="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      {/if}
                    {/if}
                    
                    {#if asset.last_updated || asset.date_updated}
                      <p class="mt-2 text-xs text-gray-400">
                        Updated: {new Date(asset.last_updated || asset.date_updated).toLocaleDateString()}
                      </p>
                    {/if}
                    
                    {#if asset.licence_info}
                      <p class="mt-1 text-xs text-gray-400">
                        License: {asset.licence_info.length > 20 ? asset.licence_info.substring(0, 20) + '...' : asset.licence_info}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <!-- Pagination controls -->
          {#if totalPages > 1}
            <div class="flex justify-center mt-6 space-x-2">
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                on:click={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <!-- Show pagination with ellipses -->
              {#if totalPages <= 4}
                {#each Array(totalPages).fill(0) as _, i}
                  <button
                    class="px-3 py-1 {currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                    on:click={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                {/each}
              {:else}
                <!-- First page always shown -->
                <button
                  class="px-3 py-1 {currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                  on:click={() => goToPage(1)}
                >
                  1
                </button>
                
                <!-- Ellipsis at the beginning if needed -->
                {#if currentPage > 2}
                  <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                {/if}
                
                <!-- Pages around current page -->
                {#each Array(totalPages).fill(0) as _, i}
                  {#if i + 1 !== 1 && i + 1 !== totalPages && Math.abs(currentPage - (i + 1)) < 2}
                    <button
                      class="px-3 py-1 {currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                      on:click={() => goToPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  {/if}
                {/each}
                
                <!-- Ellipsis at the end if needed -->
                {#if currentPage < totalPages - 1}
                  <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                {/if}
                
                <!-- Last page always shown -->
                <button
                  class="px-3 py-1 {currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                  on:click={() => goToPage(totalPages)}
                >
                  {totalPages}
                </button>
              {/if}
              
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                on:click={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          {/if}
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

  <!-- Update the popup notification with smooth transitions -->
  {#if showCopyPopup}
    <div class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50"
         transition:fade={{ duration: 300 }}>
      <div class="relative bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4"
           transition:scale={{ start: 0.7, duration: 400, opacity: 0, easing: quintOut }}>
        <button
          class="absolute top-2 right-2 text-white hover:text-gray-300"
          on:click={closeCopyPopup}
        >
          <X class="w-5 h-5" />
        </button>
        <div class="success-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="success-icon">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
        </div>
        <p class="text-lg font-semibold">Asset copied successfully!</p>
        <button
          class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors duration-200"
          on:click={goToWorkspace}
        >
          Go to My Assets
        </button>
      </div>
    </div>
  {/if}

  <!-- Add the confirmation popup -->
  {#if showConfirmPopup}
    <div class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50"
         transition:fade={{ duration: 300 }}>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center space-y-4"
           transition:scale={{ start: 0.7, duration: 400, opacity: 0, easing: quintOut }}>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete the selected assets? This action cannot be undone.
        </p>
        <div class="flex justify-center space-x-4">
          <button
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            on:click={deleteSelectedAssets}
          >
            Confirm
          </button>
          <button
            class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
            on:click={cancelDelete}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Add the delete popup notification -->
  {#if showDeletePopup}
    <div class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50"
         transition:fade={{ duration: 300 }}>
      <div class="relative bg-gradient-to-r from-red-600/50 to-red-800/50 text-white p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4"
           transition:scale={{ start: 0.7, duration: 400, opacity: 0, easing: quintOut }}>
        <div class="delete-circle">
          <div class="delete-icon"></div>
        </div>
        <p class="text-lg font-semibold">Selected assets deleted successfully!</p>
        <div class="flex space-x-4 mt-2">
          <button
            class="bg-white text-red-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            on:click={goToDashboard}
          >
            Go to Home Page
          </button>
          <button
            class="bg-white text-red-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            on:click={goToWorkspace}
          >
            Go to My Assets
          </button>
        </div>
      </div>
    </div>
  {/if}
</main>
