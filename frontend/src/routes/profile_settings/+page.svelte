<script lang="ts">
  import { goto } from "$app/navigation";
  import { user } from "$lib/user";

  let username: string;
  let fname: string;
  let lname: string;
  let email: string;

  $: {
    username = $user.username;
    fname = $user.fname;
    lname = $user.lname;
    email = $user.email;
  }

  function updatedProfile() {
    console.log("Saving Profile:", { username, fname, lname, email });
    user.set({ username, fname, lname, email });
    console.log("Store updated. Redirecting to profile page...");
    goto("/profile");
  }

  function cancel() {
    goto("/profile");
  }
</script>

<form
  id="profile-settings-form"
  class="flex flex-col justify-center items-center"
>
  <div class="border-b border-gray-900/10 pb-12">
    <h2 class="text-base/7 font-semibold text-gray-900">
      Personal Information
    </h2>

    <div class="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
      <div class="sm:col-span-4">
        <label for="username" class="block text-sm/6 font-medium text-gray-900"
          >Username</label
        >
        <div class="mt-2">
          <div
            class="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600"
          >
            <div
              class="shrink-0 text-base text-gray-500 select-none sm:text-sm/6"
            ></div>
            <input
              type="text"
              name="username"
              id="username"
              class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
              placeholder="username"
              bind:value={username}
            />
          </div>
        </div>
      </div>

      <div class="col-span-full">
        <label for="photo" class="block text-sm/6 font-medium text-gray-900"
          >Photo</label
        >
        <div class="mt-2 flex items-center gap-x-3">
          <svg
            class="size-12 text-gray-300"
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
          <button
            type="button"
            class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
            >Change</button
          >
        </div>
      </div>

      <div class="sm:col-span-3">
        <label
          for="first-name"
          class="block text-sm/6 font-medium text-gray-900">First name</label
        >
        <div class="mt-2">
          <input
            type="text"
            name="first-name"
            id="first-name"
            autocomplete="given-name"
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            bind:value={fname}
          />
        </div>
      </div>

      <div class="sm:col-span-3">
        <label for="last-name" class="block text-sm/6 font-medium text-gray-900"
          >Last name</label
        >
        <div class="mt-2">
          <input
            type="text"
            name="last-name"
            id="last-name"
            autocomplete="family-name"
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            bind:value={lname}
          />
        </div>
      </div>

      <div class="sm:col-span-4">
        <label for="email" class="block text-sm/6 font-medium text-gray-900"
          >Email address</label
        >
        <div class="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            bind:value={email}
          />
        </div>
      </div>
    </div>
  </div>
  <hr class=" w-11/12 rounded border-t-2 border-blue-500 mx-auto" />
  <div class="flex space-x-4 p-5">
    <button
      type="submit"
      class="bg-blue-300 text-white hover:bg-blue-500 rounded-md px-3 py-2 text-sm font-medium"
      on:click={updatedProfile}>Save Changes</button
    >
    <button
      type="button"
      class="bg-blue-300 text-white hover:bg-blue-500 rounded-md px-3 py-2 text-sm font-medium"
      id="cancel-button"
      on:click={cancel}>Return</button
    >
  </div>
</form>
