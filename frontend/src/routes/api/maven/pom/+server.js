import { json } from '@sveltejs/kit';

export async function GET({ url }) {
  try {
    const groupId = url.searchParams.get('groupId');
    const artifactId = url.searchParams.get('artifactId');
    const version = url.searchParams.get('version');
    
    if (!groupId || !artifactId || !version) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Convert group ID to path
    const groupPath = groupId.replace(/\./g, '/');
    
    // Use the search.maven.org URL as the primary source
    const pomUrl = `https://search.maven.org/remotecontent?filepath=${groupPath}/${artifactId}/${version}/${artifactId}-${version}.pom`;
    
    // backup
    const backupPomUrl = `https://repo1.maven.org/maven2/${groupPath}/${artifactId}/${version}/${artifactId}-${version}.pom`;

    // Try to fetch the POM file
    let response;
    try {
      response = await fetch(pomUrl, {
        headers: { 'Accept': 'application/xml' }
      });
    } catch (error) {
      console.log(`Primary POM URL failed: ${error.message}. Trying backup URL.`);
      response = await fetch(backupPomUrl, {
        headers: { 'Accept': 'application/xml' }
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch POM file: ${response.status} ${response.statusText}`);
    }

    const pomContent = await response.text();

    return new Response(JSON.stringify({ pomContent }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching POM file:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 