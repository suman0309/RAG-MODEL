import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Pinecone } from '@pinecone-database/pinecone'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

type Message = { role: 'user' | 'assistant'; content: string }

async function transformQuery(question: string, history: Message[]): Promise<string> {
  if (history.length === 0) return question

  const messages = [
    {
      role: 'system' as const,
      content: `You are a query rewriting expert. Based on the chat history, rephrase the user's follow-up question into a complete, standalone question. Only output the rewritten question and nothing else.`,
    },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: question },
  ]

  const res = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.2 })
  return res.choices[0].message.content ?? question
}

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] }: { question: string; history: Message[] } = await req.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Step 1: Rewrite query for better retrieval
    const rewrittenQuery = await transformQuery(question, history)

    // Step 2: Embed the query
    const embResult = await embeddingModel.embedContent(rewrittenQuery)
    const queryVector = embResult.embedding.values

    // Step 3: Search Pinecone
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!)

    const searchResults = await index.query({
      topK: 6,
      vector: queryVector,
      includeMetadata: true,
    })

    // Step 4: Build context + sources
    const sources = searchResults.matches
      .filter(m => (m.score ?? 0) > 0.4)
      .map(m => ({
        text: (m.metadata?.text as string) ?? '',
        page: (m.metadata?.page as number) ?? 0,
        score: Math.round((m.score ?? 0) * 100),
      }))

    const context = sources.map(s => s.text).join('\n\n---\n\n')

    // Step 5: Generate answer with Groq
    const messages = [
      {
        role: 'system' as const,
        content: `You are a Data Structures and Algorithms expert assistant.
Use the provided context as your primary source. If context is relevant, use it directly.
If context partially covers the question, combine it with your DSA knowledge.
Format your response clearly — use code blocks for examples, bullet points for lists.
Be concise but thorough.

Context from the DSA book:
${context || 'No specific context found — answer from general DSA knowledge.'}`,
      },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: question },
    ]

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens: 1024,
    })

    const answer = response.choices[0].message.content ?? 'No response generated.'

    return NextResponse.json({
      answer,
      sources,
      rewrittenQuery: rewrittenQuery !== question ? rewrittenQuery : null,
    })
  } catch (err: unknown) {
    console.error('RAG error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
