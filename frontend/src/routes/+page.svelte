<script>
  import { Search, User, Download, ChevronDown, Plus, Upload, Check } from "@lucide/svelte";
  import { login, isAuthenticated } from '$lib/auth';
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { fetchAssets } from '$lib/assetService';
  import AssetsList from '../components/AssetsList.svelte';
  import { logActions } from '../js/logging.pb.js';
  
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
    asset_id: "",
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

  // Add this function to authenticate with PocketBase
  async function authenticateAdmin() {
    try {
      // Use your admin/superuser credentials
      // These should be stored securely in environment variables in production
      await pb.admins.authWithPassword('Super.user@pocketbase.com', 'SuperPassword');
      console.log("Admin authenticated successfully");
      return true;
    } catch (error) {
      console.error("Admin authentication failed:", error);
      return false;
    }
  }

  // Function to add a new asset
  async function addAsset() {
    try {
        const formData = new FormData();
        formData.append("asset_id", newAsset.asset_id);
        formData.append("name", newAsset.name);
        formData.append("version", newAsset.version);
        formData.append("size", newAsset.size);
        formData.append("type", newAsset.type);
        formData.append("date_updated", newAsset.date_updated);
        formData.append("date_created", newAsset.date_created);
        formData.append("licence_info", newAsset.licence_info);
        formData.append("usage_info", newAsset.usage_info);
        formData.append("maven_dependency", newAsset.maven_dependency);
        formData.append("gradle_dependency", newAsset.gradle_dependency);

        // Append files only if they exist
        if (newAsset.file) {
            formData.append("file", newAsset.file);
        }
        if (newAsset.logo) {
            formData.append("logo", newAsset.logo);
        }

        // Create a new asset record
        const createdRecord = await pb.collection('assets').create(formData);
        
        // Add the new asset to the list (ensure reactivity)
        assets = [...assets, createdRecord];

        // Reset form fields
        newAsset = {
            asset_id: "",
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
        //await createLogEntry("added", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
        
    } catch (err) {
        console.error("Error adding asset:", err);
        assetError = `Failed to add asset: ${err.message}`;
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

    // Add event listener for chatbot interaction
    const createAssetHandler = (event) => {
      const assetData = event.detail;
      
      // Open the asset form
      addingAsset = true;
      
      // Fill the form with the data
      newAsset = {
        ...newAsset,
        asset_id: assetData.asset_id || "",
        name: assetData.name || "",
        version: assetData.version || "",
        type: assetData.type || "maven",
        date_updated: assetData.date_updated || "",
        date_created: assetData.date_created || "",
        licence_info: assetData.licence_info || "",
        usage_info: assetData.usage_info || "",
        maven_dependency: assetData.maven_dependency || "",
        gradle_dependency: assetData.gradle_dependency || ""
      };
      
      console.log("Asset form opened with Maven data:", newAsset);
    };
    
    window.addEventListener('createMavenAsset', createAssetHandler);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('createMavenAsset', createAssetHandler);
    };
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

input.editing, textarea.editing {
  background-color: #2d3748; /* Grey background */
  color: white; /* White text */
}

input[type="file"].hidden {
  display: none;
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
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">
              Most Popular
            </h1>
            <button
              on:click={() => addingAsset = true}
              class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus class="w-4 h-4 mr-2" />
              Add Asset
            </button>
          </div>
          {#if addingAsset}
            <div class="mb-6">
              <h2 class="text-2xl font-bold mb-4">Add New Asset</h2>
              <form on:submit|preventDefault={addAsset}>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset ID</label>
                  <input type="text" bind:value={newAsset.asset_id} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing" required />
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input type="text" bind:value={newAsset.name} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing" required />
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <input type="text" bind:value={newAsset.version} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing" required />
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <input type="text" bind:value={newAsset.type} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing" required />
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Updated</label>
                  <input type="date" bind:value={newAsset.date_updated} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing" required />
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Created</label>
                  <input type="date" bind:value={newAsset.date_created} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing" required />
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">License Info</label>
                  <textarea bind:value={newAsset.licence_info} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing"></textarea>
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Usage Info</label>
                  <textarea bind:value={newAsset.usage_info} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing"></textarea>
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Maven Dependency</label>
                  <textarea bind:value={newAsset.maven_dependency} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing"></textarea>
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Gradle Dependency</label>
                  <textarea bind:value={newAsset.gradle_dependency} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm editing"></textarea>
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                  <label class="cursor-pointer">
                    <input type="file" accept="image/*" on:change={(e) => newAsset.logo = e.target.files[0]} class="hidden" />
                    <Upload class="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  </label>
                </div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">File</label>
                  <label class="cursor-pointer">
                    <input type="file" accept="*" on:change={(e) => newAsset.file = e.target.files[0]} class="hidden" />
                    <Upload class="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  </label>
                </div>
                <div class="flex justify-end">
                  <button type="button" on:click={() => addingAsset = false} class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cancel</button>
                  <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Save</button>
                </div>
              </form>
            </div>
          {/if}
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
                    
                    <!-- Maven dependency info for maven/java assets -->
                    {#if asset.type === 'maven'}
                      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div class="flex mt-1 space-x-1">
                          <button 
                            class="px-2 py-1 text-xs {mavenCopiedIndex === i ? 'bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {mavenCopiedIndex === i ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                            on:click|stopPropagation={(e) => {
                              e.preventDefault();
                              const xmlDependency = `<dependency>\n    <groupId>${asset.asset_id?.split(':')[0] || 'com.example'}</groupId>\n    <artifactId>${asset.asset_id?.split(':')[1] || asset.name}</artifactId>\n    <version>${asset.version || '1.0.0'}</version>\n</dependency>`;
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
                              const gradleDependency = `implementation '${asset.asset_id || `com.example:${asset.name}`}:${asset.version || '1.0.0'}'`;
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
                    
                    {#if asset.last_updated}
                      <p class="mt-2 text-xs text-gray-400">
                        Updated: {new Date(asset.last_updated).toLocaleDateString()}
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
