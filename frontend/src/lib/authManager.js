import pb from '$lib/pocketbase';
import { writable, get } from 'svelte/store';

// Create stores to track authentication state
export const authStore = writable({
  isAuthenticated: false,
  user: null,
  token: null
});

// Initialize from localStorage on app start
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

// Enhanced login with proper error handling
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

// Token refresh logic
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

export function logout() {
  pb.authStore.clear();
  authStore.set({
    isAuthenticated: false,
    user: null,
    token: null
  });
} 