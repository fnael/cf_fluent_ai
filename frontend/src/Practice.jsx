import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageCircle, Loader, Trash2 } from 'lucide-react';

const API_BASE = 'https://fluentai-api.fnael-salgado.workers.dev';

export default function Practice({ language, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSession();
  }, [language]);

  const loadSession = async () => {
    try {
      const newSessionId = `${language.toLowerCase()}`;
      setSessionId(newSessionId);

      // First, try to get existing history
      const response = await fetch(`${API_BASE}/api/practice/${newSessionId}/history`, {
        method: 'GET',
      });

      const data = await response.json();

      // If history exists and has messages, use it
      if (data.history && data.history.length > 0) {
        setMessages(data.history);
      } else {
        // No history exists, initialize with welcome message
        await initializeNewSession(newSessionId);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setMessages([{
        role: 'assistant',
        content: `Hello! Let's practice ${language} together. Start by saying something in ${language}, and I'll help you improve! 😊`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeNewSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/api/practice/${sessionId}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });

      const data = await response.json();

      if (data.success) {
        setMessages([data.message]);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isSending || !sessionId) return;

    const userMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE}/api/practice/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          message: trimmedInput
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check if the API is running! 🔌',
        timestamp: Date.now()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const clearSession = async () => {
    if (!sessionId || !confirm('Are you sure you want to clear this conversation?')) return;

    try {
      await fetch(`${API_BASE}/api/practice/${sessionId}/clear`, {
        method: 'DELETE'
      });

      await initializeNewSession(sessionId);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading practice session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={clearSession}
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Practice {language}</h1>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-4 rounded-2xl ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message in ${language}...`}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
