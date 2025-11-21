# FluentAI - AI-Powered Language Learning Platform

An interactive language learning application powered by Cloudflare's AI stack, featuring conversational practice, real-time translation, and adaptive quizzes.

## 🎯 Project Overview

FluentAI was built as part of a Cloudflare internship application, demonstrating:
- ✅ **LLM Integration**: Llama 3.3 70B via Workers AI
- ✅ **State Coordination**: Durable Objects for persistent sessions
- ✅ **User Interaction**: Chat, voice-ready interfaces
- ✅ **Memory & State**: Conversation history, quiz progress tracking

## 🌟 Features

### 1️⃣ **Practice Mode** 
Chat with an AI tutor in your target language. Get real-time corrections and conversational feedback.

- Persistent conversation history via Durable Objects
- Grammar and vocabulary corrections
- Natural language interactions

### 2️⃣ **Translate & Lookup**
Google Translate-style interface with enhanced learning features.

- **Translate**: Bidirectional translation with synonyms and example sentences
- **Lookup**: Describe objects to find words, with visual references from Unsplash

### 3️⃣ **Adaptive Quiz**
Test your knowledge with AI-generated questions that adapt to your skill level.

- Dynamic difficulty based on performance
- Multiple choice and written answer formats
- Questions in target language with English hints for beginners
- Anti-repetition algorithm (tracks last 30 answers)
- Persistent progress tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  • Vite + React 18 + Tailwind CSS                   │
│  • Claude.ai Persistent Storage API                 │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────┐
│            Cloudflare Worker (Router)               │
│  • Routes: /validate, /practice, /translate, /quiz │
└──────┬──────────────────────────────────────┬───────┘
       │                                      │
       ▼                                      ▼
┌─────────────────┐                  ┌──────────────────┐
│  Workers AI     │                  │ Durable Objects  │
│  (Llama 3.3)    │                  │  (FluentState)   │
│                 │                  │                  │
│ • Translation   │                  │ • Chat history   │
│ • Validation    │                  │ • Quiz progress  │
│ • Quiz Gen      │                  │ • User stats     │
│ • Corrections   │                  │                  │
└─────────────────┘                  └──────────────────┘
```

## 📁 Project Structure

```
cf_fluent_ai/
├── api/                          # Cloudflare Worker backend
│   ├── src/
│   │   ├── ai/                   # AI prompts & utilities
│   │   │   ├── parseAIJson.js
│   │   │   ├── practicePrompt.js
│   │   │   ├── quizPrompt.js
│   │   │   ├── translationPrompts.js
│   │   │   └── validationPrompt.js
│   │   ├── durable/
│   │   │   └── FluentState.js    # Durable Object class
│   │   ├── routes/               # API endpoints
│   │   │   ├── health.js
│   │   │   ├── practice.js
│   │   │   ├── quiz.js
│   │   │   ├── translate.js
│   │   │   └── validateLanguage.js
│   │   ├── utils/
│   │   │   ├── cors.js
│   │   │   └── errors.js
│   │   └── index.js              # Main worker entry
│   ├── wrangler.toml             # Cloudflare configuration
│   └── package.json
├── frontend/                      # React frontend
│   ├── src/
│   │   ├── App.jsx               # Main app component
│   │   ├── Practice.jsx          # Chat interface
│   │   ├── Translate.jsx         # Translation UI
│   │   ├── Quiz.jsx              # Quiz interface
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
├── README.md
└── PROMPTS.md                     # AI-assisted development prompts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/cf_ai_fluentai.git
cd cf_ai_fluentai
```

### 2. Backend Setup

```bash
cd api
npm install

# Login to Cloudflare
wrangler login

# Run locally
npm run dev
```

The API will start on `http://localhost:8787`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install

# Run development server
npm run dev
```

The app will open at `http://localhost:5173`

## 🌐 Deployment

### Deploy Backend to Cloudflare

```bash
cd api
wrangler deploy
```

Note the deployed URL (e.g., `https://fluentai-api.yourname.workers.dev`)

### Deploy Frontend

```bash
cd frontend

# Update API_BASE in src/App.jsx, Practice.jsx, Translate.jsx, Quiz.jsx
# Change from 'API_BASE' to your Worker URL

npm run build

# Deploy to Cloudflare Pages
npm run build
wrangler pages deploy dist --project-name cf-fluent-ai-frontend --branch main
```

## 🎮 Usage

### Adding a Language

1. Type a language name (e.g., "Spanish", "French", "Japanese")
2. AI validates and standardizes the name
3. Language appears in your list

### Practice Mode

1. Click "Practice" for your language
2. Start chatting in the target language
3. AI corrects mistakes and continues conversation
4. History persists via Durable Objects

### Translate & Lookup

**Translate**: Type in either box for instant bidirectional translation with synonyms and examples

**Lookup**: Describe an object (e.g., "thing you write with") to find the word in your target language with an image

### Quiz

1. Click "Quiz" to start
2. Answer questions in the target language
3. Difficulty adapts based on your accuracy
4. Progress tracked across sessions

```
