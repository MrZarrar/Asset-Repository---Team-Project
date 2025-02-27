<script>
	import { goto } from '$app/navigation';
    import { logIn } from '$lib/auth'; 
    

    let email = "";
    let password = "";
    let confirmPassword = "";

    async function handleLoginUp() {
        try {
            await logIn(email, password);
            alert("Log-in successful! You can now log in.");
            goto('/')
        } catch (error) {
            errorMessage = error.message;
        }
    }
    
</script>

<h1>Login Up</h1>
<form on:submit|preventDefault={handleLoginUp}>
    <input type="email" bind:value={email} placeholder="Email" required />
    <input type="password" bind:value={password} placeholder="Password" required />
    <button type="submit">Sign Up</button>
</form>
