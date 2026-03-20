import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import herculesLogo from '../assets/hercules-logo.png'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-5/12 bg-navy-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-500/8 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-teal-500/5 translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center max-w-xs">
          <img src={herculesLogo} alt="Hercules" className="h-20 w-auto object-contain mb-8" />
          <h1 className="font-display text-3xl text-white tracking-wide text-center mb-2">BECOME LEGENDARY</h1>
          <p className="text-white/40 text-sm text-center mb-10">Track workouts, log nutrition, and connect with your community.</p>
          <div className="space-y-3 w-full">
            {['Log every workout', 'Track your nutrition', 'Connect with others'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <span className="text-white/50 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-cream-50 p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <img src={herculesLogo} alt="Hercules" className="h-16 w-auto object-contain" />
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(30,51,88,0.10)] p-8">
            <h2 className="font-display text-2xl text-ink-900 tracking-wide mb-1">WELCOME BACK</h2>
            <p className="text-ink-500 text-sm mb-6">Log in to continue your journey.</p>

            {error && (
              <div className="border border-red-200 bg-red-50 text-red-600 rounded-xl p-3 mb-5 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  type="password" required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-3 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-50 text-sm mt-2"
              >
                {loading ? 'LOGGING IN...' : 'LOG IN'}
              </button>
            </form>

            <div className="mt-5 space-y-2 text-center">
              <Link to="/forgot-password" className="text-xs text-teal-500 hover:text-teal-600 block">
                Forgot password?
              </Link>
              <p className="text-xs text-ink-500">
                No account?{' '}
                <Link to="/register" className="text-teal-500 hover:text-teal-600 font-medium">Register</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
