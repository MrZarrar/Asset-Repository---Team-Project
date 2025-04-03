<script>
    import PocketBase from 'pocketbase';
    import { onMount } from 'svelte';
    import { getAssetById } from '$lib/assetService';

    const pb = new PocketBase('http://127.0.0.1:8090');
  
    let logs = [];

    async function fetchLogs() {
        try {
            const rawLogs = await pb.collection('logs').getFullList({ sort: '-created' });
            logs = await Promise.all(
                rawLogs.map(async (log) => {
                    let assetName = 'Unknown Asset';
                    let assetAddType = 'Unknown Type';
                    if (log.asset) {
                        try {
                            const asset = await getAssetById(log.asset);
                            assetName = asset.name || assetName;
                            assetAddType = asset.add_type || assetAddType;
                        } catch (err) {
                            console.error(`Error fetching asset ${log.asset}:`, err);
                        }
                    }
                    
                    return { ...log, assetName, assetAddType };
                })
            );
        } catch (err) {
            console.error("Error fetching logs:", err);
        }
    }
  
    onMount(fetchLogs());
</script>

<svelte:head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logging</title>
</svelte:head>

<main class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen p-4">
    <h1 class="text-xl font-semibold mt-6">Log History</h1>
    <ul class="mt-4 space-y-2">
        {#each logs as log}
            <li class="p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow-md">
                <strong class="text-red-600">{log.user} </strong>
                <span class="text-blue-600">{log.action} </span>
                <strong class="text-red-600">
                    {log.assetName} (Add Type: {log.assetAddType}) (ID: {log.asset})
                </strong>
                <div class="text-sm text-gray-500">{new Date(log.created).toLocaleString()}</div>
            </li>
        {/each}
    </ul>
</main>