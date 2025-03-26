import { writable } from "svelte/store";
import { authStore } from './auth.js';
import pb from '$lib/pocketbase';

export const user = writable({
  userid: "",
  name: "",
  username: "",
  email: "",
  avatar: "",
  role: ""
});

async function fetchUserData(userId) {
  try {
    const userData = await pb.collection('users').getOne(userId);
    const avatarUrl = userData.avatar ? `http://127.0.0.1:8090/api/files/users/${userId}/${userData.avatar}` : '';
    user.set({
      userid: userData.id,
      name: userData.name,
      username: userData.username,
      email: userData.email,
      avatar: avatarUrl,
      role: userData.role
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    user.set({
      userid: "",
      name: "",
      username: "",
      email: "",
      avatar: "",
      role: ""
    });
  }
}

authStore.subscribe(($authStore) => {
  if ($authStore.isAuthenticated && $authStore.user) {
    fetchUserData($authStore.user.id);
  } else {
    user.set({
      userid: "",
      name: "",
      username: "",
      email: "",
      avatar: "",
      role: ""
    });
  }
});