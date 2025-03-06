<script>
	import { goto } from '$app/navigation';
	import { user } from '$lib/user';
	import { updateProfile } from '$lib/api';
	import { User } from '@lucide/svelte';

	let userid = $user.userid;
	let username = $user.username;
	let name = $user.name;
	let email = $user.email;
	let profilePicture = $user.profilePicture || '';

	let fileInput;

	async function profilePictureChange(event) {
		const file = event.target.files[0];
		if (file) {
			const formData = new FormData();
			formData.append('avatar', file);

			try {
				const response = await fetch(
					`http://127.0.0.1:8090/api/collections/profiles/records/${userid}`,
					{
						method: 'PATCH',
						body: formData
					}
				);

				if (!response.ok) {
					throw new Error('Error updating profile picture');
				}
				const updatedUser = await response.json();
				const imageUrl = `http://127.0.0.1:8090/api/files/profiles/${userid}/${updatedUser.profilePicture}`;

				user.update((currentUser) => ({
					...currentUser,
					profilePicture: imageUrl
				}));
			} catch (error) {
				console.error('Error updating profile picture:', error);
				alert('Error updating profile picture. Please try again.');
			}
		}
	}

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

	function cancel() {
		goto('/profile');
	}
</script>

<form id="profile-settings-form" class="flex flex-col justify-center items-center">
	<div class="border-b border-gray-900/10 pb-12">
		<h2 class="text-base/7 font-semibold text-gray-900">Personal Information</h2>

		<div class="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
			<div class="sm:col-span-4">
				<label for="username" class="block text-sm/6 font-medium text-gray-900">Username</label>
				<div class="mt-2">
					<input
						type="text"
						name="username"
						id="username"
						class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm/6"
						placeholder="Username"
						bind:value={$user.username}
					/>
				</div>
			</div>

			<div class="col-span-full">
				<label for="photo" class="block text-sm/6 font-medium text-gray-900">Photo</label>
				<div class="mt-2 flex items-center gap-x-3">
					{#if profilePicture}
						<img src={profilePicture} alt="" class="h-12 w-12 rounded-full" />
					{:else}
						<div
							class="h-12 w-12 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
						>
							<User class="size-6 text-gray-600 dark:text-gray-400" />
						</div>
					{/if}

					<input
						type="file"
						id="photo"
						accept="image/*"
						on:change={profilePictureChange}
						class="hidden"
						bind:this={fileInput}
					/>
					<button
						type="button"
						class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
						on:click={() => fileInput.click()}
					>
						Change
					</button>
				</div>
			</div>

			<div class="sm:col-span-3">
				<label for="name" class="block text-sm/6 font-medium text-gray-900">Name</label>
				<div class="mt-2">
					<input
						type="text"
						name="name"
						id="name"
						autocomplete="given-name"
						class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm/6"
						bind:value={$user.name}
					/>
				</div>
			</div>

			<div class="sm:col-span-4">
				<label for="email" class="block text-sm/6 font-medium text-gray-900">Email address</label>
				<div class="mt-2">
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm/6"
						bind:value={$user.email}
					/>
				</div>
			</div>
		</div>
	</div>
	<hr class="w-11/12 rounded border-t-2 border-black mx-auto" />
	<div class="flex space-x-4 p-5">
		<button
			type="submit"
			class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300"
			on:click={updatedProfile}>Save Changes</button
		>
		<button
			type="button"
			class="block rounded-md px-3 py-2 text-base font-medium text-black dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300"
			id="cancel-button"
			on:click={cancel}>Return</button
		>
	</div>
</form>
