import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader, CheckCircle, XCircle, Trophy, BarChart3 } from 'lucide-react';

const API_BASE = 'http://localhost:8787';

export default function Quiz({ language, onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 });
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    initializeQuiz();
  }, [language]);

  // Pre-load next question when feedback is shown
  useEffect(() => {
    if (feedback && !nextQuestion && sessionId) {
      preloadNextQuestion();
    }
  }, [feedback, nextQuestion, sessionId]);

  const initializeQuiz = async () => {
    try {
      const newSessionId = `quiz_${language.toLowerCase()}`;
      setSessionId(newSessionId);

      // Load stats
      const statsResponse = await fetch(`${API_BASE}/api/quiz/${newSessionId}/stats`);
      const statsData = await statsResponse.json();

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }

      // Check if there's a saved current question
      const savedState = localStorage.getItem(`quiz_state_${language}`);
      if (savedState) {
        const state = JSON.parse(savedState);
        setCurrentQuestion(state.currentQuestion);
        setFeedback(state.feedback);
        setUserAnswer(state.userAnswer || '');
        setSelectedOption(state.selectedOption || null);
        setIsLoading(false);
        return;
      }

      // Get first question
      await getNextQuestion(newSessionId);
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextQuestion = async (sessId = sessionId) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/quiz/${sessId}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentQuestion(data.question);
        setFeedback(null);
        setUserAnswer('');
        setSelectedOption(null);
        setNextQuestion(null);

        // Save state to localStorage
        saveQuizState(data.question, null);
      }
    } catch (error) {
      console.error('Failed to get question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadNextQuestion = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE}/api/quiz/${sessionId}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });

      const data = await response.json();

      if (data.success) {
        setNextQuestion(data.question);
      }
    } catch (error) {
      console.error('Failed to preload question:', error);
    }
  };

  const saveQuizState = (question, feedbackData) => {
    const state = {
      currentQuestion: question,
      feedback: feedbackData,
      userAnswer: userAnswer,
      selectedOption: selectedOption
    };
    localStorage.setItem(`quiz_state_${language}`, JSON.stringify(state));
  };

  const submitAnswer = async () => {
    if (isSubmitting) return;

    const answer = currentQuestion.type === 'multiple_choice'
      ? selectedOption
      : userAnswer.trim();

    if (!answer) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/quiz/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          questionId: currentQuestion.id,
          questionText: currentQuestion.question,
          answer,
          correctAnswer: currentQuestion.correctAnswer,
          difficulty: currentQuestion.difficulty
        })
      });

      const data = await response.json();

      if (data.success) {
        setFeedback(data.feedback);
        setStats(data.stats);

        // Save state with feedback
        saveQuizState(currentQuestion, data.feedback);
      }

    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentQuestion?.type === 'written' && !feedback) {
      submitAnswer();
    }
  };

  const goToNextQuestion = async () => {
    // Use preloaded question if available
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setNextQuestion(null);
      setFeedback(null);
      setUserAnswer('');
      setSelectedOption(null);

      // Save new state
      saveQuizState(nextQuestion, null);
      return;
    }

    // Otherwise fetch new question
    await getNextQuestion();
  };

  const resetQuiz = async () => {
    if (!confirm('Reset your quiz progress? This will clear your history.')) return;

    try {
      await fetch(`${API_BASE}/api/quiz/${sessionId}/reset`, {
        method: 'DELETE'
      });

      setStats({ correct: 0, total: 0, streak: 0 });
      localStorage.removeItem(`quiz_state_${language}`);
      await getNextQuestion();
    } catch (error) {
      console.error('Failed to reset quiz:', error);
    }
  };

  const handleBack = () => {
    // State is already saved, just go back
    onBack();
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-white hover:text-indigo-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {language}
        </button>

        {/* Stats Bar */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-xl font-bold text-gray-800">
                    {stats.correct}/{stats.total}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-xl font-bold text-gray-800">
                    {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl">🔥</div>
                <div>
                  <p className="text-sm text-gray-600">Streak</p>
                  <p className="text-xl font-bold text-gray-800">{stats.streak}</p>
                </div>
              </div>
            </div>
            <button
              onClick={resetQuiz}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Reset Progress
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {currentQuestion && (
            <>
              <div className="mb-8">
                <div className="text-sm text-indigo-600 font-medium mb-2">
                  {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Quick Answer'}
                  {currentQuestion.difficulty && (
                    <span className="ml-2 text-gray-500">
                      • {currentQuestion.difficulty.replace('-', ' ')}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.hint && (
                  <p className="text-gray-600 italic">Hint: {currentQuestion.hint}</p>
                )}
              </div>

              {/* Multiple Choice Options */}
              {currentQuestion.type === 'multiple_choice' && !feedback && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(option)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedOption === option
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-lg">{option}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Written Answer */}
              {currentQuestion.type === 'written' && !feedback && (
                <div className="mb-6">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer..."
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className={`mb-6 p-6 rounded-xl border-2 ${feedback.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
                  }`}>
                  <div className="flex items-start gap-3 mb-3">
                    {feedback.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-lg font-bold mb-1 ${feedback.isCorrect ? 'text-green-800' : 'text-red-800'
                        }`}>
                        {feedback.isCorrect ? 'Correct!' : 'Not quite right'}
                      </p>
                      <p className="text-gray-700">{feedback.explanation}</p>
                      {!feedback.isCorrect && feedback.correctAnswer && (
                        <p className="mt-2 text-gray-800">
                          <span className="font-semibold">Correct answer:</span> {feedback.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-end gap-3">
                {!feedback ? (
                  <button
                    onClick={submitAnswer}
                    disabled={
                      isSubmitting ||
                      (currentQuestion.type === 'multiple_choice' && !selectedOption) ||
                      (currentQuestion.type === 'written' && !userAnswer.trim())
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goToNextQuestion}
                    disabled={!nextQuestion && isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    {!nextQuestion && isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Next Question →'
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
