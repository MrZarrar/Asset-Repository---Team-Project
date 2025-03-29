<script>
  import { Search, User, Download, ChevronDown, Upload, X, Check } from "@lucide/svelte";
  import { login, isAuthenticated } from '$lib/auth';
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { page } from '$app/stores';
  import { logActions } from '../../../js/logging.pb.js';
  import { user } from '$lib/user.js';

  $: role = $user.role;

  let editing = false;

  const assetId = $page.params.id;
  
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
    asset_id: "", // used to compute dependency text (e.g., "group:artifact")
    
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

  // Add state for copy feedback
  let mavenCopied = false;
  let gradleCopied = false;

  // New dependency text variables
  let mavenDep = "";
  let gradleDep = "";

  // Function to compute the dependency texts
  function computeDependencyTexts(assetData) {
    mavenDep = `// Maven
<dependency>
  <groupId>${assetData.asset_id?.split(':')[0] || 'com.example'}</groupId>
  <artifactId>${assetData.asset_id?.split(':')[1] || assetData.name}</artifactId>
  <version>${assetData.version || '1.0.0'}</version>
</dependency>`;
  
    gradleDep = `// Gradle
implementation '${assetData.asset_id || `com.example:${assetData.name}`}:${assetData.version || '1.0.0'}'`;
  }

  // Function to fetch a specific asset by id
  async function fetchAssetById(id) {
    try {
      const record = await pb.collection('assets').getOne(id, { expand: 'logo' });

      // Log viewing of an asset
      logActions("viewed", assetId, $user.email);

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
          // Ensure licence_info field is properly recognized
          console.log("License info:", asset.licence_info);
          // Compute dependency texts after the asset is loaded:
          computeDependencyTexts(asset);
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
      const formData = new FormData();
      for (const key in updatedAsset) {
        formData.append(key, updatedAsset[key]);
      }
      if (updatedAsset.logo instanceof File) {
        formData.append('logo', updatedAsset.logo);
      }
      if (updatedAsset.file instanceof File) {
        formData.append('file', updatedAsset.file);
      }
      // Optionally include the dependency texts if you want to persist them:
      formData.append('mavenDependency', mavenDep);
      formData.append('gradleDependency', gradleDep);
      const updatedRecord = await pb.collection('assets').update(assetId, formData);
      asset = { ...updatedRecord }; // Update the asset with the new data
      updatedAsset = { ...updatedRecord }; // Ensure updatedAsset is also updated
      editing = false; // Exit edit mode after saving
      console.log("Asset updated successfully:", updatedRecord);

      // Log updating of an asset
      logActions("updated", assetId, $user.email);

    } catch (err) {
      console.error("Error updating asset:", err);
    }
  }

  async function deleteAsset() {
    try {
      id_ = assetId
      await pb.collection('assets').delete(assetId);
      console.log("Asset deleted successfully");

      // Log deleting of an asset
      logActions("deleted", id_, $user.email);

      window.location.href = '/'; // Redirect to home page after deletion
    } catch (err) {
      console.error("Error deleting asset:", err);
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

  // Function to handle copying with visual feedback
  function copyToClipboard(text, type) {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'maven') {
        mavenCopied = true;
        setTimeout(() => mavenCopied = false, 2000); // Reset after 2 seconds
      } else if (type === 'gradle') {
        gradleCopied = true;
        setTimeout(() => gradleCopied = false, 2000); // Reset after 2 seconds
      }
    });
  }
  // --- Remove Files Functions ---

  async function removeLogo() {
    if (!confirm("Are you sure you want to remove the logo?")) return;
    try {
      // Remove the logo by updating the record with null for the logo field
      const updatedRecord = await pb.collection('assets').update(assetId, { logo: null });
      asset = { ...updatedRecord };
      updatedAsset = { ...updatedRecord };
      console.log("Logo removed successfully");
    } catch (err) {
      console.error("Error removing logo:", err);
    }
  }

  async function removeAssetFile() {
    if (!confirm("Are you sure you want to remove the asset file?")) return;
    try {
      // Remove the asset file by updating the record with null for the file field
      const updatedRecord = await pb.collection('assets').update(assetId, { file: null });
      asset = { ...updatedRecord };
      updatedAsset = { ...updatedRecord };
      console.log("Asset file removed successfully");
    } catch (err) {
      console.error("Error removing asset file:", err);
    }
  }

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
  <title>{asset ? asset.name : 'Asset Details'}</title>    
