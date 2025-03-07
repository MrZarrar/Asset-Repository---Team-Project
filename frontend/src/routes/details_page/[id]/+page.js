import pb from '$lib/pocketbase';

export async function load({ params }) {
  const assetId = params.id;
  
  try {
    const asset = await pb.collection('assets').getOne(assetId);
    return {
      asset
    };
  } catch (error) {
    console.error("Error loading asset:", error);
    return {
      asset: null,
      error: `Could not load asset with ID ${assetId}`
    };
  }
} 