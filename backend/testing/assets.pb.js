const pb = new pb('http://127.0.0.1:8090');

async function setupAssetsCollection() {
  try {
    console.log('🚀 Authenticating superuser...');
    // Authenticate using the superuser script (which should handle autoCancellation, etc.)
    await authenticateSuperuser();

    // Try to get an existing collection named "assets"
    const existingCollection = await pb.collections.getOne('assets').catch(() => null);
    if (existingCollection) {
      console.log('✅ Assets collection already exists. Deleting it...');
      await pb.collections.delete(existingCollection.id);
    }

    // Define the collection as per migration style
    const collectionData = {
      "name": "assets",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      system: false,
      // Use "fields" similar to the migration example
      "fields": [
        {
          autogeneratePattern: "[a-z0-9]{15}",
          hidden: false,
          id: "text3208210256", // primary id field
          max: 15,
          min: 15,
          name: "id",
          pattern: "^[a-z0-9]+$",
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: "text"
        },
        {
          name: "name",
          type: "text",
          required: true,
          options: {}
        },
        {
          name: "asset_id",
          type: "text",
          required: true,
          unique: true,
          options: {}
        },
        {
          name: "version",
          type: "text",
          required: true,
          options: {}
        },
        {
          name: "size",
          type: "number",
          required: true,
          options: {}
        },
        {
          name: "type",
          type: "text",
          required: true,
          options: {}
        },
        {
          name: "license_info",
          type: "text",
          required: false,
          options: {}
        },
        {
          name: "usage_info",
          type: "text",
          required: false,
          options: {}
        },
        {
          name: "date_created",
          type: "date",
          required: true,
          options: {}
        },
        {
          name: "last_updated",
          type: "date",
          required: true,
          options: {}
        },
        {
          name: "project_id",
          type: "relation",
          required: true,
          options: {
            maxSelect: 1,
            collectionId: "projects"
          }
        }
      ],
      indexes: []
    };

    // Create the collection using the admin API
    const createdCollection = await pb.collections.create(collectionData);
    console.log('✅ Assets collection created successfully:', createdCollection);
  } catch (error) {
    console.error('❌ Error setting up assets collection:', error);
  }
}

module.exports = setupAssetsCollection;