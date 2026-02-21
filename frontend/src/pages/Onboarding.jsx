import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, ChevronRight, ChevronLeft, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ── Stage 4: Hardcoded diagnostic questions ──────────────────────────────────
const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'recursion_base_case',
    topic: 'Recursion',
    topicKey: 'recursion',
    code: `def factorial(n):\n    return n * factorial(n-1)`,
    question: 'What is wrong with this code?',
    options: [
      'Nothing is wrong',
      'Missing base case — will run forever',
      'Wrong multiplication formula',
      'Should use a loop instead'
    ],
    correctIndex: 1,
    misconceptions: [
      "thinks recursive code is valid without a base case",
      null, // correct
      "misreads the multiplication logic",
      "uncomfortable with recursion entirely"
    ]
  },
  {
    id: 'array_indexing',
    topic: 'Arrays & Strings',
    topicKey: 'arrays',
    code: `arr = [1, 2, 3]\nfor i in range(len(arr)):\n    print(arr[i+1])`,
    question: 'What happens when this runs?',
    options: [
      'Prints 1 2 3',
      'Prints 2 3 4',
      'Index out of range error',
      'Prints nothing'
    ],
    correctIndex: 2,
    misconceptions: [
      "not tracing code execution",
      "confusing index with value",
      null, // correct
      "misunderstands range()"
    ]
  },
  {
    id: 'tree_traversal',
    topic: 'Trees & Binary Trees',
    topicKey: 'trees',
    code: `def mystery(node):\n    if not node: return\n    mystery(node.left)\n    print(node.val)\n    mystery(node.right)`,
    question: 'What traversal is this?',
    options: ['Preorder', 'Inorder', 'Postorder', 'BFS'],
    correctIndex: 1,
    misconceptions: [
      "confuses preorder with inorder",
      null, // correct
      "confuses postorder with inorder",
      "doesn't recognize recursive tree traversal"
    ]
  },
  {
    id: 'pointer_logic',
    topic: 'Linked Lists',
    topicKey: 'linked_lists',
    code: `def delete_node(head, val):\n    curr = head\n    while curr.next:\n        if curr.next.val == val:\n            curr.next = curr.next.next\n        curr = curr.next\n    return head`,
    question: 'What is the bug?',
    options: [
      'Should check curr.val not curr.next.val',
      'After deleting, curr still advances — can skip nodes',
      'Return statement is wrong',
      'No bug'
    ],
    correctIndex: 1,
    misconceptions: [
      "misunderstands pointer traversal",
      null, // correct
      "misreads return logic",
      "doesn't trace pointer advancement after deletion"
    ]
  }
]

const ALL_TOPICS = [
  'Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Recursion',
  'Sorting Algorithms', 'Binary Search', 'Trees & Binary Trees', 'BST',
  'Graphs', 'BFS / DFS', 'Dynamic Programming', 'Heaps'
]

const TOPIC_KEY_MAP = {
  'Arrays & Strings': 'arrays',
  'Linked Lists': 'linked_lists',
  'Stacks & Queues': 'stacks',
  'Recursion': 'recursion',
  'Sorting Algorithms': 'sorting',
  'Binary Search': 'binary_search',
  'Trees & Binary Trees': 'trees',
  'BST': 'bst',
  'Graphs': 'graphs',
  'BFS / DFS': 'bfs_dfs',
  'Dynamic Programming': 'dp',
  'Heaps': 'heaps'
}

const COMFORT_OPTIONS = [
  { label: 'Lost', description: "I don't get this at all", seed: 10 },
  { label: 'Getting it', description: 'I understand basics but struggle', seed: 35 },
  { label: 'Confident', description: "I can solve most problems", seed: 65 }
]

const slide = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 })
}

