<script>
	import { user } from '../../lib/user.js';
	import { User } from '@lucide/svelte';
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Profile</title>
</svelte:head>

<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
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