</svelte:head>   

  
<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
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
          <div class="relative w-16 h-16 bg-grey p-1 rounded-lg shadow-md">
            {#if asset.logo}
              <img 
                src={`http://127.0.0.1:8090/api/files/assets/${asset.id}/${asset.logo}`} 
                alt="Asset Logo" 
                class="w-full h-full object-cover rounded-lg" 
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-gray-400">
                No Logo
              </div>
            {/if}
            
            {#if editing}
              <label class="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-30">
                <input 
                  type="file" 
                  accept="image/*" 
                  on:change={(e) => updatedAsset.logo = e.target.files[0]} 
                  class="hidden" 
                />
                <Upload class="w-6 h-6 text-white hover:text-gray-300" />
              </label>
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

            <!-- License Info -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">License</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <textarea bind:value={updatedAsset.licence_info} class="border rounded p-2 w-full editing"></textarea>
                {:else}
                  {asset.licence_info || "Not specified"}
                {/if}
              </div>
            </div>

            <!-- Maven Dependency Info -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Dependency</div>
              {#if asset.type === 'maven' || asset.type === 'java'}
                {#if editing}
                  <div class="flex flex-col gap-2">
                    <label class="text-sm">Maven Dependency (XML):</label>
                    <textarea bind:value={mavenDep} class="border rounded p-2 w-full editing"></textarea>
                    <label class="text-sm">Gradle Dependency:</label>
                    <textarea bind:value={gradleDep} class="border rounded p-2 w-full editing"></textarea>
                  </div>
                {:else}
                  <div class="bg-gray-100 dark:bg-gray-800 rounded p-3 my-2">
                    <pre class="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre">{mavenDep}</pre>
                  </div>
                  <div class="bg-gray-100 dark:bg-gray-800 rounded p-3 my-2">
                    <pre class="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre">{gradleDep}</pre>
                  </div>
                  <div class="flex flex-row gap-2 mt-2">
                    <button 
                      on:click={() => copyToClipboard(mavenDep, 'maven')}
                      class="px-3 py-1 {mavenCopied ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {mavenCopied ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                    >
                      {#if mavenCopied}
                        <Check class="w-4 h-4" /> Copied!
                      {:else}
                        Copy Maven XML
                      {/if}
                    </button>
                    <button 
                      on:click={() => copyToClipboard(gradleDep, 'gradle')}
                      class="px-3 py-1 {gradleCopied ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {gradleCopied ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                    >
                      {#if gradleCopied}
                        <Check class="w-4 h-4" /> Copied!
                      {:else}
                        Copy Gradle
                      {/if}
                    </button>
                  </div>
                {/if}
              {:else}
                <div class="text-gray-600 dark:text-gray-400">
                  Not applicable for this asset type.
                </div>
              {/if}
            </div>

            <!-- download Link -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Download</div>
              <div class="flex items-center gap-2">
                {#if editing}
                  <label class="cursor-pointer">
                    <input type="file" accept="*" on:change={(e) => updatedAsset.file = e.target.files[0]} class="hidden" />
                    <Upload class="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  </label>
                {:else}
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
                {/if}

                {#if role !== 'viewer'}
                  <button
                    on:click={() => editing = !editing}
                    class="bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-300 text-white py-2 px-4 rounded ml-2 mr-0"
                  >
                    {editing ? "Cancel" : "Edit Asset"}
                  </button>

                  {#if editing}
                    <button
                      on:click={updateAsset}
                      class="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all duration-300 text-white py-2 px-4 rounded ml-2"
                    >
                      Save
                    </button>
                  {/if}

                  <button
                    on:click={deleteAsset}
                    class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 hover:scale-105 transition-all duration-300 rounded ml-2 flex items-center gap-2"
                  >
                    <X class="w-4 h-4" />
                    Delete Asset
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

            <!-- Remove Files Section (visible only in editing mode) -->
            {#if editing}
              <div class="border-t border-gray-200 dark:border-gray-700 py-4">
                <div class="font-semibold mb-2">Remove Files</div>
                <div class="flex items-center gap-3">
                  {#if asset.logo}
                    <button on:click={removeLogo} class="bg-red-600 hover:bg-red-700 hover:scale-105 transition-all duration-300 text-white py-2 px-4 rounded">
                      Remove Logo
                    </button>
                  {/if}
                  {#if asset.file}
                    <button on:click={removeAssetFile} class="bg-red-600 hover:bg-red-700 hover:scale-105 transition-all duration-300 text-white py-2 px-4 rounded">
                      Remove Asset File
                    </button>
                  {/if}
                  {#if !asset.logo && !asset.file}
                    <p class="text-gray-500">No files available to remove.</p>
                  {/if}
                </div>
              </div>
            {/if}
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