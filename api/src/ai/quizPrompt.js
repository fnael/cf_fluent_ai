export function quizPrompt(language, history) {
  const safeHistory = Array.isArray(history) ? history : [];

  const last20 = safeHistory.slice(-20);

  const avoidList = [
    ...new Set(
      last20
        .filter(h => h.isCorrect)
        .map(h => h.questionText)
        .filter(Boolean)
    )
  ];

  const failedQuestions = [
    ...new Set(
      last20
        .filter(h => !h.isCorrect)
        .map(h => h.questionText)
        .filter(Boolean)
    )
  ];

  return [
    {
      role: "system",
      content: `You are a beginner ${language} vocabulary tutor.

REQUIREMENTS:
- Output must be strictly valid JSON. No markdown, no extra text.
- Ask simple vocabulary questions for a beginner.
- The question must be in ${language}.
- The hint must be the translation of the question into English.
- Avoid repeating questions that appear in the avoid list above.
- You may ask failed questions again, but not immediately after they were last attempted.
- Question types:
   1. "multiple_choice" - 4 options, 1 correct
   2. "written" - user types a short answer (1-3 words)
- Mix translation directions: ${language} → English and English → ${language}.
- Make distractors plausible and culturally relevant.
- Use common words, greetings, colors, food, and basic verbs.

HISTORY GUIDANCE:
- Recently answered correctly (do NOT repeat immediately): ${avoidList.join(", ") || "None"}
- Recently failed questions (can repeat later): ${failedQuestions.join(", ") || "None"}

RESPONSE FORMAT:
{
  "type": "multiple_choice" | "written",
  "question": "The question text in ${language}",
  "correctAnswer": "The exact answer",
  "options": ["option1", "option2", "option3", "option4"],  // only for multiple_choice
  "hint": "The English translation of the question"
}

Generate **only one question** following these rules.`
    },
    {
      role: "user",
      content: `Generate a beginner level ${language} vocabulary question.`
    }
  ];
}
