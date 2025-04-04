/**
 * @fileoverview Core API module for interacting with the PocketBase backend.
 * @module lib/api
 */

import PocketBase from 'pocketbase';
import { user } from './user';
import { goto } from '$app/navigation';

/**
 * PocketBase client instance for making API requests.
 * @type {PocketBase}
 * @private
 */
const pb = new PocketBase('http://127.0.0.1:8090'); // Use your actual PocketBase URL

/**
 * Authenticates a user with username and password.
 * 
 * @async
 * @function login
 * @param {string} username - The username or email of the user
 * @param {string} password - The user's password
 * @returns {Promise<Object>} Authentication data including user record and token
 * @throws {Error} If authentication fails
 */
export async function login(username, password) {
    try {
        return await pb.collection('users').authWithPassword(username, password);
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Logs out the current user by clearing the auth store.
 * 
 * @async
 * @function logout
 * @returns {Promise<void>}
 */
export async function logout() {
    pb.authStore.clear();
}

/**
 * Creates a new log entry in the logs collection.
 * 
 * @async
 * @function createLogEntry
 * @param {string} action - The action performed (e.g., 'view', 'edit', 'delete')
 * @param {string} file - The file or resource that was affected
 * @param {string} time - The time the action occurred
 * @returns {Promise<Object>} The created log entry record
 * @throws {Error} If log creation fails
 */
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

/**
 * Deletes a user account by ID and redirects to the login page.
 * 
 * @async
 * @function accountDelete
 * @param {string} userid - The ID of the user to delete
 * @returns {Promise<void>}
 * @throws {Error} If the user ID is missing or deletion fails
 */
export async function accountDelete(userid) {
    if (!userid) {
        console.error("accountDelete: Missing user ID");
        throw new Error("User ID is required.");
    }

    try {
        alert('Account has been successfully deleted');
        goto('/login');
        await pb.collection('users').delete(userid);
    } catch (error) {
        console.error('Error deleting account:', error);
        throw new Error('An error occurred while deleting the account.');
    }
}

/**
 * Removes the avatar image from a user's profile.
 * 
 * @async
 * @function removeAvatar
 * @param {string} userid - The ID of the user whose avatar should be removed
 * @returns {Promise<void>}
 * @throws {Error} If the user ID is missing or avatar removal fails
 */
export async function removeAvatar(userid) {
    if (!userid) {
        console.error("resetPicture: Missing user ID");
        throw new Error("User ID is required.");
    }

    try {
        alert('Picture has been successfully removed');
        await pb.collection('users').update(userid, { avatar: "" });
    } catch (error) {
        console.error('Error resetting picture:', error);
        throw new Error('An error occurred while resetting the picture.');
    }
}
