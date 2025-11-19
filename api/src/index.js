import { CORS_HEADERS } from "./utils/cors";
import { validateLanguageRoute } from "./routes/validateLanguage";
import { handlePracticeRoute } from "./routes/practice";
import { healthRoute } from "./routes/health";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/validate-language" && request.method === "POST")
      return validateLanguageRoute(request, env);

    if (url.pathname.startsWith("/api/practice/"))
      return handlePracticeRoute(request, env, url);

    if (url.pathname === "/api/health")
      return healthRoute();

    return new Response("Not Found", { status: 404 });
  },
};

export { FluentState } from "./durable/FluentState";
