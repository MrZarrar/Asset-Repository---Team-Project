<script>
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { fade, scale } from 'svelte/transition';

  /*************************************************************
   * Coding languages for multi-select
   *************************************************************/
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

  /*************************************************************
   * Projects, assets, and state flags
   *************************************************************/
  let projects = [];
  let assets = [];
  let loading = true;
  let error = null;

  // Form toggles
  let showAddForm = false;
  let showEditForm = false;

  // Save success modal flag (green animation on create/update)
  let showSaveSuccess = false;

  // ------------------ NEW PROJECT (Add form) ------------------
  let newProject = {
    name: '',
    description: '',
    language: [],
    launched: '',
    id: '',       // user-defined ID (must be unique)
    asset_id: []
  };

  let newLogoFile = null;
  let newLogoFileName = '';
  let newLogoPreview = '';

  // Multi-select controls for Add form
  let langDropdownOpenAdd = false;
  let searchAdd = '';

  function clearLanguagesAdd() {
    newProject.language = [];
  }

  // ------------------ EDITING PROJECT ------------------
  let editingProject = null;
  let updatedProject = {};
  let editLogoFile = null;
  let editLogoFileName = '';
  let editLogoPreview = '';

  // We'll store original values (as JSON strings) to compare later.
  let originalLanguageStr = '';
  let originalAssetIdsStr = '';

  // Multi-select controls for Edit form
  let langDropdownOpenEdit = false;
  let searchEdit = '';

  function clearLanguagesEdit() {
    updatedProject.language = [];
  }

  // ------------------ VIEW DETAILS MODAL ------------------
  let showProjectDetails = false;
  let selectedProject = null;
  function openProjectDetails(project) {
    selectedProject = project;
    showProjectDetails = true;
  }
  function closeProjectDetails() {
    showProjectDetails = false;
    selectedProject = null;
  }

  // ------------------ DELETE MODALS ------------------
  let showConfirmModal = false;
  let showDeleteSuccess = false;
  let projectToDeleteId = null;

  function requestDeleteProject(id) {
    projectToDeleteId = id;
    showConfirmModal = true;
  }

  function cancelDelete() {
    showConfirmModal = false;
    projectToDeleteId = null;
  }

  async function confirmDelete() {
    if (!projectToDeleteId) return;
    showConfirmModal = false;
    try {
      await pb.collection('projects').delete(projectToDeleteId);
      projects = projects.filter(p => p.id !== projectToDeleteId);
      projectToDeleteId = null;
      showDeleteSuccess = true;
      setTimeout(() => { showDeleteSuccess = false; }, 3000);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project.');
    }
  }

  function closeDeleteSuccess() {
    showDeleteSuccess = false;
  }

  // ------------------ SAVE SUCCESS MODAL ------------------
  function triggerSaveSuccess() {
    showSaveSuccess = true;
    setTimeout(() => { showSaveSuccess = false; }, 3000);
  }
  function closeSaveSuccess() {
    showSaveSuccess = false;
  }

  // ------------------ FETCH DATA ON MOUNT ------------------
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

  // ------------------ CREATE PROJECT ------------------
  async function createProject() {
    try {
      const currentUser = pb.authStore?.model;
      if (!currentUser) {
        alert("You must be logged in to create a project.");
        return;
      }
      if (newProject.id && projects.find(p => p.id === newProject.id)) {
        alert("ID must be unique. Another project with this ID already exists.");
        return;
      }
      let formData = new FormData();
      formData.append('id', newProject.id || '');
      formData.append('name', newProject.name || '');
      formData.append('description', newProject.description || '');
      formData.append('language', JSON.stringify(newProject.language));
      formData.append('launched', newProject.launched || '');
      if (newLogoFile) {
        formData.append('logo', newLogoFile);
      }
      formData.append('asset_id', JSON.stringify(newProject.asset_id));
      formData.append('owner_id', currentUser.id);

      const record = await pb.collection('projects').create(formData);
      const fetchedRecord = await pb.collection('projects').getOne(record.id, { expand: 'asset_id' });
      projects = [fetchedRecord, ...projects];

      resetNewProject();
      showAddForm = false;
      triggerSaveSuccess();
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
      id: '',
      asset_id: []
    };
    newLogoFile = null;
    newLogoFileName = '';
    newLogoPreview = '';
    langDropdownOpenAdd = false;
    searchAdd = '';
  }

  // ------------------ EDIT PROJECT ------------------
  function editProject(project) {
    editingProject = project;
    let parsedLangs = [];
    try {
      parsedLangs = JSON.parse(project.language) || [];
      if (!Array.isArray(parsedLangs)) parsedLangs = [];
    } catch (err) {
      if (Array.isArray(project.language)) parsedLangs = project.language;
    }
    let launchedVal = project.launched;
    if (launchedVal) {
      try {
        const dateObj = new Date(launchedVal);
        if (!isNaN(dateObj.getTime())) {
          launchedVal = dateObj.toISOString().slice(0, 10);
        }
      } catch {}
    }
    const assetIds = project.expand?.asset_id ? project.expand.asset_id.map(a => a.id) : [];
    updatedProject = {
      ...project,
      launched: launchedVal,
      language: parsedLangs,
      asset_id: assetIds
    };
    originalLanguageStr = JSON.stringify(parsedLangs);
    originalAssetIdsStr = JSON.stringify(assetIds);

    editLogoFile = null;
    editLogoFileName = '';
    editLogoPreview = '';
    langDropdownOpenEdit = false;
    searchEdit = '';
    showEditForm = true;
  }

  // ------------------ Helper: Check if changes have been made ------------------
  function hasProjectChanged() {
    if (updatedProject.name !== editingProject.name) return true;
    if (updatedProject.description !== editingProject.description) return true;
    if (JSON.stringify(updatedProject.language) !== originalLanguageStr) return true;
    if (JSON.stringify(updatedProject.asset_id) !== originalAssetIdsStr) return true;
    if (editLogoFile) return true;
    return false;
  }

  // ------------------ UPDATE PROJECT ------------------
  async function updateProject() {
    if (!hasProjectChanged()) {
      alert("No changes have been made.");
      return;
    }
    try {
      let formData = new FormData();
      formData.append('name', updatedProject.name || '');
      formData.append('description', updatedProject.description || '');
      formData.append('language', JSON.stringify(updatedProject.language));
      formData.append('launched', updatedProject.launched || '');
      if (editLogoFile) {
        formData.append('logo', editLogoFile);
      }
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
      triggerSaveSuccess();
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project.');
    }
  }

  /*************************************************************
   * FILE INPUT HANDLERS
   *************************************************************/
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

  /*************************************************************
   * MULTI-SELECT FILTERS
   *************************************************************/
  function filteredLanguagesAdd() {
    if (!searchAdd.trim()) return availableLanguages;
    return availableLanguages.filter(lang =>
      lang.toLowerCase().includes(searchAdd.toLowerCase())
    );
  }

  function filteredLanguagesEdit() {
    if (!searchEdit.trim()) return availableLanguages;
    return availableLanguages.filter(lang =>
      lang.toLowerCase().includes(searchEdit.toLowerCase())
    );
  }

  function toggleLangOptionAdd(lang) {
    if (newProject.language.includes(lang)) {
      newProject.language = newProject.language.filter(item => item !== lang);
    } else {
      newProject.language = [...newProject.language, lang];
    }
  }

  function toggleLangOptionEdit(lang) {
    if (updatedProject.language.includes(lang)) {
      updatedProject.language = updatedProject.language.filter(item => item !== lang);
    } else {
      updatedProject.language = [...updatedProject.language, lang];
    }
  }

  /*************************************************************
   * HELPER: DATE FORMATTING
   *************************************************************/
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

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

