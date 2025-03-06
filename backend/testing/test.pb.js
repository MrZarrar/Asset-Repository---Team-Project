// create_collections.js
const superuserClient = require('../pb_hooks/superuser.js');

function createCollections() {
    const collectionData = {
        name: "example_collection", // The name of the collection
        type: "base",               // Can be "base", "auth", or "view"
        schema: [
            {
                name: "title",
                type: "text",
                required: true,
                unique: false,
            },
            {
                name: "description",
                type: "text",
                required: false,
                unique: false,
            },
            {
                name: "created",
                type: "date",
                required: true,
                unique: false,
            }
        ],
        listRule: null,             // Optional: Define list rule
        viewRule: null,             // Optional: Define view rule
        createRule: null,           // Optional: Define create rule
        updateRule: null,           // Optional: Define update rule
        deleteRule: null,           // Optional: Define delete rule
    };

    // Create the collection using Promises
    superuserClient.collections.create(collectionData)
        .then((createdCollection) => {
            console.log("Collection created:", createdCollection);
        })
        .catch((error) => {
            console.error("Error creating collection:", error);
        });
}

createCollections();