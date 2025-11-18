import { FluentState } from './FluentState';
import { handlePracticeMessage } from './practice';

export { FluentState };

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/validate-language' && request.method === 'POST') {
      try {
        const { language } = await request.json();

        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            {
              role: 'system',
              content: `You are a language validator. When given a language name, determine if it's a valid real-world language and provide the standardized name.
              
Response format (JSON only):
{
  "isValid": true/false,
  "standardName": "Properly capitalized language name",
  "suggestion": "Helpful message"
}

Examples:
Input: "spanish" → {"isValid": true, "standardName": "Spanish", "suggestion": "Spanish is ready to learn!"}
Input: "spansh" → {"isValid": false, "standardName": null, "suggestion": "Did you mean Spanish?"}
Input: "klingon" → {"isValid": false, "standardName": null, "suggestion": "Klingon is a fictional language. Try a real language like Spanish, French, or Mandarin."}
Input: "mandarin" → {"isValid": true, "standardName": "Mandarin Chinese", "suggestion": "Mandarin Chinese is ready to learn!"}`
            },
            {
              role: 'user',
              content: `Validate this language: "${language}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 200
        });

        const result = normalizeAIJson(aiResponse.response);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Validation failed',
          isValid: false,
          suggestion: 'Please try again'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname.startsWith('/api/practice/')) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      const language = pathParts[2];
      const action = pathParts[3];

      try {
        const id = env.FLUENT_STATE.idFromName(language);
        const stub = env.FLUENT_STATE.get(id);

        // POST /api/practice/language/message - Send a message
        if (action === 'message' && request.method === 'POST') {
          const { language, message } = await request.json();

          // Get current history from DO
          const historyResponse = await stub.fetch('http://do/history');
          const { history } = await historyResponse.json();

          // Add user message to history
          const userMessage = { role: 'user', content: message, timestamp: Date.now() };
          await stub.fetch('http://do/history', {
            method: 'POST',
            body: JSON.stringify({ message: userMessage })
          });

          // Get AI response
          const aiContent = await handlePracticeMessage(language, message, [...history, userMessage], env);

          // Add AI message to history
          const aiMessage = { role: 'assistant', content: aiContent, timestamp: Date.now() };
          await stub.fetch('http://do/history', {
            method: 'POST',
            body: JSON.stringify({ message: aiMessage })
          });

          return new Response(JSON.stringify({
            success: true,
            message: aiMessage
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // GET /api/practice/language/history - Get conversation history
        if (action === 'history' && request.method === 'GET') {
          const response = await stub.fetch('http://do/history');
          return new Response(await response.text(), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // POST /api/practice/language/init - Initialize session
        if (action === 'init' && request.method === 'POST') {
          const language = "English"
          const welcomeMessage = {
            role: 'assistant',
            content: `Hello! Let's practice ${language} together. Start by saying something in ${language}, and I'll help you improve! 😊`,
            timestamp: Date.now()
          };

          await stub.fetch('http://do/history', {
            method: 'POST',
            body: JSON.stringify({ message: welcomeMessage })
          });

          // Store language in DO state
          await stub.fetch('http://do/state', {
            method: 'POST',
            body: JSON.stringify({ key: 'language', value: language })
          });

          return new Response(JSON.stringify({
            success: true,
            message: welcomeMessage
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // DELETE /api/practice/language/clear - Clear session
        if (action === 'clear' && request.method === 'DELETE') {
          await stub.fetch('http://do/history', { method: 'DELETE' });
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });

      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Practice session failed',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'FluentAI API with FluentState DO!'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    function normalizeAIJson(output) {
      if (!output) return null;
      let text = typeof output === 'string' ? output : JSON.stringify(output);
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(text);
      } catch (err) {
        return null;
      }
    }

    return new Response('FluentAI API', {
      status: 404,
      headers: corsHeaders
    });
  }
};
