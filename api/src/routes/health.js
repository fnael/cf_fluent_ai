import { corsResponse } from "../utils/cors";

export function healthRoute() {
  return corsResponse({
    status: "ok",
    message: "FluentAI API with Durable Objects running",
  });
}

