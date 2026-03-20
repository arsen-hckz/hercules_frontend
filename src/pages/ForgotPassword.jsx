import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import herculesLogo from '../assets/hercules-logo.png'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await api.post('/auth/password-reset/', { email }).catch(() => {})
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-5/12 bg-navy-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-500/8 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-teal-500/5 translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center max-w-xs">
          <img src={herculesLogo} alt="Hercules" className="h-20 w-auto object-contain mb-8" />
          <h1 className="font-display text-3xl text-white tracking-wide text-center mb-2">NO WORRIES</h1>
          <p className="text-white/40 text-sm text-center">We'll get you back in. Enter your email and we'll send you a reset link.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-cream-50 p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <img src={herculesLogo} alt="Hercules" className="h-16 w-auto object-contain" />
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(30,51,88,0.10)] p-8">
            <h2 className="font-display text-2xl text-ink-900 tracking-wide mb-1">RESET PASSWORD</h2>
            <p className="text-ink-500 text-sm mb-6">Enter your email and we'll send a reset link.</p>

            {sent ? (
              <div className="border border-teal-400/40 bg-teal-100 text-teal-700 rounded-xl p-4 text-sm">
                If that email exists, a reset link has been sent. Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email" required placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-3 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-50 text-sm"
                >
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </form>
            )}

            <Link to="/login" className="mt-5 block text-center text-xs text-teal-500 hover:text-teal-600">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
