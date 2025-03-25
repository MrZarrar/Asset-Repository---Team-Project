import { writable } from "svelte/store";

export const user = writable({
    userid: "",
    name: "John Doe",
    username: "johndoe",
    email: "example@gmail.com",
    profilePicture: ""
});
