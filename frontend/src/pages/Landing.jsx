import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { Code2, Brain, TrendingUp, Sparkles, ArrowRight, Zap, Target, BarChart3, Flame } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

export default function Landing() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/onboarding'
      }
    })
    if (error) console.error('Error signing in:', error)
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── Glassmorphic Navbar ── */}
      <nav className="glass-nav w-full px-6 lg:px-16 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">AskWise</span>
        </div>
        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="border-white/15 hover:bg-white/8 hover:border-white/25 rounded-full px-6 py-2.5 text-sm backdrop-blur-sm transition-all duration-300"
        >
          Sign In
        </Button>
      </nav>

      {/* ── Hero Section ── */}
      <section className="w-full px-6 lg:px-16 pt-20 pb-24 lg:pt-28 lg:pb-32 relative">
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 dot-pattern opacity-60 pointer-events-none" />
        {/* Radial glow behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Pill badge */}
            <motion.div variants={fadeUp} custom={0} className="mb-8 inline-flex">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-neutral-400 backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                AI-Powered Personalized Tutoring
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold mb-8 leading-[1.05] tracking-tight"
            >
              <span className="glow-text">ChatGPT answers</span>
              <br />
              <span className="text-neutral-500">the question.</span>
              <br />
              <span className="glossy-text">AskWise answers</span>
              <br />
              <span className="text-white">you.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
            >
              Personalized DSA tutoring that learns from your mistakes
              and adapts to your learning style.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGoogleSignIn}
                className="glow-button text-base px-10 py-3.5 flex items-center gap-2.5 font-semibold"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-neutral-400 hover:text-white px-6 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-transparent transition-all duration-300"
              >
                See How It Works
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Section Divider ── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Problem Section ── */}
      <section className="w-full px-6 lg:px-16 py-20 lg:py-24 relative">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">
                The Problem
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight glossy-text">
                Generic AI doesn't know&nbsp;you.
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-neutral-400 text-lg leading-relaxed mb-5 font-light">
                You watch a YouTube video on Binary Trees, understand it completely,
                sit down for the assignment, and still fail to write working code.
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="text-neutral-400 text-lg leading-relaxed font-light">
                ChatGPT gives a perfect explanation — and you still fail the next time.
                The explanation was not the problem. <span className="text-white font-medium">The explanation not knowing you was the problem.</span>
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="space-y-4"
            >
              {/* ChatGPT bubble */}
              <motion.div variants={scaleIn} custom={0} className="metallic-card rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 mb-1.5 font-medium uppercase tracking-wider">ChatGPT says</p>
                    <p className="text-neutral-300 text-sm leading-relaxed">"DFS is a graph traversal algorithm that explores as far as possible along each branch before backtracking..."</p>
                  </div>
                </div>
              </motion.div>

              {/* AskWise bubble */}
              <motion.div variants={scaleIn} custom={1} className="metallic-card rounded-2xl p-6" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 mb-1.5 font-medium uppercase tracking-wider">AskWise says</p>
                    <p className="text-white text-sm leading-relaxed">"I see you've attempted recursion 4 times and get the base case wrong every time. Let's fix that pattern first..."</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section Divider ── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="w-full px-6 lg:px-16 py-20 lg:py-24 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Process
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl lg:text-5xl font-bold glossy-text">
              How It Works
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: Code2, title: "Submit Your Code", desc: "Paste your attempt, even if it's broken. We learn from your mistakes, not just the errors.", num: "01" },
              { icon: Brain, title: "AI Analyzes", desc: "Our two-stage pipeline identifies the root cause of your confusion, not just the syntax error.", num: "02" },
              { icon: TrendingUp, title: "Personalized Fix", desc: "Get an explanation tailored to your specific knowledge gaps and learning history.", num: "03" }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={scaleIn}
                custom={i}
                className="metallic-card rounded-2xl p-8 text-left group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300">
                    <step.icon className="w-5 h-5 text-neutral-300 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-sm font-mono text-neutral-600">{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">{step.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed font-light">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section Divider ── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Features Bento Grid ── */}
      <section className="w-full px-6 lg:px-16 pt-20 pb-28 lg:pt-24 lg:pb-32 relative">
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl lg:text-5xl font-bold glossy-text">
              Everything you need
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {[
              { icon: Target, title: "Weakness Detection", desc: "Identifies patterns in your recurring mistakes" },
              { icon: BarChart3, title: "Mastery Tracking", desc: "Visual progress bars for every topic" },
              { icon: Zap, title: "Weakness Chain", desc: "See what's blocking your progress" },
              { icon: Flame, title: "Streak System", desc: "Build consistent learning habits" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={scaleIn}
                custom={i}
                className="metallic-card rounded-2xl p-6 group cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors duration-300">
                  <feature.icon className="w-4.5 h-4.5 text-neutral-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-semibold mb-1.5 text-white text-sm">{feature.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section Divider ── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── CTA ── */}
      <section className="w-full px-6 lg:px-16 py-20 lg:py-28 relative">
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/[0.015] rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight glossy-text">
            Ready to stop struggling&nbsp;with&nbsp;DSA?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-neutral-400 text-lg mb-10 font-light leading-relaxed">
            Join students who've finally cracked the code with personalized,
            AI-powered tutoring that adapts to you.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <button
              onClick={handleGoogleSignIn}
              className="glow-button text-base px-12 py-4 flex items-center gap-2.5 font-semibold mx-auto"
            >
              Start Learning Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full px-6 lg:px-16 pt-16 pb-8 relative">
        {/* top divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-6xl mx-auto">
          {/* Main footer grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white font-semibold tracking-tight">AskWise</span>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed font-light">
                Personalized DSA tutoring powered by AI. Learn at your level, fix your gaps, ace your exams.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium mb-4">Product</p>
              <ul className="space-y-3">
                {['How it works', 'Features', 'Practice Mode', 'Dashboard'].map(item => (
                  <li key={item}>
                    <span className="text-neutral-500 text-sm hover:text-white transition-colors cursor-default">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Students */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium mb-4">For Students</p>
              <ul className="space-y-3">
                {['DSA Concepts', 'Code Review', 'Ask Questions', 'Track Progress'].map(item => (
                  <li key={item}>
                    <span className="text-neutral-500 text-sm hover:text-white transition-colors cursor-default">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Built with */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium mb-4">Built with</p>
              <ul className="space-y-3">
                {['React + Vite', 'Claude AI', 'Supabase', 'Framer Motion'].map(item => (
                  <li key={item}>
                    <span className="text-neutral-500 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="h-px w-full bg-white/[0.06] mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-neutral-600 text-xs">&copy; 2026 AskWise. All rights reserved.</p>
            <p className="text-neutral-600 text-xs">Made with ❤️ for CS students who are tired of being stuck</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
