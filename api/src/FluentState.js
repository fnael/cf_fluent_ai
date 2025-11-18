export class FluentState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // GET /history - Retrieve conversation history
      if (url.pathname === '/history' && request.method === 'GET') {
        const history = await this.state.storage.get('history') || [];
        return new Response(JSON.stringify({ history }), { headers: corsHeaders });
      }

      // POST /history - Add message to history
      if (url.pathname === '/history' && request.method === 'POST') {
        const { message } = await request.json();

        let history = await this.state.storage.get('history') || [];
        history.push(message);

        await this.state.storage.put('history', history);

        return new Response(JSON.stringify({ success: true, history }), { headers: corsHeaders });
      }

      // DELETE /history - Clear all history
      if (url.pathname === '/history' && request.method === 'DELETE') {
        await this.state.storage.delete('history');
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // GET /state - Get arbitrary state value
      if (url.pathname === '/state' && request.method === 'GET') {
        const key = url.searchParams.get('key');
        const value = await this.state.storage.get(key);
        return new Response(JSON.stringify({ key, value }), { headers: corsHeaders });
      }

      // POST /state - Set arbitrary state value
      if (url.pathname === '/state' && request.method === 'POST') {
        const { key, value } = await request.json();
        await this.state.storage.put(key, value);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
}
