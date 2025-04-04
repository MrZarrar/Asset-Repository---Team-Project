/**
 * @fileoverview Service for managing projects in the application.
 * @module lib/projectsService
 */

import pb from '$lib/pocketbase'; 
// If you have a refreshToken helper or similar, import it here
// import { refreshToken } from './authManager';

/**
 * Fetches all projects with optional pagination and filters.
 * 
 * @async
 * @function fetchProjects
 * @param {number} [page=1] - The page number for pagination
 * @param {number} [perPage=20] - The number of projects per page
 * @param {Object} [filters={}] - Filtering criteria for projects
 * @returns {Promise<Object>} The response containing projects list and pagination info
 * @throws {Error} If fetching projects fails
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
 * Gets a single project by its ID.
 * 
 * @async
 * @function getProjectById
 * @param {string} id - The ID of the project to fetch
 * @returns {Promise<Object>} The project object
 * @throws {Error} If fetching the project fails
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
 * Creates a new project in the database.
 * 
 * @async
 * @function createProject
 * @param {Object} projectData - The data for the new project
 * @returns {Promise<Object>} The created project object
 * @throws {Error} If project creation fails
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
