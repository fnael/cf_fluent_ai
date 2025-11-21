import { translatePrompt, lookupPrompt } from "../ai/translationPrompts";
import { parseAIJson } from "../ai/parseAIJson";
import { corsResponse } from "../utils/cors";
import { handleError } from "../utils/errors";

export async function handleTranslateRoute(request, env, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const action = parts[1]; // translate or lookup

  try {
    const body = await request.json();

    // POST /api/translate
    if (action === "translate" && request.method === "POST") {
      const { text, sourceLanguage, targetLanguage } = body;

      if (!text || !sourceLanguage || !targetLanguage) {
        return corsResponse(
          { error: "Missing required fields: text, sourceLanguage, targetLanguage" },
          400
        );
      }

      const aiResponse = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: translatePrompt(text, sourceLanguage, targetLanguage),
          temperature: 0.3,
          max_tokens: 400,
        }
      );

      const result = parseAIJson(aiResponse.response);

      if (!result) {
        return corsResponse({ error: "Failed to parse translation" }, 500);
      }

      return corsResponse({
        success: true,
        ...result,
      });
    }

    // POST /api/lookup
    if (action === "lookup" && request.method === "POST") {
      const { description, targetLanguage } = body;

      if (!description || !targetLanguage) {
        return corsResponse(
          { error: "Missing required fields: description, targetLanguage" },
          400
        );
      }

      const aiResponse = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: lookupPrompt(description, targetLanguage),
          temperature: 0.3,
          max_tokens: 400,
        }
      );

      const result = parseAIJson(aiResponse.response);

      if (!result) {
        return corsResponse({ error: "Failed to parse lookup" }, 500);
      }

      let imageUrl = null;
      if (result.imageQuery) {
        try {
          const imagePrompt = `A simple, clear, photorealistic image of a ${result.imageQuery}, minimal background, centered object, like a dictionary illustration or icon`;
          const imageResponse = await env.AI.run(
            "@cf/stabilityai/stable-diffusion-xl-base-1.0",
            {
              prompt: imagePrompt,
              size: "512x512",
              model: "photorealistic",
            }
          );

          if (imageResponse) {
            const reader = imageResponse.getReader();
            const chunks = [];

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }

            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const imageData = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              imageData.set(chunk, offset);
              offset += chunk.length;
            }

            const base64 = btoa(
              imageData.reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
              )
            );
            imageUrl = `data:image/png;base64,${base64}`;
          }
        } catch (imageError) {
          console.error('Image generation failed:', imageError);
        }
      }

      return corsResponse({
        success: true,
        ...result,
        imageUrl,
      });
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    return corsResponse(handleError(error, "Translation error"), 500);
  }
}
