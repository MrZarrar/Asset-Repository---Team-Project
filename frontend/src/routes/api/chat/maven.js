// function to search Maven Central Repository
export async function searchMavenCentral(query) {
  try {
    if (!query) {
      throw new Error('Search query is required');
    }
    
    // search Maven Central Repository with simpler, more reliable parameters
    const response = await fetch(
      `https://search.maven.org/solrsearch/select?q=${encodeURIComponent(query)}&rows=20&wt=json`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Maven Central');
    }
    
    const data = await response.json();
    
    if (!data.response || !data.response.docs || data.response.docs.length === 0) {
      console.log('No results found for query:', query);
      // Try with a more lenient search if exact search returns nothing
      if (query.includes(' ')) {
        const simplifiedQuery = query.split(' ')[0]; // Try with just the first word
        console.log('Retrying with simplified query:', simplifiedQuery);
        return searchMavenCentral(simplifiedQuery);
      }
    }
    
    // Transform the response into a more usable format
    return data.response.docs.map(doc => ({
      groupId: doc.g,
      artifactId: doc.a,
      version: doc.latestVersion || doc.v, // results use v instead of latestVersion
      packaging: doc.p,
      timestamp: doc.timestamp,
      license: doc.license || 'Unknown',
      popularity: doc.downloadCount || doc.versionCount || 0 // Different popularity metrics
    }));
  } catch (error) {
    console.error('Maven search error:', error);
    throw error;
  }
} 