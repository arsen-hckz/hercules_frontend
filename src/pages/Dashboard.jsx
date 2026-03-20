import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const today = new Date().toISOString().split('T')[0]

function MacroBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  const over = max && value > max
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-ink-500 text-xs">{label}</span>
        <span className="text-xs">
          <span className={`font-medium ${over ? 'text-red-400' : 'text-ink-900'}`}>{value}g</span>
          {max > 0 && <span className="text-ink-300"> / {max}g</span>}
        </span>
      </div>
      <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${over ? 'bg-red-400' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: summary } = useQuery({
    queryKey: ['daily-summary', today],
    queryFn: () => api.get(`/nutrition/logs/summary/?date=${today}`).then(r => r.data),
  })

  const { data: sessions } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => api.get('/workouts/sessions/?ordering=-date').then(r => r.data.results?.slice(0, 3)),
  })

  const { data: stats } = useQuery({
    queryKey: ['workout-stats'],
    queryFn: () => api.get('/workouts/stats/').then(r => r.data),
  })

  const calories = summary?.nutrition?.calories ?? 0
  const tdee = summary?.tdee ?? 0
  const calPct = tdee ? Math.min((calories / tdee) * 100, 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display tracking-wide text-ink-900">
          Good {getGreeting()}, {user?.username}
        </h2>
        <p className="text-ink-500 text-sm mt-0.5">{new Date().toDateString()}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Workouts" value={stats?.total_sessions ?? '—'} accent="bg-teal-500" />
        <StatCard label="Total Volume" value={stats?.total_volume ? `${Math.round(stats.total_volume).toLocaleString()} kg` : '—'} accent="bg-navy-900" />
        <StatCard label="Goal" value={user?.goal ?? '—'} capitalize accent="bg-cream-400" />
      </div>

      {/* Calories */}
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display tracking-wide text-ink-900">TODAY'S CALORIES</h3>
          <Link to="/nutrition" className="text-xs text-teal-500 hover:text-teal-600 font-medium">Log food →</Link>
        </div>
        <div className="flex items-end gap-3 mb-4">
          <span className="text-5xl font-display text-ink-900">{Math.round(calories)}</span>
          {tdee > 0 && <span className="text-ink-500 text-sm mb-1.5">/ {tdee} kcal target</span>}
        </div>
        <div className="h-2 bg-cream-200 rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full ${calPct >= 100 ? 'bg-red-400' : 'bg-teal-500'}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
        <p className="text-xs text-ink-300 mb-5">{Math.round(calPct)}% of daily target</p>
        {summary && tdee > 0 && (
          <div className="grid grid-cols-3 gap-5 pt-4 border-t border-cream-100">
            <MacroBar label="Protein" value={Math.round(summary.nutrition.protein)} max={Math.round(tdee * 0.30 / 4)} color="bg-navy-900" />
            <MacroBar label="Carbs"   value={Math.round(summary.nutrition.carbs)}   max={Math.round(tdee * 0.45 / 4)} color="bg-teal-500" />
            <MacroBar label="Fat"     value={Math.round(summary.nutrition.fat)}     max={Math.round(tdee * 0.25 / 9)} color="bg-cream-400" />
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display tracking-wide text-ink-900">RECENT WORKOUTS</h3>
          <Link to="/workouts" className="text-xs text-teal-500 hover:text-teal-600 font-medium">View all →</Link>
        </div>
        {sessions?.length ? (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-cream-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-ink-900 text-sm">{s.name || 'Workout'}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{s.date} · {s.exercises_count} exercises</p>
                </div>
                <span className="text-sm text-teal-500 font-display font-medium">{Math.round(s.total_volume).toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ink-500 text-sm">No workouts yet. <Link to="/workouts" className="text-teal-500 hover:text-teal-600">Log your first one.</Link></p>
        )}
      </div>

      {/* Stats */}
      {user && (
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-6">
          <h3 className="font-display tracking-wide text-ink-900 mb-5">YOUR STATS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Weight', value: user.weight_kg ? `${user.weight_kg} kg` : '—' },
              { label: 'Height', value: user.height_cm ? `${user.height_cm} cm` : '—' },
              { label: 'BMI', value: user.bmi ?? '—' },
              { label: 'TDEE', value: user.tdee ? `${user.tdee} kcal` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-cream-50 rounded-xl p-4 text-center">
                <p className="text-xl font-display text-ink-900">{value}</p>
                <p className="text-xs text-ink-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <Link to="/profile" className="mt-4 inline-block text-xs text-teal-500 hover:text-teal-600">
            Update your profile →
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, capitalize, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-5 flex items-center gap-4">
      <div className={`w-1.5 h-10 ${accent} rounded-full flex-shrink-0`} />
      <div>
        <p className={`text-xl font-display text-ink-900 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
        <p className="text-xs text-ink-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
