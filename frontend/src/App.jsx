import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Session from './pages/Session'
import Dashboard from './pages/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchUserData(session.user.email)
      } else {
        setUserData(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    if (session?.user?.email) {
      await fetchUserData(session.user.email)
    } else {
      setLoading(false)
    }
  }

  async function fetchUserData(email) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (data) {
      setUserData(data)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white gap-4">
      <div className="premium-spinner" />
      <span className="text-sm text-neutral-500 tracking-widest uppercase animate-pulse">Loading</span>
    </div>
  )

  // Determine where to redirect authenticated users
  const getDefaultRoute = () => {
    if (!userData) return '/onboarding'
    return userData.onboarding_done ? '/session' : '/onboarding'
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={!session ? <Landing /> : <Navigate to={getDefaultRoute()} />} />
        <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/" />} />
        <Route path="/session" element={session ? <Session /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
