import pb from '$lib/pocketbase';

// this would search for the assets by name and fetch all fields
export async function searchAssets(searchTerm = '', field = 'name') {
  try {
    // If no search term, fetch all assets with every field
    if (!searchTerm.trim()) {
      const records = await pb.collection('Assets').getList(1, 20, {
        sort: '-created', // Sort by newest first
        fields: 'name'       // Fetch all fields
      });
      return records.items;
    }

    // Search by the specified field and fetch all fields
    const records = await pb.collection('Assets').getList(1, 50, {
      filter: `${field} ~ "${searchTerm}"`,
      sort: '-created', // Sort by newest first
      fields: '*'     // Fetch all fields including type, last_updated, date_created, etc.
    });
    
    return records.items;
  } catch (error) {
    console.error('Error in searching assets:', error);
    throw error;
  }
}