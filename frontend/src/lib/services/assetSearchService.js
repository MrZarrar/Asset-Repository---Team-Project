import pb from '$lib/pocketbase';

// this would search for the assets by name

export async function searchAssets(searchTerm = '') {
    try {
      // If there were no search term provided, we would fetch all assets (or I could limit to it to the recent ones)
      if (!searchTerm.trim()) {
        const records = await pb.collection('Assets').getList(1, 20, {
          sort: '-created', // Sort by newest first
        });
        return records.items;
      }
  
      // Search by name
      const records = await pb.collection('Assets').getList(1, 50, {
        filter: `name ~ "${searchTerm}"`,
        sort: '-created', // Sort by newest first
      });
      
      return records.items;
    } catch (error) {
      console.error('Error in searching assets:', error);
      throw error;
    }
  }