import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from 'react-router-dom'
import { Sparkles, Flame, Trophy, Code2, LogOut, TrendingUp, Target, Zap } from "lucide-react"
import { motion } from "framer-motion"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

export default function Dashboard() {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserData()
  }, [])

  async function fetchUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    // Try backend first (richer data), fall back to Supabase
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    try {
      const res = await fetch(`${backendUrl}/api/progress/${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        // Backend returns flat shape: map to what the page expects
        setUserData({
          name: data.name,
          xp: data.xp,
          streak: data.streak,
          mastery_data: data.mastery,
          weakness_chain: data.weakness_chain || [],
          topics_covered: data.topics_covered || [],
          recent_interactions: data.recent_interactions || []
        })
        setLoading(false)
        return
      }
    } catch { /* backend not up yet — fall through to Supabase */ }

    // Fallback: read directly from Supabase
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()
    if (data) setUserData(data)
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4">
        <div className="premium-spinner" />
        <span className="text-sm text-neutral-500 tracking-widest uppercase animate-pulse">Loading</span>
      </div>
    )
  }

  const masteryData = userData?.mastery_data || {}
  const weaknessChain = userData?.weakness_chain || []
  const xp = userData?.xp || 0
  const streak = userData?.streak || 0

  const sortedTopics = Object.entries(masteryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a]">
      {/* ── Glassmorphic Navbar ── */}
      <nav className="glass-nav w-full px-6 lg:px-16 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">AskWise</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/session')}
            className="text-neutral-400 hover:text-white text-sm gap-2 hover:bg-white/5 rounded-full px-4"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Practice</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-neutral-400 hover:text-white text-sm gap-2 hover:bg-white/5 rounded-full px-4"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="w-full px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">

          {/* Page Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm text-neutral-500 uppercase tracking-widest mb-2">
              Dashboard
            </motion.p>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-white glossy-text tracking-tight">
              Your Progress
            </motion.h1>
          </motion.div>

          {/* Stat Cards Row */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: Trophy, label: "Total XP", value: xp, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
              { icon: Flame, label: "Day Streak", value: streak, color: "text-orange-400", bgColor: "bg-orange-400/10" },
              { icon: TrendingUp, label: "Topics", value: Object.keys(masteryData).length, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
              { icon: Target, label: "Weaknesses", value: weaknessChain.length, color: "text-rose-400", bgColor: "bg-rose-400/10" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i}
                className="metallic-card rounded-2xl p-5 group cursor-default"
              >
                <div className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="text-2xl font-bold text-white tracking-tight mb-0.5"
                >
                  {stat.value}
                </motion.div>
                <p className="text-xs text-neutral-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Topic Mastery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="metallic-card border-white/8 bg-[#111111]/70">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Topic Mastery</h2>
                  </div>

                  {sortedTopics.length > 0 ? (
                    <div className="space-y-5">
                      {sortedTopics.map(([topic, value], i) => (
                        <motion.div
                          key={topic}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.06, duration: 0.4 }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-neutral-300 capitalize font-light">{topic.replace('_', ' ')}</span>
                            <span className="text-sm text-white font-medium tabular-nums">{value}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ delay: 0.6 + i * 0.06, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                              className="h-full rounded-full"
                              style={{
                                background: value > 60
                                  ? 'linear-gradient(90deg, #34d399, #10b981)'
                                  : value > 30
                                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                    : 'linear-gradient(90deg, #f87171, #ef4444)'
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <p className="text-neutral-500 text-sm font-light">Start practicing to see your mastery levels!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Weakness Chain + Quick Stats */}
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="metallic-card border-white/8 bg-[#111111]/70">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Weakness Chain</h2>
                    </div>

                    {weaknessChain.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5 items-center">
                        {weaknessChain.map((item, index) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                            className="flex items-center gap-2.5"
                          >
                            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium ${index < 2
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              : 'bg-white/5 text-neutral-400 border border-white/10'
                              }`}>
                              {item}
                            </span>
                            {index < weaknessChain.length - 1 && (
                              <span className="text-neutral-600 text-xs">→</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-sm font-light">No weaknesses detected yet. Keep practicing!</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="metallic-card border-white/8 bg-[#111111]/70">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Quick Stats</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/5">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Zap className="w-4 h-4 text-yellow-400" />
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                          className="text-2xl font-bold text-white tabular-nums"
                        >
                          {xp}
                        </motion.div>
                        <div className="text-xs text-neutral-500 mt-0.5">Total XP</div>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/5">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Flame className="w-4 h-4 text-orange-400" />
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9, duration: 0.5 }}
                          className="text-2xl font-bold text-orange-400 tabular-nums"
                        >
                          {streak}
                        </motion.div>
                        <div className="text-xs text-neutral-500 mt-0.5">Day Streak</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
