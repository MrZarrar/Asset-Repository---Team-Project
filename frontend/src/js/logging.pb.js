import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

export async function logActions(action, file, user, time) {
    try {
        const logEntry = await pb.collection('logs').create({
            user, action, file, time
        });
        return logEntry; // Return the created entry for potential use
    } catch (error) {
        console.error('Error saving log:', error);
        throw error; // Re-throw to allow calling code to handle if needed
    }
}
