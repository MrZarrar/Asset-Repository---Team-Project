<script>
  import { Search, User, Download, ChevronDown } from "@lucide/svelte";
  
  // Declare the variable needed for toggling the mobile menu state
  let isMobileMenuOpen = false;
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  // Declare the variable needed for toggling the user menu state
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

  let isSearchMenuOpen = false;
  function toggleSearchMenu() {
    isSearchMenuOpen = !isSearchMenuOpen;
  }

</script>

<style>
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
  display: none;
}
</style>

<svelte:head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>    
</svelte:head>   

  
<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      
  <nav class="bg-gray-200 dark:bg-gray-800">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
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
        <div class="hidden md:ml-3 md:block">
          <!-- svelte-ignore a11y-missing-attribute -->
          <div class="flex space-x-4"> 
            <a class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all duration-300" aria-current="page">
              Dashboard
            </a>
            <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700  hover:scale-105 transition-all duration-300">
              Team
            </a>
            <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700  hover:scale-105 transition-all duration-300">
              Projects
            </a>
            <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700  hover:scale-105 transition-all duration-300">
              Documentation
            </a>
          </div>
        </div>

        <div class="w-full flex justify-center md:justify-start">
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
                  id="dropdown"
                  class="z-10 absolute mt-2 bg-gray-200 dark:bg-gray-700 divide-y divide-gray-600 rounded-lg shadow-lg`}
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

        <!-- Desktop right icons (Download and Profile; visible only on md and up) -->
        <!-- <div class="md:flex md:flex-nowrap md:items-center md:ml-6 md:pr-0 space-x-3"> -->
          <div class="relative ml-1">
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
          <div class="relative ml-5">
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
              <a href="/profile" class="block px-4 py-2 text-sm font-semibold  hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-0">Your Profile</a>    
              <a class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">Settings</a>    
              <a class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-2">Sign out</a>
            </div>
          </div>
        </div>
      <!-- </div> -->
    </div>

    <!-- Mobile Menu (visible only on screens below md) -->
    <div class={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
      <!-- svelte-ignore a11y-missing-attribute -->
      <div class="space-y-1 px-2 pt-2 pb-3">
        <a class="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white" aria-current="page">
          Dashboard
        </a>
        <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300">
          Team
        </a>
        <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300">
          Projects
        </a>
        <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300">
          Documentation
        </a>
      </div>
    </div>
  </nav>      

  <section class="py-8">
      <article>
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Background</h2>
          <p class="text-gray-600">
              The goal of the project is to develop a Web-based repository system that supports the storage and access of different source code related assets of a software company.
          </p>
          <ul class="list-disc ml-6 mt-4 space-y-2">
              <li>Jar files</li>
              <li>Shared libraries e.g. a security library to authenticate users through a service like LDAP</li>
              <li>Scripts</li>
              <li>Images</li>
              <li>Information about the licensing of a particular asset</li>
              <li>Asset usage information</li>
              <li>Documentation about the asset</li>
          </ul>
      </article>
  </section>    
</main>