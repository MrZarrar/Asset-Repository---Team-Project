<script>
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';

  // Define a placeholder string for JSON input.
  let examplePlaceholder = JSON.stringify({ framework: "Svelte" });

  // ----- State Variables -----
  let projects = [];
  let assets = []; // if you're linking assets; remove if not needed
  let loading = true;
  let error = null;

  // Modal control flags
  let showAddModal = false;
  let showEditModal = false;

  // New project form data
  let newProject = {
    name: '',
    description: '',
    language: '',
    owner: '',
    launched: '',      // Format: YYYY-MM-DD
    logo: '',          // URL for logo (or use file upload)
    tag: '',           // JSON string, e.g. {"framework": "Svelte"}
    project_id: '',
    linkedAssets: []
  };

  // For editing an existing project
  let editingProject = null;
  let updatedProject = {};

  // ----- Data Fetching -----
  onMount(async () => {
    try {
      // Fetch all projects (newest first)
      projects = await pb.collection('projects').getFullList({ sort: '-created' });
      // Optionally fetch assets for linking
      assets = await pb.collection('assets').getFullList();
    } catch (err) {
      console.error('Error fetching data:', err);
      error = 'Failed to fetch projects or assets: ' + err.message;
    } finally {
      loading = false;
    }
  });

  // ----- Create New Project -----
  async function createProject() {
    try {
      let tagParsed = {};
      if (newProject.tag.trim() !== '') {
        try {
          tagParsed = JSON.parse(newProject.tag);
        } catch (e) {
          alert('Invalid JSON in Tag field. Example: ' + examplePlaceholder);
          return;
        }
      }
      const projectData = { ...newProject, tag: tagParsed };
      console.log("Creating project with data:", projectData);

      const record = await pb.collection('projects').create(projectData);
      console.log("Project created:", record);

      projects = [record, ...projects];
      resetNewProject();
      showAddModal = false;
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Failed to create project. Check console for details.');
    }
  }

  function resetNewProject() {
    newProject = {
      name: '',
      description: '',
      language: '',
      owner: '',
      launched: '',
      logo: '',
      tag: '',
      project_id: '',
      linkedAssets: []
    };
  }

  // ----- Edit Project -----
  function editProject(project) {
    editingProject = project;
    updatedProject = {
      ...project,
      tag: project.tag ? JSON.stringify(project.tag) : ''
    };
    showEditModal = true;
  }

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
      const projectData = { ...updatedProject, tag: tagParsed };
      console.log("Updating project:", projectData);

      const record = await pb.collection('projects').update(editingProject.id, projectData);
      console.log("Project updated:", record);

      projects = projects.map(p => p.id === record.id ? record : p);
      showEditModal = false;
      editingProject = null;
      updatedProject = {};
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project.');
    }
  }

  // ----- Delete Project -----
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
</script>

<svelte:head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Projects</title>
</svelte:head>

<style>
  /* Card styling */
  .card {
    background-color: #1f2937;
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 10px rgba(236,72,153,0.3);
  }

  /* Modal styling */
  .modal-backdrop {
    /* 
      IMPORTANT: Allow vertical scrolling in case the modal is tall. 
      Use flex-start instead of center so the user can scroll from the top.
    */
    position: fixed;
    inset: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    align-items: flex-start; /* or center if you prefer */
    justify-content: center;
    z-index: 40;
    padding-top: 2rem;
    padding-bottom: 2rem;
    overflow-y: auto; /* let the backdrop scroll if modal is tall */
  }

  .modal {
    background: #2d3748;
    width: 100%;
    max-width: 600px;
    margin: 0 auto; /* we rely on the padding from the backdrop for vertical spacing */
    padding: 2rem;
    border-radius: 0.5rem;
    z-index: 50;
    /* 
      Make the modal scrollable if content exceeds 80% of the viewport height. 
    */
    max-height: 80vh;
    overflow-y: auto;
  }

  /* Input styling */
  input, textarea {
    background: #1f2937;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    padding: 0.5rem;
    color: #e5e7eb;
    width: 100%;
  }
</style>

