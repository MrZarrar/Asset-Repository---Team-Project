import PocketBase from 'pocketbase';

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

export const updateProfile = async (userid, name, username, email) => {
    const url = `http://127.0.0.1:8090/api/collections/profiles/records/${userid}`;

    const data = {
        name: name,
        username: username,
        email: email,
        profilePicture: profilePicture
    };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`An error has occurred: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw new Error('An error has occurred while updating the user');
    }
};

