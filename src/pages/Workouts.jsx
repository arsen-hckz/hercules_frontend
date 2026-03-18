import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

export default function Workouts() {
  const [activeTab, setActiveTab] = useState('history')
  const qc = useQueryClient()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Workouts</h2>

      <div className="flex gap-2">
        {[['history', '📋 History'], ['log', '➕ Log Workout'], ['exercises', '🏋️ Exercises']].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {label}
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

  if (!data?.length) return <p className="text-gray-500 text-sm">No workouts logged yet.</p>

  return (
    <div className="space-y-3">
      {data.map(s => (
        <div key={s.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-white">{s.name || 'Workout'}</p>
              <p className="text-sm text-gray-400">{s.date} · {s.exercises_count} exercises · {s.duration_minutes ? `${s.duration_minutes} min` : ''}</p>
            </div>
            <span className="text-orange-400 font-semibold">{Math.round(s.total_volume).toLocaleString()} kg</span>
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

  const addEntry = (exerciseId) => {
    setEntries([...entries, { exerciseId, sets: [{ weight: '', reps: '' }] }])
  }

  const addSet = (entryIdx) => {
    const updated = [...entries]
    updated[entryIdx].sets.push({ weight: '', reps: '' })
    setEntries(updated)
  }

  const updateSet = (entryIdx, setIdx, field, val) => {
    const updated = [...entries]
    updated[entryIdx].sets[setIdx][field] = val
    setEntries(updated)
  }

  const removeEntry = (idx) => setEntries(entries.filter((_, i) => i !== idx))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Session Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chest Day"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Optional"
          className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Add Exercise</label>
        <select onChange={e => { if (e.target.value) addEntry(Number(e.target.value)); e.target.value = '' }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
          <option value="">— Select exercise —</option>
          {exercises?.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>

      {entries.map((entry, ei) => {
        const ex = exercises?.find(e => e.id === entry.exerciseId)
        return (
          <div key={ei} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold text-white">{ex?.name}</p>
              <button onClick={() => removeEntry(ei)} className="text-xs text-red-400 hover:underline">Remove</button>
            </div>
            <div className="space-y-2">
              {entry.sets.map((s, si) => (
                <div key={si} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-6">#{si + 1}</span>
                  <input placeholder="kg" value={s.weight} onChange={e => updateSet(ei, si, 'weight', e.target.value)}
                    className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                  <input placeholder="reps" value={s.reps} onChange={e => updateSet(ei, si, 'reps', e.target.value)}
                    className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
              ))}
            </div>
            <button onClick={() => addSet(ei)} className="mt-2 text-sm text-orange-400 hover:underline">+ Add set</button>
          </div>
        )
      })}

      <button onClick={() => mutation.mutate()} disabled={!entries.length || mutation.isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40">
        {mutation.isPending ? 'Saving...' : 'Save Workout'}
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
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
        <select value={muscle} onChange={e => setMuscle(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
          <option value="">All muscles</option>
          {muscles?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      {data?.map(ex => (
        <div key={ex.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center">
          <div>
            <p className="font-medium text-white">{ex.name}</p>
            <p className="text-sm text-gray-400">{ex.muscle_group?.name}</p>
          </div>
          <span className="text-xs bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-gray-300 capitalize">{ex.equipment}</span>
        </div>
      ))}
    </div>
  )
}
