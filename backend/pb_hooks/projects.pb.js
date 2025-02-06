import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createProjectsCollection() {
    try {
        // Check if the "projects" collection already exists
        const existingCollection = await pb.collections.getOne('projects').catch(() => null);
        if (existingCollection) {
            console.log('Projects collection already exists.');
            return;
        }

        const collection = await pb.collections.create({
            name: 'projects',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'language', type: 'text', required: true },
                { name: 'owner', type: 'text', required: true },
                { name: 'launched', type: 'date', required: true },
                { name: 'logo', type: 'text', required: false },
                { name: 'tag', type: 'json', required: false },
                { name: 'project_id', type: 'text', required: true, unique: true }
            ],
            options: {}
        });

        console.log('Projects collection created:', collection);
    } catch (e) {
        console.error('Error creating projects collection:', e);
    }
}

createProjectsCollection();
