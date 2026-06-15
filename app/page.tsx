'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, BookOpen, Clock, Cpu, ChevronRight, X, Zap, Hash } from 'lucide-react'

type Source = { text: string; page: number; score: number }
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  rewrittenQuery?: string | null
  timestamp: Date
}

const SUGGESTED = [
  'What is a binary search tree?',
  'Explain quicksort with an example',
  'What is dynamic programming?',
  'How does a hash map work?',
  'What is the difference between BFS and DFS?',
  'Explain time complexity of merge sort',
]

function formatContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).split('\n')
      const lang = lines[0]
      const code = lines.slice(1).join('\n')
      return (
        <div key={i} className="my-3">
          <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e2d45] rounded-t-lg px-3 py-1.5">
            <Hash size={12} className="text-[#64748b]" />
            <span className="text-xs text-[#64748b] font-mono">{lang || 'code'}</span>
          </div>
          <pre className="bg-[#0a0e1a] border border-t-0 border-[#1e2d45] rounded-b-lg p-4 overflow-x-auto">
            <code className="text-[#a5f3fc] font-mono text-sm leading-relaxed">{code}</code>
          </pre>
        </div>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-[#1a2236] border border-[#1e2d45] rounded px-1.5 py-0.5 text-[#60a5fa] font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return (
      <span key={i} dangerouslySetInnerHTML={{
        __html: part
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#93c5fd] font-semibold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^### (.*$)/gm, '<h3 class="text-[#e2e8f0] font-semibold text-base mt-4 mb-2">$1</h3>')
          .replace(/^## (.*$)/gm, '<h2 class="text-[#e2e8f0] font-semibold text-lg mt-4 mb-2">$1</h2>')
          .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-[#cbd5e1]">$1</li>')
          .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-[#cbd5e1]">$1</li>')
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/\n/g, '<br/>')
      }} />
    )
  })
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Source[] | null>(null)
  const [activeMsg, setActiveMsg] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (q?: string) => {
    const question = (q ?? input).trim()
    if (!question || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.error ? `Error: ${data.error}` : data.answer,
        sources: data.sources,
        rewrittenQuery: data.rewrittenQuery,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Network error. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const showSources = (msg: Message) => {
    if (msg.sources?.length) {
      setSelectedSource(msg.sources)
      setActiveMsg(msg.id)
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">

      {/* LEFT SIDEBAR — History */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#1e2d45] bg-[#0d1424]">
        <div className="p-4 border-b border-[#1e2d45]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Cpu size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e2e8f0]">DSA Expert</p>
              <p className="text-[10px] text-[#64748b]">RAG · Groq · Pinecone</p>
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-[#1e2d45]">
          <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-2 px-1">Try asking</p>
          <div className="space-y-1">
            {SUGGESTED.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="w-full text-left text-xs text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2236] rounded-lg px-2 py-1.5 transition-colors truncate"
              >
                <ChevronRight size={10} className="inline mr-1 opacity-50" />
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {messages.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-2 px-1 flex items-center gap-1">
                <Clock size={9} /> History
              </p>
              <div className="space-y-1">
                {messages.filter(m => m.role === 'user').map(m => (
                  <div key={m.id} className="text-xs text-[#64748b] px-2 py-1.5 rounded-lg hover:bg-[#1a2236] truncate cursor-default">
                    {m.content}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-3 border-t border-[#1e2d45]">
          <div className="text-[10px] text-[#334155] text-center">
            Built with Next.js · Groq · Gemini · Pinecone
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d45] bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-sm font-semibold text-[#e2e8f0]">DSA Expert Assistant</span>
            <span className="text-[10px] text-[#64748b] bg-[#1a2236] border border-[#1e2d45] rounded-full px-2 py-0.5">
              llama-3.3-70b
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#64748b]">
            <BookOpen size={14} />
            <span className="text-xs">710 vectors indexed</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                <Cpu size={28} className="text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#e2e8f0] mb-2">DSA Expert</h1>
                <p className="text-[#64748b] text-sm max-w-sm">
                  Ask anything about Data Structures and Algorithms. Answers are grounded in your DSA book.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {SUGGESTED.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="text-xs text-left text-[#94a3b8] bg-[#111827] hover:bg-[#1a2236] border border-[#1e2d45] hover:border-[#2d4a6b] rounded-xl p-3 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cpu size={13} className="text-white" />
                  </div>
                )}

                <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.rewrittenQuery && (
                    <div className="text-[10px] text-[#64748b] flex items-center gap-1">
                      <Zap size={9} className="text-amber-500" />
                      Searched: <span className="text-[#94a3b8] italic">{msg.rewrittenQuery}</span>
                    </div>
                  )}

                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-[#111827] border border-[#1e2d45] text-[#cbd5e1] rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose-dsa">{formatContent(msg.content)}</div>
                    ) : msg.content}
                  </div>

                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <button
                      onClick={() => showSources(msg)}
                      className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                        activeMsg === msg.id
                          ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                          : 'border-[#1e2d45] text-[#64748b] hover:border-[#2d4a6b] hover:text-[#94a3b8]'
                      }`}
                    >
                      <BookOpen size={9} />
                      {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''} from book
                    </button>
                  )}

                  <span className="text-[10px] text-[#334155]">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#1a2236] border border-[#1e2d45] flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-[#64748b] font-semibold">
                    U
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Cpu size={13} className="text-white" />
              </div>
              <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#1e2d45] bg-[#0d1424]">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about arrays, trees, graphs, sorting, DP..."
                rows={1}
                className="w-full bg-[#111827] border border-[#1e2d45] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#334155] resize-none outline-none transition-all"
                style={{ maxHeight: '120px' }}
                onInput={e => {
                  const el = e.target as HTMLTextAreaElement
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
          <p className="text-[10px] text-[#334155] text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — Sources */}
      {selectedSource && (
        <aside className="w-80 border-l border-[#1e2d45] bg-[#0d1424] flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-[#1e2d45]">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-blue-400" />
              <span className="text-sm font-semibold text-[#e2e8f0]">Sources</span>
              <span className="text-[10px] text-[#64748b] bg-[#1a2236] rounded-full px-1.5 py-0.5">
                {selectedSource.length}
              </span>
            </div>
            <button
              onClick={() => { setSelectedSource(null); setActiveMsg(null) }}
              className="text-[#64748b] hover:text-[#e2e8f0] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {selectedSource.map((src, i) => (
              <div key={i} className="bg-[#111827] border border-[#1e2d45] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#64748b]">
                    Page {src.page + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <div
                      className="h-1 rounded-full bg-blue-500/30 w-16 overflow-hidden"
                    >
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${src.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#64748b] font-mono">{src.score}%</span>
                  </div>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-6">
                  {src.text}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#1e2d45] text-[10px] text-[#334155] text-center">
            Chunks retrieved from dsa.pdf via Pinecone
          </div>
        </aside>
      )}
    </div>
  )
}
