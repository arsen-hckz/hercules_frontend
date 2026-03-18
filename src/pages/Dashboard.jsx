import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const today = new Date().toISOString().split('T')[0]

function MacroBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{value}g</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
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
      <div>
        <h2 className="text-2xl font-bold text-white">
          Good {getGreeting()}, {user?.username} 👋
        </h2>
        <p className="text-gray-400 text-sm mt-1">{new Date().toDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Workouts" value={stats?.total_sessions ?? '—'} icon="💪" />
        <StatCard label="Total Volume" value={stats?.total_volume ? `${Math.round(stats.total_volume).toLocaleString()} kg` : '—'} icon="🏋️" />
        <StatCard label="Goal" value={user?.goal ?? '—'} icon="🎯" capitalize />
      </div>

      {/* Calories */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Today's Calories</h3>
          <Link to="/nutrition" className="text-sm text-orange-400 hover:underline">Log food →</Link>
        </div>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-4xl font-bold text-white">{Math.round(calories)}</span>
          {tdee > 0 && <span className="text-gray-400 mb-1">/ {tdee} kcal target</span>}
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${calPct >= 100 ? 'bg-red-500' : 'bg-orange-500'}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
        {summary && (
          <div className="grid grid-cols-3 gap-4 mt-5">
            <MacroBar label="Protein" value={Math.round(summary.nutrition.protein)} max={tdee * 0.3 / 4} color="bg-blue-500" />
            <MacroBar label="Carbs" value={Math.round(summary.nutrition.carbs)} max={tdee * 0.45 / 4} color="bg-yellow-500" />
            <MacroBar label="Fat" value={Math.round(summary.nutrition.fat)} max={tdee * 0.25 / 9} color="bg-pink-500" />
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Workouts</h3>
          <Link to="/workouts" className="text-sm text-orange-400 hover:underline">View all →</Link>
        </div>
        {sessions?.length ? (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-white">{s.name || 'Workout'}</p>
                  <p className="text-sm text-gray-400">{s.date} · {s.exercises_count} exercises</p>
                </div>
                <span className="text-sm text-orange-400">{Math.round(s.total_volume).toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No workouts yet. <Link to="/workouts" className="text-orange-400 hover:underline">Log your first one.</Link></p>
        )}
      </div>

      {/* BMI / TDEE */}
      {user && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Weight', value: user.weight_kg ? `${user.weight_kg} kg` : '—' },
              { label: 'Height', value: user.height_cm ? `${user.height_cm} cm` : '—' },
              { label: 'BMI', value: user.bmi ?? '—' },
              { label: 'TDEE', value: user.tdee ? `${user.tdee} kcal` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <Link to="/profile" className="mt-4 inline-block text-sm text-orange-400 hover:underline">
            Update your profile →
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, capitalize }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`text-xl font-bold text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
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
