import { writable } from "svelte/store";

export const user = writable({
    userid: "",
    name: "John ",
    username: "johndoe",
    email: "example@gmail.com",
    profilePicture: "",
    role: "user",
});
