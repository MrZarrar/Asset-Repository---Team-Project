<script>
    import { writable } from 'svelte/store';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { Search, User, Download, ChevronDown } from "@lucide/svelte";
    import { authStore, logout } from '$lib/auth';
    import { user } from '$lib/user.js';
  
    let isMobileMenuOpen = false;
    let isSearchMenuOpen = false;
    
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
    
    function toggleSearchMenu() {
      isSearchMenuOpen = !isSearchMenuOpen; 
    }

    // if the current page login or signup the bar will be hidden
    $: isAuthPage = $page.url.pathname === '/login' || 
                    $page.url.pathname === '/signup';
                    
    // page routes for checking active pages                
    $: currentPath = $page.url.pathname;
    $: isDashboardActive = currentPath === '/'
    $: isLoggingActive = currentPath === '/logging';
    $: isMyAssetsActive = currentPath === '/MyAssets';//this page is not created yet

    // handles navigation for all pages
    function handleNavigation(event, targetPath) {
      // If user is already on the specific page it will refresh the page
      if (currentPath === targetPath) {
        event.preventDefault();
        window.location.reload();
      }
      // therwise, normal navigation will occur
    }

    async function handleLogout() {
        try {
            logout();
            await goto('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    }

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
              Dashboard
            </a>
            <a href="/logging" 
               on:click={(e) => handleNavigation(e, '/logging')}
               class="rounded-md {isLoggingActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-sm font-medium hover:scale-105 transition-all duration-300"
               aria-current={isLoggingActive ? 'page' : undefined}>
              Log History
            </a>
            <a href="/MyAssets" 
               on:click={(e) => handleNavigation(e, '/MyAssets')}
               class="rounded-md {isMyAssetsActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-sm font-medium hover:scale-105 transition-all duration-300"
               aria-current={isMyAssetsActive ? 'page' : undefined}>
              My Assets
            </a>
          </div>
        </div>

        <!-- Search centered but shifted slightly left -->
        <div class="flex-1 flex justify-center pl-0 pr-8 md:pl-0 md:pr-16">
          <div class="w-full max-w-[150px] xs:max-w-[120px] md:max-w-xl">
            <div class="relative flex w-full">
             <div class="relative hidden md:block">
                <button
                  on:click={toggleSearchMenu}
                  id="dropdown-button"
                  data-dropdown-toggle="dropdown"
                  type="button"
                  class="inline-flex items-center py-2 px-2 text-sm font-medium rounded-l-md border border-gray-900 bg-black text-white hover:bg-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-400 dark:hover:bg-gray-600 focus:ring-1 focus:ring-blue-600 transition-all duration-300"
                >
                  All categories
                  <ChevronDown class="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                </button>
                <div
                  class={`${isSearchMenuOpen ? 'block' : 'hidden'}
                  absolute z-50 mt-2 bg-gray-200 dark:bg-gray-700 divide-y divide-gray-600 rounded-lg shadow-lg `}
                >
                  <ul class="py-2 text-sm text-gray-900 dark:text-gray-200">
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Jar Files
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Shared Libraries
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Scripts
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-300">
                        Python Scripts
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="relative flex-1">
                <input
                  type="search"
                  id="search-dropdown"
                  class="block w-full p-2 md:p-2 text-sm md:text-sm bg-gray-200 text-black-400 dark:text-gray-200 dark:bg-gray-600 border border-gray-600 dark:border-gray-400 rounded-md md:rounded-l-none md:border-l-0 hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600 focus:ring-1 focus:outline-none transition-all duration-300"
                  placeholder="Search..."
                  required
                />
                <button
                  type="submit"
                  class="absolute inset-y-0 right-0 flex items-center px-2 md:px-3 text-black dark:text-gray-300 hover:text-white"
                >
                  <Search class="w-3 h-3 md:w-4 md:h-4" />
                  <span class="sr-only">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop right icons (Download and Profile) -->
        <div class="flex items-center space-x-4 ml-auto">
          <div class="relative">
            <button type="button"
              on:click={toggleDownloadMenu}
              class="rounded-full text-black dark:bg-gray-800 p-1 dark:text-gray-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">View notifications</span>
              <Download class="size-6" />
            </button>   
            <div class={`${isDownloadMenuOpen ? 'block' : 'hidden'} absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md dark:bg-gray-800 dark:text-white bg-white py-1  shadow-lg ring-1 ring-black/5 focus:outline-hidden`}
              role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
              <span class="block px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300">Nothing is downloaded yet.</span>
            </div>
          </div>

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
                <a class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">Settings</a>    
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
          Dashboard
        </a>
        <a href="/logging" 
           on:click={(e) => handleNavigation(e, '/logging')}
           class="block rounded-md {isLoggingActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-base font-medium transition-colors duration-300"
           aria-current={isLoggingActive ? 'page' : undefined}>
          Log History
        </a>
        <a href="/MyAssets" 
           on:click={(e) => handleNavigation(e, '/MyAssets')}
           class="block rounded-md {isMyAssetsActive ? 'bg-gray-900 text-white' : 'text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} px-3 py-2 text-base font-medium transition-colors duration-300"
           aria-current={isMyAssetsActive ? 'page' : undefined}>
          My Assets
        </a>
      </div>
    </div>
  </nav>
{/if}
