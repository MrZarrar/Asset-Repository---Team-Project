<script>
	import { user } from '../../../lib/user.js';
	import { accountDelete } from '../../../lib/api.js';
</script>

<div class="flex-1 p-10 flex flex-col">
	<div>
		<h2 class="text-2xl font-bold text-red-600">Delete Account</h2>
		<hr class="my-5 w-full" />
	</div>
	<div>
		<p>Once you delete your account, it can not be restored. Please think carefully.</p>
	</div>
	<div class="mt-5">
		<button
			class="bg-gray-300 outline outline-gray-200 text-red-600 hover:bg-red-600 hover:text-white hover:outline-red-600 text-medium font-semibold px-4 py-2 rounded-md mt-5 transition-all duration-300"
			on:click={() => accountDelete($user.userid)}
			>Delete your account
		</button>
	</div>
</div>
