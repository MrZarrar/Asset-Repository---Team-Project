<script>
  import "../../app.css";
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly, fade } from 'svelte/transition';
  import { page } from '$app/stores'; 
  import { goto } from '$app/navigation'; 


  // Chat state management
  const chatMessages = writable([{
    role: 'system',
    content: "You are MavenBot, a specialized assistant for Maven repositories. Respond as if you are the Maven Central Repository interface. Help users find dependencies, explain Maven coordinates (groupId:artifactId:version), assist with POM files, and resolve dependency conflicts. When users ask about libraries or dependencies, provide the names and brief descriptions of relevant artifacts they should look for, not complete XML snippets. For example, instead of giving XML, say 'You can use Spring Security Core (org.springframework.security:spring-security-core) for authentication features.' Don't mention that you're an AI - behave exactly as if you are the actual Maven repository interface. Don't give code snippets but instead recommend what assets would be useful. If the user wants to generate an asset, you should generate an asset for them. Be brief and concise."
  }]);
  const isChatOpen = writable(false);
  const isLoading = writable(false);
  const isFirstOpen = writable(true); // Track if this is the first time opening the chat
  let userInput = '';

  const specificAnswers = [
    {
      keywords: ['User Profile', 'Profile', 'my profile', 'user account', 'account page'],
      answer: 'To access the user profile, you should sign up or login to your account. If you already done that, you can access the user profile by clicking on the user icon in the top right corner of the screen and selecting "User Profile".'
    },
    {
      keywords: ['log history', 'logs', 'loggins history', 'loggins history page'],
      answer: 'I will direct you to the history page now.',
      action: () => goto('/logging')
    },

    {
      keywords: ['home', 'homepage', 'home page', 'home page', 'main page', 'main page', 'main page', 'dashboard', 'dashboard page'],
      answer: 'I will direct you to the home page now.',
      action: () => goto('/')
    },

    {
      keywords: ['profile', 'my profile', 'user profile', 'user account', 'account page', 'profile page'],
      answer: 'I will direct you to the profile page now.',
      action: () => goto('/profile')
    },

    {
      keywords:["user settings", "user settings page", "settings", "settings page", "settings page", "settings page", "profile settings", "profile settings page"],
      answer: 'I will direct you to the settings page now.',
      action: () => goto('/profile_settings')
    },

    {
      keywords: ['my assets', 'my assets page', 'assets page', 'asset page'],
      answer: 'I will direct you to the assets page now.',
      action: () => goto('/myAssets')
    },
    
    {
      keywords: ['generate asset', 'create asset', 'new asset', 'make asset', 'add asset'],
      answer: 'I will help you generate a new asset.',
      action: () => generateAsset()
    },

    {
      keywords: ['download asset', 'download the asset', 'get asset', 'get the asset', 'save asset', 'save the asset'],
      answer: 'I will download the asset for you now.',
      action: () => downloadAsset()
    }
  ]

  function checkSpecificAnswers(message) {
    const normalizedInput = message.toLowerCase();
    
    for (const topic of specificAnswers) {
      // More robust matching that checks for whole words
      if (topic.keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase();
        return normalizedInput.includes(keywordLower);
      })) {
        // Execute action if it exists
        if (topic.action) {
          setTimeout(() => {
            topic.action();
          }, 1000); // Short delay to allow user to see the message
        }
        return topic.answer;
      }
    }
    
    return null;
  }

  //  Restircted keywords
  const RESTRICTED_KEYWORDS = [
    'personal advice',
    'medical diagnosis',
    'legal advice',
    'investment advice',
    'financial advice',
    'history', 'historical', 'historic',
    'events', 'event',
    'news',
    'politics', 'political',
    'religion', 'religious',
    'philosophy',
    'psychology',
    'biology',
    'geography',
    'science',
    'art',
    'music',
    'literature',
    'dictators', 'dictator',
    'war', 'battle', 'conflict',
    'violence',
    'crime',
    'disasters', 'disaster',
    'natural disasters',
    'accidents', 'accident',
    'death',
    'murder',
    'terrorism', 'terrorist',
    'real estate',
    'property',
    'estate',
    'century', 'centuries',
    'year', 'decade', 'era', 'period',
    'ancient', 'medieval', 'modern',
    'revolution', 'movement',
    'empire', 'kingdom', 'dynasty',
    'civilization', 'culture',
    'president', 'king', 'queen', 'emperor', 'leader',
    'government', 'nation', 'country', 'state',
  ];
  
  // Date patterns that might indicate historical queries
  const DATE_PATTERNS = [
    /\b\d{4}\b/, // Years like 1945, 2001
    /\b\d{1,2}(st|nd|rd|th) century\b/i, // 19th century, 1st century
    /\b\d{1,2}00s\b/, // 1900s, 1800s, etc.
    /\bin \d{1,2}\b/, 
  ];
  
  // Common historical time period indicators
  const TIME_PERIODS = [
    'stone age', 'bronze age', 'iron age',
    'antiquity', 'middle ages', 'renaissance',
    'industrial revolution', 'world war', 'cold war',
    'prehistoric', 'pre-historic',
    'pre-modern', 'colonial', 'post-colonial',
    'ancient greece', 'ancient rome', 'ancient egypt',
  ];
  
  function isAllowedQuestion(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check against restricted keywords
    if (RESTRICTED_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    )) {
      return false;
    }
    
    // Check for date patterns that might indicate historical questions
    if (DATE_PATTERNS.some(pattern => pattern.test(lowerMessage))) {
      return false;
    }
    
    // Check for historical time periods
    if (TIME_PERIODS.some(period => 
      lowerMessage.includes(period.toLowerCase())
    )) {
      return false;
    }
    
    // Check for "who was", "what happened", etc. that often indicate historical questions
    const historicalPhrases = [
      'who was', 'what happened', 'tell me about', 'when did', 
      'why did', 'how did', 'what caused', 'what led to',
      'what is the history', 'what was the cause'
    ];
    
    if (historicalPhrases.some(phrase => lowerMessage.includes(phrase))) {
      // If these phrases are present, do an additional check for likely non-historical contexts
      const nonHistoricalIndicators = [
        'product', 'service', 'account', 'feature', 'technical', 'help',
        'support', 'how to use', 'login', 'password', 'troubleshoot'
      ];
      
      // Only allow if there's clear indication of non-historical context
      if (!nonHistoricalIndicators.some(indicator => lowerMessage.includes(indicator))) {
        return false;
      }
    }
    
    return true;
  }

  // Search stuff in Maven repo
  async function searchMavenRepository(query) {
    try {
      // Use Maven endpoint not chat endpoint
      const response = await fetch(`/api/maven?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search Maven repository');
      }
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Maven search error:', error);
      return [];
    }
  }

  // Make Maven results look pretty
  function formatMavenResults(results, query) {
    if (!results || results.length === 0) {
      return `I couldn't find any Maven dependencies matching "${query}". Please try a different search term or check your spelling.`;
    }
    
    // Show top 5 results
    const topResults = results.slice(0, 5);
    let message = `Here are some Maven dependencies matching "${query}":\n\n`;
    
    topResults.forEach(dep => {
      message += `- **${dep.artifactId}** (${dep.groupId}:${dep.artifactId}:${dep.version})\n`;
      if (dep.license && dep.license !== 'Unknown') {
        message += `  License: ${dep.license}\n`;
      }
    });
    
    if (results.length > 5) {
      message += `\nAnd ${results.length - 5} more results. You can ask for more specific information about any of these.`;
    }
    
    return message;
  }

  // Track if we're in generate mode
  let isGenerateMode = false;

  // Add a constant for the prefix text
  const GENERATE_PREFIX = "Generate asset for ";

  // Modified toggleGenerateMode function to handle non-deletable prefix
  function toggleGenerateMode() {
    isGenerateMode = !isGenerateMode;
    
    if (isGenerateMode) {
      // Pre-fill the text box
      userInput = GENERATE_PREFIX;
      // Focus on the input and position cursor at the end
      setTimeout(() => {
        const inputElement = document.querySelector('input[placeholder="Type your message..."]');
        if (inputElement) {
          inputElement.focus();
          inputElement.selectionStart = inputElement.selectionEnd = userInput.length;
        }
      }, 50);
    } else {
      // Clear the input if canceling
      userInput = "";
    }
  }

  // Function to handle keydown events and prevent deletion of prefix
  function handleInputKeydown(e) {
    if (isGenerateMode) {
      // Get current cursor position and selection
      const input = e.target;
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      
      // Prevent deleting the prefix with Backspace
      if (e.key === 'Backspace' && (selectionStart <= GENERATE_PREFIX.length || 
          (selectionStart === selectionEnd && selectionStart <= GENERATE_PREFIX.length))) {
        e.preventDefault();
        return;
      }
      
      // Prevent deleting the prefix with Delete
      if (e.key === 'Delete' && selectionStart < GENERATE_PREFIX.length) {
        e.preventDefault();
        return;
      }
      
      // Prevent cutting the prefix with keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && 
          selectionStart < GENERATE_PREFIX.length) {
        e.preventDefault();
        return;
      }
      
      // Allow Enter key to submit
      if (e.key === 'Enter') {
        sendMessage();
      }
    } else if (e.key === 'Enter') {
      sendMessage();
    }
  }

  // Function to monitor input changes and restore prefix if needed
  function handleInputChange(e) {
    if (isGenerateMode && !userInput.startsWith(GENERATE_PREFIX)) {
      userInput = GENERATE_PREFIX + userInput.replace(GENERATE_PREFIX, "");
      
      // Restore cursor position after forced prefix
      setTimeout(() => {
        const input = document.querySelector('input[placeholder="Type your message..."]');
        if (input) {
          const position = Math.max(GENERATE_PREFIX.length, input.selectionStart);
          input.selectionStart = input.selectionEnd = position;
        }
      }, 0);
    }
  }

  // Enhanced sendMessage function to handle generate mode
  async function sendMessage() {
    if (!userInput.trim()) return;
    
    // Reset generate mode if it's active
    if (isGenerateMode) {
      isGenerateMode = false;
    }
    
    // Check for specific commands first before content filtering
    const topicResponse = checkSpecificAnswers(userInput);
    if (topicResponse) {
      // Add user message to chat
      $chatMessages = [...$chatMessages.filter(msg => msg.role !== 'system'), { role: 'user', content: userInput }];
      userInput = '';
      
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: topicResponse
      }];
      $isLoading = false;
      return;
    }
    
    // Client-side check before sending
    if (!isAllowedQuestion(userInput)) {
      // Add user message to chat
      $chatMessages = [...$chatMessages.filter(msg => msg.role !== 'system'), { role: 'user', content: userInput }];
      userInput = '';
      
      // Add immediate feedback message
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: "I'm sorry, but I can only answer questions about Maven dependencies, repositories, and build configuration. Please ask something related to these topics."
      }];
      
      return;
    }

    // Look for Maven search patterns first
    const searchPatterns = [
      /find\s+(?:dependency|dependencies|library|libraries|package|packages)\s+(?:for|about|related to)?\s+([^?.,]+)/i,
      /search\s+(?:for)?\s+([^?.,]+)\s+(?:dependency|dependencies|library|libraries|package|packages)/i,
      /(?:how|where)\s+(?:can|do)\s+i\s+(?:get|find|use)\s+([^?.,]+)/i,
      /(?:recommend|suggest)\s+(?:a|some)?\s+(?:dependency|dependencies|library|libraries)\s+(?:for|about)?\s+([^?.,]+)/i
    ];
    
    let isSearchQuery = false;
    let searchTerm = '';
    
    for (const pattern of searchPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        isSearchQuery = true;
        searchTerm = match[1].trim();
        break;
      }
    }
    
    // Add user message to chat
    $chatMessages = [...$chatMessages.filter(msg => msg.role !== 'system'), { role: 'user', content: userInput }];
    const currentInput = userInput;
    userInput = '';
    $isLoading = true;

    try {
      // If it's a search query, handle it directly
      if (isSearchQuery && searchTerm) {
        const results = await searchMavenRepository(searchTerm);
        const formattedResults = formatMavenResults(results, searchTerm);
        
        $chatMessages = [...$chatMessages, { 
          role: 'assistant', 
          content: formattedResults
        }];
        $isLoading = false;
        return;
      }
      
      // Include the system message when sending to API
      const systemMessage = {
        role: 'system',
        content: "You are MavenBot, a specialized assistant for Maven repositories. Respond as if you are the Maven Central Repository interface. Help users find dependencies, explain Maven coordinates (groupId:artifactId:version), assist with POM files, and resolve dependency conflicts. When users ask about libraries or dependencies, provide the names and brief descriptions of relevant artifacts they should look for, not complete XML snippets. For example, instead of giving XML, say 'You can use Spring Security Core (org.springframework.security:spring-security-core) for authentication features.' Don't mention that you're an AI - behave exactly as if you are the actual Maven repository interface. Don't give code snippets but instead recommend what assets would be useful. Be brief and concise."
      };
      
      // Send to your server endpoint that interfaces with openai api
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [systemMessage, ...$chatMessages]
        })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      // Add AI response to chat
      $chatMessages = [...$chatMessages, { role: 'assistant', content: data.message }];
    } catch (error) {
      console.error('Error:', error);
      $chatMessages = [...$chatMessages, { 
        role: 'system', 
        content: 'Sorry, there was an error processing your request.' 
      }];
    } finally {
      $isLoading = false;
    }
  }

  const welcomeMessage = "Welcome to MavenBot! What kind of Maven dependency or asset are you looking for today?";

  function toggleChat() {
    $isChatOpen = !$isChatOpen;
    
    // If opening the chat for the first time, display the welcome message
    if ($isChatOpen && $isFirstOpen) {
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: welcomeMessage
      }];
      $isFirstOpen = false;
    }
  }

  // Function to check if we're on login or signup page

  $: isAuthPage = $page?.route?.id === '/login' || $page?.route?.id === '/signup';

  // Function to extractMavenDetailsFromChat that uses commonMavenLibraries
  function extractMavenDetailsFromChat() {
    // Get the last few user messages
    const recentMessages = $chatMessages
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content.toLowerCase());
    
    let groupId = null;
    let artifactId = null;
    let version = null;
    let license = null;
    
    // extract explicit maven coordinates first (existing patterns)
    const groupIdPattern = /group(?:Id)?[:\s]+["']?([^"'\s<>]+)["']?/i;
    const artifactIdPattern = /artifact(?:Id)?[:\s]+["']?([^"'\s<>]+)["']?/i;
    const versionPattern = /version[:\s]+["']?([^"'\s<>]+)["']?/i;
    const licensePattern = /licen[cs]e[:\s]+["']?([^"'\s<>]+)["']?/i;
    const fullCoordinatePattern = /["']?([a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9._-]+)+):([a-zA-Z0-9._-]+)(?::([a-zA-Z0-9._-]+))?["']?/;
    const xmlPattern = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*<version>([^<]+)<\/version>/i;
    
    for (const message of recentMessages) {
      // check for explicit specifications
      const groupMatch = message.match(groupIdPattern);
      const artifactMatch = message.match(artifactIdPattern);
      const versionMatch = message.match(versionPattern);
      const licenseMatch = message.match(licensePattern);
      
      if (groupMatch && !groupId) groupId = groupMatch[1];
      if (artifactMatch && !artifactId) artifactId = artifactMatch[1];
      if (versionMatch && !version) version = versionMatch[1];
      if (licenseMatch && !license) license = licenseMatch[1];
      
      // extract from full coordinate pattern
      const fullMatch = message.match(fullCoordinatePattern);
      if (fullMatch) {
        if (!groupId) groupId = fullMatch[1];
        if (!artifactId) artifactId = fullMatch[2];
        if (!version && fullMatch[3]) version = fullMatch[3];
      }
      
      // extract from xml pattern
      const xmlMatch = message.match(xmlPattern);
      if (xmlMatch) {
        if (!groupId) groupId = xmlMatch[1];
        if (!artifactId) artifactId = xmlMatch[2];
        if (!version) version = xmlMatch[3];
      }
    }
    
    // if we still don't have details, try to search Maven Central
    if (!groupId || !artifactId) {
      // Extract a search term from the conversation
      const searchTermPattern = /(?:generate|create|make|need|want)\s+(?:an?\s+)?(?:asset|dependency|library)\s+(?:for|about|using)?\s+([a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)?)/i;
      const searchMatch = recentMessages.join(' ').match(searchTermPattern);
      
      if (searchMatch && searchMatch[1]) {
        const searchTerm = searchMatch[1].trim();
        
        // message indicating we're searching Maven Central
        $chatMessages = [...$chatMessages, { 
          role: 'assistant', 
          content: `I'm searching Maven Central for "${searchTerm}"...`
        }];
        
        searchMavenRepository(searchTerm)
          .then(results => {
            if (results && results.length > 0) {
              const bestMatch = results[0]; // use the top result
              
              // update the form with the search result
              const today = new Date().toISOString().split('T')[0];
              const dependencyXml = `<dependency>
  <groupId>${bestMatch.groupId}</groupId>
  <artifactId>${bestMatch.artifactId}</artifactId>
  <version>${bestMatch.version}</version>
</dependency>`;

              const gradleDependency = `implementation '${bestMatch.groupId}:${bestMatch.artifactId}:${bestMatch.version}'`;

              const event = new CustomEvent('createMavenAsset', {
                detail: {
                  asset_id: `${bestMatch.groupId}:${bestMatch.artifactId}`,
                  name: bestMatch.artifactId,
                  version: bestMatch.version,
                  type: 'maven',
                  date_updated: today,
                  date_created: today,
                  licence_info: bestMatch.license || 'Apache 2.0',
                  usage_info: `Use this dependency in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.`,
                  maven_dependency: dependencyXml,
                  gradle_dependency: gradleDependency
                }
              });
              
              window.dispatchEvent(event);
              
              // Add a message with the search result
              $chatMessages = [...$chatMessages, { 
                role: 'assistant', 
                content: `I found a matching Maven dependency: ${bestMatch.groupId}:${bestMatch.artifactId}:${bestMatch.version}. I've filled out the form for you.`
              }];
            }
          })
          .catch(error => {
            console.error('Error searching Maven Central:', error);
          });
      }
    }
    
    // Return the details if we have at least groupId and artifactId
    if (groupId && artifactId) {
      return {
        groupId,
        artifactId,
        version: version || '1.0.0',
        license: license || 'Apache 2.0'
      };
    }
    
    return null;
  }

  // Add this function before or after the generateAsset function
  async function fetchPomFile(groupId, artifactId, version) {
    try {
      const response = await fetch(
        `/api/maven/pom?groupId=${encodeURIComponent(groupId)}&artifactId=${encodeURIComponent(artifactId)}&version=${encodeURIComponent(version)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch POM file');
      }
      
      const data = await response.json();
      return data.pomContent;
    } catch (error) {
      console.error('POM fetch error:', error);
      return null;
    }
  }

  // Convert POM content to a File object
  function createPomFile(pomContent, artifactId, version) {
    // Create a new Blob with the POM content
    const pomBlob = new Blob([pomContent], { type: 'application/xml' });
    
    // Create a File object from the Blob
    const pomFile = new File([pomBlob], `${artifactId}-${version}.pom`, { 
      type: 'application/xml',
      lastModified: new Date().getTime()
    });
    
    return pomFile;
  }

  // Updated generateAsset function with real Maven repository search
  async function generateAsset() {
    try {
      $isLoading = true;
      
      // Get the last few user messages to extract context
      const recentMessages = $chatMessages
        .filter(msg => msg.role === 'user')
        .slice(-3)
        .map(msg => msg.content);
      
      // Join messages for analysis
      const context = recentMessages.join(' ').toLowerCase();
      
      // Try to extract technology/library name
      let searchQuery = '';
      
      // Common patterns to extract dependency names
      const patterns = [
        /(?:for|about|using|with)\s+([a-z0-9\s._-]+)(?:\s+library|\s+framework|\s+dependency)?/i,
        /([a-z0-9\s._-]+)(?:\s+library|\s+framework|\s+dependency|\s+package)/i,
        /generate\s+(?:an?\s+)?asset\s+(?:for|about|using)\s+([a-z0-9\s._-]+)/i
      ];
      
      // Try to extract with patterns
      for (const pattern of patterns) {
        for (const message of recentMessages) {
          const match = message.match(pattern);
          if (match && match[1]) {
            searchQuery = match[1].trim();
            break;
          }
        }
        if (searchQuery) break;
      }
      
      // If we still don't have a query, look for specific keywords
      if (!searchQuery) {
        const keywords = ['spring', 'apache', 'google', 'aws', 'azure', 'cloud', 'mongo', 'sql', 
                          'hibernate', 'kafka', 'log4j', 'junit', 'mockito', 'lombok', 'jackson'];
        
        for (const keyword of keywords) {
          if (context.includes(keyword)) {
            searchQuery = keyword;
            break;
          }
        }
      }
      
      // If we still don't have a query, ask the user
      if (!searchQuery) {
        $chatMessages = [...$chatMessages, { 
          role: 'assistant', 
          content: 'I need more details to generate a Maven asset. Could you specify which library or framework you need?'
        }];
        $isLoading = false;
        return;
      }
      
      // Let user know we're searching
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: `Searching Maven Central for "${searchQuery}" dependencies...`
      }];
      
      // Search Maven Central
      const searchResults = await searchMavenRepository(searchQuery);
      
      if (!searchResults || searchResults.length === 0) {
        $chatMessages = [...$chatMessages, { 
          role: 'assistant', 
          content: `I couldn't find any Maven dependencies matching "${searchQuery}". Could you try a different search term?`
        }];
        $isLoading = false;
        return;
      }
      
      // Use the first result
      const bestMatch = searchResults[0];
      
      // Fetch the POM file for this artifact
      let pomFile = null;
      try {
        const pomContent = await fetchPomFile(
          bestMatch.groupId, 
          bestMatch.artifactId, 
          bestMatch.version
        );
        
        if (pomContent) {
          pomFile = createPomFile(
            pomContent, 
            bestMatch.artifactId, 
            bestMatch.version
          );
          console.log('POM file created successfully');
        }
      } catch (e) {
        console.error('Error creating POM file:', e);
      }
      
      // Prepare the asset data
      const today = new Date().toISOString().split('T')[0];
      const dependencyXml = `<dependency>
  <groupId>${bestMatch.groupId}</groupId>
  <artifactId>${bestMatch.artifactId}</artifactId>
  <version>${bestMatch.version}</version>
</dependency>`;

      const gradleDependency = `implementation '${bestMatch.groupId}:${bestMatch.artifactId}:${bestMatch.version}'`;

      const assetData = {
        asset_id: `${bestMatch.groupId}:${bestMatch.artifactId}`,
        name: bestMatch.artifactId,
        version: bestMatch.version,
        type: 'maven',
        date_updated: today,
        date_created: today,
        licence_info: bestMatch.license || 'Apache 2.0',
        usage_info: `Use this asset in your Maven or Gradle project. Copy the appropriate dependency configuration from the section below.`,
        maven_dependency: dependencyXml,
        gradle_dependency: gradleDependency,
        pomFile: pomFile
      };
      
      // Let user know we're redirecting to the Workspace page
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: `Found "${bestMatch.artifactId}" (${bestMatch.groupId}:${bestMatch.artifactId}:${bestMatch.version}). Opening the asset form in Workspace...`
      }];
      
      // Navigate to Workspace page with capital W
      goto('/Workspace');
      
      // Give the page a moment to load before dispatching the event
      setTimeout(() => {
        try {
          // Create and dispatch the event to trigger asset creation in Workspace
          const event = new CustomEvent('createMavenAsset', {
            detail: assetData
          });
          
          window.dispatchEvent(event);
          
          // Add confirmation message with updated instructions for Workspace
          setTimeout(() => {
            $chatMessages = [...$chatMessages, { 
              role: 'assistant', 
              content: `I've opened the asset form in Workspace with details for ${bestMatch.artifactId}. You should now see the form with all fields pre-filled. Please review and click 'Save' to complete the process.`
            }];
            
            // Reset context to allow for new asset generation
            resetChatContext();
            
            $isLoading = false;
          }, 1000); 
        } catch (error) {
          console.error('Error creating asset:', error);
          $chatMessages = [...$chatMessages, { 
            role: 'assistant', 
            content: 'Sorry, I encountered an error while creating the asset in Workspace. Please try again or create the asset manually in the Workspace section.'
          }];
          $isLoading = false;
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error in generateAsset:', error);
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while trying to generate the asset. Please try again later or create the asset manually in the Workspace section.'
      }];
      $isLoading = false;
    }
  }

  // NEW: Function to reset chat context after asset generation
  function resetChatContext() {
    // Keep only the most recent messages but add a system message indicating context reset
    const lastFewMessages = $chatMessages.slice(-3);
  
    // Add a system message to provide a clean break for context
    $chatMessages = [
      ...$chatMessages.filter(msg => msg.role === 'system'),
      ...lastFewMessages,
      {
        role: 'system',
        content: "Context reset for new requests"
      },
      {
        role: 'assistant',
        content: "I'm ready to help with another request. Need another asset or something else?"
      }
    ];
    
    // This helps ensure that any "memory" of the previous asset doesn't affect new generations
    if (isGenerateMode) {
      toggleGenerateMode(); // Turn off generate mode if it's on
    }
  }

  // Helper function to extract asset name from chat context
  function extractAssetNameFromChat() {
    // Get the last few user messages to look for asset name
    const recentMessages = $chatMessages
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content);
    
    // Look for patterns like "create asset called X" or "generate X asset"
    for (const message of recentMessages) {
      // Various patterns to extract asset name
      const patterns = [
        /create\s+(?:an?\s+)?asset\s+(?:called|named)\s+"?([^"]+)"?/i,
        /generate\s+(?:an?\s+)?asset\s+(?:called|named)\s+"?([^"]+)"?/i,
        /make\s+(?:an?\s+)?asset\s+(?:called|named)\s+"?([^"]+)"?/i,
        /(?:generate|create|make)\s+"?([^"]+)"?\s+asset/i,
        /(?:generate|create|make)\s+(?:an?\s+)?maven\s+dependency\s+(?:called|named|for)\s+"?([^"]+)"?/i,
        /name\s*:\s*"?([^"]+)"?/i
      ];
      
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    return null; // No specific name found
  }

  async function downloadAsset() {
    try {
      $isLoading = true;
      
      const assetInfo = extractAssetInfoFromChat();
      
      if (!assetInfo) {
        $chatMessages = [...$chatMessages, { 
          role: 'assistant', 
          content: 'I need to know which asset you want to download. Could you please specify the asset name or ID?'
        }];
        $isLoading = false;
        return;
      }
      
      // First attempt to fetch the asset to verify it exists
      try {
        const response = await fetch(`/api/assets/${assetInfo}`);
        if (!response.ok) {
          throw new Error('Asset not found');
        }
        
        // Trigger the actual download
        const downloadUrl = `/api/assets/${assetInfo}/download`;
        window.location.href = downloadUrl;
        
        // Add confirmation message
        $chatMessages = [...$chatMessages, { 
          role: 'assistant', 
          content: 'The asset download has started. If it doesn\'t begin automatically, check your browser settings.'
        }];
      } catch (error) {
        $chatMessages = [...$chatMessages, { 
          role: 'assistant', 
          content: `I couldn't find an asset with the identifier "${assetInfo}". Please check the name or ID and try again.`
        }];
      }
    } catch(error) {
      console.error('Error downloading asset:', error);
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while trying to download the asset. Please try again later.'
      }];
    } finally {
      $isLoading = false;
    }
  }

  // Helper function to extract asset ID or name from chat context
  function extractAssetInfoFromChat() {
    // Get the last few user messages to look for asset info
    const recentMessages = $chatMessages
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content);
    
    // Look for patterns like "download asset X" or "get the Y asset"
    for (const message of recentMessages) {
      // Various patterns to extract asset name or ID
      const patterns = [
        /download\s+(?:the\s+)?(?:asset\s+)?(?:called|named)?\s+"?([^"]+)"?/i,
        /get\s+(?:the\s+)?(?:asset\s+)?(?:called|named)?\s+"?([^"]+)"?/i,
        /download\s+"?([^"]+)"?/i,
        /(?:the\s+)?"?([^"]+)"?\s+asset/i,
        /asset\s+(?:with\s+)?(?:id|identifier)?\s+"?([^"]+)"?/i,
        /id\s*:\s*"?([^"]+)"?/i
      ];
      
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    return null; // No specific asset info found
  }

  // Add a reference to the chat container
  let chatContainer;
  let userHasScrolled = false;
  let lastMessageCount = 0;
  
  // Better auto-scroll logic that respects user scrolling
  $: if (chatContainer && $chatMessages.length) {
    // Auto-scroll only when new messages arrive or at initialization
    if ($chatMessages.length > lastMessageCount) {
      setTimeout(() => {
        // Check if the user is already near the bottom (within 100px)
        const isNearBottom = 
          chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop < 100;
        
        // Auto-scroll only if we're near bottom when a new message is added
        if (isNearBottom || !userHasScrolled) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        lastMessageCount = $chatMessages.length;
      }, 100);
    }
  }
  
  // Handle scroll events
  function handleScroll() {
    const isNearBottom = 
      chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop < 100;
    
    userHasScrolled = !isNearBottom;
  }
