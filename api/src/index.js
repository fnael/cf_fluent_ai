export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

        const result = normalizeAIJson(aiResponse.response)
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Validation error:', error);
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

    function normalizeAIJson(output) {
      if (!output) return null;

      let text = typeof output === 'string' ? output : JSON.stringify(output);

      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(text);
      } catch (err) {
        console.error("JSON parse failed. Raw:", text);
        return null;
      }
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', message: 'FluentAI API is running!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('FluentAI API - Use /api/validate-language', {
      status: 404,
      headers: corsHeaders
    });
  }
};



