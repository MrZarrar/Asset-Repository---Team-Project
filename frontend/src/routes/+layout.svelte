<script>
 import Chatbot from "$lib/components/Chatbot.svelte";
import Navigation from "$lib/components/Navigation.svelte";
import { onMount } from 'svelte';
import { initAuth, authStore } from '$lib/auth';
import { page } from '$app/stores';
import pb from '$lib/pocketbase';

// intialise auth on appp start
onMount(() => {
    initAuth();
      pb.authStore.onChange(() => {
      initAuth();
    });
});
</script>

<Navigation/>
  <Chatbot/>

<slot />