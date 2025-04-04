/**
 * @fileoverview User data management and synchronization with authentication state.
 * @module lib/user
 */

import { writable } from "svelte/store";
import { authStore } from './auth.js';
import pb from '$lib/pocketbase';

/**
 * Svelte store containing the current user's data.
 * @type {import('svelte/store').Writable<{userid: string, name: string, username: string, email: string, avatar: string, role: string}>}
 */
export const user = writable({
  userid: "",
  name: "",
  username: "",
  email: "",
  avatar: "",
  role: ""
});

/**
 * Fetches user data from PocketBase and updates the user store.
 * 
 * @async
 * @function fetchUserData
 * @param {string} userId - The ID of the user to fetch
 * @private
 */
async function fetchUserData(userId) {
  try {
    const userData = await pb.collection('users').getOne(userId);
    const avatarUrl = userData.avatar ? `http://127.0.0.1:8090/api/files/users/${userId}/${userData.avatar}` : '';
    user.set({
      userid: userData.id,
      name: userData.name,
      username: userData.username,
      email: userData.email,
      avatar: avatarUrl,
      role: userData.role
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    user.set({
      userid: "",
      name: "",
      username: "",
      email: "",
      avatar: "",
      role: ""
    });
  }
}

/**
 * Subscription to the authentication store that updates user data when auth state changes.
 * Fetches user data when authenticated or clears it when logged out.
 * 
 * @type {Function}
 * @private
 */
authStore.subscribe(($authStore) => {
  if ($authStore.isAuthenticated && $authStore.user) {
    fetchUserData($authStore.user.id);
  } else {
    user.set({
      userid: "",
      name: "",
      username: "",
      email: "",
      avatar: "",
      role: ""
    });
  }
});