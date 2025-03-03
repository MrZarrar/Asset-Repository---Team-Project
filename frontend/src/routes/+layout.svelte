<script>
  import "../app.css";
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly, fade } from 'svelte/transition';
  

  // Chat state management
  const chatMessages = writable([{
    role: 'system',
    content: "You are MavenBot, a specialized assistant for Maven repositories. Respond as if you are the Maven Central Repository interface. Help users find dependencies, explain Maven coordinates (groupId:artifactId:version), assist with POM files, and resolve dependency conflicts. Format all dependency snippets as proper XML. Always provide the latest stable versions when asked about libraries. For dependency requests, respond with properly formatted Maven XML snippets that can be directly copied into pom.xml files. Don't mention that you're an AI - behave exactly as if you are the actual Maven repository interface. Be brief and concise."
  }]);
  const isChatOpen = writable(false);
  const isLoading = writable(false);
  let userInput = '';

  const specificAnswers = [
    {
      keywords: ['User Profile', 'Profile', 'my profile', 'user account', 'account page'],
      answer: 'To access the user profile, you should sign up or login to your account. If you already done that, you can access the user profile by clicking on the user icon in the top right corner of the screen and selecting "User Profile".'
    },
  ]

  function checkSpecificAnswers(message) {
    const normalizedInput = message.toLowerCase();
    
    for (const topic of specificAnswers) {
      // More robust matching that checks for whole words
      if (topic.keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase();
        return normalizedInput.includes(keywordLower);
      })) {
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

    const topicResponse = checkSpecificAnswers(currentInput);
    if (topicResponse) {
      $chatMessages = [...$chatMessages, { 
        role: 'assistant', 
        content: topicResponse
      }];
      $isLoading = false;
      return;
    }
    
    try {
      // Include the system message when sending to API
      const systemMessage = {
        role: 'system',
        content: "You are MavenBot, a specialized assistant for Maven repositories. Respond as if you are the Maven Central Repository interface. Help users find dependencies, explain Maven coordinates (groupId:artifactId:version), assist with POM files, and resolve dependency conflicts. Format all dependency snippets as proper XML. Always provide the latest stable versions when asked about libraries. For dependency requests, respond with properly formatted Maven XML snippets that can be directly copied into pom.xml files. Don't mention that you're an AI - behave exactly as if you are the actual Maven repository interface. Be brief and concise."
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

  function toggleChat() {
    $isChatOpen = !$isChatOpen;
  }
</script>


<slot />

<!-- Chat Interface -->
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
        <div class="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          {#each $chatMessages.filter(msg => msg.role !== 'system') as message}
            <div class={`p-3 rounded-2xl max-w-[80%] ${
              message.role === 'user' 
                ? 'self-end bg-blue-600 text-white' 
                : 'self-start bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              <p class="m-0">{message.content}</p>
            </div>
          {/each}
          {#if $isLoading}
            <div class="self-start bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-2xl max-w-[80%] opacity-70">
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
