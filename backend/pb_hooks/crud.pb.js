/**
 * @fileoverview This module provides CRUD operations for PocketBase collections.
 * @module pb_hooks/crud
 */

import PocketBase from 'pocketbase';

/**
 * PocketBase client instance for database operations.
 * @type {PocketBase}
 */
const pb = new PocketBase('http://127.0.0.1:8090'); 

/**
 * The name of the collection to perform CRUD operations on.
 * @type {string}
 */
const collectionName = 'assets';

/**
 * Creates a new record in the collection.
 * 
 * @async
 * @function createRecord
 * @param {Object} data - The data to create the record with.
 * @returns {Promise<Object>} The created record.
 * @throws Will log errors if the create operation fails.
 */
export async function createRecord(data) {
    try {
        const record = await pb.collection(collectionName).create(data);
        logActions("added", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
        return record;
    } catch (error) {
        console.error('Error when creating record:', error);
    }
}

/**
 * Fetches a record by its ID.
 * 
 * @async
 * @function fetchRecordById
 * @param {string} id - The ID of the record to fetch.
 * @returns {Promise<Object>} The fetched record.
 * @throws Will log errors if the fetch operation fails.
 */
export async function fetchRecordById(id) {
    try {
        const record = await pb.collection(collectionName).getOne(id);
        logActions("viewed", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
        return record;
    } catch (error) {
        console.error('Error when fetching record:', error);
    }
}

/**
 * Updates a record in the specified collection.
 * 
 * @async
 * @function updateRecord
 * @param {string} id - The ID of the record to update.
 * @param {Object} data - The data to update the record with.
 * @returns {Promise<Object>} The updated record.
 * @throws Will log errors if the update operation fails.
 */
export async function updateRecord(id, data) {
    try {
        const updatedRecord = await pb.collection(collectionName).update(id, data);
        logActions("edited", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
        return updatedRecord;
    } catch (error) {
        console.error('Error when updating record:', error);
    }
}

/**
 * Deletes a record from the collection.
 * 
 * @async
 * @function deleteRecord
 * @param {string} id - The ID of the record to delete.
 * @returns {Promise<void>}
 * @throws Will log errors if the delete operation fails.
 */
export async function deleteRecord(id) {
    try {
        await pb.collection(collectionName).delete(id);
        logActions("deleted", "[INSERT filename]", "[CALL username]", new Date().toLocaleString());
    } catch (error) {
        console.error('Error when deleting record:', error);
    }
}

/**
 * Logs actions performed on records for auditing purposes.
 * 
 * @function logActions
 * @param {string} action - The action performed (added, viewed, edited, deleted).
 * @param {string} filename - The filename or identifier of the record.
 * @param {string} username - The username of the user who performed the action.
 * @param {string} timestamp - The timestamp when the action was performed.
 * @private
 */
function logActions(action, filename, username, timestamp) {
    // Implementation of logging actions
    console.log(`${action} ${filename} by ${username} at ${timestamp}`);
}