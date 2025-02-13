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
</script>

