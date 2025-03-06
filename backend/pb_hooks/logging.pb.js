import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function logActions(action, file, user, time) {
    try {
        const logEntry = await pb.collection('logs').create({
            action, file, user, time
        });
    } catch (error) {
        console.error('Error saving log:', error);
    }
}
