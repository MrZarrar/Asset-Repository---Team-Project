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
        <div class="w-full max-w-[150px] xs:max-w-[120px] md:max-w-xl">
          <div id="search-container" class="relative flex w-full items-center">

            <select
              bind:value={searchOption}
              on:change={() => { if (searchInputValue.trim()) debouncedSearch(searchInputValue, searchOption); }}
              class="h-10 px-3 border border-blue-300 bg-blue-50 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded-l-md dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="name">Search by Name</option>
              <option value="type">Search by Type</option>
              <option value="date_created">Search by Date Created</option>
              <option value="date_updated">Search by Date Updated</option>
            </select>

            <!-- Search bar -->
            <div class="relative flex-1">
              <input
                type="search"
                id="search-dropdown"
                class="block w-full p-2 md:p-2 text-sm md:text-sm bg-gray-200 text-black-400 dark:text-gray-200 dark:bg-gray-600 border border-gray-600 dark:border-gray-400 rounded-r-md hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600 focus:ring-1 focus:outline-none transition-all duration-300"
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
                <div class="absolute left-0 right-0 top-full mt-1 max-h-96 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
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
                    <ul class="py-1">
                      {#each $searchResults as asset}
                        <li>
                          <button 
                            class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            on:click={() => navigateToAsset(asset.id)}
                          >
                            <div class="mb-1">
                              <span class={searchOption === 'name' ? 'font-medium text-blue-600' : 'font-medium'}>
                                Name: {asset.name}
                              </span>
                            </div>
                            <div class="mb-1">
                              <span class={searchOption === 'type' ? 'font-medium text-blue-600' : ''}>
                                Type: {asset.type}
                              </span>
                            </div>
                            <div class="mb-1">
                              <span class={searchOption === 'date_created' ? 'font-medium text-blue-600' : ''}>
                                Created: {asset.date_created ? new Date(asset.date_created).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span class={searchOption === 'date_updated' ? 'font-medium text-blue-600' : ''}>
                                Updated: {asset.date_updated ? new Date(asset.date_updated).toLocaleDateString() : 'N/A'}
                              </span>
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