import PocketBase from 'pocketbase';
import { user } from './user';

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

export const fetchUserProfile = async (userid) => {
    if (!userid) {
      console.error("fetchUserProfile: Missing user ID");
      throw new Error("User ID is required.");
    }
  
    try {
      const userRecord = await pb.collection('users').getOne(userid);
  
      user.set({
        userid: userRecord.userid,
        name: userRecord.name,
        username: userRecord.username,
        email: userRecord.email,
        avatar: userRecord.avatar,
        role: userRecord.role
      });
  
      return userRecord;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile.');
    }
  };

export const updateProfile = async (userid, email, name, username, avatar) => {
    if (!userid) {
        console.error("updateProfile: Missing user ID");
        throw new Error("User ID is required.");
    }

    try {
        console.log(`Updating user ID: ${userid}`);

        const data = {
            email,
            name,
            username,
            avatar,
            role,
        };

        const updatedUser = await pb.collection('users').update(userid, data);

        console.log("Updated user response:", updatedUser);

        user.set({
            userid: updatedUser.userid,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            role: updatedUser.role
        });

        return updatedUser;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw new Error('An error occurred while updating the profile.');
    }
};
