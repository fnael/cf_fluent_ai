import React, { useState } from 'react';
import { ArrowLeft, Search, Loader, Languages, ArrowLeftRight } from 'lucide-react';

const API_BASE = 'https://fluentai-api.fnael-salgado.workers.dev';

export default function Translate({ language, onBack }) {
  // Translation state
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationDetails, setTranslationDetails] = useState(null);

  const [isLanguageToEnglish, setIsLanguageToEnglish] = useState(true);

  // Lookup state
  const [lookupInput, setLookupInput] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const swapLanguages = () => {
    setIsLanguageToEnglish(!isLanguageToEnglish);
    // Swap the text in the boxes
    setInputText(outputText);
    setOutputText(inputText);
    setTranslationDetails(null);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    const sourceLanguage = isLanguageToEnglish ? language : "English";
    const targetLanguage = isLanguageToEnglish ? "English" : language;

    setIsTranslating(true);
    setTranslationDetails(null);

    try {
      const response = await fetch(`${API_BASE}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          sourceLanguage,
          targetLanguage
        })
      });

      const data = await response.json();

      if (data.success) {
        setOutputText(data.translation);

        const formattedSynonyms = (data.synonyms || []).map(syn => syn);

        setTranslationDetails({
          synonyms: formattedSynonyms,
          examples: data.examples || []
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupInput.trim()) return;

    setIsLookingUp(true);
    setLookupResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: lookupInput.trim(),
          targetLanguage: language
        })
      });

      const data = await response.json();
      if (data.success) {
        setLookupResult(data);
      }
    } catch (error) {
      console.error('Lookup error:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleLookupKeyPress = (e) => {
    if (e.key === 'Enter') handleLookup();
  };

  const leftLanguage = isLanguageToEnglish ? language : "English";
  const rightLanguage = isLanguageToEnglish ? "English" : language;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-white hover:text-indigo-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {language}
        </button>

        {/* Translation Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Languages className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Translate</h1>
          </div>

          {/* Translation Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* LEFT: Input box */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{leftLanguage}</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type in ${leftLanguage}...`}
                className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* RIGHT: Outox (read-only) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{rightLanguage}</span>
              </div>
              <textarea
                value={outputText}
                readOnly
                placeholder="Translation will appear here..."
                className="w-full h-40 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 resize-none cursor-default"
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-center items-center gap-3 mb-4">
            <button
              onClick={swapLanguages}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-lg transition-colors flex items-center gap-2"
              title="Swap languages"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isTranslating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                "Translate"
              )}
            </button>
          </div>

          {/* Translation Details */}
          {translationDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">

              {/* Synonyms (only in target language) */}
              {translationDetails.synonyms.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Synonyms in {rightLanguage}</h3>
                  <div className="flex flex-wrap gap-2">
                    {translationDetails.synonyms.map((syn, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-200"
                      >
                        <p className="text-gray-800 font-medium text-sm">{syn}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Sentences */}
              {translationDetails.examples.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Examples</h3>
                  <div className="space-y-2">
                    {translationDetails.examples.map((ex, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-gray-800 font-medium text-sm">{ex.source}</p>
                        <p className="text-gray-600 text-sm mt-1">→ {ex.target}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lookup Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Lookup</h1>
          </div>

          <p className="text-gray-600 mb-4">
            Describe something and find the word in {language}
          </p>

          {/* Lookup Input */}
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              onKeyPress={handleLookupKeyPress}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isLookingUp}
            />
            <button
              onClick={handleLookup}
              disabled={!lookupInput.trim() || isLookingUp}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLookingUp ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Lookup
            </button>
          </div>

          {/* Lookup Result */}
          {lookupResult && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Text Info */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      Word in {language}
                    </h3>
                    <p className="text-4xl font-bold text-gray-800">{lookupResult.word}</p>
                    <p className="text-xl text-gray-600 mt-1">{lookupResult.translation}</p>
                  </div>

                  {lookupResult.definition && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        Definition
                      </h3>
                      <p className="text-gray-700">{lookupResult.definition}</p>
                    </div>
                  )}

                  {lookupResult.examples?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        Example Sentences
                      </h3>
                      <div className="space-y-2">
                        {lookupResult.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 border border-gray-200"
                          >
                            <p className="text-gray-800 text-sm">{ex}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Image */}
                {lookupResult.imageUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Visual Reference</h3>
                    <img
                      src={lookupResult.imageUrl}
                      alt={lookupResult.word}
                      className="w-full h-full min-h-[300px] object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
