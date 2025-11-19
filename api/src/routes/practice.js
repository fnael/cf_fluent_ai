import { practicePrompt } from "../ai/practicePrompt";
import { corsResponse } from "../utils/cors";
import { handleError } from "../utils/errors";

export async function handlePracticeRoute(request, env, url) {
  const parts = url.pathname.split("/").filter(Boolean);

  const language = parts[2];
  const action = parts[3];

  try {
    const id = env.FLUENT_STATE.idFromName(language);
    const stub = env.FLUENT_STATE.get(id);

    // POST /message
    if (action === "message" && request.method === "POST") {
      const { message } = await request.json();

      const historyResponse = await stub.fetch("http://do/history");
      const { history } = await historyResponse.json();

      const userMessage = {
        role: "user",
        content: message,
        timestamp: Date.now(),
      };

      await stub.fetch("http://do/history", {
        method: "POST",
        body: JSON.stringify({ message: userMessage }),
      });

      const aiResponse = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: practicePrompt(language, [...history, userMessage], message),
          temperature: 0.7,
          max_tokens: 300,
        }
      );

      const aiMessage = {
        role: "assistant",
        content: aiResponse.response,
        timestamp: Date.now(),
      };

      await stub.fetch("http://do/history", {
        method: "POST",
        body: JSON.stringify({ message: aiMessage }),
      });

      return corsResponse({ success: true, message: aiMessage });
    }

    // GET /history
    if (action === "history" && request.method === "GET") {
      const response = await stub.fetch("http://do/history");
      const json = await response.json();
      return corsResponse(json);
    }

    // POST /init
    if (action === "init" && request.method === "POST") {
      const welcomeMessage = {
        role: "assistant",
        content: `Hello! Let's practice ${language}! Say something in ${language}. 😊`,
        timestamp: Date.now(),
      };

      await stub.fetch("http://do/history", {
        method: "POST",
        body: JSON.stringify({ message: welcomeMessage }),
      });

      await stub.fetch("http://do/state", {
        method: "POST",
        body: JSON.stringify({ key: "language", value: language }),
      });

      return corsResponse({ success: true, message: welcomeMessage });
    }

    // DELETE /clear
    if (action === "clear" && request.method === "DELETE") {
      await stub.fetch("http://do/history", { method: "DELETE" });
      return corsResponse({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    return corsResponse(handleError(error, "Practice session error"), 500);
  }
}
