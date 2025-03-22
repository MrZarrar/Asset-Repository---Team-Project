import { json } from '@sveltejs/kit';
import { searchMavenCentral } from '../chat/maven.js';

export async function GET({ url }) {
  try {
    const query = url.searchParams.get('q');
    
    if (!query) {
      return json({ error: 'Search query is required' }, { status: 400 });
    }
    
    const results = await searchMavenCentral(query);
    return json({ results });
  } catch (error) {
    console.error('Maven search error:', error);
    return json({ error: error.message }, { status: 500 });
  }
} 