import PocketBase from 'pocketbase';
import { user } from './user';
import { goto } from '$app/navigation';

// Create a PocketBase client instance
const pb = new PocketBase('http://127.0.0.1:8090'); // Use your actual PocketBase URL

// Authentication functions
export async function login(username, password) {
    try {
        return await pb.collection('users').authWithPassword(username, password);
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function logout() {
    pb.authStore.clear();
}

// CRUD operations
export async function createLogEntry(action, file, time) {
    try {
        return await pb.collection('logs').create({
            user: pb.authStore.model?.id || "anonymous",
            action,
            file,
            time
        });
    } catch (error) {
        console.error('Error creating log:', error);
        throw error;
    }
}

// Add other API functions as needed for your application
export async function accountDelete(userid) {
    if (!userid) {
        console.error("accountDelete: Missing user ID");
        throw new Error("User ID is required.");
    }

    try {
        alert('Account deleted successfully');
        goto('/login');
        await pb.collection('users').delete(userid);
    } catch (error) {
        console.error('Error deleting account:', error);
        throw new Error('An error occurred while deleting the account.');
    }
}
