<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Search, User, Download, ChevronDown, Plus, Upload, Check, X } from "@lucide/svelte";
  import pb from '$lib/pocketbase';
  import { user } from '$lib/user.js';
  import { isAuthenticated } from '$lib/auth';
  import { fetchProjects } from '$lib/projectsService';
  import { fetchAssets } from '$lib/assetService';
  
  // Tab state
  let activeTab = 'assets'; // Default to projects tab
  
  // State variables
  let projects = [];
  let assets = [];
  let loadingProjects = false;
  let loadingAssets = false;
  let projectsError = null;
  let assetsError = null;

  // Pagination state
  let assetsPage = 1;
  let assetsTotalPages = 1;
  let assetsPerPage = 3;
  let projectsPage = 1;
  let projectsTotalPages = 1;
  let projectsPerPage = 8;
  
  // Add Asset form state
  let addingAsset = false;
  let assetError = null;
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
  let myMavenCopiedIndex = -1;
  let myGradleCopiedIndex = -1;

  // Function to handle copying with visual feedback
  function copyToClipboard(text, type, index, isMyAsset = false) {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'maven') {
        if (isMyAsset) {
          myMavenCopiedIndex = index;
          setTimeout(() => myMavenCopiedIndex = -1, 2000); // Reset after 2 seconds
        } else {
          mavenCopiedIndex = index;
          setTimeout(() => mavenCopiedIndex = -1, 2000); // Reset after 2 seconds
        }
      } else if (type === 'gradle') {
        if (isMyAsset) {
          myGradleCopiedIndex = index;
          setTimeout(() => myGradleCopiedIndex = -1, 2000); 
        } else {
          gradleCopiedIndex = index;
          setTimeout(() => gradleCopiedIndex = -1, 2000); 
        }
      }
    });
  }
  
  // Current user data
  $: userId = $user?.userid;
  $: role = $user?.role;
  
  // Helper function for admin authentication

  
  // Function to add a new asset
  async function addAsset() {
    try {
      // Set asset_id to undefined if left blank
      if (!newAsset.asset_id) {
        newAsset.asset_id = undefined;
      }

      // Check if we have a POM file in newAsset
      if (!newAsset.file && newAsset.type === 'maven') {
        console.log("No POM file found, searching for it...");
        // Try to fetch POM file as a backup if not already present
        try {
          const groupId = newAsset.asset_id.split(':')[0];
          const artifactId = newAsset.asset_id.split(':')[1] || newAsset.name;
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
      
      // Add additional fields
      newAsset.add_type = 'added';
      newAsset.owner_id = userId;

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
      
      // API call to save the asset
      const createdRecord = await pb.collection('assets').create(formData);
      
      // Reset form state
      addingAsset = false;
      console.log("Asset added successfully:", createdRecord);

      // Add the new asset to the addedAssets list (ensure reactivity)
      addedAssets = [...addedAssets, createdRecord];

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
      
      // Switch to "My Assets" tab to show the new asset
      activeTab = 'assets';
        
    } catch (err) {
      console.error("Error adding asset:", err);
      assetError = `Failed to add asset: ${err.message}`;
    }
  }
  
  // Removed duplicate declaration of isAuthenticated

  onMount(async () => {
    // Check if the user is authenticated
    if (!pb.authStore.isValid) {
        const authenticated = await authenticateAdmin();
        if (!authenticated) {
          assetError = "Authentication failed. Please check PocketBase credentials.";
          loadingAssets = false;
          return;
        }
      }

    // Load data only if authenticated
    await loadData();
    await loadAddedAssetsPage(1);
    await loadCopiedAssetsPage(1);

    // Listen for tab switching events from the chatbot
    

    // Add handler for createMavenAsset event
    const createAssetHandler = (event) => {
      if (event.detail) {
        // Switch to the assets tab
        activeTab = 'assets';
        
        // Set addingAsset to true to show the form
        addingAsset = true;
        
        // Fill the form with the data from the event
        newAsset = {
          ...newAsset,
          asset_id: event.detail.asset_id || "",
          name: event.detail.name || "",
          version: event.detail.version || "",
          type: event.detail.type || "maven",
          date_updated: event.detail.date_updated || new Date().toISOString().split('T')[0],
          date_created: event.detail.date_created || new Date().toISOString().split('T')[0],
          licence_info: event.detail.licence_info || "",
          usage_info: event.detail.usage_info || "",
          maven_dependency: event.detail.maven_dependency || "",
          gradle_dependency: event.detail.gradle_dependency || "",
        };
        
        // If we have a POM file in the event details
        if (event.detail.pomFile) {
          newAsset.file = event.detail.pomFile;
        }
        
        console.log('Asset form opened with Maven data from chatbot:', newAsset);
      }
    };

    window.addEventListener('switchToMyAssetsTab', switchTabHandler);
    window.addEventListener('createMavenAsset', createAssetHandler);

    // Clean up event listener on component destruction
    return () => {
      window.removeEventListener('createMavenAsset', createAssetHandler);
      window.removeEventListener('switchToMyAssetsTab', switchTabHandler);
    };
  });
  
  async function loadData() {
    try {
      // Fetch projects with pagination
      loadingProjects = true;
      const projectsResponse = await fetchProjects(projectsPage, projectsPerPage, { owner: userId });
      projects = projectsResponse.items;
      
      // Calculate total pages for projects pagination
      const totalProjects = projectsResponse.totalItems;
      projectsTotalPages = Math.ceil(totalProjects / projectsPerPage);
      
      loadingProjects = false;
    } catch (err) {
      console.error('Error fetching projects:', err);
      projectsError = 'Failed to load projects: ' + err.message;
      loadingProjects = false;
    }
    
    try {
      // Fetch assets associated with user's projects
      loadingAssets = true;
      const assetsResponse = await fetchAssets(assetsPage, 100); // Get more assets initially to filter
      // Filter for assets linked to user's projects
      const projectIds = projects.map(p => p.id);
      const filteredAssets = assetsResponse.items.filter(asset => 
        asset.linked_projects && asset.linked_projects.some(id => projectIds.includes(id))
      );
      
      // Apply pagination to the filtered assets
      const startIndex = (assetsPage - 1) * assetsPerPage;
      const endIndex = startIndex + assetsPerPage;
      assets = filteredAssets.slice(startIndex, endIndex);
      
      // Calculate total pages based on filtered assets count
      assetsTotalPages = Math.ceil(filteredAssets.length / assetsPerPage);
      
      loadingAssets = false;
    } catch (err) {
      console.error('Error fetching associated assets:', err);
      assetsError = 'Failed to load associated assets: ' + err.message;
      loadingAssets = false;
    }
    
    
  }
  
  // Functions to handle pagination
  
  async function loadAssociatedAssetsPage(page) {
    if (page < 1 || page > assetsTotalPages) return;
    
    assetsPage = page;
    loadingAssets = true;
    
    try {
      const assetsResponse = await fetchAssets(1, 100); // Get more assets to filter from
      const projectIds = projects.map(p => p.id);
      const filteredAssets = assetsResponse.items.filter(asset => 
        asset.linked_projects && asset.linked_projects.some(id => projectIds.includes(id))
      );
      
      // Apply pagination to the filtered assets
      const startIndex = (assetsPage - 1) * assetsPerPage;
      const endIndex = startIndex + assetsPerPage;
      assets = filteredAssets.slice(startIndex, endIndex);
      
      loadingAssets = false;
    } catch (err) {
      console.error('Error fetching associated assets:', err);
      assetsError = 'Failed to load associated assets: ' + err.message;
      loadingAssets = false;
    }
  }
  
  // Add function to handle projects pagination
  async function loadProjectsPage(page) {
    if (page < 1 || page > projectsTotalPages) return;
    
    projectsPage = page;
    loadingProjects = true;
    
    try {
      const projectsResponse = await fetchProjects(projectsPage, projectsPerPage, { owner: userId });
      projects = projectsResponse.items;
      loadingProjects = false;
    } catch (err) {
      console.error('Error fetching projects:', err);
      projectsError = 'Failed to load projects: ' + err.message;
      loadingProjects = false;
    }
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
  
  function handleLogoChange(event) {
    const file = event.target.files[0];
    if (file) {
      newAsset.logo = file;
    }
  }
  
  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      newAsset.file = file;
      // Optionally auto-populate size
      newAsset.size = file.size;
    }
  }

  // Add this to your existing onMount function in Workspace page

  onMount(async () => {
    // Existing code...
    
    // Check if we should auto-add an asset (triggered by chatbot)
    const shouldAutoAdd = localStorage.getItem('autoAddAsset') === 'true';
    
    if (shouldAutoAdd) {
      try {
        // Clear the flag immediately to prevent duplicate adds on refresh
        localStorage.removeItem('autoAddAsset');
        
        // Get the pending asset data
        const pendingAssetDataString = localStorage.getItem('pendingAssetData');
        
        if (pendingAssetDataString) {
          // Parse the asset data
          const pendingAssetData = JSON.parse(pendingAssetDataString);
          
          // Switch to assets tab
          activeTab = 'assets';
          
          // Set addingAsset to true to show the form
          addingAsset = true;
          
          // Fill the form with the pending asset data
          newAsset = {
            ...newAsset,
            ...pendingAssetData
          };
          
          // If we have POM file content, create a File object
          const pendingPomContent = localStorage.getItem('pendingPomContent');
          const pendingPomFilename = localStorage.getItem('pendingPomFilename');
          
          if (pendingAssetData.hasPomFile && pendingPomContent && pendingPomFilename) {
            // Create a Blob with the POM content
            const pomBlob = new Blob([pendingPomContent], { type: 'application/xml' });
            
            // Create a File object from the Blob
            newAsset.file = new File([pomBlob], pendingPomFilename, { 
              type: 'application/xml',
              lastModified: new Date().getTime()
            });
            
            console.log('POM file recreated from stored content');
          }
          
          // Clean up localStorage
          localStorage.removeItem('pendingAssetData');
          localStorage.removeItem('pendingPomContent');
          localStorage.removeItem('pendingPomFilename');
          
          console.log('Asset form opened with Maven data from chatbot:', newAsset);
        }
      } catch (error) {
        console.error('Error auto-adding asset:', error);
      }
    }
    
    // Existing code...
  });

  let addedAssets = [];
  let copiedAssets = [];
  let loadingAddedAssets = true;
  let loadingCopiedAssets = true;
  let addedAssetsError = null;
  let copiedAssetsError = null;

  let addedAssetsPage = 1;
  let addedAssetsTotalPages = 1;
  let addedAssetsPerPage = 6;

  let copiedAssetsPage = 1;
  let copiedAssetsTotalPages = 1;
  let copiedAssetsPerPage = 6;

  async function loadAddedAssetsPage(page) {
    if (!isAuthenticated || page < 1 || page > addedAssetsTotalPages) return;

    addedAssetsPage = page;
    loadingAddedAssets = true;

    try {
      const response = await fetchAssets(addedAssetsPage, addedAssetsPerPage, { add_type: 'added', owner_id: userId });
      addedAssets = response.items;
      addedAssetsTotalPages = Math.ceil(response.totalItems / addedAssetsPerPage);
      loadingAddedAssets = false;
    } catch (err) {
      console.error('Error fetching added assets:', err);
      addedAssetsError = 'Failed to load added assets: ' + err.message;
      loadingAddedAssets = false;
    }
  }

  async function loadCopiedAssetsPage(page) {
    if (!isAuthenticated || page < 1 || page > copiedAssetsTotalPages) return;

    copiedAssetsPage = page;
    loadingCopiedAssets = true;

    try {
      const response = await fetchAssets(copiedAssetsPage, copiedAssetsPerPage, { add_type: 'copied', owner_id: userId });
      copiedAssets = response.items;
      copiedAssetsTotalPages = Math.ceil(response.totalItems / copiedAssetsPerPage);
      loadingCopiedAssets = false;
    } catch (err) {
      console.error('Error fetching copied assets:', err);
      copiedAssetsError = 'Failed to load copied assets: ' + err.message;
      loadingCopiedAssets = false;
    }
  }

  // Ensure addedAssets includes the correct file URL for download
  function getFileUrl(asset) {
    return pb.files.getUrl(asset, asset.file);
  }

  // Function to handle downloading the file
  async function downloadAssetFile(asset) {
    if (!asset || !asset.file) {
      console.error("Cannot download: Asset file is missing");
      return;
    }

    try {
      const fileUrl = getFileUrl(asset);

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

</script>

{#if isAuthenticated}
<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen p-8">
  <div class="container mx-auto">
    
    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
      <nav class="flex -mb-px">
        <button 
          class="py-4 px-6 text-center border-b-2 font-medium text-sm leading-5 focus:outline-none transition-colors duration-200 ease-in-out mr-8 {activeTab === 'projects' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
          on:click={() => activeTab = 'projects'}
        >
          My Projects
        </button>
        <button 
          class="py-4 px-6 text-center border-b-2 font-medium text-sm leading-5 focus:outline-none transition-colors duration-200 ease-in-out {activeTab === 'assets' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
          on:click={() => activeTab = 'assets'}
        >
          My Assets
        </button>
      </nav>
    </div>
    
    {#if activeTab === 'projects'}
      <!-- Projects Tab Content -->
      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold">My Projects</h2>
          <a href="/Projects" class="text-blue-600 dark:text-blue-400 hover:underline">
            View All Projects
          </a>
        </div>
        
        {#if loadingProjects}
          <div class="flex justify-center items-center h-32">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-200"></div>
            <p class="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        {:else if projectsError}
          <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md">
            <p>{projectsError}</p>
          </div>
        {:else if projects.length === 0}
          <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
            <p>You don't have any projects yet. <a href="/Projects" class="underline">Create a project</a> to get started.</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {#each projects as project}
              <div class="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div class="p-4">
                  <div class="flex items-center mb-3">
                    {#if project.logo}
                      <img 
                        src={pb.getFileUrl(project, 'logo')} 
                        alt="{project.name} logo" 
                        class="w-10 h-10 object-cover rounded-md mr-3"
                      />
                    {/if}
                    <h3 class="text-lg font-semibold">{project.name}</h3>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>
                  <div class="text-xs text-gray-500 dark:text-gray-500">
                    <p><span class="font-medium">Language:</span> {project.language || 'N/A'}</p>
                    <p><span class="font-medium">Launch Date:</span> {formatDate(project.launched)}</p>
                    <p><span class="font-medium">Updated:</span> {formatDate(project.updated)}</p>
                  </div>
                </div>
                <div class="bg-gray-200 dark:bg-gray-700 px-4 py-2 flex justify-end">
                  <a href={`/Projects?edit=${project.id}`} class="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                    View Details
                  </a>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
      
      <!-- Associated Assets Section -->
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold">Associated Assets</h2>
          <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">
            Browse All Assets
          </a>
        </div>
        
        {#if loadingAssets}
          <div class="flex justify-center items-center h-32">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-200"></div>
            <p class="ml-3 text-gray-600 dark:text-gray-400">Loading assets...</p>
          </div>
        {:else if assetsError}
          <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md">
            <p>{assetsError}</p>
          </div>
        {:else if assets.length === 0}
          <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
            <p>No assets are associated with your projects. Assets linked to your projects will appear here.</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
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
          </div>
          
          <!-- Pagination for Associated Assets -->
          {#if assetsTotalPages > 1}
            <div class="flex justify-center mt-6">
              <nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                <button 
                  class="px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {assetsPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                  on:click={() => loadAssociatedAssetsPage(assetsPage - 1)}
                  disabled={assetsPage === 1}
                >
                  Previous
                </button>
                <div class="px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  Page {assetsPage} of {assetsTotalPages}
                </div>
                <button 
                  class="px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {assetsPage === assetsTotalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                  on:click={() => loadAssociatedAssetsPage(assetsPage + 1)}
                  disabled={assetsPage === assetsTotalPages}
                >
                  Next
                </button>
              </nav>
            </div>
          {/if}
        {/if}
      </section>
      
    {:else}
      <!-- My Assets Tab Content -->
      <section>
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-semibold">Added Assets</h2>
          {#if !addingAsset}
            <button 
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
              on:click={() => addingAsset = true}
            >
              <Plus class="w-4 h-4" />
              Add New Asset
            </button>
          {/if}
        </div>
        
        <!-- Display the asset adding form using the same design as the home page -->
        {#if addingAsset}
          <div class="mb-6">
            <h2 class="text-2xl font-bold mb-4">Add New Asset</h2>
            <form on:submit|preventDefault={addAsset}>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset ID</label>
                <input type="text" bind:value={newAsset.asset_id} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave blank to auto-generate an ID</p>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" bind:value={newAsset.name} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                <input type="text" bind:value={newAsset.version} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <input type="text" bind:value={newAsset.type} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Updated</label>
                <input type="date" bind:value={newAsset.date_updated} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Created</label>
                <input type="date" bind:value={newAsset.date_created} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">License Info</label>
                <textarea bind:value={newAsset.licence_info} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Usage Info</label>
                <textarea bind:value={newAsset.usage_info} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Maven Dependency</label>
                <textarea bind:value={newAsset.maven_dependency} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Gradle Dependency</label>
                <textarea bind:value={newAsset.gradle_dependency} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                <div class="mt-1 flex items-center space-x-2">
                  <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
                    <Upload class="w-4 h-4 mr-2" />
                    {newAsset.logo ? 'Change Image' : 'Upload Image'}
                    <input type="file" accept="image/*" on:change={(e) => newAsset.logo = e.target.files[0]} class="hidden" />
                  </label>
                  {#if newAsset.logo}
                    <div class="flex items-center space-x-2">
                      <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        {#if newAsset.logo.type.startsWith('image/')}
                          <img src={URL.createObjectURL(newAsset.logo)} alt="Logo preview" class="h-8 w-8 object-cover rounded mr-2" />
                        {/if}
                        <span class="truncate max-w-xs">{newAsset.logo.name}</span>
                      </div>
                      <button 
                        type="button" 
                        on:click={() => newAsset.logo = null}
                        class="text-red-500 hover:text-red-700"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">File</label>
                <div class="mt-1 flex items-center space-x-2">
                  <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
                    <Upload class="w-4 h-4 mr-2" />
                    {newAsset.file ? 'Change File' : 'Upload File'}
                    <input type="file" accept="*" on:change={(e) => newAsset.file = e.target.files[0]} class="hidden" />
                  </label>
                  {#if newAsset.file}
                    <div class="flex items-center space-x-2">
                      <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <span class="truncate max-w-xs">{newAsset.file.name}</span>
                        <span class="ml-2 text-xs text-gray-500">({Math.round(newAsset.file.size / 1024)} KB)</span>
                      </div>
                      <button 
                        type="button" 
                        on:click={() => newAsset.file = null}
                        class="text-red-500 hover:text-red-700"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
              <div class="flex justify-end">
                <button type="button" on:click={() => addingAsset = false} class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cancel</button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Save</button>
              </div>
            </form>
          </div>
        {/if}
        
    

        <!-- Added Assets Section -->
        <div class="mb-12">
          {#if loadingAddedAssets}
            <div class="col-span-full text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-200"></div>
              <p class="mt-2 text-gray-600 dark:text-gray-400">Loading added assets...</p>
            </div>
          {:else if addedAssetsError}
            <div class="col-span-full text-center py-8">
              <p class="text-red-500">{addedAssetsError}</p>
            </div>
          {:else if addedAssets.length === 0}
            <div class="col-span-full text-center py-8">
              <p class="text-gray-600 dark:text-gray-400">No added assets found.</p>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {#each addedAssets as asset, i}
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
                          <!-- Download button -->
                          {#if asset.file}
                            <button 
                              on:click={() => downloadAssetFile(asset)}
                              class="p-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
                            >
                              <Download class="w-4 h-4" />
                            </button>
                          {/if}
                        </div>
                      </div>
                    {:else}
                      <!-- For non-maven assets, still show download button if available -->
                      {#if asset.file}
                        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                          <div class="flex mt-1 space-x-1">
                            <button 
                              on:click={() => downloadAssetFile(asset)}
                              class="p-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
                            >
                              <Download class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      {/if}
                    {/if}
                    {#if asset.last_updated || asset.date_updated}
                      <p class="mt-2 text-xs text-gray-400">
                        Updated: {new Date(asset.last_updated || asset.date_updated).toLocaleDateString()}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            <!-- Pagination for Added Assets -->
            {#if addedAssetsTotalPages > 1}
              <div class="flex justify-center mt-6">
                <nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                  <button 
                    class="px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {addedAssetsPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    on:click={() => loadAddedAssetsPage(addedAssetsPage - 1)}
                    disabled={addedAssetsPage === 1}
                  >
                    Previous
                  </button>
                  <div class="px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                    Page {addedAssetsPage} of {addedAssetsTotalPages}
                  </div>
                  <button 
                    class="px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {addedAssetsPage === addedAssetsTotalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                    on:click={() => loadAddedAssetsPage(addedAssetsPage + 1)}
                    disabled={addedAssetsPage === addedAssetsTotalPages}
                  >
                    Next
                  </button>
                </nav>
              </div>
            {/if}
          {/if}
        </div>

        <!-- Copied Assets Section -->
        <div class="mb-12">
          <h2 class="text-2xl font-semibold mb-6">Copied Assets</h2> <!-- Added bottom margin -->
          {#if loadingCopiedAssets}
            <div class="col-span-full text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-200"></div>
              <p class="mt-2 text-gray-600 dark:text-gray-400">Loading copied assets...</p>
            </div>
          {:else if copiedAssetsError}
            <div class="col-span-full text-center py-8">
              <p class="text-red-500">{copiedAssetsError}</p>
            </div>
          {:else if copiedAssets.length === 0}
            <div class="col-span-full text-center py-8">
              <p class="text-gray-600 dark:text-gray-400">No copied assets found.</p>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {#each copiedAssets as asset, i}
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
                          <!-- Download button -->
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
                    {/if}
                    {#if asset.last_updated || asset.date_updated}
                      <p class="mt-2 text-xs text-gray-400">
                        Updated: {new Date(asset.last_updated || asset.date_updated).toLocaleDateString()}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            <!-- Pagination for Copied Assets -->
            {#if copiedAssetsTotalPages > 1}
              <div class="flex justify-center mt-6">
                <nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                  <button 
                    class="px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {copiedAssetsPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    on:click={() => loadCopiedAssetsPage(copiedAssetsPage - 1)}
                    disabled={copiedAssetsPage === 1}
                  >
                    Previous
                  </button>
                  <div class="px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                    Page {copiedAssetsPage} of {copiedAssetsTotalPages}
                  </div>
                  <button 
                    class="px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {copiedAssetsPage === copiedAssetsTotalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                    on:click={() => loadCopiedAssetsPage(copiedAssetsPage + 1)}
                    disabled={copiedAssetsPage === copiedAssetsTotalPages}
                  >
                    Next
                  </button>
                </nav>
              </div>
            {/if}
          {/if}
        </div>
      </section>
    {/if}
    
    <!-- Quick Actions Panel for both tabs -->
  </div>
</main>
{/if}

<style>
  input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    display: none;
  }
  
  /* Remove the editing class that was causing dark backgrounds in light mode */
  input[type="file"].hidden {
    display: none;
  }
</style>
