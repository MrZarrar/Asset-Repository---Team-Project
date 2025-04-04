/**
 * @fileoverview Authentication module for managing user sessions and auth state.
 * @module lib/auth
 */

import pb from '$lib/pocketbase';
import { writable, derived } from 'svelte/store';

/**
 * Main authentication store with user state information.
 * @type {import('svelte/store').Writable<{isAuthenticated: boolean, user: Object|null, token: string|null}>}
 */
export const authStore = writable({
  isAuthenticated: false,
  user: null,
  token: null
});

/**
 * Derived store providing quick access to authentication status.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isAuthenticated = derived(
  authStore,
  $authStore => $authStore.isAuthenticated
);

/**
 * Initializes authentication state from PocketBase auth store.
 * Checks if there's a valid session and updates the auth store accordingly.
 * 
 * @function initAuth
 * @returns {boolean} True if user is authenticated, false otherwise
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
  authStore.set({
    isAuthenticated: false,
    user: null,
    token: null
  });
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
    
    email = email.toLowerCase();

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

/**
 * Refreshes the authentication token.
 * Updates the auth store with new token information or logs out if refresh fails.
 * 
 * @async
 * @function refreshToken
 * @returns {Promise<boolean>} True if token was refreshed successfully, false otherwise
 */
export async function refreshToken() {
  try {
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
 * Creates a new user account.
 * 
 * @async
 * @function signUp
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} passwordConfirm - Password confirmation (must match password)
 * @param {string} username - User's username
 * @param {string} name - User's full name
 * @returns {Promise<Object>} The created user object
 * @throws {Error} If passwords don't match or sign-up fails
 */
export async function signUp(email, password, passwordConfirm, username, name) {
  try {
    if (password !== passwordConfirm) {
      throw new Error("Passwords don't match!");
    }

    email = email.toLowerCase();
       
    const user = await pb.collection('users').create({
      username,
      name,
      email,
      password,
      passwordConfirm,
      role: 'user' // default role
    });

    return user;
  } catch (error) {
    console.error("Sign-up error:", error);
    throw error;
  }
}


  


