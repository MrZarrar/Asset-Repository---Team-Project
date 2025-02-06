import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');


const collection = await pb.collection.create({
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
    ],
});