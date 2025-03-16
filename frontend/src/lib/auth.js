import pb from '$lib/pocketbase';
import { writable } from 'svelte/store';

// This initialises the auth store based on Pocketbase's current state
export const isAuthenticated = writable(pb.authStore.isValid);
// This makes is so we restore the auth state on page reload
export const currentUser = writable(pb.authStore.model);

// listens for the auth state changes 
pb.authStore.onChange((token, model) => {
    isAuthenticated.set(pb.authStore.isValid);
    currentUser.set(model);
  });

export async function signUp(email, password, passwordConfirm, username, name) {
    try {
        if (password !== passwordConfirm) {
            throw new Error("Passwords don't match!");
        }
        const user = await pb.collection('users').create({
            username,  
            name,
            email,
            password,
            passwordConfirm
        });

        return user;
    } catch (error) {
        console.error("Sign-up error:", error);
        throw error;
    }
}

export async function login(email, password) {
    try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        isAuthenticated.set(true);
        return authData;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

export function logout() {
    pb.authStore.clear();
    isAuthenticated.set(false);
}


  


