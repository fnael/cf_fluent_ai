import React, { useState, useEffect } from 'react';
import { Globe, Plus, ArrowRight, Trash2, Sparkles, AlertCircle, CheckCircle, MessageCircle, BookOpen, Brain } from 'lucide-react';
import Practice from './Practice';
import Translate from './Translate';
import Quiz from './Quiz';
import './index.css';

const API_BASE = 'http://localhost:8787';

export default function FluentAI() {
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [currentView, setCurrentView] = useState('menu');
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationType, setValidationType] = useState('');

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const result = await window.storage.get('languages');
      if (result && result.value) {
        setLanguages(JSON.parse(result.value));
      }
    } catch {
      console.log('No languages stored yet');
    } finally {
      setIsLoading(false);
    }
  };

  const saveLanguages = async (updatedLanguages) => {
    try {
      await window.storage.set('languages', JSON.stringify(updatedLanguages));
    } catch (error) {
      console.error('Failed to save languages:', error);
    }
  };

  const addLanguage = async () => {
    const trimmed = newLanguage.trim();
    if (!trimmed) return;

    if (languages.some(lang => lang.toLowerCase() === trimmed.toLowerCase())) {
      setValidationType('warning');
      setValidationMessage('This language is already in your list!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/validate-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: trimmed })
      });

      const result = await response.json();

      if (result.isValid) {
        setValidationType('success');
        setValidationMessage(result.suggestion);
        const updatedLanguages = [...languages, result.standardName];
        setLanguages(updatedLanguages);
        await saveLanguages(updatedLanguages);
        setNewLanguage('');
      } else {
        setValidationType('error');
        setValidationMessage(result.suggestion);
      }
    } catch (error) {
      console.error('Error validating language:', error);
    }
  };

  const removeLanguage = async (languageToRemove) => {
    const updatedLanguages = languages.filter(lang => lang !== languageToRemove);
    setLanguages(updatedLanguages);
    await saveLanguages(updatedLanguages);
    await fetch(`${API_BASE}/api/practice/${languageToRemove.toLowerCase()}/clear`, {
      method: 'DELETE'
    });
    await fetch(`${API_BASE}/api/quiz/${languageToRemove.toLowerCase()}/reset`, {
      method: 'DELETE'
    });

  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addLanguage();
  };

  const navigateToLanguage = (language) => {
    setSelectedLanguage(language);
    setCurrentView('language-menu');
  };

  const backToMenu = () => {
    setCurrentView('menu');
    setSelectedLanguage(null);
  };

  // Practice view
  if (currentView === 'practice') {
    return <Practice language={selectedLanguage} onBack={() => setCurrentView('language-menu')} />;
  }

  // Translate view
  if (currentView === 'translate') {
    return (
      <Translate
        language={selectedLanguage}
        onBack={() => setCurrentView('language-menu')}
      />
    );
  }

  // Quiz view
  if (currentView === 'quiz') {
    return <Quiz language={selectedLanguage} onBack={() => setCurrentView('language-menu')} />;
  }

  // Language menu (Practice, Translate, Quiz buttons)
  if (currentView === 'language-menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <button
            onClick={backToMenu}
            className="mb-6 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 transition-colors"
          >
            ← Back to Menu
          </button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {selectedLanguage}
            </h1>
            <p className="text-gray-600">Choose how you want to learn</p>
          </div>

          <div className="space-y-4">
            {/* Practice Button */}
            <button
              onClick={() => setCurrentView('practice')}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white p-6 rounded-xl transition-all hover:shadow-lg flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Practice</h3>
                  <p className="text-indigo-100 text-sm">Chat with AI in {selectedLanguage}</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>

            {/* Translate Button */}
            <button
              onClick={() => setCurrentView("translate")}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white p-6 rounded-xl transition-all hover:shadow-lg flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Translate & Lookup</h3>
                  <p className="text-indigo-100 text-sm">Translate between languages</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>

            {/* Quiz Button */}
            <button
              onClick={() => setCurrentView('quiz')}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white p-6 rounded-xl transition-all hover:shadow-lg flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Brain className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Quiz</h3>
                  <p className="text-purple-100 text-sm">Test your knowledge</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main menu view
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Globe className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">FluentAI</h1>
          </div>
          <p className="text-gray-600 text-lg">Your AI-powered language learning companion</p>
        </div>

        {/* Add Language Input */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => {
                  setNewLanguage(e.target.value);
                  setValidationMessage('');
                  setValidationType('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Add a new language"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="h-12 mt-2">
                {validationMessage && (
                  <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 border ${validationType === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : validationType === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-orange-50 border-orange-200 text-orange-800'
                    }`}>
                    {validationType === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{validationMessage}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={addLanguage}
              disabled={!newLanguage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-lg font-medium leading-none flex items-center gap-1 self-start"
            >
              <Plus className="w-6 h-6" />
              Add
            </button>
          </div>
        </div>

        {/* Languages List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Loading your languages...</p>
          </div>
        ) : languages.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No languages yet</h3>
            <p className="text-gray-500">Add a language above to get started!</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Languages</h2>
            <div className="space-y-3">
              {languages.map((language, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow border border-indigo-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {language.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-lg font-medium text-gray-800">{language}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeLanguage(language)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove language"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigateToLanguage(language)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      Learn
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" />
            Talk, translate, and quiz your way to fluency
          </p>
        </div>
      </div>
    </div>
  );
}
