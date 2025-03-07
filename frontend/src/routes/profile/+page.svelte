<script>
	import { user } from '../../lib/user.js';
	import { User, Download, ChevronDown } from '@lucide/svelte';

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
	<title>Profile</title>
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

				<div class="hidden md:block">
					<div class="flex space-x-4">
						<a
							href="/profile"
							class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all duration-300"
							aria-current="page"
						>
							Profile
						</a>
						<a
							href="/"
							class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300"
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
				<div class="flex itmes-center">
					<div class="relative ml-1">
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
							class={`${isDownloadMenuOpen ? 'block' : 'hidden'} absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md dark:bg-gray-800 dark:text-white bg-white py-1  shadow-lg ring-1 ring-black/5 focus:outline-hidden`}
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
				</div>
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

	<div class="flex items-center space-x-5 p-5">
		<div>
			{#if $user.profilePicture}
				<img
					src={$user.profilePicture}
					alt={$user.name ? `${$user.name}'s profile picture` : ''}
					class="w-[200px] h-[200px] rounded-full object-cover border-4 border-gray-300 dark:border-gray-600"
				/>
			{:else}
				<div
					class="w-[200px] h-[200px] flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600"
				>
					<User class="size-16 text-gray-600 dark:text-gray-400" />
				</div>
			{/if}
		</div>
		<div class="flex flex-col justify-center items-center gap-2">
			<div class="flex flex-row gap-4">
				<h3 class="text-2xl font-bold">{$user.name}</h3>
			</div>
			<p class="text-lg">{$user.username}</p>
			<p class="text-lg">{$user.email}</p>
			<p class="text-lg">Role: User</p>
		</div>
	</div>
	<div class="flex items-center pl-10">
		<a
			href="/profile_settings"
			class="block rounded-md px-3 py-2 text-base font-medium bg-gray-300 text-black dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300"
			>Profile Settings</a
		>
	</div>
</main>
