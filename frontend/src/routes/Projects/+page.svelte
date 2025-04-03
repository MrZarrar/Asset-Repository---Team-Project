<script>
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';

  // For JSON placeholder in the "tag" field
  let examplePlaceholder = JSON.stringify({ framework: "Svelte" });

  // Projects and Assets
  let projects = [];
  let assets = [];
  let loading = true;
  let error = null;

  // Add/Edit controls
  let showAddForm = false;
  let showEditForm = false;

  // New project data
  let newProject = {
    name: '',
    description: '',
    language: '',
    owner: '',
    launched: '',
    tag: '',
    project_id: '',
    asset_id: []
  };
  // New project logo & preview
  let newLogoFile = null;
  let newLogoFileName = '';
  let newLogoPreview = '';

  // Editing an existing project
  let editingProject = null;
  let updatedProject = {};
  let editLogoFile = null;
  let editLogoFileName = '';
  let editLogoPreview = '';

  // Toggle expanded details for each project
  let expandedProjects = {};

  // Fetch data on mount
  onMount(async () => {
    try {
      projects = await pb.collection('projects').getFullList({
        sort: '-created',
        expand: 'asset_id'
      });
      assets = await pb.collection('assets').getFullList();
    } catch (err) {
      console.error('Error fetching data:', err);
      error = 'Failed to fetch projects or assets: ' + err.message;
    } finally {
      loading = false;
    }
  });

  // ------------------
  // CREATE PROJECT
  // ------------------
  async function createProject() {
    try {
      // Check for duplicate project_id
      if (projects.find(p => p.project_id === newProject.project_id)) {
        alert("Project ID must be unique. A project with this ID already exists.");
        return;
      }

      // Parse 'tag' field if provided
      let tagParsed = {};
      if (newProject.tag.trim() !== '') {
        try {
          tagParsed = JSON.parse(newProject.tag);
        } catch (e) {
          alert('Invalid JSON in Tag field. Example: ' + examplePlaceholder);
          return;
        }
      }

      // Build form data
      let formData = new FormData();
      formData.append('name', newProject.name);
      formData.append('description', newProject.description);
      formData.append('language', newProject.language);
      formData.append('owner', newProject.owner);
      formData.append('launched', newProject.launched || '');
      if (newLogoFile) {
        formData.append('logo', newLogoFile);
      }
      formData.append('tag', JSON.stringify(tagParsed));
      formData.append('project_id', newProject.project_id);
      formData.append('asset_id', JSON.stringify(newProject.asset_id));

      const record = await pb.collection('projects').create(formData);
      // Fetch with expanded assets
      const fetchedRecord = await pb.collection('projects').getOne(record.id, { expand: 'asset_id' });
      projects = [fetchedRecord, ...projects];

      resetNewProject();
      showAddForm = false;
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Failed to create project.');
    }
  }

  function resetNewProject() {
    newProject = {
      name: '',
      description: '',
      language: '',
      owner: '',
      launched: '',
      tag: '',
      project_id: '',
      asset_id: []
    };
    newLogoFile = null;
    newLogoFileName = '';
    newLogoPreview = '';
  }

  // ------------------
  // EDIT PROJECT
  // ------------------
  function editProject(project) {
    editingProject = project;
    const assetIds = project.expand?.asset_id ? project.expand.asset_id.map(a => a.id) : [];
    updatedProject = {
      ...project,
      tag: project.tag ? JSON.stringify(project.tag) : '',
      asset_id: assetIds
    };
    editLogoFile = null;
    editLogoFileName = '';
    editLogoPreview = '';
    showEditForm = true;
  }

  // ------------------
  // UPDATE PROJECT
  // ------------------
  async function updateProject() {
    try {
      let tagParsed = {};
      if (updatedProject.tag.trim() !== '') {
        try {
          tagParsed = JSON.parse(updatedProject.tag);
        } catch (e) {
          alert('Invalid JSON in Tag field. Example: ' + examplePlaceholder);
          return;
        }
      }

      let formData = new FormData();
      formData.append('name', updatedProject.name);
      formData.append('description', updatedProject.description);
      formData.append('language', updatedProject.language);
      formData.append('owner', updatedProject.owner);
      formData.append('launched', updatedProject.launched || '');
      if (editLogoFile) {
        formData.append('logo', editLogoFile);
      }
      formData.append('tag', JSON.stringify(tagParsed));
      formData.append('project_id', updatedProject.project_id);
      formData.append('asset_id', JSON.stringify(updatedProject.asset_id));

      const record = await pb.collection('projects').update(editingProject.id, formData);
      const fetchedRecord = await pb.collection('projects').getOne(record.id, { expand: 'asset_id' });
      projects = projects.map(p => p.id === fetchedRecord.id ? fetchedRecord : p);

      showEditForm = false;
      editingProject = null;
      updatedProject = {};
      editLogoFile = null;
      editLogoFileName = '';
      editLogoPreview = '';
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project.');
    }
  }

  // ------------------
  // DELETE PROJECT
  // ------------------
  async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await pb.collection('projects').delete(id);
      projects = projects.filter(p => p.id !== id);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project.');
    }
  }

  // Toggle expanded details
  function toggleDetails(id) {
    expandedProjects = { ...expandedProjects, [id]: !expandedProjects[id] };
  }

  // ------------------
  // DOWNLOAD PROJECT FILE
  // ------------------
  async function downloadProject(project) {
    if (!project || !project.id || !project.file) {
      alert("No project file available for download.");
      return;
    }
    try {
      const fileUrl = pb.getFileUrl(project, 'file');
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = project.file;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed: " + err.message);
    }
  }

  // ------------------
  // FILE INPUT HANDLERS
  // ------------------
  function handleNewLogoChange(event) {
    const file = event.target.files[0];
    if (file) {
      newLogoFile = file;
      newLogoFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => { newLogoPreview = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      newLogoFile = null;
      newLogoFileName = '';
      newLogoPreview = '';
    }
  }

  function handleEditLogoChange(event) {
    const file = event.target.files[0];
    if (file) {
      editLogoFile = file;
      editLogoFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => { editLogoPreview = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      editLogoFile = null;
      editLogoFileName = '';
      editLogoPreview = '';
    }
  }
</script>

<svelte:head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Projects</title>
</svelte:head>

<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex">
  <!-- LEFT SIDEBAR -->
  <aside class="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">Indexed Projects</h2>
      <div class="h-48 bg-gray-100 dark:bg-gray-700 rounded"></div>
    </div>
    <div>
      <h2 class="text-xl font-bold mb-4">Popular Categories</h2>
      <ul class="space-y-2">
        <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Web Applications</a></li>
        <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Mobile Applications</a></li>
        <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Data Science Projects</a></li>
        <li><a class="text-blue-600 dark:text-blue-400 hover:underline">Enterprise Apps</a></li>
      </ul>
    </div>
  </aside>

  <!-- MAIN CONTENT -->
  <div class="flex-1 flex flex-col">
    <!-- Header / Breadcrumb + Add Button -->
    <header class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-2 text-sm">
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">Home</a>
        <span>»</span>
        <span>Projects</span>
      </div>
      <button 
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        on:click={() => showAddForm = true}
      >
        Add Project
      </button>
    </header>

    <!-- Main Body -->
    <div class="flex-1 p-6 overflow-auto">
      {#if showAddForm}
        <!-- FULL-SCREEN Add Project -->
        <section>
          <div class="max-w-2xl mx-auto">
            <h2 class="text-2xl font-semibold mb-6">Add New Project</h2>
            <form on:submit|preventDefault={createProject}>
              <!-- Project Name -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                <input
                  type="text"
                  bind:value={newProject.name}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <!-- Description -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  rows="3"
                  bind:value={newProject.description}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter project description"
                ></textarea>
              </div>
              <!-- Language -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                <input
                  type="text"
                  bind:value={newProject.language}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter language"
                />
              </div>
              <!-- Owner -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner</label>
                <input
                  type="text"
                  bind:value={newProject.owner}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter owner"
                />
              </div>
              <!-- Launched -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Launched</label>
                <input
                  type="date"
                  bind:value={newProject.launched}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <!-- Project ID -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID</label>
                <input
                  type="text"
                  bind:value={newProject.project_id}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter unique project ID"
                />
              </div>
              <!-- Tag (JSON) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag (JSON format)</label>
                <textarea
                  rows="2"
                  bind:value={newProject.tag}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={examplePlaceholder}
                ></textarea>
              </div>
              <!-- Upload Logo -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Logo</label>
                <div class="mt-1 flex items-center space-x-2">
                  <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                                 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 
                                 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Select File
                    <input 
                      type="file" 
                      accept="image/*" 
                      on:change={handleNewLogoChange} 
                      class="hidden"
                    />
                  </label>
                  {#if newLogoFileName}
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {newLogoFileName}
                    </div>
                  {/if}
                </div>
                {#if newLogoPreview}
                  <img
                    src={newLogoPreview}
                    alt="New Logo Preview"
                    class="mt-2 h-16 w-16 object-cover rounded-md 
                           border border-gray-300 dark:border-gray-600"
                  />
                {/if}
              </div>
              <!-- Link Assets -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Assets</label>
                <div class="grid grid-cols-1 gap-2 mt-1">
                  {#each assets.slice().sort((a, b) => a.name.localeCompare(b.name)) as asset}
                    <label class="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        value={asset.id}
                        bind:group={newProject.asset_id}
                        class="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span>{asset.name}{asset.version ? ` (${asset.version})` : ''}</span>
                    </label>
                  {/each}
                </div>
              </div>
              <!-- Buttons -->
              <div class="flex justify-end">
                <button
                  type="button"
                  class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 
                         dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  on:click={() => (showAddForm = false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </section>
      {:else if showEditForm}
        <!-- FULL-SCREEN Edit Project -->
        <section>
          <div class="max-w-2xl mx-auto">
            <h2 class="text-2xl font-semibold mb-6">Edit Project</h2>
            <form on:submit|preventDefault={updateProject}>
              <!-- Project Name -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                <input
                  type="text"
                  bind:value={updatedProject.name}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <!-- Description -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  rows="3"
                  bind:value={updatedProject.description}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                ></textarea>
              </div>
              <!-- Language -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                <input
                  type="text"
                  bind:value={updatedProject.language}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <!-- Owner -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner</label>
                <input
                  type="text"
                  bind:value={updatedProject.owner}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <!-- Launched -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Launched</label>
                <input
                  type="date"
                  bind:value={updatedProject.launched}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <!-- Project ID -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID</label>
                <input
                  type="text"
                  bind:value={updatedProject.project_id}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <!-- Tag (JSON) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag (JSON format)</label>
                <textarea
                  rows="2"
                  bind:value={updatedProject.tag}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={examplePlaceholder}
                ></textarea>
              </div>
              <!-- Upload New Logo -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload New Logo</label>
                <div class="mt-1 flex items-center space-x-2">
                  <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                                 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 
                                 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Select File
                    <input 
                      type="file" 
                      accept="image/*" 
                      on:change={handleEditLogoChange} 
                      class="hidden"
                    />
                  </label>
                  {#if editLogoFileName}
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {editLogoFileName}
                    </div>
                  {/if}
                </div>
                {#if editLogoPreview}
                  <img
                    src={editLogoPreview}
                    alt="Edit Logo Preview"
                    class="mt-2 h-16 w-16 object-cover rounded-md 
                           border border-gray-300 dark:border-gray-600"
                  />
                {/if}
              </div>
              <!-- Linked Assets -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Edit Linked Assets</label>
                <div class="grid grid-cols-1 gap-2 mt-1">
                  {#each assets.slice().sort((a, b) => a.name.localeCompare(b.name)) as asset}
                    <label class="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        value={asset.id}
                        bind:group={updatedProject.asset_id}
                        class="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span>{asset.name} {asset.version ? `(${asset.version})` : ''}</span>
                    </label>
                  {/each}
                </div>
              </div>
              <!-- Buttons -->
              <div class="flex justify-end">
                <button
                  type="button"
                  class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 
                         dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  on:click={() => { showEditForm = false; editingProject = null; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </section>
      {:else}
        <!-- Show Projects Grid -->
        {#if loading}
          <div class="flex justify-center items-center h-64">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-300"></div>
            <p class="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        {:else if error}
          <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-8">
            <p>{error}</p>
          </div>
        {:else}
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Latest Projects
          </h1>
          {#if projects.length === 0}
            <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
              <p>No projects found. Try adding a new one!</p>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {#each projects as project}
                <div class="relative w-64 group">
                  <!-- Gradient border effect on hover -->
                  <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md 
                              opacity-75 group-hover:opacity-100 transition-all duration-1000 group-hover:duration-200">
                  </div>
                  <!-- Card content -->
                  <div class="relative h-full bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-md">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {project.name}
                    </h2>
                    <!-- Only show last updated in the collapsed card -->
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      <strong>Last Updated:</strong> {project.date_updated || 'N/A'}
                    </p>
                    <!-- Action buttons: Edit, Delete, Download, plus "View Details" -->
                    <div class="mt-3 flex items-center justify-between">
                      <div class="flex space-x-2">
                        <button 
                          class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                          on:click={() => editProject(project)}
                        >
                          Edit
                        </button>
                        <button 
                          class="px-2 py-1 text-xs bg-red-500 hover:bg-red-700 text-white rounded"
                          on:click={() => deleteProject(project.id)}
                        >
                          Delete
                        </button>
                      </div>
                      <button 
                        class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                        on:click={() => downloadProject(project)}
                      >
                        Download
                      </button>
                    </div>
                    <div class="mt-3">
                      <button
                        class="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                        on:click={() => toggleDetails(project.id)}
                      >
                        {expandedProjects[project.id] ? "Hide Details" : "View Details"}
                      </button>
                    </div>

                    <!-- If expanded, show all other fields -->
                    {#if expandedProjects[project.id]}
                      <div class="mt-4 text-xs text-gray-700 dark:text-gray-200 space-y-1">
                        <p><strong>Language:</strong> {project.language || 'N/A'}</p>
                        <p><strong>Owner:</strong> {project.owner || 'N/A'}</p>
                        <p><strong>Launched:</strong> {project.launched || 'N/A'}</p>
                        <p><strong>Project ID:</strong> {project.project_id}</p>
                        {#if project.tag}
                          <p><strong>Tag:</strong> {JSON.stringify(project.tag)}</p>
                        {/if}
                        {#if project.expand?.asset_id && project.expand.asset_id.length > 0}
                          <div class="mt-1">
                            <strong>Linked Assets:</strong>
                            <ul class="list-disc list-inside">
                              {#each project.expand.asset_id as asset}
                                <li>{asset.name}</li>
                              {/each}
                            </ul>
                          </div>
                        {/if}
                        <p class="mt-2">{project.description}</p>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  </div>

  <!-- RIGHT SIDEBAR -->
  <aside class="hidden xl:block w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 min-h-screen">
    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">Project Statistics</h2>
      <ul class="space-y-2">
        <li class="flex justify-between">
          <span>Total Projects:</span> <span>{projects.length}</span>
        </li>
        {#if projects.length > 0}
          <li class="flex justify-between">
            <span>Last Updated:</span>
            <span>{projects[0].date_updated || "N/A"}</span>
          </li>
          <li class="flex justify-between">
            <span>Created:</span>
            <span>{projects[0].date_created || "N/A"}</span>
          </li>
        {/if}
      </ul>
    </div>
    <div>
      <h2 class="text-xl font-bold mb-4">Popular Tags</h2>
      <div class="flex flex-wrap gap-2">
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">web</a>
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">mobile</a>
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">svelte</a>
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">js</a>
      </div>
    </div>
  </aside>
</main>

<style>
/* Keep line clamp for short description if needed */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
