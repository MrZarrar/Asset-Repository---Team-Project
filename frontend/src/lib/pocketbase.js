/**
 * @fileoverview Initializes and exports the PocketBase client for use throughout the application.
 * @module lib/pocketbase
 */

import PocketBase from 'pocketbase';

/**
 * PocketBase client instance configured with the server URL.
 * This is used for all database operations in the frontend.
 * @type {PocketBase}
 */
const pb = new PocketBase('http://127.0.0.1:8090');  // Your PocketBase URL

export default pb;
