# DSA Expert — RAG Assistant

A full-stack RAG (Retrieval Augmented Generation) chatbot built with Next.js, Groq, Gemini Embeddings, and Pinecone.

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **LLM**: Groq (llama-3.3-70b-versatile) — fast, free
- **Embeddings**: Google Gemini (gemini-embedding-001) — 3072-dim vectors
- **Vector DB**: Pinecone — semantic search over your DSA book

## Local Development

1. Clone and install:
```bash
npm install
```

2. Create `.env.local`:
```
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=your-index-name
```

3. Run:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add all 4 environment variables in Settings → Environment Variables
4. Deploy!

## Features
- 💬 Full chat interface with message history
- 📚 Sources panel — see which book pages were used
- 🔍 Query rewriting — better retrieval for follow-up questions
- ⚡ Suggested questions to get started
- 📱 Responsive design
