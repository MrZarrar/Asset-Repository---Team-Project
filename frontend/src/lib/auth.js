import pb from '$lib/pocketbase';
// In $lib/auth.js
import { writable } from 'svelte/store';
export const isAuthenticated = writable(false);

// Update this in your login/logout functions

export async function signUp(email, password, passwordConfirm, username, name) {
    try {
        if (password !== passwordConfirm) {
            throw new Error("Passwords don't match!");
        }

       
        const user = await pb.collection('users').create({
            username,  // Ensure that 'username' is passed as an argument
            name,      // Same for 'name'
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
