<script>
	import { removeAvatar } from '../../lib/api.js';
	import { user } from '../../lib/user.js';
	import { User, Download, ChevronDown, X } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let fileInput;
	let popupMessage = '';
	let showPopup = false;
	let popupType = 'success'; // 'success' or 'error'

	function showPopupMessage(message, type = 'success') {
		popupMessage = message;
		popupType = type;
		showPopup = true;
		setTimeout(() => {
			showPopup = false;
		}, 3000); // Hide popup after 3 seconds
	}

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
				showPopupMessage('Profile picture updated successfully!', 'success');
			} catch (error) {
				console.error('Error updating profile picture:', error);
				showPopupMessage('Error updating profile picture. Please try again.', 'error');
			}
		}
	}

	async function updatedProfile() {
		try {
			// Validate required fields before submission
			if (!$user.username || !$user.email) {
				showPopupMessage('Username and email are required fields.', 'error');
				return;
			}

			// Get the current user data from the server to compare
			const getCurrentUser = await fetch(
				`http://127.0.0.1:8090/api/collections/users/records/${$user.userid}`
			);
			
			if (!getCurrentUser.ok) {
				throw new Error('Could not retrieve current user data');
			}
			
			const currentUserData = await getCurrentUser.json();
			
			// Check if any changes were made
			const hasChanges = 
				currentUserData.username !== $user.username ||
				currentUserData.name !== $user.name ||
				currentUserData.role.toLowerCase() !== $user.role.toLowerCase() ||
				$user.avatar instanceof File;
				
			if (!hasChanges) {
				showPopupMessage('No changes detected to update.', 'error');
				return;
			}

			const formData = new FormData();
			formData.append('username', $user.username);
			formData.append('name', $user.name || '');
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

			const responseData = await response.json();

			if (!response.ok) {
				// Extract error message from response if available
				const errorMessage = responseData.message || 'Error updating profile';
				throw new Error(errorMessage);
			}

			// Verify that we received valid data back
			if (!responseData.id) {
				throw new Error('Invalid response from server');
			}

			const updatedUser = responseData;
			
			// Properly handle the avatar URL
			let avatarUrl = $user.avatar;
			if (updatedUser.avatar) {
				// Check if it's already a full URL or needs to be constructed
				if (typeof updatedUser.avatar === 'string' && !updatedUser.avatar.startsWith('http')) {
					avatarUrl = `http://127.0.0.1:8090/api/files/users/${$user.userid}/${updatedUser.avatar}`;
				} else {
					avatarUrl = updatedUser.avatar;
				}
			}
			
			user.set({
				userid: updatedUser.id,
				username: updatedUser.username,
				name: updatedUser.name,
				email: updatedUser.email || $user.email,
				avatar: avatarUrl,
				role: updatedUser.role
			});
			
			showPopupMessage('Profile updated successfully!', 'success');
		} catch (error) {
			console.error('Error updating profile:', error);
			showPopupMessage(`Error updating profile: ${error.message}`, 'error');
		}
	}
</script>

<!-- Profile Section -->
<div class="flex-1 p-5 pb-10 flex flex-col min-h-0 overflow-y-auto">
	<!-- Profile Title + Divider -->
	<div class="border-b border-gray-200 dark:border-gray-800">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 pb-2">Profile</h2>
	</div>

	<!-- Profile Form -->
	<form id="profile-settings-form" class="flex flex-col md:flex-row justify-between items-start mb-10" on:submit|preventDefault={updatedProfile}>
		<!-- Right Section: Avatar -->
		<div class="flex flex-col items-center gap-y-3 mt-5 md:mt-5">
			{#if $user.avatar}
				<img
					src={$user.avatar}
					alt={$user.name ? `${$user.name}'s profile picture` : ''}
					class="w-[150px] h-[150px] md:w-[250px] md:h-[250px] rounded-full object-cover border-4 border-gray-300"
				/>
			{:else}
				<div
					class="flex items-center justify-center w-[150px] h-[150px] md:w-[250px] md:h-[250px] rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-100"
				>
					<User class="size-12 md:size-16 text-gray-900 dark:text-gray-100" />
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
			<div class="flex flex-row justify-center md:justify-start gap-x-2">
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

		<!-- Left Section: Profile Info -->
		<div class="flex-1 w-full md:ml-5">
			<div class="pb-8">
				<div class="grid grid-cols-6 mt-5 gap-x-6 gap-y-8 ">
					<div class="col-span-4">
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
					<div class="col-span-3">
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
					<div class="col-span-4">
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
							disabled
							bind:value={$user.email}
						/>
					</div>

					<div class="col-span-4">
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
						</select>
					</div>
				</div>
			</div>
			<!-- Save Button -->
			<div class="flex justify-center md:justify-start space-x-4 mb-5">
				<button
					type="submit"
					class="rounded-md px-3 py-2 text-base font-medium text-white bg-green-600 hover:bg-green-500 transition-all duration-300"
				>
					Save Changes
				</button>
			</div>
		</div>
	</form>
</div>

<!-- Popup Component -->
{#if showPopup}
	<div
		class="fixed inset-0 flex items-center justify-center bg-black z-50"
		transition:fade={{ duration: 300 }}
	>
		<div
			class="relative bg-gradient-to-r from-blue-600/50 to-pink-600/50 text-white p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4"
			class:success={popupType === 'success'}
			class:error={popupType === 'error'}
			transition:scale={{ start: 0.7, duration: 400, opacity: 0, easing: quintOut }}
		>
			<button
				class="absolute top-2 right-2 text-white hover:text-gray-300"
				on:click={() => showPopup = false}
			>
				<X class="w-5 h-5" />
			</button>
			
			{#if popupType === 'success'}
				<div class="success-circle">
					<User class="success-icon" />
				</div>
				<p class="text-lg font-semibold">{popupMessage}</p>
			{:else}
				<div class="error-circle">
					<X class="error-icon" />
				</div>
				<p class="text-lg font-semibold">{popupMessage}</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Pulse Animation for Success */
	.success-circle {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.success-icon {
		width: 30px;
		height: 30px;
		color: white;
		opacity: 0;
		animation: fade-in 0.5s ease-in-out 0.3s forwards;
	}
	
	/* Error Animation */
	.error-circle {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		animation: error-pulse 1.5s ease-in-out infinite;
	}

	.error-icon {
		width: 30px;
		height: 30px;
		color: white;
		opacity: 0;
		animation: fade-in 0.5s ease-in-out 0.3s forwards;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
		}
		
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
		}
		
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
		}
	}
	
	@keyframes error-pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.5);
		}
		
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 15px rgba(244, 67, 54, 0);
		}
		
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
		}
	}

	@keyframes fade-in {
		0% {
			opacity: 0;
			transform: scale(0.7);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.success {
		background-color: transparent;
	}
	.error {
		background-color: transparent;
		background-image: linear-gradient(to right, rgba(244, 67, 54, 0.5), rgba(233, 30, 99, 0.5));
	}
</style>
