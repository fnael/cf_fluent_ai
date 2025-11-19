export class FluentState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // GET /history
    if (url.pathname === "/history" && request.method === "GET") {
      const history = (await this.state.storage.get("history")) || [];
      return Response.json({ history });
    }

    // POST /history
    if (url.pathname === "/history" && request.method === "POST") {
      const { message } = await request.json();

      const history = (await this.state.storage.get("history")) || [];
      history.push(message);

      await this.state.storage.put("history", history);
      return Response.json({ success: true, history });
    }

    // DELETE /history
    if (url.pathname === "/history" && request.method === "DELETE") {
      await this.state.storage.delete("history");
      return Response.json({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  }
}
