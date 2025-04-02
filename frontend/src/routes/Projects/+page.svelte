<script>
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';

  // Example placeholder JSON for the "tag" field
  let examplePlaceholder = JSON.stringify({ framework: "Svelte" });

  // State Variables
  let projects = [];
  let assets = [];
  let loading = true;
  let error = null;

  // Modal control flags
  let showAddModal = false;
  let showEditModal = false;

  // New project form data – relation field is asset_id (many-to-many)
  let newProject = {
    name: '',
    description: '',
    language: '',
    owner: '',
    launched: '',
    tag: '',
    project_id: '',
    asset_id: [] // Holds linked asset record IDs
  };

  // For new project logo file & preview
  let newLogoFile = null;
  let newLogoFileName = '';
  let newLogoPreview = '';

  // For editing an existing project
  let editingProject = null;
  let updatedProject = {};
  let editLogoFile = null;
  let editLogoFileName = '';
  let editLogoPreview = '';

  // Track expanded project details
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

  // Create new project
  async function createProject() {
    try {
      // Check for duplicate project_id
      if (projects.find(p => p.project_id === newProject.project_id)) {
        alert("Project ID must be unique. A project with this ID already exists.");
        return;
      }
      // Validate tag field
      let tagParsed = {};
      if (newProject.tag.trim() !== '') {
        try {
          tagParsed = JSON.parse(newProject.tag);
        } catch (e) {
          alert('Invalid JSON in Tag field. Example: ' + examplePlaceholder);
          return;
        }
      }
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
      const fetchedRecord = await pb.collection('projects').getOne(record.id, { expand: 'asset_id' });
      projects = [fetchedRecord, ...projects];
      resetNewProject();
      showAddModal = false;
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

  // Edit project: pre-fill form
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
    showEditModal = true;
  }

  // Update project
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
      showEditModal = false;
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

  // Delete project
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

  // Toggle project details view
  function toggleDetails(id) {
    expandedProjects = { ...expandedProjects, [id]: !expandedProjects[id] };
  }

  // Download project file (if available)
  async function downloadProject(project) {
    if (!project || !project.id || !project.file) {
      alert("No project file available for download.");
      return;
    }
    try {
      const fileUrl = pb.getFileUrl(project, 'file');
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
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

  // ----- File Input Handlers -----
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

<style>
  /* Card styling inspired by assets page */
  .card {
    position: relative;
    background-color: #1f2937;
    border-radius: 0.5rem;
    padding: 1.5rem;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 10px rgba(236,72,153,0.3);
  }
  /* Gradient border effect */
  .gradient-border {
    position: absolute;
    inset: 0;
    border-radius: 0.5rem;
    background: linear-gradient(45deg, rgba(59,130,246,0.5), rgba(236,72,153,0.5));
    filter: blur(8px);
    opacity: 0.75;
    transition: opacity 0.5s;
    z-index: -1;
  }
  .card:hover .gradient-border {
    opacity: 1;
  }
  /* Modal styling */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 2rem;
    padding-bottom: 2rem;
    overflow-y: auto;
    z-index: 40;
  }
  .modal {
    background: #2d3748;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    border-radius: 0.5rem;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 50;
  }
  /* Input & textarea */
  input, textarea {
    background: #1f2937;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    padding: 0.5rem;
    color: #e5e7eb;
    width: 100%;
  }
  /* Upload button */
  .upload-btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #2563eb;
    color: white;
    border-radius: 0.375rem;
    cursor: pointer;
  }
  .upload-btn:hover {
    background: #1d4ed8;
  }
  .hidden-input {
    display: none;
  }
  .preview-image {
    margin-top: 10px;
    max-width: 100px;
    max-height: 100px;
    border-radius: 0.375rem;
  }
  .flex-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  /* Asset checkbox styling */
  .asset-checkbox {
    display: flex;
    align-items: center;
    background-color: #2d3748;
    padding: 0.4rem 0.6rem;
    border-radius: 0.25rem;
    margin-bottom: 4px;
    transition: background-color 0.2s;
  }
  .asset-checkbox:hover {
    background-color: #374151;
  }
  .asset-checkbox input[type="checkbox"] {
    margin-right: 0.5rem;
  }
  /* Utility for truncating text */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>


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
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">Web Applications</a></li>
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">Mobile Applications</a></li>
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">Data Science Projects</a></li>
          <li><a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">Enterprise Apps</a></li>
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 p-8 overflow-y-auto">
      <!-- Breadcrumbs & Add Button -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center space-x-2 text-sm">
          <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">Home</a>
          <span>»</span>
          <span>Projects</span>
        </div>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm" on:click={() => showAddModal = true}>
          Add Project
        </button>
      </div>

      {#if loading}
        <div class="flex justify-center items-center h-64">
          <p class="text-lg text-gray-400">Loading projects...</p>
        </div>
      {:else if error}
        <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-8">
          <p>{error}</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {#each projects as project}
            <div class="card">
              <div class="gradient-border"></div>
              <div class="relative">
                <div class="flex-row">
                  {#if project.logo}
                    <img src={pb.getFileUrl(project, 'logo')} alt="Project Logo" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem;" />
                  {/if}
                  <h2 class="text-2xl font-semibold">{project.name}</h2>
                </div>
                <p><strong>Language:</strong> {project.language}</p>
                <p><strong>Owner:</strong> {project.owner}</p>
                <p><strong>Launched:</strong> {project.launched}</p>
                <p><strong>Project ID:</strong> {project.project_id}</p>
                {#if project.tag}
                  <p><strong>Tag:</strong> {JSON.stringify(project.tag)}</p>
                {/if}
                {#if project.expand?.asset_id && project.expand.asset_id.length > 0}
                  <div class="mt-2">
                    <strong>Linked Assets:</strong>
                    <ul class="list-disc list-inside">
                      {#each project.expand.asset_id as asset}
                        <li>{asset.name}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                <p class="mt-2 line-clamp-2">{project.description}</p>
                <div class="mt-4 flex justify-between items-center">
                  <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm" on:click={() => editProject(project)}>
                    Edit
                  </button>
                  <button class="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" on:click={() => deleteProject(project.id)}>
                    Delete
                  </button>
                  <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm" on:click={() => downloadProject(project)}>
                    Download
                  </button>
                </div>
                <div class="mt-2">
                  <button class="text-blue-600 dark:text-blue-400 text-sm hover:underline" on:click={() => toggleDetails(project.id)}>
                    {expandedProjects[project.id] ? "Hide Details" : "View Details"}
                  </button>
                </div>
                {#if expandedProjects[project.id]}
                  <div class="mt-4 text-sm text-gray-200">
                    {#if project.tag}
                      <p><strong>Tag:</strong> {JSON.stringify(project.tag)}</p>
                    {/if}
                    {#if project.expand?.asset_id && project.expand.asset_id.length > 0}
                      <div class="mt-2">
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
    </div>

    <!-- Right Sidebar -->
    <aside class="hidden xl:block w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 min-h-screen">
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Project Statistics</h2>
        <ul class="space-y-2">
          <li class="flex justify-between">
            <span>Total Projects:</span> <span>{projects.length}</span>
          </li>
          {#if projects.length > 0}
            <li class="flex justify-between">
              <span>Last Updated:</span> <span>{projects[0].date_updated || "N/A"}</span>
            </li>
            <li class="flex justify-between">
              <span>Created:</span> <span>{projects[0].date_created || "N/A"}</span>
            </li>
          {/if}
        </ul>
      </div>
      <div>
        <h2 class="text-xl font-bold mb-4">Popular Tags</h2>
        <div class="flex flex-wrap gap-2">
          <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">web</a>
          <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">mobile</a>
          <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">svelte</a>
          <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">js</a>
        </div>
      </div>
    </aside>
  </div>
</main>

<!-- Add Project Modal -->
{#if showAddModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h2 class="text-2xl font-bold mb-6 text-white">Add New Project</h2>
      <div class="space-y-4">
        <div>
          <label for="new-name" class="text-white">Project Name</label>
          <input id="new-name" type="text" bind:value={newProject.name} placeholder="Enter project name" />
        </div>
        <div>
          <label for="new-description" class="text-white">Description</label>
          <textarea id="new-description" rows="3" bind:value={newProject.description} placeholder="Enter project description"></textarea>
        </div>
        <div>
          <label for="new-language" class="text-white">Language</label>
          <input id="new-language" type="text" bind:value={newProject.language} placeholder="Enter language" />
        </div>
        <div>
          <label for="new-owner" class="text-white">Owner</label>
          <input id="new-owner" type="text" bind:value={newProject.owner} placeholder="Enter owner" />
        </div>
        <div>
          <label for="new-launched" class="text-white">Launched</label>
          <input id="new-launched" type="date" bind:value={newProject.launched} />
        </div>
        <div>
          <label for="new-project_id" class="text-white">Project ID</label>
          <input id="new-project_id" type="text" bind:value={newProject.project_id} placeholder="Enter unique project ID" />
        </div>
        <div>
          <label for="new-tag" class="text-white">Tag (JSON format)</label>
          <textarea id="new-tag" rows="2" bind:value={newProject.tag} placeholder={examplePlaceholder}></textarea>
        </div>
        <!-- Upload Logo -->
        <div>
          <label class="upload-btn" for="new-logo">Upload Logo</label>
          <input id="new-logo" type="file" accept="image/*" on:change={handleNewLogoChange} class="hidden-input" />
          {#if newLogoFileName}
            <span class="ml-2 text-white">{newLogoFileName}</span>
          {/if}
          {#if newLogoPreview}
            <img src={newLogoPreview} alt="New Logo Preview" class="preview-image" />
          {/if}
        </div>
        <!-- Linked Assets Checkboxes -->
        <div>
          <label class="text-white">Link Assets</label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            {#each assets.slice().sort((a, b) => a.name.localeCompare(b.name)) as asset}
              <label class="asset-checkbox">
                <input type="checkbox" value={asset.id} bind:group={newProject.asset_id} />
                <span class="text-sm text-white">{asset.name} {asset.version ? `(${asset.version})` : ''}</span>
              </label>
            {/each}
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-4">
        <button class="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded text-white" on:click={() => (showAddModal = false)}>
          Cancel
        </button>
        <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white" on:click={createProject}>
          Save
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Project Modal -->
{#if showEditModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h2 class="text-2xl font-bold mb-6 text-white">Edit Project</h2>
      <div class="space-y-4">
        <div>
          <label for="edit-name" class="text-white">Project Name</label>
          <input id="edit-name" type="text" bind:value={updatedProject.name} placeholder="Enter project name" />
        </div>
        <div>
          <label for="edit-description" class="text-white">Description</label>
          <textarea id="edit-description" rows="3" bind:value={updatedProject.description} placeholder="Enter project description"></textarea>
        </div>
        <div>
          <label for="edit-language" class="text-white">Language</label>
          <input id="edit-language" type="text" bind:value={updatedProject.language} placeholder="Enter language" />
        </div>
        <div>
          <label for="edit-owner" class="text-white">Owner</label>
          <input id="edit-owner" type="text" bind:value={updatedProject.owner} placeholder="Enter owner" />
        </div>
        <div>
          <label for="edit-launched" class="text-white">Launched</label>
          <input id="edit-launched" type="date" bind:value={updatedProject.launched} />
        </div>
        <div>
          <label for="edit-project_id" class="text-white">Project ID</label>
          <input id="edit-project_id" type="text" bind:value={updatedProject.project_id} placeholder="Enter unique project ID" />
        </div>
        <div>
          <label for="edit-tag" class="text-white">Tag (JSON format)</label>
          <textarea id="edit-tag" rows="2" bind:value={updatedProject.tag} placeholder={examplePlaceholder}></textarea>
        </div>
        <!-- Upload New Logo -->
        <div>
          <label class="upload-btn" for="edit-logo">Upload New Logo</label>
          <input id="edit-logo" type="file" accept="image/*" on:change={handleEditLogoChange} class="hidden-input" />
          {#if editLogoFileName}
            <span class="ml-2 text-white">{editLogoFileName}</span>
          {/if}
          {#if editLogoPreview}
            <img src={editLogoPreview} alt="Edit Logo Preview" class="preview-image" />
          {/if}
        </div>
        <!-- Edit Linked Assets Checkboxes -->
        <div>
          <label class="text-white">Edit Linked Assets</label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            {#each assets.slice().sort((a, b) => a.name.localeCompare(b.name)) as asset}
              <label class="asset-checkbox">
                <input type="checkbox" value={asset.id} bind:group={updatedProject.asset_id} />
                <span class="text-sm text-white">{asset.name} {asset.version ? `(${asset.version})` : ''}</span>
              </label>
            {/each}
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-4">
        <button class="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded text-white" on:click={() => { showEditModal = false; editingProject = null; }}>
          Cancel
        </button>
        <button class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white" on:click={updateProject}>
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}
