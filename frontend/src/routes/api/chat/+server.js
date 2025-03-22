import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import { searchMavenCentral } from './maven.js';

export async function POST({ request }) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return json({ error: 'Invalid request format' }, { status: 400 });
    }

    // api call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return json({ error: 'Failed to get response from AI' }, { status: 502 });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return json({ message: assistantMessage });
  } catch (error) {
    console.error('Server error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

