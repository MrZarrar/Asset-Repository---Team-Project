import pb from '$lib/pocketbase'; 
// If you have a refreshToken helper or similar, import it here
// import { refreshToken } from './authManager';

/**
 * Fetch all projects with optional pagination and filters.
 */
export async function fetchProjects(page = 1, perPage = 20, filters = {}) {
  try {
    // If you need to build a filter string:
    let filterString = '';
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        // Example filter format: key="value"
        filterString += `${key}="${value}" && `;
      }
    }
    if (filterString.endsWith(' && ')) {
      filterString = filterString.slice(0, -4);
    }

    // Make sure "projects" is the exact name or ID of your PB collection
    const response = await pb.collection('projects').getList(page, perPage, {
      filter: filterString,
      sort: '-created'
      // expand: 'relationField' // if you need expansions
    });
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    // If you have token refresh logic, handle it here
    // if (error.status === 401) {
    //   const refreshed = await refreshToken();
    //   if (refreshed) return fetchProjects(page, perPage, filters);
    // }
    throw error;
  }
}

/**
 * Get a single project by ID (optional).
 */
export async function getProjectById(id) {
  try {
    const project = await pb.collection('projects').getOne(id);
    return project;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new project (optional if you want separate function).
 */
export async function createProject(projectData) {
  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(projectData)) {
      formData.append(key, value);
    }
    const createdProject = await pb.collection('projects').create(formData);
    return createdProject;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}
