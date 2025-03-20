<script>
  import { onMount } from 'svelte';
  import { Search, User, Download, ChevronDown, Upload, X } from "@lucide/svelte";
  import pb from '$lib/pocketbase';
  import { page } from '$app/stores';
  import { login, isAuthenticated } from '$lib/auth';

  let editing = false;
  const projectId = $page.params.id;
  let project = {
    name: "",
    description: "",
    language: "",
    owner: "",
    logo: "",
    launched: "",
    tag: {}, // Assuming tags is a JSON object
    project_id: "",
    date_created: "",
    date_updated: ""
  };
  let updatedProject = { ...project };
  let loading = true;
  let error = null;
  let assets = []; // List of all assets for linking
  
  // App metadata variables (matching asset page)
  let appMeta = {
    appName: "Loading...",
    appURL: "",
    senderName: "",
    senderAddress: ""
  };

  async function fetchProjectById(id) {
    try {
      const record = await pb.collection('projects').getOne(id, { expand: 'logo' });
      return record;
    } catch (err) {
      console.error("Error fetching project:", err);
      throw err;
    }
  }

  async function fetchAssets() {
    try {
      const records = await pb.collection('assets').getFullList();
      assets = records;
    } catch (err) {
      console.error("Error fetching assets:", err);
    }
  }

  onMount(async () => {
    try {
      // Load app metadata (matching asset page)
      appMeta = {
        appName: "Project Repository",
        appURL: "http://127.0.0.1:8090",
        senderName: "Repository Admin",
        senderAddress: ""
      };
      
      if (projectId) {
        project = await fetchProjectById(projectId);
        updatedProject = { ...project };
        console.log("Project data:", project);
      }
      await fetchAssets();
      loading = false;
    } catch (err) {
      console.error("Application initialization failed:", err);
      error = "Failed to initialize application.";
      loading = false;
    }
  });

  async function updateProject() {
    try {
      const formData = new FormData();
      for (const key in updatedProject) {
        if (key === 'tag') {
          formData.append(key, JSON.stringify(updatedProject[key])); // Handle JSON field
        } else {
          formData.append(key, updatedProject[key]);
        }
      }
      if (updatedProject.logo instanceof File) {
        formData.append('logo', updatedProject.logo);
      }
      const updatedRecord = await pb.collection('projects').update(projectId, formData);
      project = { ...updatedRecord };
      updatedProject = { ...updatedRecord };
      editing = false;
      console.log("Project updated successfully:", updatedRecord);
    } catch (err) {
      console.error("Error updating project:", err);
    }
  }

  async function deleteProject() {
    try {
      await pb.collection('projects').delete(projectId);
      console.log("Project deleted successfully");
      window.location.href = '/';
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  }
  
  /**
   * Formats a date to a human-readable string
   */
  function formatDate(dateString) {
    if (!dateString) return "Not specified";
    return new Date(dateString).toISOString().split('T')[0];
  }
</script>

<style>
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
    background-color: #2d3748;
    color: white;
  }

  input[type="file"].hidden {
    display: none;
  }
  
  input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    display: none;
  }
</style>

<svelte:head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{project ? project.name : 'Project Details'}</title>    
</svelte:head>   

