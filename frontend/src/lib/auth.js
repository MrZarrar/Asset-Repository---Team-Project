import pb from '$lib/pocketbase';
import { writable, derived } from 'svelte/store';

// main auth store
export const authStore = writable({
  isAuthenticated: false,
  user: null,
  token: null
});

// derived store for isAuthenticated
export const isAuthenticated = derived(
  authStore,
  $authStore => $authStore.isAuthenticated
);

// initialise auth state
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

// login function
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

// logout function
export function logout() {
  pb.authStore.clear();
  authStore.set({
    isAuthenticated: false,
    user: null,
    token: null
  });
}

// to refresh the token
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

// to sign up
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


  


