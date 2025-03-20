<script>
	// import { goto } from '$app/navigation';
	import { User, Download, ChevronDown } from '@lucide/svelte';

	async function updatedProfile() {
		if (!userid) {
			alert('User ID is required.');
			return;
		}
		try {
			await updateProfile(userid, username, name, email, profilePicture);
			user.set({ userid, username, name, email, profilePicture });
			goto('/profile');
		} catch (error) {
			console.error('Error updating profile:', error);
			alert('Error updating profile. Please try again.');
		}
	}

	let isMobileMenuOpen = false;
	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	let isUserMenuOpen = false;
	function toggleUserMenu() {
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
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Profile Settings</title>
</svelte:head>

<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
	<nav class="bg-gray-200 dark:bg-gray-800">
		<div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
			<div class="relative flex h-16 items-center justify-between">
				<div class="absolute inset-y-0 left-0 flex items-center md:hidden">
					<button
						type="button"
						on:click={toggleMobileMenu}
						class="relative inline-flex items-center justify-center rounded-md p-2 dark:text-gray-400 hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset"
						aria-controls="mobile-menu"
						aria-expanded={isMobileMenuOpen}
					>
						<span class="absolute -inset-0.5"></span>
						<span class="sr-only">Open main menu</span>
						<svg
							class={!isMobileMenuOpen ? 'block size-6' : 'hidden size-6'}
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
							/>
						</svg>
						<svg
							class={isMobileMenuOpen ? 'block size-6' : 'hidden size-6'}
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="hidden md:ml-3 md:block">
					<div class="flex space-x-4">
						<a
							href="/"
							class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all duration-300"
							aria-current="page"
						>
							Dashboard
						</a>
						<a
							href=""
							class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300"
						>
							Team
						</a>
						<a
							href=""
							class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300"
						>
							Project
						</a>
						<a
							href=""
							class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300"
						>
							Documentation
						</a>
					</div>
				</div>
				<!-- <div class="flex itmes-center"> -->

				<div class="relative ml-auto">
					<button
						type="button"
						on:click={toggleDownloadMenu}
						class="rounded-full text-black dark:bg-gray-800 p-1 dark:text-gray-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300"
					>
						<span class="absolute -inset-1.5"></span>
						<span class="sr-only">View notifications</span>
						<Download class="size-6" />
					</button>
					<div
						class={`${isDownloadMenuOpen ? 'block' : 'hidden'} absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md dark:bg-gray-800 dark:text-white bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden`}
						role="menu"
						aria-orientation="vertical"
						aria-labelledby="user-menu-button"
						tabindex="-1"
					>
						<span
							class="block px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
							>Nothing is downloaded yet.</span
						>
					</div>
				</div>
				<div class="relative ml-5">
					<button
						type="button"
						on:click={toggleUserMenu}
						class="rounded-full dark:text-gray-400 p-1 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden hover:scale-105 transition-all duration-300"
						id="user-menu-button"
						aria-expanded={isUserMenuOpen}
						aria-haspopup="true"
					>
						<span class="absolute -inset-1.5"></span>
						<span class="sr-only">Open user menu</span>
						<User class="size-6" />
					</button>
					<div
						class={`${isUserMenuOpen ? 'block' : 'hidden'} absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 py-1 ring-1 shadow-lg ring-black/5 focus:outline-hidden`}
						role="menu"
						aria-orientation="vertical"
						aria-labelledby="user-menu-button"
						tabindex="-1"
					>
						<a
							href="/profile"
							class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
							role="menuitem"
							tabindex="-1"
							id="user-menu-item-0">Your Profile</a
						>
						<a
							href="/profile_settings"
							class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
							role="menuitem"
							tabindex="-1"
							id="user-menu-item-1">Settings</a
						>
						<a
							class="block px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
							role="menuitem"
							tabindex="-1"
							id="user-menu-item-2">Sign out</a
						>
					</div>
				</div>
				<!--</div>-->
			</div>
		</div>

		<div class={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
			<div class="space-y-1 px-2 pt-2 pb-3">
				<a
					href="/"
					class="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white"
					aria-current="page"
				>
					Dashboard
				</a>
				<a
					href=""
					class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
				>
					Team
				</a>
				<a
					href=""
					class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
				>
					Projects
				</a>
				<a
					href=""
					class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
				>
					Documentation
				</a>
			</div>
		</div>
	</nav>

	<div class="flex h-screen bg-gray-100">
		<!--  Sidebar -->
		<div class="w-64 bg-white text-black p-6">
			<div class="text-center font-bold">User Settings</div>
			<div>
				<ul>
					<li
						class="mb-2 mt-2 cursor-pointer hover:bg-gray-300 rounded-md p-1 flex items-center gap-2"
					>
						<a href="/profile_settings" class="flex items-center gap-2 w-full h-full p-1">
							<svg height="22px" viewBox="0 -960 960 960" width="22px" fill="#1f1f1f"
								><path
									d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"
								/></svg
							>
							<span>Profile</span>
						</a>
					</li>
					<li
						class="mb-2 mt-2 cursor-pointer hover:bg-gray-300 rounded-md p-1 flex items-center gap-2"
					>
						<a href="/profile_settings/account" class="flex items-center gap-2 w-full h-full p-1">
							<svg height="22px" viewBox="0 -960 960 960" width="22px" fill="#1f1f1f"
								><path
									d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"
								/></svg
							>
							<span>Account</span>
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- Profile Section -->
		<slot></slot>
	</div>
</main>
