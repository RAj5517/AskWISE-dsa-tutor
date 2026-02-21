import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from 'react-router-dom'
import {
  Loader2, Sparkles, Send, BarChart3, LogOut,
  CheckCircle2, Code2, MessageSquare, PlayCircle, ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import GraphVisualizer from '@/components/GraphVisualizer'

const MODES = [
  { id: 'code', label: 'Review Code', icon: Code2, desc: 'Paste your broken code and get a personalized fix' },
  { id: 'concept', label: 'Ask Concept', icon: MessageSquare, desc: 'Confused about a topic? Ask anything' },
  { id: 'practice', label: 'Practice', icon: PlayCircle, desc: 'Get a question based on your weak topics' }
]

// Practice topics — keys MUST match DSA_CONCEPT_GRAPH snake_case keys
const PRACTICE_TOPICS = [
  { key: 'recursion', label: 'Recursion' },
  { key: 'trees', label: 'Tree Traversal' },
  { key: 'linked_lists', label: 'Linked Lists' },
  { key: 'bfs_dfs', label: 'BFS / DFS' },
  { key: 'dp', label: 'Dynamic Programming' },
  { key: 'arrays', label: 'Arrays' },
  { key: 'binary_search', label: 'Binary Search' },
  { key: 'two_pointers', label: 'Two Pointers' },
  { key: 'hashing', label: 'Hashing' },
]

export default function Session() {
  const [mode, setMode] = useState('code')
  const navigate = useNavigate()

  // Auth
  const [user, setUser] = useState(null)
  const [studentData, setStudentData] = useState(null)

  // Shared state
  const [loading, setLoading] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [showXpToast, setShowXpToast] = useState(false)

  // Per-mode persistent results — switching modes preserves each mode's last result
  const [codeResult, setCodeResult] = useState(null)
  const [conceptResult, setConceptResult] = useState(null)
  const [practiceResult, setPracticeResult] = useState(null)

  // Helper: get/set result for the active mode
  const result = mode === 'code' ? codeResult : mode === 'concept' ? conceptResult : practiceResult
  const setResult = (data) => {
    if (mode === 'code') setCodeResult(data)
    else if (mode === 'concept') setConceptResult(data)
    else setPracticeResult(data)
  }

  // Mode: code
  const [problem, setProblem] = useState('')
  const [code, setCode] = useState('')
  const [whatsWrong, setWhatsWrong] = useState('')

  // Mode: concept
  const [conceptQuestion, setConceptQuestion] = useState('')

  // Mode: practice
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [practiceQuestion, setPracticeQuestion] = useState(null)
  const [practiceCode, setPracticeCode] = useState('')
  const [practicePhase, setPracticePhase] = useState('pick') // 'pick' | 'attempt' | 'result'

  useEffect(() => { getUser() }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }
    setUser(user)

    const { data } = await supabase
      .from('students')
      .select('mastery_data, weak_topics, misconceptions, name')
      .eq('email', user.email)
      .maybeSingle()
    if (data) setStudentData(data)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  // ── Shared submit dispatcher ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    setResult(null)
    setShowXpToast(false)

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    try {
      let body = { student_email: user.email, mode }

      if (mode === 'code') {
        if (!code.trim()) { setLoading(false); return }
        body = { ...body, question: problem, student_code: code, whats_wrong: whatsWrong }
      } else if (mode === 'concept') {
        if (!conceptQuestion.trim()) { setLoading(false); return }
        body = { ...body, question: conceptQuestion }
      } else if (mode === 'practice') {
        if (!practiceCode.trim()) { setLoading(false); return }
        body = { ...body, question: practiceQuestion, student_code: practiceCode, topic: selectedTopic }
        setPracticePhase('result')
      }

      const response = await fetch(`${backendUrl}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Backend error')

      const data = await response.json()
      setResult(data)

      // XP toast
      if (data.xp_earned) {
        setXpGained(data.xp_earned)
        setShowXpToast(true)
        setTimeout(() => setShowXpToast(false), 3000)
      }

      // Update local student data with fresh mastery if returned
      if (data.mastery) {
        setStudentData(prev => ({ ...prev, mastery_data: data.mastery }))
      }

    } catch (err) {
      console.error(err)
      setResult({ explanation: 'Failed to get response. Please check the backend is running.' })
    }

    setLoading(false)
  }

  // ── Practice: get question from backend ─────────────────────────────────
  const fetchPracticeQuestion = async () => {
    if (!selectedTopic || !user) return
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_email: user.email, mode: 'practice', topic: selectedTopic, phase: 'question' })
      })
      const data = await res.json()
      setPracticeQuestion(data.question || 'Write a function to solve this problem.')
      setPracticePhase('attempt')
    } catch {
      setPracticeQuestion('Write a recursive function to compute factorial(n).')
      setPracticePhase('attempt')
    }
    setLoading(false)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    // DON'T clear results — each mode remembers its last explanation
    // Only reset practice input state when switching away
    if (newMode !== 'practice') {
      setPracticePhase('pick')
      setSelectedTopic(null)
      setPracticeQuestion(null)
      setPracticeCode('')
    }
  }

  const canSubmit = () => {
    if (mode === 'code') return code.trim().length > 0
    if (mode === 'concept') return conceptQuestion.trim().length > 0
    if (mode === 'practice') return practiceCode.trim().length > 0
    return false
  }

  // ── Weak topics for practice ─────────────────────────────────────────────
  const weakTopicKeys = studentData?.weak_topics || []
  const practiceTopics = PRACTICE_TOPICS.map(t => ({
    ...t,
    isWeak: weakTopicKeys.includes(t.key),
    mastery: studentData?.mastery_data?.[t.key] ?? null
  })).sort((a, b) => (b.isWeak ? 1 : 0) - (a.isWeak ? 1 : 0))

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a]">

      {/* ── Navbar ── */}
      <nav className="glass-nav w-full px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">AskWise</span>
          {studentData?.name && (
            <span className="text-sm text-neutral-500 ml-1">· {studentData.name}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}
            className="text-neutral-400 hover:text-white text-sm gap-2 hover:bg-white/5 rounded-full px-4">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}
            className="text-neutral-400 hover:text-white text-sm gap-2 hover:bg-white/5 rounded-full px-4">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </nav>

      {/* ── XP Toast ── */}
      <AnimatePresence>
        {showXpToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/15 border border-green-500/20 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-semibold text-sm">+{xpGained} XP earned!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">

          {/* ── Mode Toggle ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 mb-6 p-1 bg-white/[0.03] border border-white/8 rounded-2xl w-fit"
          >
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${mode === m.id
                  ? 'bg-white text-black'
                  : 'text-neutral-500 hover:text-neutral-200'}`}
              >
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </motion.div>

          {/* ── Content Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ── LEFT: input panel ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >

                {/* ── CODE MODE ── */}
                {mode === 'code' && (
                  <>
                    <Card className="metallic-card border-white/8">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Problem Statement</h2>
                          <span className="text-xs text-neutral-600 ml-auto">Optional</span>
                        </div>
                        <Textarea value={problem} onChange={e => setProblem(e.target.value)}
                          placeholder="What problem are you trying to solve?"
                          className="min-h-[80px] font-mono text-sm bg-[#0a0a0a] border-white/8 text-white placeholder:text-neutral-600 rounded-xl resize-none focus:border-white/20 transition-colors" />
                      </CardContent>
                    </Card>

                    <Card className="metallic-card border-white/8">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Your Code</h2>
                        </div>
                        <Textarea value={code} onChange={e => setCode(e.target.value)}
                          placeholder="Paste your code here (even if it's broken)..."
                          className="min-h-[260px] font-mono text-sm bg-[#0a0a0a] border-white/8 text-white placeholder:text-neutral-600 rounded-xl resize-none focus:border-white/20 transition-colors leading-relaxed" />
                      </CardContent>
                    </Card>

                    <Card className="metallic-card border-white/8">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">What's Going Wrong</h2>
                          <span className="text-xs text-neutral-600 ml-auto">Optional</span>
                        </div>
                        <Textarea value={whatsWrong} onChange={e => setWhatsWrong(e.target.value)}
                          placeholder="e.g. 'infinite loop', 'wrong output', 'index error'..."
                          className="min-h-[72px] font-mono text-sm bg-[#0a0a0a] border-white/8 text-white placeholder:text-neutral-600 rounded-xl resize-none focus:border-white/20 transition-colors" />
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* ── CONCEPT MODE ── */}
                {mode === 'concept' && (
                  <Card className="metallic-card border-white/8">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Your Question</h2>
                      </div>
                      <Textarea value={conceptQuestion} onChange={e => setConceptQuestion(e.target.value)}
                        placeholder={"e.g. 'I don't understand how DFS works'\ne.g. 'What is memoization and when do I use it'\ne.g. 'Why does my recursion keep hitting max depth'"}
                        className="min-h-[240px] text-sm bg-[#0a0a0a] border-white/8 text-white placeholder:text-neutral-600 rounded-xl resize-none focus:border-white/20 transition-colors leading-relaxed" />
                      <p className="text-xs text-neutral-600 mt-3">We'll tailor the explanation to your known weak spots.</p>
                    </CardContent>
                  </Card>
                )}

                {/* ── PRACTICE MODE ── */}
                {mode === 'practice' && (
                  <>
                    {practicePhase === 'pick' && (
                      <Card className="metallic-card border-white/8">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Pick a Topic</h2>
                          </div>
                          <p className="text-xs text-neutral-500 mb-4">Highlighted topics are your current weak areas.</p>
                          <div className="space-y-2">
                            {practiceTopics.map(t => (
                              <button
                                key={t.key}
                                onClick={() => setSelectedTopic(t.key)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${selectedTopic === t.key
                                  ? 'bg-white/10 border-white/25 text-white'
                                  : 'bg-white/[0.03] border-white/8 text-neutral-400 hover:border-white/15'}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {t.isWeak && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse flex-shrink-0" />}
                                  {t.label}
                                </div>
                                {t.mastery !== null && (
                                  <span className={`text-xs font-medium tabular-nums ${t.mastery > 60 ? 'text-emerald-400' : t.mastery > 30 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                    {t.mastery}%
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={fetchPracticeQuestion}
                            disabled={!selectedTopic || loading}
                            className={`mt-5 w-full glow-button py-3 text-sm font-semibold flex items-center justify-center gap-2 ${(!selectedTopic || loading) ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Getting question...</> : <>Get Question <ChevronRight className="w-4 h-4" /></>}
                          </button>
                        </CardContent>
                      </Card>
                    )}

                    {(practicePhase === 'attempt' || practicePhase === 'result') && (
                      <>
                        <Card className="metallic-card border-white/8">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Your Question</h2>
                              </div>
                              <button onClick={() => setPracticePhase('pick')} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                                Change topic
                              </button>
                            </div>
                            <p className="text-sm text-neutral-200 leading-relaxed bg-white/[0.03] rounded-xl p-4 border border-white/5">
                              {practiceQuestion}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="metallic-card border-white/8">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Your Attempt</h2>
                            </div>
                            <Textarea value={practiceCode} onChange={e => setPracticeCode(e.target.value)}
                              placeholder="Write your solution here..."
                              className="min-h-[220px] font-mono text-sm bg-[#0a0a0a] border-white/8 text-white placeholder:text-neutral-600 rounded-xl resize-none focus:border-white/20 transition-colors leading-relaxed" />
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </>
                )}

                {/* ── Submit Button (shared for code + concept + practice attempt) ── */}
                {(mode !== 'practice' || practicePhase === 'attempt' || practicePhase === 'result') && mode !== 'practice' || (mode === 'practice' && practicePhase === 'attempt') ? (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !canSubmit()}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 ${(loading || !canSubmit())
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                      : 'glow-button'}`}
                  >
                    {loading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</>
                      : <><Send className="w-4 h-4" />Get Personalized Explanation</>
                    }
                  </button>
                ) : null}

              </motion.div>
            </AnimatePresence>

            {/* ── RIGHT: output panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="metallic-card border-white/8 min-h-[540px]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Explanation</h2>
                    {result?.topic_category && (
                      <span className="ml-auto text-xs bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full text-neutral-500">
                        {result.topic_category}
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-4">
                        <div className="shimmer-loader h-4 w-3/4 rounded-lg" />
                        <div className="shimmer-loader h-4 w-full rounded-lg" />
                        <div className="shimmer-loader h-4 w-5/6 rounded-lg" />
                        <div className="shimmer-loader h-4 w-2/3 rounded-lg" />
                        <div className="h-3" />
                        <div className="shimmer-loader h-4 w-full rounded-lg" />
                        <div className="shimmer-loader h-4 w-4/5 rounded-lg" />
                        <div className="h-3" />
                        <div className="shimmer-loader h-4 w-3/4 rounded-lg" />
                      </motion.div>

                    ) : result ? (
                      <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                        {/* Explanation — rendered with ReactMarkdown + SyntaxHighlighter */}
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              // Section headers
                              h2: ({ children }) => (
                                <h2 className="text-white text-sm font-semibold mt-5 mb-1.5 border-b border-white/5 pb-1">
                                  {children}
                                </h2>
                              ),
                              // Paragraphs
                              p: ({ children }) => (
                                <p className="text-neutral-300 text-sm font-light leading-relaxed mb-2">
                                  {children}
                                </p>
                              ),
                              // Bold
                              strong: ({ children }) => (
                                <strong className="text-white font-semibold">{children}</strong>
                              ),
                              // Inline code
                              code: ({ node, inline, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      padding: '14px',
                                      margin: '10px 0',
                                      border: '1px solid rgba(255,255,255,0.07)',
                                      background: '#0a0a0a',
                                    }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code
                                    className="bg-white/[0.06] text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                )
                              },
                              // Lists
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside text-neutral-300 text-sm space-y-1 mb-2 pl-2">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside text-neutral-300 text-sm space-y-1 mb-2 pl-2">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-neutral-300 text-sm font-light">{children}</li>
                              ),
                            }}
                          >
                            {result.explanation || ''}
                          </ReactMarkdown>
                        </div>

                        {/* Graph visualizer — only renders when Gemini returns viz data for graph/tree/linked_list problems */}
                        <GraphVisualizer data={result.visualization} />

                        {/* Corrected Code — shown separately if Gemini returned it standalone */}
                        {result.corrected_code && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            <div className="flex items-center gap-2 mb-2.5">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <h3 className="text-sm font-medium text-white">Corrected Code</h3>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language="python"
                              PreTag="div"
                              customStyle={{
                                borderRadius: '10px',
                                fontSize: '13px',
                                padding: '14px',
                                border: '1px solid rgba(255,255,255,0.07)',
                                background: '#0a0a0a',
                              }}
                            >
                              {result.corrected_code}
                            </SyntaxHighlighter>
                          </motion.div>
                        )}

                        {/* Mastery snapshot */}
                        {result.mastery && Object.keys(result.mastery).length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                            className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                            <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3 font-medium">Mastery updated</p>
                            <div className="space-y-2">
                              {Object.entries(result.mastery).map(([topic, score]) => (
                                <div key={topic} className="flex items-center justify-between gap-3">
                                  <span className="text-xs text-neutral-500 capitalize">{topic.replace('_', ' ')}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="h-full rounded-full"
                                        style={{ background: score > 60 ? '#34d399' : score > 30 ? '#fbbf24' : '#f87171' }}
                                      />
                                    </div>
                                    <span className="text-xs text-white font-medium tabular-nums w-8 text-right">{score}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>

                    ) : (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-80 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                          <Sparkles className="w-6 h-6 text-neutral-600" />
                        </div>
                        <p className="text-neutral-500 text-sm font-light mb-1">
                          {mode === 'code' && 'Paste your code and submit for a personalized explanation'}
                          {mode === 'concept' && 'Ask any DSA concept question — we\'ll explain from your level'}
                          {mode === 'practice' && 'Pick a topic to get a practice question'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
