export function parseAIJson(raw) {
  if (!raw) return null;

  let text = typeof raw === "string" ? raw : JSON.stringify(raw);

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

