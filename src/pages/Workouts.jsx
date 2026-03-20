import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

export default function Workouts() {
  const [activeTab, setActiveTab] = useState('history')
  const qc = useQueryClient()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-display tracking-wide text-ink-900">WORKOUTS</h2>

      {/* Pill tabs */}
      <div className="flex bg-cream-100 rounded-xl p-1 gap-1">
        {[['history', 'History'], ['log', 'Log Workout'], ['exercises', 'Exercises']].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-xs font-display tracking-wide rounded-lg ${
              activeTab === tab
                ? 'bg-white shadow-sm text-teal-500 font-medium'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'history' && <WorkoutHistory />}
      {activeTab === 'log' && <LogWorkout onSuccess={() => { setActiveTab('history'); qc.invalidateQueries(['sessions']) }} />}
      {activeTab === 'exercises' && <ExerciseList />}
    </div>
  )
}

function WorkoutHistory() {
  const { data } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/workouts/sessions/').then(r => r.data.results),
  })

  if (!data?.length) return <p className="text-ink-500 text-sm">No workouts logged yet.</p>

  return (
    <div className="space-y-2">
      {data.map(s => (
        <div key={s.id} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(30,51,88,0.06)] p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-ink-900">{s.name || 'Workout'}</p>
              <p className="text-sm text-ink-500 mt-0.5">{s.date} · {s.exercises_count} exercises{s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}</p>
            </div>
            <span className="text-sm text-teal-500 font-display font-medium">{Math.round(s.total_volume).toLocaleString()} kg</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function LogWorkout({ onSuccess }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState('')
  const [entries, setEntries] = useState([])

  const { data: exercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => api.get('/workouts/exercises/').then(r => r.data.results),
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/workouts/sessions/', {
      name, date,
      duration_minutes: duration ? Number(duration) : null,
      entries: entries.map((e, i) => ({
        exercise_id: e.exerciseId,
        order: i,
        sets: e.sets.map((s, j) => ({
          set_number: j + 1,
          weight_kg: Number(s.weight),
          reps: Number(s.reps),
        }))
      }))
    }),
    onSuccess,
  })

  const addEntry = (exerciseId) => setEntries([...entries, { exerciseId, sets: [{ weight: '', reps: '' }] }])
  const addSet = (i) => { const u = [...entries]; u[i].sets.push({ weight: '', reps: '' }); setEntries(u) }
  const updateSet = (ei, si, field, val) => { const u = [...entries]; u[ei].sets[si][field] = val; setEntries(u) }
  const removeEntry = (i) => setEntries(entries.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Session Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chest Day"
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Duration (minutes)</label>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Optional"
            className="w-40 bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
        </div>

        <div className="mt-3">
          <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Add Exercise</label>
          <select onChange={e => { if (e.target.value) addEntry(Number(e.target.value)); e.target.value = '' }}
            className="bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15">
            <option value="">— Select exercise —</option>
            {exercises?.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
      </div>

      {entries.map((entry, ei) => {
        const ex = exercises?.find(e => e.id === entry.exerciseId)
        return (
          <div key={ei} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(30,51,88,0.06)] p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-display tracking-wide text-ink-900 text-sm">{ex?.name}</p>
              <button onClick={() => removeEntry(ei)} className="text-xs text-red-400 hover:text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">Remove</button>
            </div>
            <div className="space-y-2">
              {entry.sets.map((s, si) => (
                <div key={si} className="flex items-center gap-3">
                  <span className="text-xs text-ink-300 w-6 font-medium">#{si + 1}</span>
                  <input placeholder="kg" value={s.weight} onChange={e => updateSet(ei, si, 'weight', e.target.value)}
                    className="w-20 bg-cream-50 border border-cream-300 rounded-lg px-3 py-1.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500" />
                  <input placeholder="reps" value={s.reps} onChange={e => updateSet(ei, si, 'reps', e.target.value)}
                    className="w-20 bg-cream-50 border border-cream-300 rounded-lg px-3 py-1.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500" />
                </div>
              ))}
            </div>
            <button onClick={() => addSet(ei)} className="mt-2.5 text-xs text-teal-500 hover:text-teal-600 font-medium">+ Add set</button>
          </div>
        )
      })}

      <button onClick={() => mutation.mutate()} disabled={!entries.length || mutation.isPending}
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-3 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-40 text-sm">
        {mutation.isPending ? 'SAVING...' : 'SAVE WORKOUT'}
      </button>
    </div>
  )
}

function ExerciseList() {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')

  const { data: muscles } = useQuery({
    queryKey: ['muscle-groups'],
    queryFn: () => api.get('/workouts/muscle-groups/').then(r => r.data),
  })

  const { data } = useQuery({
    queryKey: ['exercises', search, muscle],
    queryFn: () => api.get(`/workouts/exercises/?search=${search}&muscle_group=${muscle}`).then(r => r.data.results),
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 shadow-sm" />
        <select value={muscle} onChange={e => setMuscle(e.target.value)}
          className="bg-white border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 shadow-sm">
          <option value="">All muscles</option>
          {muscles?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      {data?.map(ex => (
        <div key={ex.id} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(30,51,88,0.06)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink-900 text-sm">{ex.name}</p>
              {ex.description && (
                <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">{ex.description}</p>
              )}
              {/* Muscle activations */}
              {ex.muscle_activations?.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {ex.muscle_activations.map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      <span className="text-xs text-ink-500 w-24 flex-shrink-0 truncate">{a.muscle_group.name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-sm ${
                              i < a.level
                                ? a.level >= 8 ? 'bg-teal-500'
                                : a.level >= 5 ? 'bg-teal-400/70'
                                : 'bg-cream-400'
                                : 'bg-cream-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-ink-300">{a.level}/10</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Fallback: single muscle group (older API) */}
              {!ex.muscle_activations?.length && ex.muscle_group?.name && (
                <p className="text-xs text-ink-500 mt-1">{ex.muscle_group.name}</p>
              )}
            </div>
            <span className="text-xs bg-cream-100 rounded-lg px-2.5 py-1 text-ink-500 capitalize font-medium flex-shrink-0">{ex.equipment}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
