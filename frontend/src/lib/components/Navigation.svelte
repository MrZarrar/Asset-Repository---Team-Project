<script>
    import { writable } from 'svelte/store';
    import { goto } from '$app/navigation';
  
    let isUserMenuOpen = false;
    let isDownloadMenuOpen = false;
  
    function toggleUserMenu() {
      isUserMenuOpen = !isUserMenuOpen;
    }
  
    function toggleDownloadMenu() {
      isDownloadMenuOpen = !isDownloadMenuOpen;
    }
  </script>
  
  <nav class="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
    <div class="max-w-screen-xl flex items-center justify-between mx-auto p-4">
      <a href="/" class="text-lg font-bold text-gray-900 dark:text-white">MyApp</a>
      
      <div class="relative">
        <button on:click={toggleUserMenu} class="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
          User Menu
        </button>
        
        {#if isUserMenuOpen}
          <div class="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 text-white">
            <a on:click={() => goto('/profile')} class="block px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Profile</a>
            <a on:click={() => goto('/settings')} class="block px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Settings</a>
            <a href="/logout" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-700">Logout</a>
          </div>
        {/if}
      </div>
    </div>
  </nav>
  
  <style>
    .menu {
      display: block;
      position: absolute;
      z-index: 100;
    }
  </style>
  