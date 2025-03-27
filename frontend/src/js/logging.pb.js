import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

export async function logActions(action, asset, user) {
    try {
        const logEntry = await pb.collection('logs').create({
            action, asset, file
        });
        return logEntry; // Return the created entry for potential use
    } catch (error) {
        console.error('Error saving log:', error);
        throw error; // Re-throw
    }
}
