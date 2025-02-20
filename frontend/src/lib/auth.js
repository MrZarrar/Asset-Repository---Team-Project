import { pb } from '$lib/pocketbase';

export async function SignUp(email, password, passwordConfirm){
    try {
        if (password != passwordConfirm){
            throw new Error("The Passwords don't match")
        }
        
        const user = await pb.collection('users').create(
            email,
            password,
            passwordConfirm
        )

        return user;
        
    } catch (error) {
        console.error("Sign-up error:", error);
        throw error;        
    }

}


export async function login(email, password) {

}

export function logout() {

}