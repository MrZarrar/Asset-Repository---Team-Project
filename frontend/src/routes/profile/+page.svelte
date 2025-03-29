<script>
	import { removeAvatar } from '../../lib/api.js';
	import { user } from '../../lib/user.js';
	import { User, Download, ChevronDown } from '@lucide/svelte';

	let fileInput;

	async function profilePictureChange(event) {
		const file = event.target.files[0];
		if (file) {
			const formData = new FormData();
			formData.append('avatar', file);

			try {
				const response = await fetch(
					`http://127.0.0.1:8090/api/collections/users/records/${$user.userid}`,
					{
						method: 'PATCH',
						body: formData
					}
				);

				if (!response.ok) {
					throw new Error('Error updating profile picture');
				}
				const updatedUser = await response.json();
				const imageUrl = `http://127.0.0.1:8090/api/files/users/${$user.userid}/${updatedUser.avatar}`;

				user.update((currentUser) => ({
					...currentUser,
					avatar: imageUrl
				}));
			} catch (error) {
				console.error('Error updating profile picture:', error);
				alert('Error updating profile picture. Please try again.');
			}
		}
	}

	async function updatedProfile() {
		try {
			const formData = new FormData();
			formData.append('username', $user.username);
			formData.append('name', $user.name);
			formData.append('email', $user.email.toLowerCase());
			formData.append('role', $user.role.toLowerCase());
			if ($user.avatar instanceof File) {
				formData.append('avatar', $user.avatar);
			}

			const response = await fetch(
				`http://127.0.0.1:8090/api/collections/users/records/${$user.userid}`,
				{
					method: 'PATCH',
					body: formData
				}
			);

			if (!response.ok) {
				throw new Error('Error updating profile');
			}

			const updatedUser = await response.json();
			user.set({
				userid: updatedUser.id,
				username: updatedUser.username,
				name: updatedUser.name,
				email: updatedUser.email,
				avatar: updatedUser.avatar,
				role: updatedUser.role
			});
			alert('Profile updated successfully');
		} catch (error) {
			console.error('Error updating profile:', error);
			alert('Error updating profile. Please try again.');
		}
	}
</script>

<!-- Profile Section -->
<div class="flex-1 p-10 flex flex-col min-h-screen">
	<!-- Profile Title + Divider -->
	<div class="border-b border-gray-200 dark:border-gray-800">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 pb-2">Profile</h2>
	</div>

	<!-- Profile Form -->
	<form id="profile-settings-form" class="flex justify-between items-start" on:submit|preventDefault={updatedProfile}>
		<!-- Left Section: Profile Info -->
		<div class="flex-1">
			<div class="pb-8">
				<div class="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
					<div class="sm:col-span-4">
						<label
							for="username"
							class="block text-sm font-medium pb-2 text-gray-900 dark:text-gray-100"
							>Username</label
						>
						<input
							type="text"
							name="username"
							id="username"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-black focus:ring-2 focus:ring-indigo-600 sm:text-sm"
							placeholder="Username"
							bind:value={$user.username}
						/>
					</div>
					<div class="sm:col-span-3">
						<label
							for="name"
							class="block text-sm font-medium pb-2 text-gray-900 dark:text-gray-100">Name</label
						>
						<input
							type="text"
							name="name"
							id="name"
							autocomplete="given-name"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-black focus:ring-2 focus:ring-indigo-600 sm:text-sm"
							placeholder="Name"
							bind:value={$user.name}
						/>
					</div>
					<div class="sm:col-span-4">
						<label
							for="email"
							class="block text-sm font-medium pb-2 text-gray-900 dark:text-gray-100"
							>Email address</label
						>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-black focus:ring-2 focus:ring-indigo-600 sm:text-sm"
							placeholder="Email address"
							bind:value={$user.email}
						/>
					</div>

					<div class="sm:col-span-4">
						<label
							for="role"
							class="block text-sm font-medium pb-2 text-gray-900 dark:text-gray-100">Role</label
						>
						<select
							id="role"
							name="role"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-black focus:ring-2 focus:ring-indigo-600 sm:text-sm"
							bind:value={$user.role}
						>
							<option value="admin">Admin</option>
							<option value="user">User</option>
							<option value="viewer">Viewer</option>
						</select>
					</div>
				</div>
			</div>
			<!-- Save Button -->
			<div class="flex space-x-4">
				<button
					type="submit"
					class="rounded-md px-3 py-2 text-base font-medium text-white bg-green-600 hover:bg-green-500 transition-all duration-300"
				>
					Save Changes
				</button>
			</div>
		</div>

		<!-- Right Section: Avatar -->
		<div class="flex flex-col items-center gap-y-3 mt-5">
			{#if $user.avatar}
				<img
					src={$user.avatar}
					alt={$user.name ? `${$user.name}'s profile picture` : ''}
					class="w-[250px] h-[250px] rounded-full object-cover border-4 border-gray-300"
				/>
			{:else}
				<div
					class="w-[250px] h-[250px] flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-100"
				>
					<User class="size-16 text-gray-900 dark:text-gray-100" />
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
			<div class="flex flex-row gap-x-2 m-auto">
				<button
					type="button"
					class="flex gap-2 rounded-md bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-900 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-sm font-semibold mt-1"
					on:click={() => fileInput.click()}
				>
					<svg
						height="20px"
						viewBox="0 -960 960 960"
						width="20px"
						fill="currentColor"
						class="text-gray-900 dark:text-gray-100"
					>
						<path
							d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
						/>
					</svg>
					<span>Edit</span>
				</button>
				<button
					type="button"
					class="flex gap-2 rounded-md bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-900 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-sm font-semibold mt-1"
					on:click={() => removeAvatar($user.userid)}
				>
					<svg
						height="20px"
						viewBox="0 -960 960 960"
						width="20px"
						fill="currentColor"
						class="text-gray-900 dark:text-gray-100"
						><path
							d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
						/></svg
					>
					<span>Remove</span>
				</button>
			</div>
		</div>
	</form>
</div>
