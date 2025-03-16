<script>
    import PocketBase from 'pocketbase';
    import { onMount } from 'svelte';

    const pb = new PocketBase('http://127.0.0.1:8090'); // Change if your PocketBase runs elsewhere
    let posts = [];

    onMount(async () => {
        try {
            posts = await pb.collection('post').getFullList({
                fields: "name,usage_info" // Fetch only the required fields
            });
        } catch (err) {
            console.error("Error fetching posts:", err);
        }
    });
</script>

<main>
    <h1>Posts</h1>
    {#each posts as post}
        <div class="post">
            <h2>{post.name}</h2>
            <p>{post.usage_info}</p>
        </div>
    {/each}
</main>

<style>
    .post {
        border: 1px solid #ccc;
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
    }
</style>
