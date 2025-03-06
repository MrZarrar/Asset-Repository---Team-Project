<script>
    import { logIn } from '$lib/auth'; 
    
    let email = "";
    let password = "";
    let errorMessage = "";

    async function handleLogin() {
        try {
            await logIn(email, password);
            window.location.href = "/";
        } catch (error) {
            errorMessage = error.message;
        }
    }
</script>

<svelte:head>
  <title>Login</title>    
</svelte:head>

<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center">
    <div class="relative w-full max-w-md group">
        <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-all duration-1000 group-hover:duration-200"></div>
        <div class="relative w-full p-6 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
            <h1 class="text-4xl font-bold mb-6 text-center">Login</h1>
            
            {#if errorMessage}
                <div class="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
                    {errorMessage}
                </div>
            {/if}
            
            <form on:submit|preventDefault={handleLogin} class="space-y-4">
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            class="text-gray-500 dark:text-gray-400"
                        >
                            <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" />
                        </svg>
                    </div>
                    <input 
                        type="email" 
                        bind:value={email} 
                        placeholder="Enter your email" 
                        required 
                        class="w-full p-2 pl-12 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
                    />
                </div>
                
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            class="text-gray-500 dark:text-gray-400"
                        >
                            <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z" />
                        </svg>
                    </div>
                    <input 
                        type="password" 
                        bind:value={password} 
                        placeholder="Enter your password" 
                        required 
                        class="w-full p-2 pl-12 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
                    />
                </div>
                
                <button 
                    type="submit" 
                    class="mx-auto block w-20 bg-gray-900 dark:bg-blue-600 font-bold transition-all duration-300 hover:scale-105 text-white py-2 rounded-md hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-300"
                >
                    Login
                </button>
            </form>
            
            <div class="mt-6 text-center">
                <p class="text-sm">
                    Don't have an account? 
                    <a href="/signup" class="text-blue-600 dark:text-blue-400 hover:underline">Sign up</a>
                </p>
            </div>
        </div>
    </div>
</main>
