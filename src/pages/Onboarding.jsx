import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import herculesLogo from '../assets/hercules-logo.png'

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary',    desc: 'Little or no exercise' },
  { value: 'light',       label: 'Light',         desc: '1–3 days/week' },
  { value: 'moderate',    label: 'Moderate',      desc: '3–5 days/week' },
  { value: 'active',      label: 'Active',        desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active',   desc: 'Twice a day / hard labour' },
]

function calcTDEE(weight, height, dob, gender, activityLevel) {
  if (!weight || !height || !dob || !gender) return null
  const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 86400000))
  if (age < 10 || age > 120) return null
  const bmr = gender === 'M'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
  return Math.round(bmr * (mult[activityLevel] || 1.55))
}

function deriveGoal(current, target) {
  if (!current || !target) return 'maintain'
  const diff = parseFloat(target) - parseFloat(current)
  if (diff > 0.5) return 'bulk'
  if (diff < -0.5) return 'cut'
  return 'maintain'
}

function weeksToGoal(current, target, goal) {
  if (!current || !target || goal === 'maintain') return null
  const diff = Math.abs(parseFloat(target) - parseFloat(current))
  if (diff < 0.5) return null
  return Math.round(diff / (goal === 'cut' ? 0.5 : 0.25))
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { fetchMe } = useAuthStore()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    date_of_birth: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    target_weight_kg: '',
    activity_level: 'moderate',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const goal = deriveGoal(form.weight_kg, form.target_weight_kg)
  const tdee = calcTDEE(
    parseFloat(form.weight_kg),
    parseFloat(form.height_cm),
    form.date_of_birth,
    form.gender,
    form.activity_level
  )
  const weeks = weeksToGoal(form.weight_kg, form.target_weight_kg, goal)

  const step1Complete = form.date_of_birth && form.gender && form.height_cm && form.weight_kg

  async function handleFinish() {
    setLoading(true)
    setError('')
    try {
      await api.patch('/auth/me/', {
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        height_cm: parseFloat(form.height_cm),
        weight_kg: parseFloat(form.weight_kg),
        target_weight_kg: form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
        activity_level: form.activity_level,
        goal,
      })
      await fetchMe()
      navigate('/')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={herculesLogo} alt="Hercules" className="h-16 w-auto object-contain" />
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-3 mb-6 px-2">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-display flex-shrink-0 ${
                step >= s ? 'bg-teal-500 text-white shadow-[0_4px_8px_rgba(59,191,191,0.3)]' : 'bg-cream-200 text-ink-500'
              }`}>{s}</div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? 'bg-teal-500' : 'bg-cream-300'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(30,51,88,0.10)] p-7">
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl tracking-wide text-ink-900 mb-1">LET'S SET UP YOUR PROFILE</h2>
              <p className="text-ink-500 text-sm mb-6">This helps us personalise your experience.</p>

              <div className="space-y-4">
                {/* DOB + Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Date of Birth</label>
                    <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                      className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Gender</label>
                    <div className="flex gap-1.5 mt-0.5">
                      {[['M', 'Male'], ['F', 'Female'], ['O', 'Other']].map(([v, l]) => (
                        <button key={v} onClick={() => set('gender', v)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-display tracking-wide border ${
                            form.gender === v
                              ? 'bg-teal-500 text-white border-teal-500 shadow-[0_4px_8px_rgba(59,191,191,0.25)]'
                              : 'bg-cream-50 text-ink-700 border-cream-300 hover:border-teal-400'
                          }`}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Height + Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Height (cm)</label>
                    <input type="number" placeholder="175" value={form.height_cm} onChange={e => set('height_cm', e.target.value)}
                      className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Current Weight (kg)</label>
                    <input type="number" step="0.1" placeholder="70" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                      className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
                  </div>
                </div>

                {/* Target weight */}
                <div>
                  <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Target Weight (kg) <span className="normal-case text-ink-300">— optional</span></label>
                  <input type="number" step="0.1" placeholder="65" value={form.target_weight_kg} onChange={e => set('target_weight_kg', e.target.value)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
                  {form.target_weight_kg && (
                    <p className="text-xs mt-1.5 text-teal-500 font-medium">
                      Goal auto-set to: <span className="uppercase">{goal}</span>
                    </p>
                  )}
                </div>

                {/* Activity */}
                <div>
                  <label className="block text-xs text-ink-500 mb-2 uppercase tracking-wide">Activity Level</label>
                  <div className="space-y-1.5">
                    {ACTIVITY_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => set('activity_level', opt.value)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left ${
                          form.activity_level === opt.value
                            ? 'bg-teal-50 border-teal-400 text-teal-700'
                            : 'bg-cream-50 border-cream-200 text-ink-700 hover:border-teal-300'
                        }`}>
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span className="text-xs text-ink-500">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!step1Complete}
                className="w-full mt-6 bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-3 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-40 text-sm"
              >
                SEE MY PLAN →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-2xl tracking-wide text-ink-900 mb-1">YOUR PLAN</h2>
              <p className="text-ink-500 text-sm mb-6">Here's what we've calculated for you.</p>

              <div className="space-y-3 mb-6">
                {/* Goal card */}
                <div className="bg-navy-900 rounded-2xl p-5 text-white flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Your Goal</p>
                    <p className="font-display text-3xl tracking-wide uppercase text-teal-400">{goal}</p>
                    {goal !== 'maintain' && <p className="text-xs text-white/40 mt-1">{form.weight_kg} kg → {form.target_weight_kg} kg</p>}
                  </div>
                  <div className="text-5xl opacity-40">{goal === 'cut' ? '↘' : goal === 'bulk' ? '↗' : '→'}</div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-cream-50 rounded-xl p-3 text-center">
                    <p className="font-display text-lg text-ink-900">{tdee ?? '—'}</p>
                    <p className="text-xs text-ink-500 mt-0.5">kcal / day</p>
                  </div>
                  <div className="bg-cream-50 rounded-xl p-3 text-center">
                    <p className="font-display text-lg text-ink-900">{weeks ?? '—'}</p>
                    <p className="text-xs text-ink-500 mt-0.5">weeks to goal</p>
                  </div>
                  <div className="bg-cream-50 rounded-xl p-3 text-center">
                    <p className="font-display text-lg text-ink-900 capitalize">{form.activity_level.replace('_', ' ')}</p>
                    <p className="text-xs text-ink-500 mt-0.5">activity</p>
                  </div>
                </div>

                {/* Explanation */}
                {weeks && (
                  <div className="border-l-2 border-teal-400 pl-4 py-1">
                    <p className="text-sm text-ink-700">
                      {goal === 'cut'
                        ? `At a safe rate of ~0.5 kg/week, you can reach ${form.target_weight_kg} kg in approximately `
                        : `At a steady rate of ~0.25 kg/week, you can reach ${form.target_weight_kg} kg in approximately `
                      }
                      <strong className="text-teal-600">{weeks} weeks</strong>
                      {weeks >= 52 ? ` (~${(weeks / 52).toFixed(1)} years)` : weeks >= 4 ? ` (~${Math.round(weeks / 4)} months)` : ''}.
                    </p>
                  </div>
                )}

                {!weeks && goal === 'maintain' && (
                  <div className="border-l-2 border-teal-400 pl-4 py-1">
                    <p className="text-sm text-ink-700">You're at your target weight. We'll keep your calories at maintenance.</p>
                  </div>
                )}
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl bg-cream-100 text-ink-700 hover:bg-cream-200 text-sm font-medium">
                  ← Back
                </button>
                <button onClick={handleFinish} disabled={loading}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-3 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-40 text-sm">
                  {loading ? 'SAVING...' : "LET'S GO!"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
