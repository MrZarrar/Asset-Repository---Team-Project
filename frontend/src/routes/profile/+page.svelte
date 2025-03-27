<script>
	import { user } from '../../lib/user.js';
	import { User, Download, ChevronDown } from '@lucide/svelte';

	let userid = $user.userid;
	let username = $user.username;
	let name = $user.name;
	let email = $user.email;
	let profilePicture = $user.avatar || '';
	let role = $user.role;

	let fileInput;

	async function profilePictureChange(event) {
		const file = event.target.files[0];
		if (file) {
			const formData = new FormData();
			formData.append('avatar', file);

			try {
				const response = await fetch(
					`http://127.0.0.1:8090/api/collections/users/records/${userid}`,
					{
						method: 'PATCH',
						body: formData
					}
				);

				if (!response.ok) {
					throw new Error('Error updating profile picture');
				}
				const updatedUser = await response.json();
				const imageUrl = `http://127.0.0.1:8090/api/files/users/${userid}/${updatedUser.avatar}`;

				user.update((currentUser) => ({
					...currentUser,
					avatar: imageUrl
					}));
				profilePicture = imageUrl; 
			} catch (error) {
				console.error('Error updating profile picture:', error);
				alert('Error updating profile picture. Please try again.');
			}
		}
	}

	async function updatedProfile() {
		try {
			const formData = new FormData();
			formData.append('username', username);
			formData.append('name', name);
			formData.append('email', email.toLowerCase());
			formData.append('role', role.toLowerCase());
			if (profilePicture instanceof File) {
				formData.append('avatar', profilePicture);
			}

			const response = await fetch(
				`http://127.0.0.1:8090/api/collections/users/records/${userid}`,
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
<div class="flex-1 p-10 flex flex-col">
	<!-- Profile Title + Divider -->
	<div>
		<h2 class="text-2xl font-bold">Profile</h2>
		<hr class="my-5 w-full" />
	</div>

	<!-- Profile Form -->
	<form id="profile-settings-form" class="flex justify-between items-start" on:submit|preventDefault={updatedProfile}>
		<!-- Left Section: Profile Info -->
		<div class="flex-1">
			<div class="pb-8">
				<div class="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-6">
					<div class="sm:col-span-4">
						<label for="username" class="block text-sm font-medium text-gray-900">Username</label>
						<input
							type="text"
							name="username"
							id="username"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
							placeholder="Username"
							bind:value={$user.username}
						/>
					</div>
					<div class="sm:col-span-3">
						<label for="name" class="block text-sm font-medium text-gray-900">Name</label>
						<input
							type="text"
							name="name"
							id="name"
							autocomplete="given-name"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
							bind:value={$user.name}
						/>
					</div>
					<div class="sm:col-span-4">
						<label for="email" class="block text-sm font-medium text-gray-900">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
							bind:value={$user.email}
						/>
					</div>

					<div class="sm:col-span-4">
						<label for="role" class="block text-sm font-medium text-gray-900">Role</label>
						<select
							id="role"
							name="role"
							class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
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
			{#if profilePicture}
				<img
					src={profilePicture}
					alt={$user.name ? `${$user.name}'s profile picture` : ''}
					class="w-[250px] h-[250px] rounded-full object-cover border-4 border-gray-300"
				/>
			{:else}
				<div
					class="w-[250px] h-[250px] flex items-center justify-center rounded-full bg-gray-200 border-4 border-gray-300"
				>
					<User class="size-16 text-gray-600" />
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
				class="flex gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 mt-1"
				on:click={() => fileInput.click()}
			>
				<svg height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f">
					<path
						d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
					/>
				</svg>
				<span>Edit</span>
			</button>
		</div>
	</form>
</div>
