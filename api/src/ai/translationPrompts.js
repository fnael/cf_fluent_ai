
export function translatePrompt(text, sourceLanguage, targetLanguage) {
  return [
    {
      role: "system",
      content: `You are a translation assistant. Translate text from ${sourceLanguage} to ${targetLanguage}.

First, determine whether the user input is a **single word** or a **sentence/phrase**.

### If the input is a SINGLE WORD:
- Provide 2–3 natural synonyms IN THE TARGET LANGUAGE
- Provide 2 example sentences showing correct usage of the translated word
- Examples must be natural and practical

### If the input is a SENTENCE/PHRASE:
- Do NOT provide synonyms
- Instead, provide 2 similar example sentences (parallel meaning or structure)
- Examples must feel natural in everyday language

### Response format (JSON only):
{
  "translation": "the translated text",
  "synonyms": ["only for single words, otherwise empty"],
  "examples": [
    {"source": "example in ${sourceLanguage}", "target": "example in ${targetLanguage}"},
    {"source": "another example", "target": "another example"}
  ]
}

### Additional rules:
- Keep JSON valid, no commentary
- If no synonyms exist, return an empty array
- If user input is a sentence, synonyms must ALWAYS be an empty array
`
    },
    {
      role: "user",
      content: `Translate "${text}" from ${sourceLanguage} to ${targetLanguage}`
    }
  ];
}

export function lookupPrompt(description, targetLanguage) {
  return [
    {
      role: "system",
      content: `You are a word lookup assistant. Given a description, identify the word in ${targetLanguage}.

Response format (JSON only):
{
  "word": "the word in ${targetLanguage}",
  "translation": "word in English",
  "definition": "brief definition",
  "examples": [
    "example sentence 1 in ${targetLanguage}",
    "example sentence 2 in ${targetLanguage}"
  ],
  "imageQuery": "simple search term for finding an image (1-2 words max)"
}

Rules:
- Identify the most common/accurate word
- Keep definition under 20 words
- Provide 2 natural example sentences
- imageQuery should be simple (e.g., "pencil", "bicycle", "coffee cup")`
    },
    {
      role: "user",
      content: `What is the ${targetLanguage} word for: "${description}"?`
    }
  ];
}
