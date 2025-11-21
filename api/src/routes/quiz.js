import { quizPrompt } from "../ai/quizPrompt";
import { parseAIJson } from "../ai/parseAIJson";
import { corsResponse } from "../utils/cors";
import { handleError } from "../utils/errors";

export async function handleQuizRoute(request, env, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const sessionId = parts[2];
  const action = parts[3];

  try {
    const id = env.FLUENT_STATE.idFromName(sessionId);
    const stub = env.FLUENT_STATE.get(id);

    // GET /stats
    if (action === "stats" && request.method === "GET") {
      const response = await stub.fetch("http://do/quiz-stats");
      const json = await response.json();
      return corsResponse({ success: true, stats: json.stats || { correct: 0, total: 0, streak: 0 } });
    }

    // POST /question - Generate a new question
    if (action === "question" && request.method === "POST") {
      const { language } = await request.json();

      // Get history to avoid repeating recent questions
      const historyResponse = await stub.fetch("http://do/quiz-history");
      const { history } = await historyResponse.json();

      const aiResponse = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: quizPrompt(language, history || []),
          temperature: 0.4,
          max_tokens: 500,
        }
      );

      const question = parseAIJson(aiResponse.response);
      if (!question) {
        return corsResponse({ error: "Failed to generate question" }, 500);
      }

      // Add unique ID and difficulty tracking to question
      question.id = Date.now().toString();

      // Extract difficulty from recent history if available
      const recentHistory = (history || []).slice(-20);
      const totalRecent = recentHistory.length;
      const correctRecent = recentHistory.filter(h => h.isCorrect).length;
      const accuracy = totalRecent > 0 ? (correctRecent / totalRecent) : 0;

      let streak = 0;
      for (let i = recentHistory.length - 1; i >= 0; i--) {
        if (recentHistory[i].isCorrect) streak++;
        else break;
      }

      const levels = ["beginner", "beginner-intermediate", "intermediate", "intermediate-advanced", "advanced"];
      let levelIndex = 0;
      if (accuracy > 0.55) levelIndex = 1;
      if (accuracy > 0.65 && streak >= 3) levelIndex = 2;
      if (accuracy > 0.75 && streak >= 5) levelIndex = 3;
      if (accuracy > 0.85 && streak >= 7) levelIndex = 4;

      if (recentHistory.length > 0) {
        const previousDifficulty = recentHistory[recentHistory.length - 1].difficulty || "beginner";
        const prevIndex = levels.indexOf(previousDifficulty);
        levelIndex = Math.min(levelIndex, prevIndex + 1);
      }

      question.difficulty = levels[levelIndex];

      return corsResponse({ success: true, question });
    }

    // POST /answer - Check answer and update stats
    if (action === "answer" && request.method === "POST") {
      const { language, questionText, questionId, answer, correctAnswer } = await request.json();

      // Check if answer is correct (case-insensitive, trimmed)
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Get current stats
      const statsResponse = await stub.fetch("http://do/quiz-stats");
      const { stats } = await statsResponse.json();

      const currentStats = stats || { correct: 0, total: 0, streak: 0 };

      // Update stats
      const newStats = {
        correct: currentStats.correct + (isCorrect ? 1 : 0),
        total: currentStats.total + 1,
        streak: isCorrect ? currentStats.streak + 1 : 0
      };

      await stub.fetch("http://do/quiz-stats", {
        method: "POST",
        body: JSON.stringify({ stats: newStats }),
      });

      // Get history to find the full question object
      const historyResponse = await stub.fetch("http://do/quiz-history");
      const { history } = await historyResponse.json();

      // Find the question that was just answered from recent history
      // (it should be stored from when it was generated)
      const recentQuestion = (history || [])
        .slice(-5)
        .find(h => h.questionId === questionId && !h.answered);

      const historyItem = {
        questionId,
        questionText,
        answer,
        correctAnswer,
        isCorrect,
        difficulty: recentQuestion ? recentQuestion.difficulty : "beginner",
        timestamp: Date.now(),
        answered: true
      };

      const updatedHistory = [...(history || []), historyItem].slice(-50); // Keep last 50

      await stub.fetch("http://do/quiz-history", {
        method: "POST",
        body: JSON.stringify({ history: updatedHistory }),
      });

      // Generate feedback using AI
      const feedbackResponse = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: [
            {
              role: "system",
              content: `You are a ${language} teacher providing feedback. Be encouraging and educational.`
            },
            {
              role: "user",
              content: `The student answered "${answer}" when the correct answer was "${correctAnswer}". ${isCorrect ? 'Praise them briefly.' : 'Explain the correct answer and why it matters.'} Keep it under 30 words.`
            }
          ],
          temperature: 0.7,
          max_tokens: 100,
        }
      );

      const feedback = {
        isCorrect,
        explanation: feedbackResponse.response,
        correctAnswer: isCorrect ? null : correctAnswer
      };

      return corsResponse({ success: true, feedback, stats: newStats });
    }

    // DELETE /reset
    if (action === "reset" && request.method === "DELETE") {
      await stub.fetch("http://do/quiz-stats", { method: "DELETE" });
      await stub.fetch("http://do/quiz-history", { method: "DELETE" });
      return corsResponse({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    return corsResponse(handleError(error, "Quiz error"), 500);
  }
}
