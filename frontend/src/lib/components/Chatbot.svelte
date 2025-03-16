<script>
  import "../../app.css";
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly, fade } from 'svelte/transition';
  import { page } from '$app/stores';  // Import page store
  import { goto } from '$app/navigation';  // Import goto for navigation
  

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

  // Function to send message to OpenAI API
  async function sendMessage() {
    if (!userInput.trim()) return;
    
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
    
    // Add user message to chat
    $chatMessages = [...$chatMessages.filter(msg => msg.role !== 'system'), { role: 'user', content: userInput }];
    const currentInput = userInput;
    userInput = '';
    $isLoading = true;

    try {
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

  // Add this function for asset generation
  async function generateAsset() {
    try {
      $isLoading = true;
      
      const assetName = extractAssetNameFromChat();
      
      // Make API call to create asset
      const response = await fetch('/api/assets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetName || 'New Asset',
          type: 'maven',
          // Add any other properties needed for asset creation
        })
      });
      
      if (!response.ok) throw new Error('Failed to create asset');
      
      const data = await response.json();
      
      // Add confirmation message to chat
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: `I've created a new asset "${data.name}" for you. Would you like to go to your assets page to view it?`
      }];
      
      // Set up a temporary handler for "yes" response
      const yesHandler = setTimeout(() => {
        const lastUserMessage = $chatMessages.findLast(msg => msg.role === 'user')?.content.toLowerCase();
        if (lastUserMessage && (lastUserMessage.includes('yes') || lastUserMessage.includes('sure'))) {
          goto('/assets');
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error generating asset:', error);
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while trying to create the asset. Please try again later.'
      }];
    } finally {
      $isLoading = false;
    }
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
        /(?:generate|create|make)\s+"?([^"]+)"?\s+asset/i
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
      <div class="relative w-[350px] h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col overflow-hidden">
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
          <input 
            type="text" 
            bind:value={userInput} 
            placeholder="Type your message..." 
            on:keydown={(e) => e.key === 'Enter' && sendMessage()}
            class="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            on:click={sendMessage} 
            disabled={$isLoading}
            class="bg-blue-600 text-white border-none rounded px-4 py-2 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
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

