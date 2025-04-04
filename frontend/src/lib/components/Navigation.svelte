<script>
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Search, User, Download, ChevronDown, X } from "@lucide/svelte";
  import { authStore, logout } from '$lib/auth';
  import { user } from '$lib/user.js';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { performSearch, searchTerm, searchResults, isSearching, searchError, clearSearch } from '$lib/stores/searchStore';
  import { debounce } from '$lib/debounce';

  let isMobileMenuOpen = false;
  let searchInputValue = '';
  let showSearchResults = false;
  let searchOption = "name"; // Default search option
  let showDropdown = false; // new variable for dropdown visibility
  const searchOptions = ["name", "type", "date_created", "date_updated"]; // available options
  
  // Updated debouncedSearch to accept searchOption as second parameter
  const debouncedSearch = debounce((term, option) => {
    performSearch(term, option);
  }, 300);
  
  // Updated search input handler to pass searchOption
  function handleSearchInput(event) {
    const term = event.target.value;
    searchInputValue = term;
    
    if (term.trim()) {
      debouncedSearch(term, searchOption);
      showSearchResults = true;
    } else {
      clearSearch();
      showSearchResults = false;
    }
  }
  
  // Clear search input and results
  function handleClearSearch() {
    searchInputValue = '';
    clearSearch();
    showSearchResults = false;
  }
  
  // Navigate to asset details page
  function navigateToAsset(assetId) {
    goto(`/details_page/${assetId}`);
    showSearchResults = false;
  }
  
  let isUserMenuOpen = false;
  function toggleUserMenu() {
    // Toggle the user menu and close the download menu if it is open
    isUserMenuOpen = !isUserMenuOpen;
    if (isUserMenuOpen) {
      isDownloadMenuOpen = false;
    }
  }

  let isDownloadMenuOpen = false;
  function toggleDownloadMenu() {
    // Toggle the download menu and close the user menu if it is open
    isDownloadMenuOpen = !isDownloadMenuOpen;
    if (isDownloadMenuOpen) {
      isUserMenuOpen = false;
    }
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  // if the current page login or signup the bar will be hidden
  $: isAuthPage = $page.url.pathname === '/login' || 
                  $page.url.pathname === '/signup';
                  
  // page routes for checking active pages                
  $: currentPath = $page.url.pathname;
  $: isDashboardActive = currentPath === '/'
  $: isLoggingActive = currentPath === '/logging';
  $: isProjectsActive = currentPath === '/Projects'; 
  $: isWorkspaceActive = currentPath === '/Workspace';

  // handles navigation for all pages
  function handleNavigation(event, targetPath) {
    // If user is already on the specific page it will refresh the page
    if (currentPath === targetPath) {
      event.preventDefault();
      window.location.reload();
    }
    // otherwise, normal navigation will occur
  }

  async function handleLogout() {
    try {
      logout();
      await goto('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  $: role = $user.role;

  function handleWorkspaceNavigation(event) {
    if (role === 'viewer') {
      event.preventDefault();
      goto('/AccessDenied');
    }
  }

  // Handle clicking outside of menus
  function handleClickOutside(event) {
    // User menu outside click
    if (isUserMenuOpen && !event.target.closest('#user-menu-button') && 
        !event.target.closest('[role="menu"]')) {
      isUserMenuOpen = false;
    }
    
    // Download menu outside click
    if (isDownloadMenuOpen && !event.target.closest('[on\\:click="toggleDownloadMenu"]') && 
        !event.target.closest('[role="menu"]')) {
      isDownloadMenuOpen = false;
    }
    
    // Search results outside click
    const searchContainer = document.getElementById('search-container');
    if (showSearchResults && searchContainer && !searchContainer.contains(event.target)) {
      showSearchResults = false;
    }
  }
  
  // Set up and clean up click handler
  onMount(() => {
    if (browser) {
      document.addEventListener('click', handleClickOutside);
    }
  });
  
  onDestroy(() => {
    if (browser) {
      document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

{#if !isAuthPage}
<nav class="bg-gray-200 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
    <div class="relative flex h-16 items-center justify-between">
      <!-- Mobile menu button (visible on mobile) -->
      <div class="absolute inset-y-0 left-0 flex items-center md:hidden">
        <button type="button"
          on:click={toggleMobileMenu}
          class="relative inline-flex items-center justify-center rounded-md p-2 dark:text-gray-400 hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset"
          aria-controls="mobile-menu" 
          aria-expanded={isMobileMenuOpen}>
          <span class="absolute -inset-0.5"></span>
          <span class="sr-only">Open main menu</span>
          <!-- Icon when menu is closed -->
          <svg class={!isMobileMenuOpen ? 'block size-6' : 'hidden size-6'} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <!-- Icon when menu is open -->
          <svg class={isMobileMenuOpen ? 'block size-6' : 'hidden size-6'} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Desktop navigation links (visible only on md and up) -->
      <div class="hidden md:flex md:items-center md:ml-1">
        <!-- svelte-ignore a11y-missing-attribute -->
        <div class="flex space-x-4"> 
          <a href="/" 
             on:click={(e) => handleNavigation(e, '/')}
             class="rounded-md {isDashboardActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-sm font-medium hover:scale-105 transition-all duration-300" 
             aria-current={isDashboardActive ? 'page' : undefined}>
            Home
          </a>
          {#if role === 'admin'}
            <a href="/logging" 
               on:click={(e) => handleNavigation(e, '/logging')}
               class="rounded-md {isLoggingActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-sm font-medium hover:scale-105 transition-all duration-300"
               aria-current={isLoggingActive ? 'page' : undefined}>
              Log History
            </a>
          {/if}
          <a href="/Projects" 
             on:click={(e) => handleNavigation(e, '/Projects')}
             class="rounded-md {isProjectsActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-sm font-medium hover:scale-105 transition-all duration-300"
             aria-current={isProjectsActive ? 'page' : undefined}>
            Projects
          </a>
          <a href="/Workspace" 
             on:click={handleWorkspaceNavigation}
             class="rounded-md {isWorkspaceActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-sm font-medium hover:scale-105 transition-all duration-300"
             aria-current={isWorkspaceActive ? 'page' : undefined}>
            Workspace
          </a>
        </div>
      </div>

      <div class="flex-1 flex justify-center pl-0 pr-8 md:pl-0 md:pr-16">
        <div class="w-full max-w-[150px] xs:max-w-[120px] md:max-w-lg">
          <div id="search-container" class="relative flex w-full items-center ml-4">
            <div class="relative flex items-center space-x-2 -ml-2">
              <span class="text-gray-700 dark:text-gray-300 text-sm">Search by:</span>
              <div class="relative">
                <button
                  class="flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm border border-gray-300 dark:border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  on:click={() => showDropdown = !showDropdown}
                >
                  {searchOption}
                  <svg class="ml-2 w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {#if showDropdown}
                <ul class="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-black rounded-lg shadow-md overflow-hidden transition-all duration-200 z-[1000]">
                    {#each searchOptions as option}
                      <li
                        class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        on:click={() => { searchOption = option; showDropdown = false; }}
                      >
                        {option}
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            </div>

            <!-- Search bar remains unchanged -->
            <div class="relative flex-1">
              <input
                type="search"
                id="search-dropdown"
                class="block w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                placeholder="Search assets..."
                bind:value={searchInputValue}
                on:input={handleSearchInput}
                aria-label="Search for assets"
              />
              {#if searchInputValue}
                <button
                  type="button"
                  class="absolute inset-y-0 right-8 flex items-center px-2 text-black dark:text-gray-300 hover:text-gray-700"
                  on:click={handleClearSearch}
                  aria-label="Clear search"
                >
                  <X class="w-3 h-3 md:w-4 md:h-4" />
                </button>
              {/if}
              <button
                type="submit"
                class="absolute inset-y-0 right-0 flex items-center px-2 md:px-3 text-black dark:text-gray-300 hover:text-white"
              >
                <Search class="w-3 h-3 md:w-4 md:h-4" />
                <span class="sr-only">Search</span>
              </button>
              
              <!-- Search Results Dropdown -->
              {#if showSearchResults && searchInputValue.trim()}
                <div class="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 p-3 space-y-4 transition-all duration-300">
                  {#if $isSearching}
                    <div class="p-4 text-center text-gray-500 dark:text-gray-300">
                      <div class="inline-block animate-spin h-5 w-5 border-t-2 border-blue-500 rounded-full mr-2"></div>
                      Searching...
                    </div>
                  {:else if $searchError}
                    <div class="p-4 text-center text-red-500 dark:text-red-400">
                      Error: {$searchError}
                    </div>
                  {:else if $searchResults.length === 0}
                    <div class="p-4 text-center text-gray-500 dark:text-gray-300">
                      No assets found matching "{searchInputValue}"
                    </div>
                  {:else}
                    <ul class="space-y-3">
                      {#each $searchResults as asset}
                        <li class="rounded-xl bg-gray-50 dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 list-none">
                          <button
                            class="w-full text-left space-y-1 text-sm text-gray-700 dark:text-gray-300"
                            on:click={() => navigateToAsset(asset.id)}
                          >
                            <div class={searchOption === 'name' ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-300'}>
                              Name: {asset.name}
                            </div>
                            <div class={searchOption === 'type' ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-300'}>
                              Type: {asset.type}
                            </div>
                            <div class={searchOption === 'date_created' ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-300'}>
                              Created: {asset.date_created ? new Date(asset.date_created).toLocaleDateString() : 'N/A'}
                            </div>
                            <div class={searchOption === 'date_updated' ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-300'}>
                              Updated: {asset.date_updated ? new Date(asset.date_updated).toLocaleDateString() : 'N/A'}
                            </div>
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop right icons (User) -->
      <div class="flex items-center space-x-4 ml-auto">
        <!-- Profile dropdown -->
        <div class="relative">
          <button type="button"
            on:click={toggleUserMenu}
            class="flex rounded-full dark:text-gray-400 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300"
            id="user-menu-button" aria-expanded={isUserMenuOpen} aria-haspopup="true">
            <span class="absolute -inset-1.5"></span>
            <span class="sr-only">Open user menu</span>
            <User class="size-6" />
          </button>
          <div class={`${isUserMenuOpen ? 'block' : 'hidden'} absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 py-1 ring-1 shadow-lg ring-black/5 focus:outline-hidden`}
            role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
            {#if $authStore.isAuthenticated}
              {#if $user.role !== 'viewer'}
                <a href="/profile" class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-0">Your Profile</a>
              {/if}
              <button 
                on:click={handleLogout}
                class="block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" 
                role="menuitem" 
                tabindex="-1" 
                id="user-menu-item-2">Sign out</button>
            {:else}
              <a href="/signup" class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-0">Sign up</a>
              <a href="/login" class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">Login</a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Menu (visible only on screens below md) -->
  <div class={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
    <!-- svelte-ignore a11y-missing-attribute -->
    <div class="space-y-1 px-2 pt-2 pb-3">
      <a href="/" 
         on:click={(e) => handleNavigation(e, '/')}
         class="block rounded-md {isDashboardActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-base font-medium" 
         aria-current={isDashboardActive ? 'page' : undefined}>
        Home
      </a>
      {#if role === 'admin'}
        <a href="/logging" 
           on:click={(e) => handleNavigation(e, '/logging')}
           class="block rounded-md {isLoggingActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-base font-medium transition-colors duration-300"
           aria-current={isLoggingActive ? 'page' : undefined}>
          Log History
        </a>
      {/if}
      <a href="/Projects" 
         on:click={(e) => handleNavigation(e, '/Projects')}
         class="block rounded-md {isProjectsActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-base font-medium transition-colors duration-300"
         aria-current={isProjectsActive ? 'page' : undefined}>
        Projects
      </a>
      <a href="/Workspace" 
         on:click={handleWorkspaceNavigation}
         class="block rounded-md {isWorkspaceActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-base font-medium transition-colors duration-300"
         aria-current={isWorkspaceActive ? 'page' : undefined}>
        Workspace
      </a>
    </div>
  </div>
</nav>
{/if}