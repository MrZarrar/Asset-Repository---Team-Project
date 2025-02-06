import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createAssetsCollection() {
    try { // Check if the collection already exists
        const existingCollection = await pb.collections.getOne('assets').catch(() => null);
        if (existingCollection) {
            console.log('Assets collection already exists.');
            return;
        }

        const collection = await pb.collections.create({
            name: 'assets',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'asset_id', type: 'text', required: true, unique: true }, 
                { name: 'version', type: 'text', required: true },
                { name: 'size', type: 'number', required: true },
                { name: 'type', type: 'text', required: true },
                { name: 'license_info', type: 'text', required: false },
                { name: 'usage_info', type: 'text', required: false },
                { name: 'date_created', type: 'date', required: true },
                { name: 'last_updated', type: 'date', required: true },
                
            ]
        });

        console.log('Assets collection created:', collection);
    } catch (e) {
        console.error('Error creating collection:', e);
    }
}

createAssetsCollection();