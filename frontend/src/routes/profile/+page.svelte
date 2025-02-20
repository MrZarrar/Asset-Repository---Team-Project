<script>
	import { user } from '../../lib/user.js';

	let isOpen = false;

	const toggle = () => {
		isOpen = !isOpen;
	};
</script>

<header class="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
	<!-- Search bar -->
	<div class="flex flex-row items-center justify-center bg-gray-300 dark:bg-gray-700 p-2">
		<form action="#" method="get" class="flex items-center">
			<input
				type="search"
				placeholder="Search..."
				class="rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-400 dark:border-gray-500"
			/>
			<button
				type="submit"
				class="rounded-md ml-1 bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 text-sm font-medium hover:scale-105 transition-all duration-300"
				>Search</button
			>
		</form>
	</div>

	<!-- Navigation -->
	<nav class="bg-gray-300 dark:bg-gray-700">
		<div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
			<div class="relative flex h-16 items-center justify-between">
				<div class="absolute inset-y-0 left-0 flex items-center md:hidden">
					<button
						type="button"
						class="relative inline-flex items-center justify-center rounded-md p-2 dark:text-gray-400 hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset"
						aria-controls="mobile-menu"
						aria-expanded="false"
					>
						<span class="sr-only">Open main menu</span>
						<svg
							class="block size-6"
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
					</button>
				</div>

				<div class="hidden md:block">
					<div class="flex space-x-4">
						<a
							href="#"
							class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all duration-300"
							>Profile</a
						>
						<a
							href="/home"
							class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300"
							>Home</a
						>
						<a
							href="#"
							class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300"
							>Log In</a
						>
						<a
							href="#"
							class="rounded-md px-3 py-2 text-sm font-medium text-black dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300"
							>Sign Up</a
						>
					</div>
				</div>
			</div>
		</div>
	</nav>
</header>

<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen p-5">
	<div class="flex items-center space-x-5">
		<div>
			<svg
				class="w-[200px] h-[200px] text-gray-300 dark:text-gray-500"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
		<div class="flex flex-col justify-center items-center gap-2">
			<h3 class="text-2xl font-bold">{$user.name}</h3>
			<p class="text-lg">{$user.username}</p>
			<p class="text-lg">{$user.email}</p>
			<p class="text-lg">Role: User</p>
		</div>
	</div>
	<div class="flex items-center pt-5">
		<a
			href="/profile_settings"
			class="text-white bg-gray-600 dark:bg-gray-800 hover:bg-gray-900 dark:hover:bg-gray-700 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300"
			>Profile Settings</a
		>
	</div>
</main>