</script>


<slot />

<!-- Chat Interface - conditionally rendered -->
{#if !isAuthPage}
<div class="fixed bottom-5 right-5 z-50">
  {#if $isChatOpen}
    <div class="relative group">
      <div class="absolute -inset-2 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-lg blur-md opacity-75 group-hover:blur-md transition-all duration-1000 group-hover:duration-200"></div>
      <div class="relative w-[470px] h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div class="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h3 class="m-0 font-medium">My Chatbot</h3>
          <button 
            class="bg-transparent border-none text-white text-2xl cursor-pointer" 
            on:click={toggleChat}
          >
            ×
          </button> 
        </div>
        <div 
          class="flex-1 p-4 overflow-y-auto flex flex-col space-y-4" 
          bind:this={chatContainer}
          on:scroll={handleScroll}
        >
          {#each $chatMessages.filter(msg => msg.role !== 'system') as message}
            <div class={`p-3 rounded-2xl max-w-[90%] shadow-sm ${
              message.role === 'user' 
                ? 'self-end bg-blue-600 text-white' 
                : 'self-start bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
            in:fade={{ duration: 150 }}
            >
              <p class="m-0 break-words whitespace-normal">{message.content}</p>
            </div>
          {/each}
          {#if $isLoading}
            <div class="self-start bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-2xl max-w-[80%] opacity-70 shadow-sm"
            in:fade={{ duration: 150 }}>
              <p class="m-0">Thinking...</p>
            </div>
          {/if}
        </div>

        <div class="flex p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="p-1 flex gap-2">
            <input
              bind:value={userInput}
              placeholder="Type your message..."
              class="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              on:keydown={handleInputKeydown}
              on:input={handleInputChange}
            />
            <button 
              on:click={sendMessage} 
              class="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
            <button 
              class="bg-green-600 text-white border-none border-2 border-green-600 rounded-md px-2 py-1 cursor-pointer hover:bg-green-700 transition-colors"
              on:click={() => {
                const directMenu = document.getElementById('directMenu');
                directMenu.classList.toggle('hidden');
              }}
            >
              Direct
            </button>
            <button 
              on:click={toggleGenerateMode} 
              class={`py-1 px-3 ${isGenerateMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-${isGenerateMode ? 'red' : 'green'}-500`}
            >
              {isGenerateMode ? 'Cancel' : 'Generate'}
            </button>
          </div>
        </div> 
        
        <!-- Direct menu dropdown -->
        <div id="directMenu" class="hidden absolute bottom-[80px] right-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm z-10">
          <div class="p-1 flex flex-col space-y-1">
            <button class="text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
              on:click={() => { 
                goto('/');
                document.getElementById('directMenu').classList.add('hidden');
              }}>
              Home
            </button>
            <button class="text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
              on:click={() => { 
                goto('/profile');
                document.getElementById('directMenu').classList.add('hidden');
              }}>
              Profile
            </button>
            <button class="text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
              on:click={() => { 
                goto('/Workspace');
                document.getElementById('directMenu').classList.add('hidden');
              }}>
              Workspace
            </button>
            <button class="text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
              on:click={() => { 
                goto('/logging');
                document.getElementById('directMenu').classList.add('hidden');
              }}>
              Log History
            </button>
            <button class="text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
              on:click={() => { 
                goto('/profile_settings');
                document.getElementById('directMenu').classList.add('hidden');
              }}>
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-blue-600/50 to-pink-600/50 rounded-full blur-md opacity-75 group-hover:blur-lg transition-all duration-1000 group-hover:duration-200"></div>
      <button 
        class="relative bg-blue-600 text-white border-none rounded-full w-[60px] h-[60px] text-base cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
        on:click={toggleChat}
      >
        Chat
      </button>
    </div>
  {/if}
</div>
{/if}