export default function Onboarding() {
  const [stage, setStage] = useState(1)
  const [direction, setDirection] = useState(1)
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  // Stage 1
  const [name, setName] = useState('')
  const [semester, setSemester] = useState(null)
  const [experience, setExperience] = useState(null)

  // Stage 2
  const [topicsCovered, setTopicsCovered] = useState([])

  // Stage 3
  const [comfortRatings, setComfortRatings] = useState({})

  // Stage 4
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({})
  const [currentDiagQ, setCurrentDiagQ] = useState(0)

  // Stage 5
  const [goal, setGoal] = useState(null)
  const [dailyTime, setDailyTime] = useState(null)

  const TOTAL_STAGES = 5

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    const { data } = await supabase
      .from('students')
      .select('onboarding_done')
      .eq('email', user.email)
      .maybeSingle()

    if (data?.onboarding_done) { navigate('/session'); return }
    setUser(user)
  }

  // ── Stage gating ────────────────────────────────────────────────────────────
  const canProceed = () => {
    if (stage === 1) return name.trim().length > 0 && semester !== null && experience !== null
    if (stage === 2) return topicsCovered.length > 0
    if (stage === 3) return Object.keys(comfortRatings).length === topicsCovered.length
    if (stage === 4) return relevantDiagnostics().every(q => diagnosticAnswers[q.id] !== undefined)
    if (stage === 5) return goal !== null && dailyTime !== null
    return false
  }

  const goNext = () => {
    if (!canProceed()) return
    setDirection(1)
    setStage(s => s + 1)
  }

  const goBack = () => {
    setDirection(-1)
    setStage(s => s - 1)
  }

  // Only show diagnostics for topics the student covered
  const relevantDiagnostics = () =>
    DIAGNOSTIC_QUESTIONS.filter(q => topicsCovered.some(t => TOPIC_KEY_MAP[t] === q.topicKey))

  // ── Final submit ─────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!user || saving) return
    setSaving(true)

    // Build mastery_data from comfort ratings
    const masteryData = {}
    topicsCovered.forEach(topic => {
      const key = TOPIC_KEY_MAP[topic]
      const rating = comfortRatings[topic]  // { seed: 10|35|65 }
      masteryData[key] = rating?.seed ?? 35
    })

    // Diagnostic overrides: wrong answer caps the seeded mastery
    const misconceptions = {}
    relevantDiagnostics().forEach(q => {
      const answerIdx = diagnosticAnswers[q.id]
      if (answerIdx !== undefined && answerIdx !== q.correctIndex) {
        const misconception = q.misconceptions[answerIdx]
        misconceptions[q.topicKey] = misconception
        // Cap mastery at 25 for any topic with a wrong diagnostic answer
        if (masteryData[q.topicKey] !== undefined) {
          masteryData[q.topicKey] = Math.min(masteryData[q.topicKey], 25)
        }
      }
    })

    // Derive weak topics
    const weakTopics = Object.entries(masteryData)
      .filter(([, score]) => score <= 25)
      .map(([key]) => key)

    await supabase.from('students').upsert({
      email: user.email,
      name: name.trim(),
      semester,
      experience,
      goal,
      daily_time: dailyTime,
      topics_covered: topicsCovered.map(t => TOPIC_KEY_MAP[t]),
      weak_topics: weakTopics,
      mastery_data: masteryData,
      misconceptions,
      weakness_chain: weakTopics.slice(0, 3),
      onboarding_done: true,
      xp: 0,
      streak: 0,
      created_at: new Date().toISOString()
    })

    setSaving(false)
    navigate('/session')
  }

  // ── Render helpers ──────────────────────────────────────────────────────────
  const diagQuestions = relevantDiagnostics()
  const currentDiag = diagQuestions[currentDiagQ]

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-white/[0.012] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">AskWise</span>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
            title="Cancel setup"
            style={{ color: 'rgba(163,163,163,0.8)', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', padding: 0 }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/8 transition-all duration-200"
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(163,163,163,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Progress bar ── */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-neutral-600 mb-2">
            <span>Setup</span>
            <span>Stage {stage} of {TOTAL_STAGES}</span>
          </div>
          <div className="h-0.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(stage / TOTAL_STAGES) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>

        {/* ── Stage Content ── */}
        <div className="metallic-card rounded-2xl overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stage}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="p-7"
            >

              {/* ── STAGE 1: Basic Info ── */}
              {stage === 1 && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1 font-medium">Stage 1 — About You</p>
                  <h2 className="text-xl font-semibold text-white mb-6">Let's get to know you</h2>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs text-neutral-500 uppercase tracking-wide font-medium block mb-2">Your name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Rahul"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-white/25 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-500 uppercase tracking-wide font-medium block mb-2">Semester</label>
                      <div className="grid grid-cols-6 gap-2">
                        {[1, 2, 3, 4, 5, 6].map(s => (
                          <button
                            key={s}
                            onClick={() => setSemester(s)}
                            className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${semester === s
                              ? 'bg-white/15 text-white border-white/35'
                              : 'bg-white/[0.04] text-neutral-400 border-white/10 hover:border-white/20'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-500 uppercase tracking-wide font-medium block mb-2">How long learning DSA?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Just started', '1–2 months', '3–6 months', '6+ months'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setExperience(opt)}
                            className={`py-2.5 px-3 rounded-xl text-sm transition-all duration-200 border text-left ${experience === opt
                              ? 'bg-white/15 text-white border-white/35 font-medium'
                              : 'bg-white/[0.04] text-neutral-400 border-white/10 hover:border-white/20'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STAGE 2: Topics Covered ── */}
              {stage === 2 && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1 font-medium">Stage 2 — Your Curriculum</p>
                  <h2 className="text-xl font-semibold text-white mb-1">What has your professor covered?</h2>
                  <p className="text-sm text-neutral-500 mb-5 font-light">Pick everything you've seen in class so far.</p>

                  <div className="grid grid-cols-2 gap-2">
                    {ALL_TOPICS.map(topic => {
                      const selected = topicsCovered.includes(topic)
                      return (
                        <button
                          key={topic}
                          onClick={() => setTopicsCovered(prev =>
                            selected ? prev.filter(t => t !== topic) : [...prev, topic]
                          )}
                          className={`py-2.5 px-3.5 rounded-xl text-sm transition-all duration-200 border text-left flex items-center gap-2 ${selected
                            ? 'bg-white/10 text-white border-white/25'
                            : 'bg-white/[0.03] text-neutral-400 border-white/8 hover:border-white/15'}`}
                        >
                          <div className={`w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200 ${selected ? 'bg-white' : 'border border-white/20'}`}>
                            {selected && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          {topic}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-neutral-600 mt-3">{topicsCovered.length} selected</p>
                </div>
              )}

              {/* ── STAGE 3: Comfort Ratings ── */}
              {stage === 3 && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1 font-medium">Stage 3 — Self Assessment</p>
                  <h2 className="text-xl font-semibold text-white mb-1">How comfortable are you?</h2>
                  <p className="text-sm text-neutral-500 mb-5 font-light">Be honest — we correct these automatically as you practice.</p>

                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {topicsCovered.map(topic => (
                      <div key={topic}>
                        <p className="text-sm text-neutral-300 mb-2">{topic}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {COMFORT_OPTIONS.map(opt => {
                            const selected = comfortRatings[topic]?.label === opt.label
                            return (
                              <button
                                key={opt.label}
                                onClick={() => setComfortRatings(prev => ({ ...prev, [topic]: opt }))}
                                className={`py-2 px-2 rounded-xl text-xs transition-all duration-200 border text-center ${selected
                                  ? 'bg-white/10 text-white border-white/25'
                                  : 'bg-white/[0.03] text-neutral-500 border-white/8 hover:border-white/15'}`}
                              >
                                <div className="font-medium">{opt.label}</div>
                                <div className="text-neutral-600 text-[10px] mt-0.5 leading-tight hidden sm:block">{opt.description}</div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STAGE 4: Diagnostic MCQ ── */}
              {stage === 4 && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1 font-medium">Stage 4 — Quick Diagnostic</p>
                  <h2 className="text-xl font-semibold text-white mb-1">2-minute code check</h2>
                  <p className="text-sm text-neutral-500 mb-5 font-light">
                    {diagQuestions.length > 0
                      ? `Question ${currentDiagQ + 1} of ${diagQuestions.length} — no typing, just pick`
                      : 'No relevant questions for your selected topics — tap Next to continue.'}
                  </p>

                  {diagQuestions.length > 0 && currentDiag ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentDiagQ}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Mini progress dots for diagnostic sub-steps */}
                        <div className="flex gap-1.5 mb-4">
                          {diagQuestions.map((_, i) => (
                            <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i <= currentDiagQ ? 'bg-white' : 'bg-white/15'}`} />
                          ))}
                        </div>

                        <p className="text-xs text-neutral-500 mb-2">{currentDiag.topic}</p>
                        <pre className="bg-[#0a0a0a] text-green-400/80 text-xs font-mono p-4 rounded-xl border border-white/5 mb-4 overflow-x-auto leading-relaxed">
                          {currentDiag.code}
                        </pre>
                        <p className="text-sm text-neutral-200 mb-3 font-medium">{currentDiag.question}</p>

                        <div className="space-y-2">
                          {currentDiag.options.map((opt, idx) => {
                            const selected = diagnosticAnswers[currentDiag.id] === idx
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setDiagnosticAnswers(prev => ({ ...prev, [currentDiag.id]: idx }))
                                  // Auto-advance after short delay
                                  if (currentDiagQ < diagQuestions.length - 1) {
                                    setTimeout(() => setCurrentDiagQ(q => q + 1), 400)
                                  }
                                }}
                                className={`w-full text-left py-3 px-4 rounded-xl text-sm transition-all duration-200 border ${selected
                                  ? 'bg-white/10 text-white border-white/25'
                                  : 'bg-white/[0.03] text-neutral-400 border-white/8 hover:border-white/15 hover:text-neutral-200'}`}
                              >
                                <span className="text-neutral-600 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                              </button>
                            )
                          })}
                        </div>

                        {/* Manual next for last question */}
                        {currentDiagQ < diagQuestions.length - 1 && (
                          <button
                            onClick={() => setCurrentDiagQ(q => q + 1)}
                            disabled={diagnosticAnswers[currentDiag.id] === undefined}
                            className={`mt-4 text-xs text-neutral-500 hover:text-white transition-colors ${diagnosticAnswers[currentDiag.id] === undefined ? 'opacity-30 pointer-events-none' : ''}`}
                          >
                            Next question →
                          </button>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <p className="text-sm text-neutral-600">No diagnostic questions apply to your selected topics.</p>
                  )}
                </div>
              )}

              {/* ── STAGE 5: Goal ── */}
              {stage === 5 && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1 font-medium">Stage 5 — Your Goal</p>
                  <h2 className="text-xl font-semibold text-white mb-1">Almost there!</h2>
                  <p className="text-sm text-neutral-500 mb-5 font-light">This shapes how we select questions and frame explanations.</p>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs text-neutral-500 uppercase tracking-wide font-medium block mb-2">What's your goal?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Understand class concepts', 'Exam prep', 'Fix assignments', 'Build fundamentals'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setGoal(opt)}
                            className={`py-2.5 px-3 rounded-xl text-sm transition-all duration-200 border text-left ${goal === opt
                              ? 'bg-white/15 text-white border-white/35 font-medium'
                              : 'bg-white/[0.04] text-neutral-400 border-white/10 hover:border-white/20'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-500 uppercase tracking-wide font-medium block mb-2">Daily time available</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['15 min', '30 min', '1 hour', 'More'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setDailyTime(opt)}
                            className={`py-2.5 rounded-xl text-sm transition-all duration-200 border text-center ${dailyTime === opt
                              ? 'bg-white/15 text-white border-white/35 font-medium'
                              : 'bg-white/[0.04] text-neutral-400 border-white/10 hover:border-white/20'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="px-7 pb-7 flex items-center justify-between">
            <button
              onClick={goBack}
              className={`flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors ${stage === 1 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {stage < TOTAL_STAGES ? (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className={`glow-button text-sm px-7 py-2.5 flex items-center gap-1.5 font-semibold ${!canProceed() ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || saving}
                className={`glow-button text-sm px-7 py-2.5 flex items-center gap-2 font-semibold ${(!canProceed() || saving) ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : 'Start Learning'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
