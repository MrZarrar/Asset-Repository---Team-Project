/**
 * @fileoverview Authentication manager that handles user authentication state and operations.
 * @module lib/authManager
 */

import pb from '$lib/pocketbase';
import { writable, get } from 'svelte/store';

/**
 * Store for managing authentication state across the application.
 * @type {import('svelte/store').Writable<{isAuthenticated: boolean, user: Object|null, token: string|null}>}
 */
export const authStore = writable({
  isAuthenticated: false,
  user: null,
  token: null
});

/**
 * Initializes the authentication state from PocketBase's auth store.
 * Should be called when the application starts.
 * 
 * @function initAuth
 * @returns {boolean} True if a valid authentication session exists, false otherwise
 */
export function initAuth() {
  if (pb.authStore.isValid) {
    authStore.set({
      isAuthenticated: true,
      user: pb.authStore.model,
      token: pb.authStore.token
    });
    return true;
  }
  return false;
}

/**
 * Authenticates a user with email and password.
 * 
 * @async
 * @function login
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Authentication data including user record and token
 * @throws {Error} If authentication fails
 */
export async function login(email, password) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    authStore.set({
      isAuthenticated: true,
      user: authData.record,
      token: authData.token
    });
    
    return authData;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

/**
 * Refreshes the authentication token.
 * Will log out the user if token refresh fails.
 * 
 * @async
 * @function refreshToken
 * @returns {Promise<boolean>} True if token was successfully refreshed, false otherwise
 */
export async function refreshToken() {
  try {
    // PocketBase handles token refresh automatically when making requests
    // But we can explicitly refresh it too
    const authData = await pb.collection('users').authRefresh();
    
    authStore.set({
      isAuthenticated: true,
      user: authData.record,
      token: authData.token
    });
    
    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    logout();
    return false;
  }
}

/**
 * Logs out the current user and clears authentication state.
 * 
 * @function logout
 */
export function logout() {
  pb.authStore.clear();
  authStore.set({
    isAuthenticated: false,
    user: null,
    token: null
  });
} 