<main class="flex min-h-screen bg-gray-900 text-gray-200">
  <!-- Left Sidebar -->
  <aside class="hidden lg:block w-64 h-screen overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Indexed Projects</h2>
      <div class="h-48 bg-gray-100 dark:bg-gray-700 rounded"></div>
    </div>
    <div>
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Popular Categories</h2>
      <ul class="space-y-2">
        <li>
          <a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">
            Web Applications
          </a>
        </li>
        <li>
          <a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">
            Mobile Applications
          </a>
        </li>
        <li>
          <a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">
            Data Science Projects
          </a>
        </li>
        <li>
          <a class="text-blue-600 dark:text-blue-400 hover:underline" href="#">
            Enterprise Apps
          </a>
        </li>
      </ul>
    </div>
  </aside>

  <!-- Main Content (center) -->
  <div class="flex-1 p-8 overflow-y-auto">
    <div class="mb-8 flex justify-between items-center">
      <h1 class="text-3xl font-bold">Projects</h1>
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        on:click={() => showAddModal = true}
      >
        + Add Project
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
            <h2 class="text-2xl font-semibold mb-4">{project.name}</h2>
            <p><strong>Language:</strong> {project.language}</p>
            <p><strong>Owner:</strong> {project.owner}</p>
            <p><strong>Launched:</strong> {project.launched}</p>
            <p><strong>Project ID:</strong> {project.project_id}</p>
            {#if project.logo}
              <p><strong>Logo:</strong> {project.logo}</p>
            {/if}
            {#if project.tag}
              <p><strong>Tag:</strong> {JSON.stringify(project.tag)}</p>
            {/if}
            {#if project.linkedAssets && project.linkedAssets.length > 0}
              <div class="mt-2">
                <strong>Linked Assets:</strong>
                <ul class="list-disc list-inside">
                  {#each project.linkedAssets as assetId}
                    <li>{assetId}</li>
                  {/each}
                </ul>
              </div>
            {/if}
            <p class="mt-2">{project.description}</p>
            <div class="mt-4 flex justify-between items-center">
              <button
                class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                on:click={() => editProject(project)}
              >
                Edit
              </button>
              <button
                class="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                on:click={() => deleteProject(project.id)}
              >
                Delete
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Right Sidebar -->
  <aside class="hidden xl:block w-72 h-screen overflow-y-auto bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4">
    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Project Statistics</h2>
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
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Popular Tags</h2>
      <div class="flex flex-wrap gap-2">
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">web</a>
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">mobile</a>
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">svelte</a>
        <a class="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded" href="#">js</a>
      </div>
    </div>
  </aside>
</main>

<!-- Add Project Modal -->
{#if showAddModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h2 class="text-2xl font-bold mb-6">Add New Project</h2>
      <div class="space-y-4">
        <div>
          <label for="new-name">Project Name</label>
          <input
            id="new-name"
            type="text"
            bind:value={newProject.name}
            placeholder="Enter project name"
          />
        </div>
        <div>
          <label for="new-description">Description</label>
          <textarea
            id="new-description"
            rows="3"
            bind:value={newProject.description}
            placeholder="Enter project description"
          ></textarea>
        </div>
        <div>
          <label for="new-language">Language</label>
          <input
            id="new-language"
            type="text"
            bind:value={newProject.language}
            placeholder="Enter language"
          />
        </div>
        <div>
          <label for="new-owner">Owner</label>
          <input
            id="new-owner"
            type="text"
            bind:value={newProject.owner}
            placeholder="Enter owner"
          />
        </div>
        <div>
          <label for="new-launched">Launched</label>
          <input
            id="new-launched"
            type="date"
            bind:value={newProject.launched}
          />
        </div>
        <div>
          <label for="new-logo">Logo URL</label>
          <input
            id="new-logo"
            type="text"
            bind:value={newProject.logo}
            placeholder="Enter logo URL"
          />
        </div>
        <div>
          <label for="new-tag">Tag (JSON format)</label>
          <textarea
            id="new-tag"
            rows="2"
            bind:value={newProject.tag}
            placeholder={examplePlaceholder}
          ></textarea>
        </div>
        <div>
          <label for="new-project_id">Project ID</label>
          <input
            id="new-project_id"
            type="text"
            bind:value={newProject.project_id}
            placeholder="Enter unique project ID"
          />
        </div>
        <div>
          <label>Link Assets</label>
          <div class="grid grid-cols-2 gap-2">
            {#each assets as asset}
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id={"new-" + asset.id}
                  value={asset.id}
                  bind:group={newProject.linkedAssets}
                  class="mr-2"
                />
                <label for={"new-" + asset.id} class="text-sm">
                  {asset.name} {asset.version ? `(${asset.version})` : ''}
                </label>
              </div>
            {/each}
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-4">
        <button
          class="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded"
          on:click={() => (showAddModal = false)}
        >
          Cancel
        </button>
        <button
          class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          on:click={createProject}
        >
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
      <h2 class="text-2xl font-bold mb-6">Edit Project</h2>
      <div class="space-y-4">
        <div>
          <label for="edit-name">Project Name</label>
          <input
            id="edit-name"
            type="text"
            bind:value={updatedProject.name}
            placeholder="Enter project name"
          />
        </div>
        <div>
          <label for="edit-description">Description</label>
          <textarea
            id="edit-description"
            rows="3"
            bind:value={updatedProject.description}
            placeholder="Enter project description"
          ></textarea>
        </div>
        <div>
          <label for="edit-language">Language</label>
          <input
            id="edit-language"
            type="text"
            bind:value={updatedProject.language}
            placeholder="Enter language"
          />
        </div>
        <div>
          <label for="edit-owner">Owner</label>
          <input
            id="edit-owner"
            type="text"
            bind:value={updatedProject.owner}
            placeholder="Enter owner"
          />
        </div>
        <div>
          <label for="edit-launched">Launched</label>
          <input
            id="edit-launched"
            type="date"
            bind:value={updatedProject.launched}
          />
        </div>
        <div>
          <label for="edit-logo">Logo URL</label>
          <input
            id="edit-logo"
            type="text"
            bind:value={updatedProject.logo}
            placeholder="Enter logo URL"
          />
        </div>
        <div>
          <label for="edit-tag">Tag (JSON format)</label>
          <textarea
            id="edit-tag"
            rows="2"
            bind:value={updatedProject.tag}
            placeholder={examplePlaceholder}
          ></textarea>
        </div>
        <div>
          <label for="edit-project_id">Project ID</label>
          <input
            id="edit-project_id"
            type="text"
            bind:value={updatedProject.project_id}
            placeholder="Enter unique project ID"
          />
        </div>
        <div>
          <label>Edit Linked Assets</label>
          <div class="grid grid-cols-2 gap-2">
            {#each assets as asset}
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id={"edit-" + asset.id}
                  value={asset.id}
                  bind:group={updatedProject.linkedAssets}
                  class="mr-2"
                />
                <label for={"edit-" + asset.id} class="text-sm">
                  {asset.name} {asset.version ? `(${asset.version})` : ''}
                </label>
              </div>
            {/each}
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-4">
        <button
          class="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded"
          on:click={() => {
            showEditModal = false;
            editingProject = null;
          }}
        >
          Cancel
        </button>
        <button
          class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          on:click={updateProject}
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}
