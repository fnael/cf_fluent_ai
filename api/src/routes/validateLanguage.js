import { validationPrompt } from "../ai/validationPrompt";
import { parseAIJson } from "../ai/parseAIJson";
import { corsResponse } from "../utils/cors";
import { handleError } from "../utils/errors";

export async function validateLanguageRoute(request, env) {
  try {
    const { language } = await request.json();

    const aiResponse = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: validationPrompt(language),
        temperature: 0.1,
        max_tokens: 200,
      }
    );

    const result = parseAIJson(aiResponse.response);

    return corsResponse(result);
  } catch (error) {
    return corsResponse(handleError(error, "Validation failed"), 500);
  }
}

