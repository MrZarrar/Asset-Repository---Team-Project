<script>
    import pb from '$lib/pocketbase';

    let email = "";
    let password = "";
    let confirmPassword = "";

    async function register() {
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
    }

    try {
            const user = await pb.collection('users').create({
                email: email,
                password: password,
                passwordConfirm: confirmPassword
            });

            console.log("User created:", user);
        } catch (err) {
            console.error("Sign-up failed:", err);
        }
</script>

</script>

<form on:submit|preventDefault={register}>
    <input type="email" bind:value={email} placeholder="Email" required />
    <input type="password" bind:value={password} placeholder="Password" required />
    <input type="password" bind:value={confirmPassword} placeholder="Confirm Password" required />
    <button type="submit">Sign Up</button>
</form>