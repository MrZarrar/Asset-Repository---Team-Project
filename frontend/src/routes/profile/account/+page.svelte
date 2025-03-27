<script>
	import { user } from '../../../lib/user.js';
	import { accountDelete } from '../../../lib/api.js';
</script>

<div class="flex-1 p-10 flex flex-col">
	<div class="border-b border-gray-200 dark:border-gray-800">
		<h2 class="text-2xl font-bold text-red-600 pb-2">Delete Account</h2>
	</div>
	<div class="mt-5 text-gray-900 dark:text-gray-100">
		<p>Once you delete your account, it can not be restored. Please think carefully.</p>
	</div>
	<div class="mt-5">
		<button
			class="bg-gray-300 dark:bg-gray-800 outline dark:outline-gray-900 outline-gray-200 text-red-600 hover:bg-red-600 hover:text-white hover:outline-red-600 text-medium font-semibold px-4 py-2 rounded-md mt-5 transition-all duration-300"
			on:click={() => accountDelete($user.userid)}
			>Delete your account
		</button>
	</div>
</div>