<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
  <div class="flex">
    <!-- Left Sidebar -->
    <aside class="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Indexed Projects</h2>
        <div class="h-48 bg-gray-100 dark:bg-gray-700 rounded"></div>
      </div>

      <div>
        <h2 class="text-xl font-bold mb-4">Popular Categories</h2>
        <ul class="space-y-2">
          <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Web Applications</a></li>
          <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Mobile Applications</a></li>
          <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Data Science Projects</a></li>
          <!-- svelte-ignore a11y-missing-attribute -->
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Enterprise Applications</a></li>
        </ul>
      </div>
    </aside>

    <div class="flex-1 p-8">
      <div class="mb-6 flex items-center space-x-2 text-sm">
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">Home</a>
        <span>»</span>
        <span>Project Details</span>
      </div>

      {#if loading}
        <div class="flex justify-center items-center h-64">
          <p class="text-lg text-gray-600 dark:text-gray-400">Loading project details...</p>
        </div>
      {:else if error}
        <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-8">
          <p>{error}</p>
        </div>
      {:else}
        <div class="flex items-start gap-6 mb-8">
          <div class="w-16 h-16 bg-grey p-1 rounded-lg shadow-md">
            {#if editing}
              <label class="cursor-pointer">
                <input type="file" accept="image/*" on:change={(e) => updatedProject.logo = e.target.files[0]} class="hidden" />
                <Upload class="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </label>
            {:else if project.logo}
              <img src={`http://127.0.0.1:8090/api/files/projects/${project.id}/${project.logo}`} alt="Project Logo" class="w-full h-full object-cover rounded-lg" />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-gray-400">No Logo</div>
            {/if}
          </div>
          
          <div>
            <h1 class="text-3xl font-bold mb-4">
              {#if editing}
                <input type="text" bind:value={updatedProject.name} class="border rounded p-2 w-full editing" placeholder="Project Name" />
              {:else}
                {project ? project.name : 'Project Not Found'}
              {/if}
            </h1>
            <p class="text-gray-600 dark:text-gray-300 max-w-3xl">
              {#if editing}
                <textarea bind:value={updatedProject.description} class="border rounded p-2 w-full editing" placeholder="Project Description"></textarea>
              {:else}
                {project ? project.description : "Unable to find the requested project."}
              {/if}
            </p>
          </div>
        </div>

        <!-- Project Details -->
        {#if project}
          <div class="grid gap-4 mb-8">
            <!-- project language -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Language</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="text" bind:value={updatedProject.language} class="border rounded p-2 w-full editing" placeholder="Language" />
                {:else}
                  {project.language || "Not specified"}
                {/if}
              </div>
            </div>

            <!-- project owner -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Owner</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="text" bind:value={updatedProject.owner} class="border rounded p-2 w-full editing" placeholder="Owner" />
                {:else}
                  {project.owner || "Not specified"}
                {/if}
              </div>
            </div>

            <!-- project launched -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Launched</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="date" bind:value={updatedProject.launched} class="border rounded p-2 w-full editing" />
                {:else}
                  {formatDate(project.launched)}
                {/if}
              </div>
            </div>

            <!-- project tags -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Tags</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <textarea bind:value={updatedProject.tag} class="border rounded p-2 w-full editing" placeholder="Tags (JSON)"></textarea>
                {:else}
                  <div class="flex flex-wrap gap-2">
                    {#if project.tag && typeof project.tag === 'object' && Object.keys(project.tag).length > 0}
                      {#each Object.keys(project.tag) as tagKey}
                        <span class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                          {tagKey}: {project.tag[tagKey]}
                        </span>
                      {/each}
                    {:else}
                      <span class="text-gray-500">No tags specified</span>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>

            <!-- project ID -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Project ID</div>
              <div class="text-gray-800 dark:text-gray-200">
                {#if editing}
                  <input type="text" bind:value={updatedProject.project_id} class="border rounded p-2 w-full editing" placeholder="Project ID" />
                {:else}
                  {project.project_id || "Not specified"}
                {/if}
              </div>
            </div>

            <!-- project created -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Created</div>
              <div class="text-gray-800 dark:text-gray-200">
                {formatDate(project.date_created)}
              </div>
            </div>

            <!-- project updated -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Updated</div>
              <div class="text-gray-800 dark:text-gray-200">
                {formatDate(project.date_updated)}
              </div>
            </div>

            <!-- Link Assets -->
            <div class="border-b border-gray-200 dark:border-gray-700 py-4">
              <div class="font-semibold mb-2">Linked Assets</div>
              {#if assets.length > 0}
                <ul class="space-y-2">
                  {#each assets as asset}
                    <li class="flex items-center">
                      {#if editing}
                        <input type="checkbox" id={asset.id} bind:group={updatedProject.linkedAssets} value={asset.id} class="mr-2" />
                      {/if}
                      <a href={`/assets/${asset.id}`} class="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                        {#if asset.logo}
                          <img src={`http://127.0.0.1:8090/api/files/assets/${asset.id}/${asset.logo}`} alt={asset.name} class="w-6 h-6 mr-2 rounded" />
                        {/if}
                        {asset.name} {asset.version ? `(${asset.version})` : ''}
                      </a>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-gray-500">No assets available for linking</p>
              {/if}
            </div>
          </div>
        {:else}
          <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-md mb-2">
            <p>Project with ID "{projectId}" could not be found.</p>
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <button 
            on:click={() => editing = !editing} 
            class="bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-300 text-white py-2 px-4 rounded flex items-center gap-2"
          >
            {editing ? "Cancel" : "Edit Project"}
          </button>

          {#if editing}
            <button 
              on:click={updateProject} 
              class="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all duration-300 text-white py-2 px-4 rounded flex items-center gap-2"
            >
              Save
            </button>
          {/if}

          <button 
            on:click={deleteProject} 
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            <X class="w-4 h-4" />
            Delete Project
          </button>
        </div>
      {/if}
    </div>
    
    <!-- Right Sidebar -->
    <aside class="hidden xl:block w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 min-h-screen">
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Project Statistics</h2>
        <ul class="space-y-2">
          <li class="flex justify-between"><span>Total Assets:</span> <span>{assets.length}</span></li>
          <li class="flex justify-between"><span>Last Updated:</span> <span>{formatDate(project.date_updated)}</span></li>
          <li class="flex justify-between"><span>Created:</span> <span>{formatDate(project.date_created)}</span></li>
        </ul>
      </div>

      <div>
        <h2 class="text-xl font-bold mb-4">Popular Tags</h2>
        <div class="flex flex-wrap gap-2">
          <a class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">web</a>
          <a class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">mobile</a>
          <a class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">react</a>
          <a class="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">svelte</a>
        </div>
      </div>
    </aside>
  </div>
</main>