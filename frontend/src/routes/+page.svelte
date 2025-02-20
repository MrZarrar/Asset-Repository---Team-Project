<script>
  import { Search, User, Download, ChevronDown } from "@lucide/svelte";

  import PocketBase from 'pocketbase';

  const pb = new PocketBase('http://127.0.0.1:8090');

  let fetchedAssets = [];

  async function fetchAssets() {
    try {
      fetchedAssets = await pb.collection('assets').getFullList();
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  }

  fetchAssets();
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
    <!-- <section class="py-4"> -->
        
    <nav class="bg-gray-200 dark:bg-gray-800">
        
        <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div class="relative flex h-16 items-center justify-between">
            <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <!-- Mobile menu button-->
              <button type="button" class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset" aria-controls="mobile-menu" aria-expanded="false">
                <span class="absolute -inset-0.5"></span>
                <span class="sr-only">Open main menu</span>
                <!--
                  Icon when menu is closed.
      
                  Menu open: "hidden", Menu closed: "block"
                -->
                <svg class="block size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <!--
                  Icon when menu is open.
      
                  Menu open: "block", Menu closed: "hidden"
                -->
                <svg class="hidden size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="hidden sm:ml-6 sm:block">
                <div class="flex space-x-4">
                  <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
                  <!--svelte-ignore a11y-missing-attribute-->
                  <a class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all duration-300" aria-current="page">
                    Dashboard
                  </a>
                  <!--svelte-ignore a11y-missing-attribute-->
                  <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-300">
                    Team
                  </a>
                  <!--svelte-ignore a11y-missing-attribute-->
                  <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-300">
                    Projects
                  </a>
                  <!--svelte-ignore a11y-missing-attribute-->
                  <a class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-300">
                    Calendar
                  </a>
                </div>
            </div>

            <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div class="flex shrink-0 items-center">
              </div>
              <div class="hidden sm:ml-6 sm:flex flex-1 max-w-xl">
                <div class="relative flex w-full">
                  <div class="relative shrink-0">
                    <button
                      id="dropdown-button"
                      data-dropdown-toggle="dropdown"
                      type="button"
                      class="inline-flex items-center py-2 px-4 text-sm font-medium rounded-l-md border border-gray-900 bg-black text-white hover:bg-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-400 dark:hover:bg-gray-600 focus:ring-1 focus:ring-blue-600 transition-all duration-300"
                    >
                      All categories
                      <ChevronDown class="w-4 h-4 ml-2" />
                    </button>
                    <div
                      id="dropdown"
                      class="z-10 hidden absolute mt-2 bg-gray-700 divide-y divide-gray-600 rounded-lg shadow-lg"
                    >
                      <ul class="py-2 text-sm text-gray-200">
                        <li>
                          <button type="button" class="w-full px-4 py-2 hover:bg-gray-600">
                            Jar Files
                          </button>
                        </li>
                        <li>
                          <button type="button" class="w-full px-4 py-2 hover:bg-gray-600">
                            Shared Libraries
                          </button>
                        </li>
                        <li>
                          <button type="button" class="w-full px-4 py-2 hover:bg-gray-600">
                            Scripts
                          </button>
                        </li>
                        <li>
                          <button type="button" class="w-full px-4 py-2 hover:bg-gray-600">
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
                      class="block w-full p-2 text-sm bg-gray-200 text-black-400 dark:text-gray-200 dark:bg-gray-600 border border-gray-600 dark:border-gray-400 border-l-0 rounded-r-md hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600 focus:ring-1 focus:outline-none transition-all duration-300"
                      placeholder="Search assets..."
                      required
                    />
                    <button
                      type="submit"
                      class="absolute inset-y-0 right-0 flex items-center px-3 text:black dark:text-gray-300 hover:text-white"
                    >
                      <Search class="w-4 h-4" />
                      <span class="sr-only">Search</span>
                    </button>
                  </div>
                </div>
              </div>
              
            <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <button type="button" class="relative rounded-full text-black dark:bg-gray-800 p-1 dark:text-gray-400  focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300">
                <span class="absolute -inset-1.5"></span>
                <span class="sr-only">View notifications</span>
                <Download class="size-6" />
              </button>
      
              <!-- Profile dropdown -->
              <div class="relative ml-3">
                <div>
                  <button type="button" class="relative flex rounded-full dark:text-gray-400 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                    <span class="absolute -inset-1.5"></span>
                    <span class="sr-only">Open user menu</span>
                    <User class="size-6" />
                  </button>
                </div>
      
                <!--
                  Dropdown menu, show/hide based on menu state.
      
                  Entering: "transition ease-out duration-100"
                    From: "transform opacity-0 scale-95"
                    To: "transform opacity-100 scale-100"
                  Leaving: "transition ease-in duration-75"
                    From: "transform opacity-100 scale-100"
                    To: "transform opacity-0 scale-95"
                -->
                <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 focus:outline-hidden" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
                  <!-- Active: "bg-gray-100 outline-hidden", Not Active: "" -->
                  <!--svelte-ignore a11y-missing-attribute-->
                  <a class="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-0">Your Profile</a>    
                  <!--svelte-ignore a11y-missing-attribute-->
                  <a  class="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">Settings</a>    
                  <!--svelte-ignore a11y-missing-attribute-->
                  <a class="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-2">Sign out</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <!-- Mobile menu, show/hide based on menu state. -->
        <div class="sm:hidden" id="mobile-menu">
          <div class="space-y-1 px-2 pt-2 pb-3">
            <!--svelte-ignore a11y-missing-attribute-->
            <a class="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white" aria-current="page">
              Dashboard
            </a>
            <!--svelte-ignore a11y-missing-attribute-->
            <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300">
              Team
            </a>
            <!--svelte-ignore a11y-missing-attribute-->
            <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300">
              Projects
            </a>
            <!--svelte-ignore a11y-missing-attribute-->
            <a class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300">
              Calendar
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