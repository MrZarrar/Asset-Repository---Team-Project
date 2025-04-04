<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Search, User, Download, ChevronDown, Plus, Upload, Check, X } from "@lucide/svelte";
  import pb from '$lib/pocketbase';
  import { user } from '$lib/user.js';
  import { isAuthenticated } from '$lib/auth';
  import { fetchProjects } from '$lib/projectsService';
  import { fetchAssets } from '$lib/assetService';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';


  
  // Tab state
  let activeTab = 'projects'; // Default to projects tab



   // ------------------ VIEW DETAILS MODAL ------------------
  let showAddProjectForm = false;
  let showEditProjectForm = false;
  let showProjectSaveSuccess = false;
  let showProjectDeleteSuccess = false;
  let showProjectConfirmDeleteModal = false;

  let newProject = { name: '', description: '', language: [], launched: '', id: '', asset_id: [] };
  let newProjectLogoFile = null;
  let newProjectLogoFileName = '';
  let newProjectLogoPreview = '';

  let editingProject = null;
  let updatedProject = {};
  let editProjectLogoFile = null;
  let editProjectLogoFileName = '';
  let editProjectLogoPreview = '';
  let originalLanguageStr = '';
  let originalAssetIdsStr = '';

  let projectToDeleteId = null;
  let showProjectDetails = false;

  let selectedProject = null;

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

  let langDropdownOpenAdd = false;
  let langDropdownOpenEdit = false;
  let searchAdd = '';
  let searchEdit = '';

  // --- PROJECTS FUNCTIONS ---
  async function loadProjectsPage(page) {
    if (page < 1 || page > projectsTotalPages) return;
    projectsPage = page;
    loadingProjects = true;
    try {
      const projectsResponse = await fetchProjects(projectsPage, projectsPerPage, { owner_id: userId });
      projects = projectsResponse.items;
      const total = projectsResponse.totalItems;
      projectsTotalPages = Math.ceil(total / projectsPerPage);
      loadingProjects = false;
    } catch (err) {
      console.error('Error fetching projects:', err);
      projectsError = 'Failed to load projects: ' + err.message;
      loadingProjects = false;
    }
  }

  async function createProject() {
    try {
      if (!pb.authStore?.model) {
        alert("You must be logged in to create a project.");
        return;
      }
      if (role === 'viewer') {
        alert("Viewers do not have permission to create projects.");
        return;
      }
      if (newProject.id && projects.find(p => p.id === newProject.id)) {
        alert("Project ID must be unique.");
        return;
      }
      let formData = new FormData();
      formData.append('id', newProject.id || '');
      formData.append('name', newProject.name || '');
      formData.append('description', newProject.description || '');
      formData.append('language', JSON.stringify(newProject.language));
      formData.append('launched', newProject.launched || '');
      if (newProjectLogoFile) {
        formData.append('logo', newProjectLogoFile);
      }
      formData.append('asset_id', JSON.stringify(newProject.asset_id));
      formData.append('owner_id', userId);

      const record = await pb.collection('projects').create(formData);
      await loadProjectsPage(1);
      resetNewProject();
      showAddProjectForm = false;
      triggerProjectSaveSuccess();
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Failed to create project.');
    }
  }

  function resetNewProject() {
    newProject = { name: '', description: '', language: [], launched: '', id: '', asset_id: [] };
    newProjectLogoFile = null;
    newProjectLogoFileName = '';
    newProjectLogoPreview = '';
    langDropdownOpenAdd = false;
    searchAdd = '';
  }

  function editProjectFn(project) {
    editingProject = project;
    let langs = [];
    try {
      langs = JSON.parse(project.language) || [];
      if (!Array.isArray(langs)) langs = [];
    } catch {
      langs = Array.isArray(project.language) ? project.language : [];
    }
    let launchedVal = project.launched;
    if (launchedVal) {
      try {
        const d = new Date(launchedVal);
        if (!isNaN(d.getTime())) {
          launchedVal = d.toISOString().slice(0, 10);
        }
      } catch {}
    }
    const assetIds = project.expand?.asset_id
      ? project.expand.asset_id.map(a => a.id)
      : (Array.isArray(project.asset_id) ? project.asset_id : []);
    updatedProject = { ...project, launched: launchedVal, language: langs, asset_id: assetIds };
    originalLanguageStr = JSON.stringify(langs);
    originalAssetIdsStr = JSON.stringify(assetIds);
    editProjectLogoFile = null;
    editProjectLogoFileName = '';
    editProjectLogoPreview = '';
    showEditProjectForm = true;
  }

  function hasProjectChanged() {
    if (!editingProject) return false;
    if (updatedProject.name !== editingProject.name) return true;
    if (updatedProject.description !== editingProject.description) return true;
    if (JSON.stringify(updatedProject.language) !== originalLanguageStr) return true;
    if (JSON.stringify(updatedProject.asset_id) !== originalAssetIdsStr) return true;
    if (editProjectLogoFile) return true;
    return false;
  }

  async function updateProject() {
    if (!editingProject) return;
    if (role === 'viewer') {
      alert("Viewers do not have permission to update projects.");
      return;
    }
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
      if (editProjectLogoFile) {
        formData.append('logo', editProjectLogoFile);
      }
      formData.append('asset_id', JSON.stringify(updatedProject.asset_id));

      const record = await pb.collection('projects').update(editingProject.id, formData);
      const fetchedRecord = await pb.collection('projects').getOne(record.id, { expand: 'asset_id' });
      projects = projects.map(p => p.id === fetchedRecord.id ? fetchedRecord : p);
      showEditProjectForm = false;
      editingProject = null;
      updatedProject = {};
      editProjectLogoFile = null;
      editProjectLogoFileName = '';
      editProjectLogoPreview = '';
      triggerProjectSaveSuccess();
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project.');
    }
  }

  function requestDeleteProject(id) {
    projectToDeleteId = id;
    showProjectConfirmDeleteModal = true;
  }

  function cancelProjectDelete() {
    showProjectConfirmDeleteModal = false;
    projectToDeleteId = null;
  }

  async function confirmProjectDelete() {
    if (!projectToDeleteId) return;
    showProjectConfirmDeleteModal = false;
    try {
      await pb.collection('projects').delete(projectToDeleteId);
      projects = projects.filter(p => p.id !== projectToDeleteId);
      projectToDeleteId = null;
      showProjectDeleteSuccess = true;
      setTimeout(() => { showProjectDeleteSuccess = false; }, 3000);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project.');
    }
  }

  function triggerProjectSaveSuccess() {
    showProjectSaveSuccess = true;
    setTimeout(() => { showProjectSaveSuccess = false; }, 3000);
  }
  function closeProjectSaveSuccess() {
    showProjectSaveSuccess = false;
  }
  function closeProjectDeleteSuccess() {
    showProjectDeleteSuccess = false;
  }

  function handleNewProjectLogoChange(event) {
    const file = event.target.files[0];
    if (file) {
      newProjectLogoFile = file;
      newProjectLogoFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => { newProjectLogoPreview = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      newProjectLogoFile = null;
      newProjectLogoFileName = '';
      newProjectLogoPreview = '';
    }
  }

  function handleEditProjectLogoChange(event) {
    const file = event.target.files[0];
    if (file) {
      editProjectLogoFile = file;
      editProjectLogoFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => { editProjectLogoPreview = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      editProjectLogoFile = null;
      editProjectLogoFileName = '';
      editProjectLogoPreview = '';
    }
  }

  function filteredLanguagesAdd() {
    if (!searchAdd.trim()) return availableLanguages;
    return availableLanguages.filter(lang => lang.toLowerCase().includes(searchAdd.toLowerCase()));
  }
  function filteredLanguagesEdit() {
    if (!searchEdit.trim()) return availableLanguages;
    return availableLanguages.filter(lang => lang.toLowerCase().includes(searchEdit.toLowerCase()));
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
  function clearLanguagesAdd() {
    newProject.language = [];
  }
  function clearLanguagesEdit() {
    updatedProject.language = [];
  }


  function openProjectDetails(project) {
    selectedProject = project;
    showProjectDetails = true;
  }
  function closeProjectDetails() {
    showProjectDetails = false;
    selectedProject = null;
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

  



  // State variables
  let projects = [];
  let assets = [];
  let loadingProjects = false;
  let loadingAssets = false;
  let projectsError = null;
  let assetsError = null;

  // Pagination state
  let assetsPage = 1;
  let linkedAssetsPage = 1;
  let assetsTotalPages = 1;
  let linkedAssetsTotalPages = 1; // Added for associated assets pagination
  // Updated assetsPerPage from 3 to 6 for associated assets pagination
  let assetsPerPage = 6;
  let projectsPage = 1;
  let projectsTotalPages = 1;
  let projectsPerPage = 8;
  
  // Add Asset form state
  let addingAsset = false;
  let assetError = null;
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
    category: "", // Add category field
  };
  
  // Add state variables to track copy status for each asset
  let mavenCopiedIndex = -1;
  let gradleCopiedIndex = -1;
  let myMavenCopiedIndex = -1;
  let myGradleCopiedIndex = -1;

  // Add separate state variables for added and copied assets
  let addedMavenCopiedIndex = -1;
  let addedGradleCopiedIndex = -1;
  let copiedMavenCopiedIndex = -1;
  let copiedGradleCopiedIndex = -1;

  // Predefined categories for the dropdown
  const categories = [
    "Testing Frameworks & Tools",
    "Android Packages",
    "Logging Frameworks",
    "JVM Languages"
  ];

  // Function to handle copying with visual feedback
  function copyToClipboard(text, type, index, isAddedAsset = true) {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'maven') {
        if (isAddedAsset) {
          addedMavenCopiedIndex = index;
          setTimeout(() => (addedMavenCopiedIndex = -1), 2000); // Reset after 2 seconds
        } else {
          copiedMavenCopiedIndex = index;
          setTimeout(() => (copiedMavenCopiedIndex = -1), 2000); // Reset after 2 seconds
        }
      } else if (type === 'gradle') {
        if (isAddedAsset) {
          addedGradleCopiedIndex = index;
          setTimeout(() => (addedGradleCopiedIndex = -1), 2000);
        } else {
          copiedGradleCopiedIndex = index;
          setTimeout(() => (copiedGradleCopiedIndex = -1), 2000);
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

      // Show the asset created popup
      showAssetCreatedNotification();

      // Add the new asset to the addedAssets list (ensure reactivity)
      addedAssets = [...addedAssets, createdRecord];

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
        category: "", // Reset category field
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
    

    // Enhanced event handler with debug logging
    const createAssetHandler = (event) => {
      console.log('Received createMavenAsset event:', event.detail);
      if (event.detail) {
        // Switch to the assets tab
        activeTab = 'assets';

        
        // Set addingAsset to true to show the form
        addingAsset = true;
        
        // Fill the form with the data from the event
        newAsset = {
          ...newAsset,
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

    // Make sure to remove existing listeners before adding new ones 
    // to prevent duplicate handlers
    window.addEventListener('createMavenAsset', createAssetHandler);

    // Clean up event listener on component destruction
    return () => {
      window.removeEventListener('createMavenAsset', createAssetHandler);
    };
  });
  
  async function loadData() {
    try {
      loadingProjects = true;
      const projectsResponse = await fetchProjects(projectsPage, projectsPerPage, { owner_id: userId });
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
      loadingAssets = true;
      const assetsResponse = await fetchAssets(assetsPage, 100);
      let filteredAssets = [];
      if (selectedProjectForAssets && selectedProjectForAssets.asset_id) {
        const linkedAssetIds = selectedProjectForAssets.asset_id;
        filteredAssets = assetsResponse.items.filter(asset => linkedAssetIds.includes(asset.id));
      } else {
        const projectIds = projects.map(p => p.id);
        filteredAssets = assetsResponse.items.filter(asset =>
          asset.linked_projects && asset.linked_projects.some(id => projectIds.includes(id))
        );
      }
      const startIndex = (assetsPage - 1) * assetsPerPage;
      const endIndex = startIndex + assetsPerPage;
      assets = filteredAssets.slice(startIndex, endIndex);
      assetsTotalPages = Math.ceil(filteredAssets.length / assetsPerPage);
      loadingAssets = false;
    } catch (err) {
      console.error('Error fetching associated assets:', err);
      assetsError = 'Failed to load associated assets: ' + err.message;
      loadingAssets = false;
    }
  }

  async function loadAssociatedAssetsPage(page) {
    if (page < 1 || page > linkedAssetsTotalPages) return;
    linkedAssetsPage = page;
    loadingAssets = true;
    try {
      const assetsResponse = await fetchAssets(1, 100);
      let filteredAssets = [];
      if (selectedProjectForAssets && selectedProjectForAssets.asset_id) {
        const linkedAssetIds = selectedProjectForAssets.asset_id;
        filteredAssets = assetsResponse.items.filter(asset => linkedAssetIds.includes(asset.id));
      } else {
        const projectIds = projects.map(p => p.id);
        filteredAssets = assetsResponse.items.filter(asset =>
          asset.linked_projects && asset.linked_projects.some(id => projectIds.includes(id))
        );
      }
      const startIndex = (linkedAssetsPage - 1) * assetsPerPage;
      const endIndex = startIndex + assetsPerPage;
      assets = filteredAssets.slice(startIndex, endIndex);
      loadingAssets = false;
      linkedAssetsTotalPages = Math.ceil(filteredAssets.length / assetsPerPage);
    } catch (err) {
      console.error('Error fetching associated assets:', err);
      assetsError = 'Failed to load associated assets: ' + err.message;
      loadingAssets = false;
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
    if (!$isAuthenticated || page < 1 || page > addedAssetsTotalPages) return;

    addedAssetsPage = page;
    loadingAddedAssets = true;

    try {
      const response = await fetchAssets(page, 6, { add_type: ['original', 'added'], owner_id: userId });
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

  let showAssetCreatedPopup = false;

  function showAssetCreatedNotification() {
    showAssetCreatedPopup = true;
    setTimeout(() => {
      showAssetCreatedPopup = false;
    }, 2000);
  }

  function closeAssetCreatedPopup() {
    showAssetCreatedPopup = false;
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

  function selectAllAssets() {
    const allAssetIds = [...addedAssets.map(asset => asset.id), ...copiedAssets.map(asset => asset.id)];
    selectedAssets = new Set(allAssetIds); // Select all assets from both sections
    selectedAssetsCount = selectedAssets.size; // Update the count
  }

  async function clearAllSelections() {
    selectAllAssets(); // Select all assets first
    await new Promise(resolve => setTimeout(resolve, 1)); 
    selectedAssets = new Set(); // Clear the selected assets
    selectedAssetsCount = selectedAssets.size; // Update the count
    assets = assets.map(asset => ({ ...asset })); // Trigger reactivity by creating a new array
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
      selectedAssetsCount = 0; // Ensure the count is reset
      await loadAddedAssetsPage(addedAssetsPage); // Refresh added assets
      await loadCopiedAssetsPage(copiedAssetsPage); // Refresh copied assets

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
      showConfirmPopup = false; // Ensure the confirmation popup is closed
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


  let selectedProjectForAssets = null;
  
  function selectProjectForAssets(project) {
    selectedProjectForAssets = project;
    loadAssociatedAssetsPage(1);
    if (project.expand && project.expand.asset_id) {
      // If expanded linked assets are available, set assets accordingly and disable pagination
      assets = project.expand.asset_id;
      linkedAssetsTotalPages = 1;
    } else {
      // Fallback: filter current assets by project id
      assets = assets.filter(a => a.linked_projects && a.linked_projects.includes(project.id));
      linkedAssetsTotalPages = 1;
    }
  }
  
  function clearSelectedProject() {
    selectedProjectForAssets = null;
    loadAssociatedAssetsPage(linkedAssetsPage);
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
    
   <!-- PROJECTS TAB -->
   {#if activeTab === 'projects'}
   <section class="mb-12">
     <div class="flex justify-between items-center mb-6">
       <h2 class="text-2xl font-semibold">My Projects</h2>
       {#if role !== 'viewer'}
         {#if !showAddProjectForm && !showEditProjectForm}
           <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm ml-4"
             on:click={() => showAddProjectForm = true}>
             Add Project
           </button>
         {/if}
       {/if}
     </div>

     {#if showAddProjectForm}
       <!-- ADD PROJECT FORM -->
       <div class="mb-6">
         <h2 class="text-2xl font-bold mb-4">Add New Project</h2>
         <form on:submit|preventDefault={createProject}>
           <!-- Logo Preview -->
           <div class="flex items-center space-x-3 mb-4">
             {#if newProjectLogoPreview}
               <img src={newProjectLogoPreview} alt="New Logo Preview" class="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
             {:else}
               <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs">
                 No Logo
               </div>
             {/if}
           </div>
           <!-- Project Name -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
             <input type="text" bind:value={newProject.name} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
           </div>
           <!-- Description -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
             <textarea rows="3" bind:value={newProject.description} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter project description"></textarea>
           </div>
           <!-- Languages Multi-Select -->
           <div class="mb-4 relative">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Languages</label>
             <button type="button" class="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex justify-between focus:ring-blue-500 focus:border-blue-500" on:click={() => (langDropdownOpenAdd = !langDropdownOpenAdd)}>
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
                   <button type="button" class="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded" on:click={clearLanguagesAdd}>Clear</button>
                   <button type="button" class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded" on:click={() => (langDropdownOpenAdd = false)}>Done</button>
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
           </div>
           <!-- Launched -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Launched</label>
             <input type="date" bind:value={newProject.launched} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
           </div>
           <!-- Upload Logo -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Logo</label>
             <div class="mt-1 flex items-center space-x-2">
               <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                 Select File
                 <input type="file" accept="image/*" on:change={handleNewProjectLogoChange} class="hidden" />
               </label>
               {#if newProjectLogoFileName}
                 <div class="text-sm text-gray-600 dark:text-gray-400">{newProjectLogoFileName}</div>
               {/if}
             </div>
           </div>
          <!-- Edit Linked Assets -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Linked Assets</label>
            <div class="space-y-2">
              {#each addedAssets.concat(copiedAssets).sort((a, b) => a.name.localeCompare(b.name)) as asset}
                <label class="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <input type="checkbox" value={asset.id} bind:group={updatedProject.asset_id} class="rounded accent-blue-600" />
                  <span class="text-sm font-medium">{asset.name}{asset.version ? ` (${asset.version})` : ''}</span>
                </label>
              {/each}
            </div>
          </div>
           <!-- Buttons -->
           {#if role !== 'viewer'}
             <div class="flex justify-end">
               <button type="button" on:click={() => showAddProjectForm = false} class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                 Cancel
               </button>
               <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                 Save
               </button>
             </div>
           {/if}
         </form>
       </div>

     {:else if showEditProjectForm}
       <!-- EDIT PROJECT FORM -->
       <div class="mb-6">
         <h2 class="text-2xl font-bold mb-4">Edit Project</h2>
         <form on:submit|preventDefault={updateProject}>
           {#if editingProject?.logo && !editProjectLogoFile}
             <img src={pb.files.getUrl(editingProject, editingProject.logo)} alt="Project Logo" class="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600 mb-4" />
           {:else if editProjectLogoPreview}
             <img src={editProjectLogoPreview} alt="New Logo Preview" class="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600 mb-4" />
           {:else}
             <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs mb-4">
               No Logo
             </div>
           {/if}
           <!-- Name -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
             <input type="text" bind:value={updatedProject.name} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
           </div>
           <!-- Description -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
             <textarea rows="3" bind:value={updatedProject.description} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
           </div>
           <!-- Languages Multi-Select (Edit) -->
           <div class="mb-4 relative">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Languages</label>
             <button type="button" class="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex justify-between focus:ring-blue-500 focus:border-blue-500" on:click={() => (langDropdownOpenEdit = !langDropdownOpenEdit)}>
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
                   <button type="button" class="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded" on:click={clearLanguagesEdit}>Clear</button>
                   <button type="button" class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded" on:click={() => (langDropdownOpenEdit = false)}>Done</button>
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
           </div>
           <!-- Launched (read-only) -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Launched</label>
             <input type="date" bind:value={updatedProject.launched} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed" disabled />
           </div>
           <!-- Upload New Logo -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload New Logo</label>
             <div class="mt-1 flex items-center space-x-2">
               <label class="cursor-pointer flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                 Select File
                 <input type="file" accept="image/*" on:change={handleEditProjectLogoChange} class="hidden" />
               </label>
               {#if editProjectLogoFileName}
                 <div class="text-sm text-gray-600 dark:text-gray-400">{editProjectLogoFileName}</div>
               {/if}
             </div>
           </div>
           <!-- Edit Linked Assets -->
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Linked Assets</label>
             <div class="space-y-2">
               {#each addedAssets.concat(copiedAssets).sort((a, b) => a.name.localeCompare(b.name)) as asset}
                 <label class="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                   <input type="checkbox" value={asset.id} bind:group={updatedProject.asset_id} class="rounded accent-blue-600" />
                   <span class="text-sm font-medium">{asset.name}{asset.version ? ` (${asset.version})` : ''}</span>
                 </label>
               {/each}
             </div>
           </div>
           {#if role !== 'viewer'}
             <div class="flex justify-end">
               <button type="button" on:click={() => { showEditProjectForm = false; editingProject = null; }} class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                 Cancel
               </button>
               <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                 Save Changes
               </button>
             </div>
           {/if}
         </form>
       </div>

     {:else}
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
           <p>You don't have any projects yet. Try adding a new one!</p>
         </div>
       {:else}
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
           {#each projects as project}
             <div class="relative w-64 group transition-transform duration-300 ease-in-out">
               <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md opacity-75 group-hover:opacity-100 animate-gradient"></div>
               <div class="relative h-full bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-md transform transition-transform group-hover:scale-105">
                 <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h2>
                 <p class="text-xs text-gray-500 dark:text-gray-400"><strong>Last Updated:</strong> {formatDate(project.updated)}</p>
                 <div class="mt-3 flex items-center justify-between">
                   <div class="flex space-x-2">
                     {#if role !== 'viewer'}
                       <button class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded" on:click={() => editProjectFn(project)}>
                         Edit
                       </button>
                       <button class="px-2 py-1 text-xs bg-red-500 hover:bg-red-700 text-white rounded" on:click={() => requestDeleteProject(project.id)}>
                         Delete
                       </button>
                       <!-- New button to select project for assets -->
                       <button class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded" on:click={() => selectProjectForAssets(project)}>
                         Show Linked Assets
                       </button>
                     {/if}
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
         {#if projectsTotalPages > 1}
           <div class="flex justify-center mt-6">
             <nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">
               <button class="px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {projectsPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" on:click={() => loadProjectsPage(projectsPage - 1)} disabled={projectsPage === 1}>
                 Previous
               </button>
               <div class="px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                 Page {projectsPage} of {projectsTotalPages}
               </div>
               <button class="px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 {projectsPage === projectsTotalPages ? 'opacity-50 cursor-not-allowed' : ''}" on:click={() => loadProjectsPage(projectsPage + 1)} disabled={projectsPage === projectsTotalPages}>
                 Next
               </button>
             </nav>
           </div>
         {/if}
       {/if}
     {/if}
   </section>

      
      <!-- Associated Assets Section -->
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold">
            {#if selectedProjectForAssets}
              Assets for: {selectedProjectForAssets.name}
            {:else}
              Associated Assets
            {/if}
          </h2>
          {#if selectedProjectForAssets}
            <button class="text-blue-600 dark:text-blue-400 hover:underline" on:click={clearSelectedProject}>
              Clear Selection
            </button>
          {:else}
            <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">
              Browse All Assets
            </a>
          {/if}
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
                  <a href={`/details_page/${asset.id}?from=workspace`} class="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-all duration-300">
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
          <!-- Updated Pagination for Associated Assets with Page Numbers -->
          {#if linkedAssetsTotalPages > 1}
            <div class="flex justify-center mt-6 space-x-2">
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                on:click={() => loadAssociatedAssetsPage(linkedAssetsPage - 1)}
                disabled={linkedAssetsPage === 1}
              >
                Previous
              </button>
              {#if linkedAssetsTotalPages <= 4}
                {#each Array(linkedAssetsTotalPages) as _, i}
                  <button
                    class="px-3 py-1 {linkedAssetsPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                    on:click={() => loadAssociatedAssetsPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                {/each}
              {:else}
                <button
                  class="px-3 py-1 {linkedAssetsPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                  on:click={() => loadAssociatedAssetsPage(1)}
                >
                  1
                </button>
                {#if linkedAssetsPage > 2}
                  <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                {/if}
                {#each Array(linkedAssetsTotalPages) as _, i}
                  {#if i + 1 !== 1 && i + 1 !== linkedAssetsTotalPages && Math.abs(linkedAssetsPage - (i + 1)) < 2}
                    <button
                      class="px-3 py-1 {linkedAssetsPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                      on:click={() => loadAssociatedAssetsPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  {/if}
                {/each}
                {#if linkedAssetsPage < linkedAssetsTotalPages - 1}
                  <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                {/if}
                <button
                  class="px-3 py-1 {linkedAssetsPage === linkedAssetsTotalPages ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                  on:click={() => loadAssociatedAssetsPage(linkedAssetsTotalPages)}
                >
                  {linkedAssetsTotalPages}
                </button>
              {/if}
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                on:click={() => loadAssociatedAssetsPage(linkedAssetsPage + 1)}
                disabled={linkedAssetsPage === linkedAssetsTotalPages}
              >
                Next
              </button>
            </div>
          {/if}
        {/if}
      </section>
      
    {:else}
      <!-- My Assets Tab Content -->
      <section>
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-semibold">Added Assets</h2>
          {#if selectedAssetsCount > 0}
            <div class="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2"> <!-- Centered horizontally -->
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

          {#if role === 'user' || role === 'admin'}
            {#if !addingAsset}
              <button 
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                on:click={() => addingAsset = true}
              >
                <Plus class="w-4 h-4" />
                Add New Asset
              </button>
            {/if}
          {/if}
        </div>
        
        <!-- Display the asset adding form using the same design as the home page -->
        {#if addingAsset}
          <div class="mb-6">
            <h2 class="text-2xl font-bold mb-4">Add New Asset</h2>
            <form on:submit|preventDefault={addAsset}>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" bind:value={newAsset.name} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                <input type="text" bind:value={newAsset.version} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select bind:value={newAsset.category} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" >
                  <option value="" disabled selected>Select a category</option>
                  {#each categories as category}
                    <option value={category}>{category}</option>
                  {/each}
                </select>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <input type="text" bind:value={newAsset.type} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Updated</label>
                <input type="date" bind:value={newAsset.date_updated} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"  />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Created</label>
                <input type="date" bind:value={newAsset.date_created} class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"  />
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
                    <!-- Checkbox -->
                    <input
                      type="checkbox"
                      class="checkbox asset-checkbox"
                      checked={selectedAssets.has(asset.id)}
                      on:change={() => toggleAssetSelection(asset.id)}
                    />
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{asset.name || `Asset ${i + 1}`}</h2>

                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {#if asset.version}v{asset.version}{/if}
                      {#if asset.type} · {asset.type}{/if}
                    </p>
                    <a href={`/details_page/${asset.id}?from=workspace`} class="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-all duration-300">
                      {asset.description || "View details"}
                    </a>
                    <!-- Maven dependency info for maven/java assets -->
                    {#if asset.type === 'maven'}
                      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div class="flex mt-1 space-x-1">
                          <button 
                            class="px-2 py-1 text-xs {addedMavenCopiedIndex === i ? 'bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {addedMavenCopiedIndex === i ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                            on:click|stopPropagation={(e) => {
                              e.preventDefault();
                              const xmlDependency = `<dependency>\n    <groupId>${asset.id?.split(':')[0] || 'com.example'}</groupId>\n    <artifactId>${asset.id?.split(':')[1] || asset.name}</artifactId>\n    <version>${asset.version || '1.0.0'}</version>\n</dependency>`;
                              copyToClipboard(xmlDependency, 'maven', i, true);
                            }}
                          >
                            {#if addedMavenCopiedIndex === i}
                              <Check class="w-3 h-3" />
                              Copied!
                            {:else}
                              Copy Mvn XML
                            {/if}
                          </button>
                          <button 
                            class="px-2 py-1 text-xs {addedGradleCopiedIndex === i ? 'bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {addedGradleCopiedIndex === i ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                            on:click|stopPropagation={(e) => {
                              e.preventDefault();
                              const gradleDependency = `implementation '${asset.id || `com.example:${asset.name}`}:${asset.version || '1.0.0'}'`;
                              copyToClipboard(gradleDependency, 'gradle', i, true);
                            }}
                          >
                            {#if addedGradleCopiedIndex === i}
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
              <div class="flex justify-center mt-6 space-x-2">
                <button
                  class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                  on:click={() => loadAddedAssetsPage(addedAssetsPage - 1)}
                  disabled={addedAssetsPage === 1}
                >
                  Previous
                </button>
                
                <!-- Show pagination with ellipses -->
                {#if addedAssetsTotalPages <= 4}
                  {#each Array(addedAssetsTotalPages).fill(0) as _, i}
                    <button
                      class="px-3 py-1 {addedAssetsPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                      on:click={() => loadAddedAssetsPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  {/each}
                {:else}
                  <!-- First page always shown -->
                  <button
                    class="px-3 py-1 {addedAssetsPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                    on:click={() => loadAddedAssetsPage(1)}
                  >
                    1
                  </button>
                  
                  <!-- Ellipsis at the beginning if needed -->
                  {#if addedAssetsPage > 2}
                    <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                  {/if}
                  
                  <!-- Pages around current page -->
                  {#each Array(addedAssetsTotalPages).fill(0) as _, i}
                    {#if i + 1 !== 1 && i + 1 !== addedAssetsTotalPages && Math.abs(addedAssetsPage - (i + 1)) < 2}
                      <button
                        class="px-3 py-1 {addedAssetsPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                        on:click={() => loadAddedAssetsPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    {/if}
                  {/each}
                  
                  <!-- Ellipsis at the end if needed -->
                  {#if addedAssetsPage < addedAssetsTotalPages - 1}
                    <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                  {/if}
                  
                  <!-- Last page always shown -->
                  <button
                    class="px-3 py-1 {addedAssetsPage === addedAssetsTotalPages ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                    on:click={() => loadAddedAssetsPage(addedAssetsTotalPages)}
                  >
                    {addedAssetsTotalPages}
                  </button>
                {/if}
                
                <button

                  class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                  on:click={() => loadAddedAssetsPage(addedAssetsPage + 1)}
                  disabled={addedAssetsPage === addedAssetsTotalPages}
                >
                  Next
                </button>
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
                    <!-- Checkbox -->
                    <input
                      type="checkbox"
                      class="checkbox asset-checkbox"
                      checked={selectedAssets.has(asset.id)}
                      on:change={() => toggleAssetSelection(asset.id)}
                    />
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{asset.name || `Asset ${i + 1}`}</h2>

                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {#if asset.version}v{asset.version}{/if}
                      {#if asset.type} · {asset.type}{/if}
                    </p>
                    <a href={`/details_page/${asset.id}?from=workspace`} class="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-all duration-300">
                      {asset.description || "View details"}
                    </a>
                    <!-- Maven dependency info for maven/java assets -->
                    {#if asset.type === 'maven'}
                      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div class="flex mt-1 space-x-1">
                          <button 
                            class="px-2 py-1 text-xs {copiedMavenCopiedIndex === i ? 'bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {copiedMavenCopiedIndex === i ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                            on:click|stopPropagation={(e) => {
                              e.preventDefault();
                              const xmlDependency = `<dependency>\n    <groupId>${asset.id?.split(':')[0] || 'com.example'}</groupId>\n    <artifactId>${asset.id?.split(':')[1] || asset.name}</artifactId>\n    <version>${asset.version || '1.0.0'}</version>\n</dependency>`;
                              copyToClipboard(xmlDependency, 'maven', i, false);
                            }}
                          >
                            {#if copiedMavenCopiedIndex === i}
                              <Check class="w-3 h-3" />
                              Copied!
                            {:else}
                              Copy Mvn XML
                            {/if}
                          </button>
                          <button 
                            class="px-2 py-1 text-xs {copiedGradleCopiedIndex === i ? 'bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded {copiedGradleCopiedIndex === i ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-600'} transition-colors duration-50 flex items-center gap-1"
                            on:click|stopPropagation={(e) => {
                              e.preventDefault();
                              const gradleDependency = `implementation '${asset.id || `com.example:${asset.name}`}:${asset.version || '1.0.0'}'`;
                              copyToClipboard(gradleDependency, 'gradle', i, false);
                            }}
                          >
                            {#if copiedGradleCopiedIndex === i}
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
              <div class="flex justify-center mt-6 space-x-2">
                <button
                  class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                  on:click={() => loadCopiedAssetsPage(copiedAssetsPage - 1)}
                  disabled={copiedAssetsPage === 1}
                >
                  Previous
                </button>
                
                <!-- Show pagination with ellipses -->
                {#if copiedAssetsTotalPages <= 4}
                  {#each Array(copiedAssetsTotalPages).fill(0) as _, i}
                    <button
                      class="px-3 py-1 {copiedAssetsPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                      on:click={() => loadCopiedAssetsPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  {/each}
                {:else}
                  <!-- First page always shown -->
                  <button
                    class="px-3 py-1 {copiedAssetsPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                    on:click={() => loadCopiedAssetsPage(1)}
                  >
                    1
                  </button>
                  
                  <!-- Ellipsis at the beginning if needed -->
                  {#if copiedAssetsPage > 2}
                    <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                  {/if}
                  
                  <!-- Pages around current page -->
                  {#each Array(copiedAssetsTotalPages).fill(0) as _, i}
                    {#if i + 1 !== 1 && i + 1 !== copiedAssetsTotalPages && Math.abs(copiedAssetsPage - (i + 1)) < 2}
                      <button
                        class="px-3 py-1 {copiedAssetsPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                        on:click={() => loadCopiedAssetsPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    {/if}
                  {/each}
                  
                  <!-- Ellipsis at the end if needed -->
                  {#if copiedAssetsPage < copiedAssetsTotalPages - 1}
                    <span class="px-3 py-1 text-gray-700 dark:text-gray-300">...</span>
                  {/if}
                  
                  <!-- Last page always shown -->
                  <button
                    class="px-3 py-1 {copiedAssetsPage === copiedAssetsTotalPages ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded"
                    on:click={() => loadCopiedAssetsPage(copiedAssetsTotalPages)}
                  >
                    {copiedAssetsTotalPages}
                  </button>
                {/if}
                
                <button

                  class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                  on:click={() => loadCopiedAssetsPage(copiedAssetsPage + 1)}
                  disabled={copiedAssetsPage === copiedAssetsTotalPages}
                >
                  Next
                </button>
              </div>
            {/if}
          {/if}
        </div>
      </section>
    {/if}
    
    <!-- Quick Actions Panel for both tabs -->
  </div>

  <!-- Asset Created Popup -->
  {#if showAssetCreatedPopup}
    <div
      class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50"
      transition:fade={{ duration: 300 }}
    >
      <div
        class="relative bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4"
        transition:scale={{ start: 0.7, duration: 400, opacity: 0, easing: quintOut }}
      >
        <button
          class="absolute top-2 right-2 text-white hover:text-gray-300"
          on:click={closeAssetCreatedPopup}
        >
          <X class="w-5 h-5" />
        </button>
        <div class="success-circle">
          <Check class="success-icon" />
        </div>
        <p class="text-lg font-semibold">Asset created successfully!</p>
      </div>
    </div>
  {/if}

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

<!-- PROJECT DETAILS MODAL -->
  {#if showProjectDetails && selectedProject}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-backdrop" transition:fade>
      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 mx-4 md:mx-0" transition:scale>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedProject.name}</h2>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" on:click={closeProjectDetails}>✕</button>
        </div>
        <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
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
            <p class="mt-2"><span class="font-medium">Description:</span> {selectedProject.description}</p>
          {/if}
        </div>
        <div class="mt-6 flex justify-end">
          <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm" on:click={closeProjectDetails}>
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- PROJECT DELETE CONFIRM MODAL -->
  {#if showProjectConfirmDeleteModal}
    <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 modal-backdrop" transition:fade>
      <div class="bg-white dark:bg-gray-800 rounded p-6 w-80 shadow-lg" transition:scale>
        <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Are you sure you want to delete this project? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-2">
          {#if role !== 'viewer'}
            <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" on:click={confirmProjectDelete}>
              Confirm
            </button>
            <button class="bg-gray-200 dark:bg-gray-600 text-sm px-3 py-1 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500" on:click={cancelProjectDelete}>
              Cancel
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- PROJECT DELETE SUCCESS MODAL -->
  {#if showProjectDeleteSuccess}
    <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 modal-backdrop" transition:fade>
      <div class="relative bg-red-100 dark:bg-red-900 rounded p-6 w-80 shadow-lg" transition:scale>
        <button class="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" on:click={closeProjectDeleteSuccess}>
          ✕
        </button>
        <div class="flex justify-center mb-4">
          <div class="animated-circle">
            <span class="text-xl text-white">–</span>
          </div>
        </div>
        <h2 class="text-md font-semibold mb-2 text-center text-red-800 dark:text-red-200">
          Project Deleted Successfully!
        </h2>
        <p class="text-sm text-center text-red-700 dark:text-red-300 mb-4">
          The selected project has been removed.
        </p>
        <div class="flex justify-center">
          <button class="bg-gray-200 dark:bg-gray-600 text-sm px-3 py-1 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500" on:click={closeProjectDeleteSuccess}>
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- PROJECT SAVE SUCCESS MODAL -->
  {#if showProjectSaveSuccess}
    <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 modal-backdrop" transition:fade>
      <div class="relative bg-green-100 dark:bg-green-900 rounded p-6 w-80 shadow-lg" transition:scale>
        <button class="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" on:click={closeProjectSaveSuccess}>
          ✕
        </button>
        <div class="flex justify-center mb-4">
          <div class="animated-green">
            <span class="text-xl text-white">✔</span>
          </div>
        </div>
        <h2 class="text-md font-semibold mb-2 text-center text-green-800 dark:text-green-200">
          Project Saved Successfully!
        </h2>
        <p class="text-sm text-center text-green-700 dark:text-green-300">
          Your changes have been saved.
        </p>
      </div>
    </div>
  {/if}
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
    width: 30px;
    height: 30px;
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

  

</style>
