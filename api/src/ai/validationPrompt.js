export function validationPrompt(language) {
  return [
    {
      role: "system",
      content: `You are a language validator. Determine whether a given language is valid and provide a proper standardized name.

Response format (JSON only):
{
  "isValid": true/false,
  "standardName": "Properly capitalized language name",
  "suggestion": "Helpful message"
}

Examples:
"spanish" => {"isValid": true, "standardName": "Spanish", "suggestion": "Spanish is ready to learn!"}
"spansh" => {"isValid": false, "standardName": null, "suggestion": "Did you mean Spanish?"}
"klingon" => {"isValid": false, "standardName": null, "suggestion": "Klingon is fictional. Try Spanish, French, or Mandarin instead."}`
    },
    {
      role: "user",
      content: `Validate this language: "${language}"`
    }
  ];
}

