<script>
    import { signUp } from '$lib/auth';
    import { goto } from '$app/navigation';

  
    
    let email = "";
    let password = "";
    let confirmPassword = "";
    let username = "";
    let name = "";
    let errorMessage = "";

    async function handleSignUp() {
        try {
            await signUp(email, password, confirmPassword,username,name);
            alert("Sign-up successful! You can now log in.");
            goto('/')
        } catch (error) {
            errorMessage = error.message;
        }
    }
</script>

<h1>Sign Up</h1>
<form on:submit|preventDefault={handleSignUp}>
    <input type="text" bind:value={username} placeholder="Username" required />
    <input type="text" bind:value={name} placeholder="Name" required />
    <input type="email" bind:value={email} placeholder="Email" required />
    <input type="password" bind:value={password} placeholder="Password" required />
    <input type="password" bind:value={confirmPassword} placeholder="Confirm Password" required />
    <button type="submit">Sign Up</button>
</form>

{#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
{/if}

<a href="/login">Already have an account? Log in</a>
