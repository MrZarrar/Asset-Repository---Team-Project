<script>
  import { user } from "../../lib/user.js";

  let isOpen = false;

  const toggle = () => {
    isOpen = !isOpen;
  };
</script>

<header>
  <!-- Search bar -->
  <div class="flex flex-row items-center justify-center bg-blue-300 p-2">
    <form action="#" method="get" class="flex items-center">
      <input
        type="search"
        placeholder="Search..."
        class="rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
      />
      <button
        type="submit"
        class="rounded-md ml-1 hover:bg-blue-500 px-3 py-2 text-sm font-medium text-white"
        >Search</button
      >
    </form>
  </div>

  <!-- Divider -->
  <div class="bg-blue-300 py-2">
    <hr class=" w-11/12 rounded border-t-2 border-blue-500 mx-auto" />
  </div>

  <!-- Navigation -->
  <nav class="bg-blue-300">
    <div class="mx-0 max-w-full sm:px-6 lg:px-2">
      <div class="relative flex h-16 items-center justify-between">
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <!-- Mobile menu button-->
          <button
            type="button"
            class="relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-blue-500 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset"
            aria-controls="mobile-menu"
            aria-expanded={isOpen ? "true" : "false"}
            on:click={toggle}
          >
            <span class="absolute -inset-0.5"></span>
            <span class="sr-only">Open main menu</span>
            <!--
                Icon when menu is closed.
  
                Menu open: "hidden", Menu closed: "block"
                -->
            <svg
              class={isOpen ? "hidden" : "block w-6 h-6"}
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
              data-slot="icon"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            <!--
                Icon when menu is open.
        
                Menu open: "block", Menu closed: "hidden"
                -->
            <svg
              class={isOpen ? "block w-6 h-6" : "hidden"}
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
              data-slot="icon"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Desktop Navigation -->
        </div>
        <div
          class="flex items-start justify-start sm:items-start sm:justify-start"
        >
          <div class="hidden sm:block">
            <div class="flex space-x-4">
              <a
                href="#"
                class="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white"
                aria-current="page">Profile</a
              >
              <a
                href="#"
                class="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 hover:text-white"
                >Home</a
              >
              <a
                href="#"
                class="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 hover:text-white"
                >Log In</a
              >
              <a
                href="#"
                class="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 hover:text-white"
                >Sign Up</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div class={`sm:hidden ${isOpen ? "block" : "hidden"}`} id="mobile-menu">
      <div class="space-y-1 px-2 pt-2 pb-3">
        <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
        <a
          href="#"
          class="block rounded-md bg-blue-500 px-3 py-2 text-base font-medium text-white"
          aria-current="page">Profile</a
        >
        <a
          href="#"
          class="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-500 hover:text-white"
          >Home</a
        >
        <a
          href="#"
          class="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-500 hover:text-white"
          >Log In</a
        >
        <a
          href="#"
          class="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-500 hover:text-white"
          >Sign Up</a
        >
      </div>
    </div>
  </nav>
</header>
<main>
  <div class="flex items-center space-x-5 p-5">
    <div>
      <svg
        class="size-50 text-gray-300"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        data-slot="icon"
      >
        <path
          fill-rule="evenodd"
          d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <div class="flex flex-col justify-center items-center gap-2">
      <div class="flex flex-row gap-4">
        <h3 class="text-2xl font-bold">{$user.fname}</h3>
        <h3 class="text-2xl font-bold">{$user.lname}</h3>
      </div>
      <p class="text-lg">{$user.username}</p>
      <p class="text-lg">{$user.email}</p>
      <p class="text-lg">Role: User</p>
    </div>
  </div>
  <div class="flex items-center pl-10">
    <a
      href="/prof_settings"
      class="text-white bg-blue-300 hover:bg-blue-500 rounded-md px-3 py-2 text-sm font-medium"
      >Profile Settings</a
    >
  </div>
</main>
