<script>
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';

  // A large list of coding languages
  let availableLanguages = [
    "Assembly", "Ada", "ALGOL", "APL", "Awk", "Bash", "BASIC", "C", "C++", "C#", "COBOL",
    "CoffeeScript", "Crystal", "D", "Dart", "Delphi/Object Pascal", "Eiffel", "Elixir",
    "Elm", "Erlang", "F#", "Fortran", "Go", "Groovy", "Haskell", "HTML/CSS", "Java",
    "JavaScript", "Julia", "Kotlin", "LabVIEW", "Lisp", "Lua", "MATLAB", "Nim",
    "Objective-C", "OCaml", "Pascal", "Perl", "PHP", "Prolog", "Python", "R", "Ruby",
    "Rust", "Scala", "Scheme", "Smalltalk", "SQL", "Swift", "TypeScript", "VB.NET",
    "Visual Basic", "Clojure", "PowerShell", "Forth", "Racket", "SAS", "ABAP",
    "Common Lisp", "Factor", "Fantom", "Io", "J", "K", "Logo", "Modula-2", "Modula-3",
    "OpenCL", "Oz", "PL/I", "REBOL", "RPG", "Simula", "Standard ML", "Tcl", "XQuery",
    "Zig"
  ];

  // Projects, assets, loading/error states
  let projects = [];
  let assets = [];
  let loading = true;
  let error = null;

  // Show/hide Add and Edit forms
  let showAddForm = false;
  let showEditForm = false;

  // ---------------------------------------------------------------------
  // NEW PROJECT (for Create)
  // ---------------------------------------------------------------------
  let newProject = {
    name: '',
    description: '',
    language: [],  // multiple languages as an array
    launched: '',
    project_id: '',
    asset_id: []
  };

  let newLogoFile = null;
  let newLogoFileName = '';
  let newLogoPreview = '';

  // Multi-select dropdown controls for Add form
  let langDropdownOpenAdd = false;
  let searchAdd = '';

  // Clear all selected languages in the Add form
  function clearLanguagesAdd() {
    newProject.language = [];
  }

  // ---------------------------------------------------------------------
  // EDITING PROJECT (for Edit)
  // ---------------------------------------------------------------------
  let editingProject = null;
  let updatedProject = {};
  let editLogoFile = null;
  let editLogoFileName = '';
  let editLogoPreview = '';

  // Multi-select dropdown controls for Edit form
  let langDropdownOpenEdit = false;
  let searchEdit = '';

  // Clear all selected languages in the Edit form
  function clearLanguagesEdit() {
    updatedProject.language = [];
  }

  // Toggle expanded details for each project card
  let expandedProjects = {};

  // ---------------------------------------------------------------------
  // FETCH DATA ON MOUNT
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // CREATE PROJECT
  // ---------------------------------------------------------------------
  async function createProject() {
    try {
      // Ensure unique project_id
      if (projects.find(p => p.project_id === newProject.project_id)) {
        alert("Project ID must be unique. Another project with this ID exists.");
        return;
      }

      // Ensure user is logged in
      const currentUser = pb.authStore?.model;
      if (!currentUser) {
        alert("You must be logged in to create a project.");
        return;
      }

      // Build form data
      let formData = new FormData();
      formData.append('name', newProject.name);
      formData.append('description', newProject.description);
      formData.append('language', JSON.stringify(newProject.language));
      formData.append('launched', newProject.launched || '');
      if (newLogoFile) {
        formData.append('logo', newLogoFile);
      }
      formData.append('project_id', newProject.project_id);
      formData.append('asset_id', JSON.stringify(newProject.asset_id));
      formData.append('owner_id', currentUser.id);

      // Create in PocketBase
      const record = await pb.collection('projects').create(formData);

      // Fetch the newly created project (with expanded assets)
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
      language: [],
      launched: '',
      project_id: '',
      asset_id: []
    };
    newLogoFile = null;
    newLogoFileName = '';
    newLogoPreview = '';
    langDropdownOpenAdd = false;
    searchAdd = '';
  }

  // ---------------------------------------------------------------------
  // EDIT PROJECT
  // ---------------------------------------------------------------------
  function editProject(project) {
    editingProject = project;

    // If languages are stored as JSON, parse them
    let parsedLangs = [];
    try {
      parsedLangs = JSON.parse(project.language) || [];
      if (!Array.isArray(parsedLangs)) parsedLangs = [];
    } catch (err) {
      if (Array.isArray(project.language)) parsedLangs = project.language;
    }

    const assetIds = project.expand?.asset_id ? project.expand.asset_id.map(a => a.id) : [];
    updatedProject = {
      ...project,
      language: parsedLangs,
      asset_id: assetIds
    };
    delete updatedProject.owner_id;

    editLogoFile = null;
    editLogoFileName = '';
    editLogoPreview = '';
    langDropdownOpenEdit = false;
    searchEdit = '';

    showEditForm = true;
  }

  // ---------------------------------------------------------------------
  // UPDATE PROJECT
  // ---------------------------------------------------------------------
  async function updateProject() {
    try {
      let formData = new FormData();
      formData.append('name', updatedProject.name);
      formData.append('description', updatedProject.description);
      formData.append('language', JSON.stringify(updatedProject.language));
      // Do not update launched or owner_id
      formData.append('launched', editingProject.launched || '');

      if (editLogoFile) {
        formData.append('logo', editLogoFile);
      }
      // The Project ID is read-only once created, so we won't let the user change it
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

  // ---------------------------------------------------------------------
  // DELETE PROJECT
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // UI HANDLERS
  // ---------------------------------------------------------------------
  function toggleDetails(id) {
    expandedProjects = { ...expandedProjects, [id]: !expandedProjects[id] };
  }

  // For new logo (Add)
  function handleNewLogoChange(event) {
    const file = event.target.files[0];
    if (file) {
      newLogoFile = file;
      newLogoFileName = file.name;
      const reader = new FileReader();
      reader.onload = e => { newLogoPreview = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      newLogoFile = null;
      newLogoFileName = '';
      newLogoPreview = '';
    }
  }

  // For new logo (Edit)
  function handleEditLogoChange(event) {
    const file = event.target.files[0];
    if (file) {
      editLogoFile = file;
      editLogoFileName = file.name;
      const reader = new FileReader();
      reader.onload = e => { editLogoPreview = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      editLogoFile = null;
      editLogoFileName = '';
      editLogoPreview = '';
    }
  }

  // Filtering languages for the Add form
  function filteredLanguagesAdd() {
    if (!searchAdd.trim()) return availableLanguages;
    return availableLanguages.filter(lang =>
      lang.toLowerCase().includes(searchAdd.toLowerCase())
    );
  }

  // Filtering languages for the Edit form
  function filteredLanguagesEdit() {
    if (!searchEdit.trim()) return availableLanguages;
    return availableLanguages.filter(lang =>
      lang.toLowerCase().includes(searchEdit.toLowerCase())
    );
  }

  // Toggle a language in the Add form
  function toggleLangOptionAdd(lang) {
    if (newProject.language.includes(lang)) {
      newProject.language = newProject.language.filter(item => item !== lang);
    } else {
      newProject.language = [...newProject.language, lang];
    }
  }

  // Toggle a language in the Edit form
  function toggleLangOptionEdit(lang) {
    if (updatedProject.language.includes(lang)) {
      updatedProject.language = updatedProject.language.filter(item => item !== lang);
    } else {
      updatedProject.language = [...updatedProject.language, lang];
    }
  }

  // ---------------------------------------------------------------------
  // HELPER: DATE FORMATTING
  // ---------------------------------------------------------------------
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper to display languages as a comma-separated string
  function displayLanguages(langValue) {
    if (!langValue) return 'N/A';
    if (Array.isArray(langValue)) {
      return langValue.length ? langValue.join(', ') : 'N/A';
    }
    try {
      let arr = JSON.parse(langValue);
      return (Array.isArray(arr) && arr.length) ? arr.join(', ') : 'N/A';
    } catch {
      return langValue || 'N/A';
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
        <!-- ADD PROJECT FORM -->
        <section>
          <div class="flex items-center space-x-3 mb-6">
            {#if newLogoPreview}
              <img
                src={newLogoPreview}
                alt="New Logo Preview"
                class="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600"
              />
            {:else}
              <div
                class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md 
                       flex items-center justify-center text-gray-500 text-xs"
              >
                No Logo
              </div>
            {/if}
            <h2 class="text-2xl font-semibold">Add New Project</h2>
          </div>

          <div class="max-w-2xl">
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

              <!-- Multi-select Dropdown for Languages (Add) -->
              <div class="mb-4 relative">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Languages</label>
                <button
                  type="button"
                  class="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex justify-between 
                         focus:ring-blue-500 focus:border-blue-500"
                  on:click={() => (langDropdownOpenAdd = !langDropdownOpenAdd)}
                >
                  {#if newProject.language.length > 0}
                    {newProject.language.join(', ')}
                  {:else}
                    Select Programming Languages...
                  {/if}
                  <!-- caret -->
                  <svg class="ml-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {#if langDropdownOpenAdd}
                  <div
                    class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 
                           border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto"
                  >
                    <!-- Search + Clear/Done row -->
                    <div class="p-2 border-b border-gray-200 dark:border-gray-600 flex items-center">
                      <input
                        type="text"
                        placeholder="Search..."
                        bind:value={searchAdd}
                        class="w-full p-2 text-sm bg-gray-100 dark:bg-gray-800 
                               border border-gray-200 dark:border-gray-600 rounded-md
                               focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-gray-300"
                      />
                      <!-- "Clear" button to unselect all -->
                      <button
                        type="button"
                        class="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        on:click={clearLanguagesAdd}
                      >
                        Clear
                      </button>
                      <!-- "Done" button to close -->
                      <button
                        type="button"
                        class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        on:click={() => (langDropdownOpenAdd = false)}
                      >
                        Done
                      </button>
                    </div>

                    <!-- Checkboxes list -->
                    <div class="p-2 space-y-1">
                      {#each filteredLanguagesAdd() as lang}
                        <label
                          class="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 
                                 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            class="rounded"
                            checked={newProject.language.includes(lang)}
                            on:change={() => toggleLangOptionAdd(lang)}
                          />
                          <span>{lang}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                {/if}
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose one or more languages
                </p>
              </div>

              <!-- Launched (Editable on create) -->
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

              <!-- Upload Logo -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Logo</label>
                <div class="mt-1 flex items-center space-x-2">
                  <label
                    class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 
                           bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                  >
                    Select File
                    <input 
                      type="file" 
                      accept="image/*" 
                      on:change={handleNewLogoChange} 
                      class="hidden"
                    />
                  </label>
                  {#if newLogoFileName}
                    <div class="text-sm text-gray-600 dark:text-gray-400">{newLogoFileName}</div>
                  {/if}
                </div>
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
        <!-- EDIT PROJECT FORM -->
        <section>
          <div class="flex items-center space-x-3 mb-6">
            {#if editingProject?.logo && !editLogoFile}
              <img
                src={pb.getFileUrl(editingProject, 'logo')}
                alt="Project Logo"
                class="w-16 h-16 object-cover rounded-md 
                       border border-gray-300 dark:border-gray-600"
              />
            {:else if editLogoPreview}
              <img
                src={editLogoPreview}
                alt="New Logo Preview"
                class="w-16 h-16 object-cover rounded-md 
                       border border-gray-300 dark:border-gray-600"
              />
            {:else}
              <div
                class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md 
                       flex items-center justify-center text-gray-500 text-xs"
              >
                No Logo
              </div>
            {/if}
            <h2 class="text-2xl font-semibold">
              {editingProject.name || "Edit Project"}
            </h2>
          </div>

          <div class="max-w-2xl">
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

              <!-- Multi-select Dropdown for Languages (Edit) -->
              <div class="mb-4 relative">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Languages</label>
                <button
                  type="button"
                  class="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex justify-between 
                         focus:ring-blue-500 focus:border-blue-500"
                  on:click={() => (langDropdownOpenEdit = !langDropdownOpenEdit)}
                >
                  {#if updatedProject.language.length > 0}
                    {updatedProject.language.join(', ')}
                  {:else}
                    Select Programming Languages...
                  {/if}
                  <svg class="ml-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {#if langDropdownOpenEdit}
                  <div
                    class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 
                           border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto"
                  >
                    <!-- Search + Clear/Done row -->
                    <div class="p-2 border-b border-gray-200 dark:border-gray-600 flex items-center">
                      <input
                        type="text"
                        placeholder="Search..."
                        bind:value={searchEdit}
                        class="w-full p-2 text-sm bg-gray-100 dark:bg-gray-800 
                               border border-gray-200 dark:border-gray-600 rounded-md
                               focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-gray-300"
                      />
                      <!-- "Clear" button to unselect all -->
                      <button
                        type="button"
                        class="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        on:click={clearLanguagesEdit}
                      >
                        Clear
                      </button>
                      <!-- "Done" button to close -->
                      <button
                        type="button"
                        class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        on:click={() => (langDropdownOpenEdit = false)}
                      >
                        Done
                      </button>
                    </div>

                    <!-- Checkboxes list -->
                    <div class="p-2 space-y-1">
                      {#each filteredLanguagesEdit() as lang}
                        <label
                          class="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 
                                 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            class="rounded"
                            checked={updatedProject.language.includes(lang)}
                            on:change={() => toggleLangOptionEdit(lang)}
                          />
                          <span>{lang}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                {/if}
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose one or more languages
                </p>
              </div>

              <!-- Launched (read-only in edit) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Launched</label>
                <input
                  type="date"
                  bind:value={updatedProject.launched}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                  disabled
                  title="Launched date cannot be changed after creation."
                />
              </div>

              <!-- Project ID (read-only in edit) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID</label>
                <input
                  type="text"
                  bind:value={updatedProject.project_id}
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         cursor-not-allowed"
                  disabled
                  title="Project ID cannot be changed once created."
                />
              </div>

              <!-- Upload New Logo -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload New Logo</label>
                <div class="mt-1 flex items-center space-x-2">
                  <label
                    class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 
                           bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                  >
                    Select File
                    <input type="file" accept="image/*" on:change={handleEditLogoChange} class="hidden" />
                  </label>
                  {#if editLogoFileName}
                    <div class="text-sm text-gray-600 dark:text-gray-400">{editLogoFileName}</div>
                  {/if}
                </div>
              </div>

              <!-- Link Assets -->
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
        <!-- PROJECTS GRID (No logo displayed) -->
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
                  <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-all duration-500 group-hover:duration-200"></div>
                  <div class="relative h-full bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-md transform transition-transform group-hover:scale-105">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400"><strong>Last Updated:</strong> {formatDate(project.updated)}</p>
                    <div class="mt-3 flex items-center justify-between">
                      <div class="flex space-x-2">
                        <button class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded" on:click={() => editProject(project)}>Edit</button>
                        <button class="px-2 py-1 text-xs bg-red-500 hover:bg-red-700 text-white rounded" on:click={() => deleteProject(project.id)}>Delete</button>
                      </div>
                    </div>
                    <div class="mt-3">
                      <button class="text-blue-600 dark:text-blue-400 text-xs hover:underline" on:click={() => toggleDetails(project.id)}>
                        {expandedProjects[project.id] ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                    {#if expandedProjects[project.id]}
                      <div class="mt-4 text-xs text-gray-700 dark:text-gray-200 space-y-1">
                        <p><strong>Languages:</strong> {displayLanguages(project.language)}</p>
                        <p><strong>Launched:</strong> {project.launched || 'N/A'}</p>
                        <p><strong>Project ID:</strong> {project.project_id}</p>
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
          <span>Total Projects:</span> 
          <span>{projects.length}</span>
        </li>
        {#if projects.length > 0}
          <li class="flex justify-between">
            <span>Last Updated:</span>
            <span>{formatDate(projects[0].updated)}</span>
          </li>
          <li class="flex justify-between">
            <span>Created:</span>
            <span>{formatDate(projects[0].created)}</span>
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
  /* For truncating text if necessary */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