<!-- MAIN LAYOUT -->
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

  <!-- CENTER CONTENT -->
  <div class="flex-1 flex flex-col">
    <!-- Header / Breadcrumb + Add Button -->
    <header class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-2 text-sm">
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">Home</a>
        <span>»</span>
        <span>Projects</span>
      </div>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm btn-fancy btn-ripple" on:click={() => showAddForm = true}>
        Add Project
      </button>
    </header>

    <!-- Main Body Area -->
    <div class="flex-1 p-6 overflow-auto">
      {#if showAddForm}
        <!-- ADD PROJECT FORM -->
        <section>
          <div class="flex items-center space-x-3 mb-6">
            {#if newLogoPreview}
              <img src={newLogoPreview} alt="New Logo Preview" class="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
            {:else}
              <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs">
                No Logo
              </div>
            {/if}
            <h2 class="text-2xl font-semibold">Add New Project</h2>
          </div>
          <div class="max-w-2xl">
            <form on:submit|preventDefault={createProject}>
              <!-- Project Name -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Name
                </label>
                <input type="text" bind:value={newProject.name} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter project name" required />
              </div>
              <!-- Description -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea rows="3" bind:value={newProject.description} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter project description"></textarea>
              </div>
              <!-- Multi-select (Add) -->
              <div class="mb-4 relative">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Languages
                </label>
                <button type="button" class="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex justify-between focus:ring-blue-500 focus:border-blue-500 btn-fancy btn-ripple" on:click={() => (langDropdownOpenAdd = !langDropdownOpenAdd)}>
                  {#if newProject.language.length > 0}
                    {newProject.language.join(', ')}
                  {:else}
                    Select Programming Languages...
                  {/if}
                  <svg class="ml-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {#if langDropdownOpenAdd}
                  <div class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                    <div class="p-2 border-b border-gray-200 dark:border-gray-600 flex items-center">
                      <input type="text" placeholder="Search..." bind:value={searchAdd} class="w-full p-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-gray-300" />
                      <button type="button" class="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded btn-fancy" on:click={clearLanguagesAdd}>Clear</button>
                      <button type="button" class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded btn-fancy" on:click={() => (langDropdownOpenAdd = false)}>Done</button>
                    </div>
                    <div class="p-2 space-y-1">
                      {#each filteredLanguagesAdd() as lang}
                        <label class="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer">
                          <input type="checkbox" class="rounded" checked={newProject.language.includes(lang)} on:change={() => toggleLangOptionAdd(lang)} />
                          <span>{lang}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                {/if}
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose one or more languages</p>
              </div>
              <!-- Launched -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Launched
                </label>
                <input type="date" bind:value={newProject.launched} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <!-- ID -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID</label>
                <input type="text" bind:value={newProject.id} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter unique ID" />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Leave blank to auto-generate an ID</p>
              </div>
              <!-- Upload Logo -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Upload Logo
                </label>
                <div class="mt-1 flex items-center space-x-2">
                  <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 btn-fancy btn-ripple">
                    Select File
                    <input type="file" accept="image/*" on:change={handleNewLogoChange} class="hidden" />
                  </label>
                  {#if newLogoFileName}
                    <div class="text-sm text-gray-600 dark:text-gray-400">{newLogoFileName}</div>
                  {/if}
                </div>
              </div>
              <!-- Link Assets (Simple Vertical List) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Assets</label>
                <div class="space-y-2">
                  {#each assets.slice().sort((a, b) => a.name.localeCompare(b.name)) as asset}
                    <label class="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <input type="checkbox" value={asset.id} bind:group={newProject.asset_id} class="rounded accent-blue-600" />
                      <span class="text-sm font-medium">{asset.name}{asset.version ? ` (${asset.version})` : ''}</span>
                    </label>
                  {/each}
                </div>
              </div>
              <!-- Buttons -->
              <div class="flex justify-end">
                <button type="button" class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 btn-fancy btn-ripple" on:click={() => (showAddForm = false)}>Cancel</button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 btn-fancy btn-ripple">Save</button>
              </div>
            </form>
          </div>
        </section>
      {:else if showEditForm}
        <!-- EDIT PROJECT FORM -->
        <section>
          <div class="flex items-center space-x-3 mb-6">
            {#if editingProject?.logo && !editLogoFile}
              <img src={pb.getFileUrl(editingProject, 'logo')} alt="Project Logo" class="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
            {:else if editLogoPreview}
              <img src={editLogoPreview} alt="New Logo Preview" class="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
            {:else}
              <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs">
                No Logo
              </div>
            {/if}
            <h2 class="text-2xl font-semibold">{editingProject.name || "Edit Project"}</h2>
          </div>
          <div class="max-w-2xl">
            <form on:submit|preventDefault={updateProject}>
              <!-- Project Name -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                <input type="text" bind:value={updatedProject.name} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <!-- Description -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea rows="3" bind:value={updatedProject.description} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter project description"></textarea>
              </div>
              <!-- Multi-select (Edit) -->
              <div class="mb-4 relative">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Languages</label>
                <button type="button" class="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex justify-between focus:ring-blue-500 focus:border-blue-500 btn-fancy btn-ripple" on:click={() => (langDropdownOpenEdit = !langDropdownOpenEdit)}>
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
                  <div class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                    <div class="p-2 border-b border-gray-200 dark:border-gray-600 flex items-center">
                      <input type="text" placeholder="Search..." bind:value={searchEdit} class="w-full p-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-gray-300" />
                      <button type="button" class="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded btn-fancy" on:click={clearLanguagesEdit}>Clear</button>
                      <button type="button" class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded btn-fancy" on:click={() => (langDropdownOpenEdit = false)}>Done</button>
                    </div>
                    <div class="p-2 space-y-1">
                      {#each filteredLanguagesEdit() as lang}
                        <label class="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer">
                          <input type="checkbox" class="rounded" checked={updatedProject.language.includes(lang)} on:change={() => toggleLangOptionEdit(lang)} />
                          <span>{lang}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                {/if}
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose one or more languages</p>
              </div>
              <!-- Launched (read-only in edit) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Launched</label>
                <input type="date" bind:value={updatedProject.launched} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed" disabled title="Launched date cannot be changed after creation." />
              </div>
              <!-- ID (read-only in edit) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID</label>
                <input type="text" bind:value={updatedProject.id} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed" disabled title="ID cannot be changed once created." />
              </div>
              <!-- Upload New Logo -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload New Logo</label>
                <div class="mt-1 flex items-center space-x-2">
                  <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 btn-fancy btn-ripple">
                    Select File
                    <input type="file" accept="image/*" on:change={handleEditLogoChange} class="hidden" />
                  </label>
                  {#if editLogoFileName}
                    <div class="text-sm text-gray-600 dark:text-gray-400">{editLogoFileName}</div>
                  {/if}
                </div>
              </div>
              <!-- Edit Linked Assets (Simple Vertical List) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Edit Linked Assets</label>
                <div class="space-y-2">
                  {#each assets.slice().sort((a, b) => a.name.localeCompare(b.name)) as asset}
                    <label class="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                           on:click={() => toggleAssetEdit(asset.id)}>
                      <input type="checkbox" value={asset.id} bind:group={updatedProject.asset_id} class="rounded accent-blue-600" />
                      <span class="text-sm font-medium">{asset.name}{asset.version ? ` (${asset.version})` : ''}</span>
                    </label>
                  {/each}
                </div>
              </div>
              <!-- Buttons -->
              <div class="flex justify-end">
                <button type="button" class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 btn-fancy btn-ripple" on:click={() => { showEditForm = false; editingProject = null; }}>Cancel</button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 btn-fancy btn-ripple">Save Changes</button>
              </div>
            </form>
          </div>
        </section>
      {:else}
        <!-- PROJECTS GRID -->
        {#if loading}
          <div class="flex justify-center items-center h-64">
            <!-- Upgraded loader: three pulsing dots -->
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot animation-delay-200"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot animation-delay-400"></div>
            </div>
            <p class="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        {:else if error}
          <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-8">
            <p>{error}</p>
          </div>
        {:else}
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Latest Projects</h1>
          {#if projects.length === 0}
            <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
              <p>No projects found. Try adding a new one!</p>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {#each projects as project}
                <div class="relative w-64 group transition-transform duration-300 ease-in-out">
                  <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md opacity-75 group-hover:opacity-100 animate-gradient"></div>
                  <div class="relative h-full bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-md transform transition-transform group-hover:scale-105">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center space-x-1">
                      {project.name}
                      <!-- Animated Pencil SVG for Edit icon -->
                      <svg class="w-4 h-4 fill-current text-gray-500 hover:text-gray-700 transition-transform duration-200 transform hover:rotate-12" viewBox="0 0 20 20">
                        <path d="M17.414 2.586a2 2 0 010 2.828l-1.829 1.829-2.828-2.829 1.829-1.829a2 2 0 012.828 0zM4 13.414V16h2.586l7.07-7.07-2.586-2.586L4 13.414z"/>
                      </svg>
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400"><strong>Last Updated:</strong> {formatDate(project.updated)}</p>
                    <div class="mt-3 flex items-center justify-between">
                      <div class="flex space-x-2">
                        <button class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded btn-fancy btn-ripple" on:click={() => editProject(project)}>Edit</button>
                        <button class="px-2 py-1 text-xs bg-red-500 hover:bg-red-700 text-white rounded btn-fancy btn-ripple" on:click={() => requestDeleteProject(project.id)}>Delete</button>
                      </div>
                    </div>
                    <div class="mt-3">
                      <button class="text-blue-600 dark:text-blue-400 text-xs hover:underline" on:click={() => openProjectDetails(project)}>
                        View Details
                      </button>
                    </div>
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

<!-- PROJECT DETAILS MODAL -->
{#if showProjectDetails}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-backdrop" transition:fade>
    <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 mx-4 md:mx-0" transition:scale>
      {#if selectedProject}
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedProject.name}</h2>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" on:click={closeProjectDetails}>✕</button>
        </div>
        <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p><span class="font-medium">ID:</span> {selectedProject.id}</p>
          <p><span class="font-medium">Launched:</span> {selectedProject.launched || 'N/A'}</p>
          <p><span class="font-medium">Languages:</span> {displayLanguages(selectedProject.language)}</p>
          {#if selectedProject.expand?.asset_id && selectedProject.expand.asset_id.length > 0}
            <div>
              <span class="font-medium">Linked Assets:</span>
              <ul class="list-disc list-inside ml-4 mt-1">
                {#each selectedProject.expand.asset_id as asset}
                  <li>{asset.name}</li>
                {/each}
              </ul>
            </div>
          {/if}
          {#if selectedProject.description}
            <p class="mt-2">{selectedProject.description}</p>
          {/if}
        </div>
        <div class="mt-6 flex justify-end">
          <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm btn-fancy btn-ripple focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" on:click={closeProjectDetails}>Close</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- CONFIRM DELETION MODAL -->
{#if showConfirmModal}
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 modal-backdrop" transition:fade>
    <div class="bg-white dark:bg-gray-800 rounded p-6 w-80 shadow-lg" transition:scale>
      <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
      <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this project? This action cannot be undone.</p>
      <div class="flex justify-end space-x-2">
        <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm btn-fancy btn-ripple" on:click={confirmDelete}>Confirm</button>
        <button class="bg-gray-200 dark:bg-gray-600 text-sm px-3 py-1 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500 btn-fancy btn-ripple" on:click={cancelDelete}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<!-- SUCCESS DELETION MODAL (with pulsing red circle and manual close) -->
{#if showDeleteSuccess}
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 modal-backdrop" transition:fade>
    <div class="relative bg-red-100 dark:bg-red-900 rounded p-6 w-80 shadow-lg" transition:scale>
      <button class="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" on:click={closeDeleteSuccess}>✕</button>
      <div class="flex justify-center mb-4">
        <div class="animated-circle">
          <span class="text-xl text-white">–</span>
        </div>
      </div>
      <h2 class="text-md font-semibold mb-2 text-center text-red-800 dark:text-red-200">Project Deleted Successfully!</h2>
      <p class="text-sm text-center text-red-700 dark:text-red-300 mb-4">The selected project has been removed.</p>
      <div class="flex justify-center">
        <button class="bg-gray-200 dark:bg-gray-600 text-sm px-3 py-1 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500 btn-fancy btn-ripple" on:click={closeDeleteSuccess}>Close</button>
      </div>
    </div>
  </div>
{/if}

<!-- SUCCESS SAVE MODAL (with pulsing green check icon and manual close) -->
{#if showSaveSuccess}
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 modal-backdrop" transition:fade>
    <div class="relative bg-green-100 dark:bg-green-900 rounded p-6 w-80 shadow-lg" transition:scale>
      <button class="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" on:click={closeSaveSuccess}>✕</button>
      <div class="flex justify-center mb-4">
        <div class="animated-green">
          <span class="text-xl text-white">✔</span>
        </div>
      </div>
      <h2 class="text-md font-semibold mb-2 text-center text-green-800 dark:text-green-200">Project Saved Successfully!</h2>
      <p class="text-sm text-center text-green-700 dark:text-green-300">Your changes have been saved.</p>
    </div>
  </div>
{/if}

<style>
  /* Existing Styles */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .animated-circle {
    width: 40px;
    height: 40px;
    background-color: #ef4444;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulseCircle 1.2s ease-in-out infinite;
  }
  @keyframes pulseCircle {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  .animated-green {
    width: 30px;
    height: 30px;
    background-color: #10b981;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulseGreen 1.2s ease-in-out infinite;
  }
  @keyframes pulseGreen {
    0%, 100% { transform: scale(0.9); }
    50% { transform: scale(1.1); }
  }

  /* Enhanced Button Styles */
  .btn-fancy {
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  .btn-fancy:active {
    transform: scale(0.98);
  }
  .btn-ripple {
    position: relative;
    overflow: hidden;
  }
  .btn-ripple::after {
    content: "";
    position: absolute;
    background: rgba(255,255,255,0.4);
    border-radius: 50%;
    width: 100px;
    height: 100px;
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.5s, opacity 1s;
  }
  .btn-ripple:active::after {
    transform: scale(1);
    opacity: 1;
    transition: 0s;
  }
  .modal-backdrop {
    backdrop-filter: blur(4px);
  }
  /* Animated gradient background for project cards */
  .animate-gradient {
    animation: gradientShift 5s ease infinite;
  }
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  /* Loader animation: pulsing dots */
  .animate-pulse-dot {
    animation: pulseDot 1s ease-in-out infinite;
  }
  @keyframes pulseDot {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  .animation-delay-200 {
    animation-delay: 0.2s;
  }
  .animation-delay-400 {
    animation-delay: 0.4s;
  }

  /*************************************************************
   * Refined Link Assets Styles (Simple & Fancy)
   *************************************************************/
  /* Using the original vertical layout with subtle styling */
  .asset-checkbox-label {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: background 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
  }
  .asset-checkbox-label:hover {
    background: #f9fafb;
    border-color: #e5e7eb;
  }
  .asset-checkbox-label input[type="checkbox"] {
    margin-right: 8px;
    accent-color: #3b82f6;
    transform: scale(1.1);
    cursor: pointer;
  }
</style>
