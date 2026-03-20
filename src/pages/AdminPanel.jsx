import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import herculesLogo from '../assets/hercules-logo.png'

const TABS = ['Overview', 'Foods', 'Exercises', 'Users']

export default function AdminPanel() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('Overview')
  const [detail, setDetail] = useState(null) // { type: 'user'|'food'|'exercise', data }

  if (!user) return null
  if (!user.is_staff) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-navy-900 flex flex-col fixed h-full">
        <div className="px-4 py-4 border-b border-white/8">
          <div className="bg-cream-50 rounded-xl px-3 py-2">
            <img src={herculesLogo} alt="Hercules" className="w-full h-auto object-contain" style={{ maxHeight: 48 }} />
          </div>
        </div>
        <div className="px-3 pt-4">
          <p className="text-xs text-white/30 font-display tracking-widest mb-3 px-1">ADMIN PANEL</p>
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setDetail(null) }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-display tracking-wide mb-0.5 ${
                tab === t && !detail ? 'bg-teal-500/20 text-teal-400 font-medium' : 'text-white/50 hover:bg-white/6 hover:text-white/80'
              }`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="mt-auto px-3 pb-4 border-t border-white/8 pt-3">
          <a href="/" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/30 hover:bg-white/6 hover:text-white/60 text-xs font-display tracking-wide">
            ← BACK TO APP
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-52 flex-1 p-8 min-h-screen">
        {/* Breadcrumb */}
        {detail && (
          <button onClick={() => setDetail(null)}
            className="text-xs text-teal-500 hover:underline mb-4 flex items-center gap-1">
            ← Back to {tab}
          </button>
        )}

        {!detail && tab === 'Overview'  && <OverviewTab onNavigate={(t) => { setTab(t); setDetail(null) }} />}
        {!detail && tab === 'Foods'     && <FoodsTab onDetail={d => setDetail(d)} />}
        {!detail && tab === 'Exercises' && <ExercisesTab onDetail={d => setDetail(d)} />}
        {!detail && tab === 'Users'     && <UsersTab onDetail={d => setDetail(d)} />}

        {detail?.type === 'user'     && <UserDetail data={detail.data} />}
        {detail?.type === 'food'     && <FoodDetail data={detail.data} onBack={() => setDetail(null)} />}
        {detail?.type === 'exercise' && <ExerciseDetail data={detail.data} onBack={() => setDetail(null)} />}
      </main>
    </div>
  )
}

/* ─── Overview ──────────────────────────────────────────────────────────── */
function OverviewTab({ onNavigate }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/auth/admin/stats/').then(r => r.data),
    refetchInterval: 30000,
  })

  if (isLoading) return <Spinner />

  return (
    <div className="max-w-4xl space-y-6">
      <SectionTitle>OVERVIEW</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Users',      value: stats.users.total,             sub: `+${stats.users.new_today} today · +${stats.users.new_this_week} this week`, tab: 'Users' },
          { label: 'Posts',            value: stats.posts.total,             sub: `${stats.posts.today} today` },
          { label: 'Meal Logs',        value: stats.meal_logs.total,         sub: `${stats.meal_logs.today} today` },
          { label: 'Workout Sessions', value: stats.workout_sessions.total,  sub: `${stats.workout_sessions.today} today` },
          { label: 'Food Items',       value: stats.food_items.total,        sub: `${stats.food_items.pending_review} pending review`, alert: stats.food_items.pending_review > 0, tab: 'Foods' },
          { label: 'Exercises',        value: stats.exercises.total,         sub: 'in database', tab: 'Exercises' },
        ].map(c => (
          <div key={c.label}
            onClick={() => c.tab && onNavigate(c.tab)}
            className={`bg-white rounded-2xl p-4 shadow-[0_2px_16px_rgba(30,51,88,0.08)] ${c.alert ? 'border border-amber-400' : ''} ${c.tab ? 'cursor-pointer hover:shadow-[0_4px_20px_rgba(30,51,88,0.12)] transition-all' : ''}`}>
            <p className="text-3xl font-display text-ink-900">{c.value}</p>
            <p className="text-xs text-ink-500 mt-0.5">{c.label}</p>
            <p className={`text-xs mt-1 ${c.alert ? 'text-amber-500 font-medium' : 'text-ink-300'}`}>{c.sub}</p>
            {c.tab && <p className="text-xs text-teal-500 mt-2">View all →</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Foods ─────────────────────────────────────────────────────────────── */
function FoodsTab({ onDetail }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState(false)

  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['admin-foods', search, pending],
    queryFn: () => api.get(`/nutrition/admin/foods/?search=${search}${pending ? '&pending=1' : ''}`).then(r => r.data),
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/nutrition/foods/${id}/`),
    onSuccess: () => qc.invalidateQueries(['admin-foods']),
  })

  const verifyMutation = useMutation({
    mutationFn: (id) => api.patch(`/nutrition/foods/${id}/verify/`),
    onSuccess: () => qc.invalidateQueries(['admin-foods']),
  })

  return (
    <div className="max-w-4xl space-y-4">
      <SectionTitle>FOOD DATABASE <span className="text-ink-400 font-sans text-base normal-case font-normal">({foods.length})</span></SectionTitle>

      <div className="flex gap-2">
        <input placeholder="Search by name or brand…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
        <button onClick={() => setPending(p => !p)}
          className={`px-3 py-2 rounded text-xs font-display tracking-wide transition-colors border ${pending ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-ink-500 border-cream-300 hover:border-amber-400'}`}>
          {pending ? '★ PENDING' : 'PENDING REVIEW'}
        </button>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 bg-cream-50 border-b border-cream-200 text-xs font-display tracking-wide text-ink-500">
            <span>NAME / BRAND</span><span>CALORIES</span><span>P · C · F</span><span>STATUS</span><span></span>
          </div>
          <div className="divide-y divide-cream-100 max-h-[65vh] overflow-y-auto">
            {foods.map(f => (
              <div key={f.id}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-cream-50 transition-colors ${!f.is_verified && f.submitted_by ? 'border-l-2 border-amber-400' : ''}`}>
                <button className="text-left" onClick={() => onDetail({ type: 'food', data: f })}>
                  <p className="text-sm font-medium text-ink-900 hover:text-teal-500 transition-colors">{f.name}</p>
                  <p className="text-xs text-ink-500">{f.brand || '—'}</p>
                </button>
                <span className="text-sm text-ink-700">{f.calories} kcal</span>
                <span className="text-xs text-ink-500">{f.protein}g · {f.carbs}g · {f.fat}g</span>
                <span>{!f.is_verified && f.submitted_by
                  ? <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Pending</span>
                  : <span className="text-xs bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded">Verified</span>
                }</span>
                <div className="flex gap-2">
                  {!f.is_verified && f.submitted_by && (
                    <button onClick={() => verifyMutation.mutate(f.id)} className="text-xs text-teal-500 hover:text-teal-700 font-medium">Verify</button>
                  )}
                  <button onClick={() => onDetail({ type: 'food', data: f })} className="text-xs text-ink-400 hover:text-ink-700">Edit</button>
                  <button onClick={() => { if (window.confirm(`Delete "${f.name}"?`)) deleteMutation.mutate(f.id) }} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
            {!foods.length && <p className="px-4 py-8 text-center text-ink-500 text-sm">No food items found.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function FoodDetail({ data: initialData, onBack }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: initialData.name || '',
    brand: initialData.brand || '',
    calories: initialData.calories ?? '',
    protein: initialData.protein ?? '',
    carbs: initialData.carbs ?? '',
    fat: initialData.fat ?? '',
    fiber: initialData.fiber ?? '',
    sugars: initialData.sugars ?? '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => api.patch(`/nutrition/foods/${initialData.id}/`, {
      ...form,
      calories: Number(form.calories), protein: Number(form.protein),
      carbs: Number(form.carbs), fat: Number(form.fat),
      fiber: Number(form.fiber) || 0, sugars: Number(form.sugars) || 0,
    }),
    onSuccess: () => { qc.invalidateQueries(['admin-foods']); onBack() },
  })

  const fields = [
    ['name','Name','text','col-span-2'], ['brand','Brand','text','col-span-2'],
    ['calories','Calories (kcal)','number',''], ['protein','Protein (g)','number',''],
    ['carbs','Carbs (g)','number',''], ['fat','Fat (g)','number',''],
    ['fiber','Fiber (g)','number',''], ['sugars','Sugars (g)','number',''],
  ]

  return (
    <div className="max-w-xl space-y-5">
      <SectionTitle>EDIT FOOD — {initialData.name}</SectionTitle>
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-5">
        <p className="text-xs text-ink-500 mb-4">All nutritional values are per 100g.</p>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(([k, label, type, span]) => (
            <div key={k} className={span}>
              <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">{label}</label>
              <input type={type} value={form[k]} onChange={e => set(k, e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onBack} className="px-4 py-2 bg-cream-100 text-ink-700 rounded hover:bg-cream-200 text-sm transition-colors">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-2 rounded text-sm transition-colors disabled:opacity-40">
            {mutation.isPending ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Exercises ──────────────────────────────────────────────────────────── */
const EQUIPMENT_OPTIONS = ['barbell','dumbbell','machine','cable','bodyweight','kettlebell','resistance_band','other']

function MuscleActivationBar({ level }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={`w-2 h-2 rounded-sm ${i < level ? (level >= 8 ? 'bg-teal-500' : level >= 5 ? 'bg-teal-300' : 'bg-cream-400') : 'bg-cream-200'}`} />
        ))}
      </div>
      <span className="text-xs text-ink-500">{level}/10</span>
    </div>
  )
}

function ExercisesTab({ onDetail }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', equipment: 'barbell', description: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['admin-exercises', search],
    queryFn: () => api.get(`/workouts/admin/exercises/?search=${search}`).then(r => r.data),
    keepPreviousData: true,
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/workouts/exercises/', form),
    onSuccess: () => { qc.invalidateQueries(['admin-exercises']); setForm({ name: '', equipment: 'barbell', description: '' }); setShowAdd(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/workouts/exercises/${id}/`),
    onSuccess: () => qc.invalidateQueries(['admin-exercises']),
  })

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle>EXERCISES <span className="text-ink-400 font-sans text-base normal-case font-normal">({exercises.length})</span></SectionTitle>
        <button onClick={() => setShowAdd(s => !s)}
          className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-display tracking-widest px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)]">
          {showAdd ? 'CANCEL' : '+ ADD EXERCISE'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-cream-300 rounded p-4 space-y-3">
          <h3 className="font-display tracking-wide text-ink-900 text-sm">NEW EXERCISE</h3>
          <p className="text-xs text-ink-400">You can add muscle group activations after saving.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Equipment</label>
              <select value={form.equipment} onChange={e => set('equipment', e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15">
                {EQUIPMENT_OPTIONS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                className="w-full bg-cream-50 border border-cream-300 rounded px-3 py-2 text-ink-900 text-sm focus:outline-none focus:border-teal-500 resize-none transition-colors" />
            </div>
          </div>
          <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-display tracking-widest px-5 py-2 rounded transition-colors disabled:opacity-40">
            {createMutation.isPending ? 'SAVING…' : 'SAVE EXERCISE'}
          </button>
        </div>
      )}

      <input placeholder="Search exercises…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-white border border-cream-300 rounded px-4 py-2 text-ink-900 text-sm focus:outline-none focus:border-teal-500 transition-colors" />

      {isLoading ? <Spinner /> : (
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-3 px-4 py-2 bg-cream-50 border-b border-cream-200 text-xs font-display tracking-wide text-ink-500">
            <span>NAME</span><span>MUSCLE GROUPS</span><span>EQUIPMENT</span><span></span>
          </div>
          <div className="divide-y divide-cream-100 max-h-[62vh] overflow-y-auto">
            {exercises.map(ex => (
              <div key={ex.id} className="grid grid-cols-[2fr_2fr_1fr_auto] gap-3 px-4 py-3 items-start hover:bg-cream-50 transition-colors">
                <button className="text-left" onClick={() => onDetail({ type: 'exercise', data: ex })}>
                  <p className="text-sm font-medium text-ink-900 hover:text-teal-500 transition-colors">{ex.name}</p>
                  {ex.description && <p className="text-xs text-ink-400 truncate max-w-xs">{ex.description}</p>}
                </button>
                <div className="space-y-1">
                  {ex.muscle_activations?.length > 0
                    ? ex.muscle_activations.map(a => (
                        <div key={a.id} className="flex items-center gap-2">
                          <span className="text-xs text-ink-700 w-24 truncate">{a.muscle_group.name}</span>
                          <MuscleActivationBar level={a.level} />
                        </div>
                      ))
                    : <span className="text-xs text-ink-400">—</span>
                  }
                </div>
                <span className="text-sm text-ink-500 capitalize">{ex.equipment?.replace('_', ' ')}</span>
                <div className="flex gap-2">
                  <button onClick={() => onDetail({ type: 'exercise', data: ex })} className="text-xs text-ink-400 hover:text-ink-700">Edit</button>
                  <button onClick={() => { if (window.confirm(`Delete "${ex.name}"?`)) deleteMutation.mutate(ex.id) }} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
            {!exercises.length && <p className="px-4 py-8 text-center text-ink-500 text-sm">No exercises found.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseDetail({ data: initialData, onBack }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: initialData.name || '',
    equipment: initialData.equipment || 'other',
    description: initialData.description || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Re-fetch so we always have fresh activations
  const { data: exercise } = useQuery({
    queryKey: ['exercise-detail', initialData.id],
    queryFn: () => api.get(`/workouts/exercises/${initialData.id}/`).then(r => r.data),
    initialData: initialData,
  })

  const { data: muscles = [] } = useQuery({
    queryKey: ['muscle-groups'],
    queryFn: () => api.get('/workouts/muscle-groups/').then(r => r.data),
  })

  const [newMuscle, setNewMuscle] = useState({ muscle_group_id: '', level: 7 })

  const saveMutation = useMutation({
    mutationFn: () => api.patch(`/workouts/exercises/${initialData.id}/`, form),
    onSuccess: () => { qc.invalidateQueries(['admin-exercises']); onBack() },
  })

  const addMuscleMutation = useMutation({
    mutationFn: () => api.post(`/workouts/exercises/${initialData.id}/muscles/`, {
      muscle_group_id: Number(newMuscle.muscle_group_id),
      level: Number(newMuscle.level),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['exercise-detail', initialData.id])
      qc.invalidateQueries(['admin-exercises'])
      setNewMuscle({ muscle_group_id: '', level: 7 })
    },
  })

  const updateLevelMutation = useMutation({
    mutationFn: ({ id, level }) => api.patch(`/workouts/muscles/${id}/`, { level }),
    onSuccess: () => {
      qc.invalidateQueries(['exercise-detail', initialData.id])
      qc.invalidateQueries(['admin-exercises'])
    },
  })

  const removeMuscleMutation = useMutation({
    mutationFn: (id) => api.delete(`/workouts/muscles/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries(['exercise-detail', initialData.id])
      qc.invalidateQueries(['admin-exercises'])
    },
  })

  const activations = exercise?.muscle_activations ?? []
  const usedMuscleIds = new Set(activations.map(a => a.muscle_group.id))

  return (
    <div className="max-w-2xl space-y-5">
      <SectionTitle>EDIT EXERCISE — {initialData.name}</SectionTitle>

      {/* Basic info */}
      <div className="bg-white border border-cream-300 rounded p-5 space-y-3">
        <p className="text-xs font-display tracking-widest text-ink-500">BASIC INFO</p>
        <div>
          <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Equipment</label>
          <select value={form.equipment} onChange={e => set('equipment', e.target.value)}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15">
            {EQUIPMENT_OPTIONS.map(e => <option key={e} value={e}>{e.replace('_',' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full bg-cream-50 border border-cream-300 rounded px-3 py-2 text-ink-900 text-sm focus:outline-none focus:border-teal-500 resize-none transition-colors" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onBack} className="px-4 py-2 bg-cream-100 text-ink-700 rounded hover:bg-cream-200 text-sm transition-colors">Cancel</button>
          <button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-2 rounded text-sm transition-colors disabled:opacity-40">
            {saveMutation.isPending ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>

      {/* Muscle activations */}
      <div className="bg-white border border-cream-300 rounded p-5 space-y-3">
        <p className="text-xs font-display tracking-widest text-ink-500">MUSCLE GROUP ACTIVATIONS</p>
        <p className="text-xs text-ink-400">Level 10 = primary mover &nbsp;·&nbsp; Level 1 = minimal involvement</p>

        {activations.length > 0 ? (
          <div className="divide-y divide-cream-100">
            {activations.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="text-sm text-ink-900 w-32 flex-shrink-0">{a.muscle_group.name}</span>
                <div className="flex items-center gap-1.5 flex-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <button key={i}
                      onClick={() => updateLevelMutation.mutate({ id: a.id, level: i + 1 })}
                      className={`w-5 h-5 rounded text-xs font-medium transition-colors ${
                        i < a.level
                          ? (a.level >= 8 ? 'bg-teal-500 text-white' : a.level >= 5 ? 'bg-teal-300 text-white' : 'bg-cream-400 text-ink-700')
                          : 'bg-cream-100 text-ink-400 hover:bg-cream-200'
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                  <span className="text-xs text-ink-500 ml-1">{a.level}/10</span>
                </div>
                <button onClick={() => removeMuscleMutation.mutate(a.id)}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">No muscle groups assigned yet.</p>
        )}

        {/* Add new */}
        <div className="flex items-end gap-2 pt-2 border-t border-cream-100">
          <div className="flex-1">
            <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Add Muscle Group</label>
            <select value={newMuscle.muscle_group_id} onChange={e => setNewMuscle(n => ({ ...n, muscle_group_id: e.target.value }))}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15">
              <option value="">— Select —</option>
              {muscles.filter(m => !usedMuscleIds.has(m.id)).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-ink-500 mb-1 uppercase tracking-wide">Level (1–10)</label>
            <input type="number" min={1} max={10} value={newMuscle.level}
              onChange={e => setNewMuscle(n => ({ ...n, level: e.target.value }))}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
          </div>
          <button onClick={() => addMuscleMutation.mutate()}
            disabled={!newMuscle.muscle_group_id || addMuscleMutation.isPending}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-display tracking-wide px-4 py-2 rounded transition-colors disabled:opacity-40">
            ADD
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Users ──────────────────────────────────────────────────────────────── */
function UsersTab({ onDetail }) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/auth/admin/users/').then(r => r.data.results ?? r.data),
  })

  return (
    <div className="max-w-4xl space-y-4">
      <SectionTitle>USERS <span className="text-ink-400 font-sans text-base normal-case font-normal">({users.length})</span></SectionTitle>
      {isLoading ? <Spinner /> : (
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3 px-4 py-2 bg-cream-50 border-b border-cream-200 text-xs font-display tracking-wide text-ink-500">
            <span>USER</span><span>EMAIL</span><span>GOAL</span><span>JOINED</span><span>ROLE</span>
          </div>
          <div className="divide-y divide-cream-100 max-h-[65vh] overflow-y-auto">
            {users.map(u => (
              <button key={u.id} onClick={() => onDetail({ type: 'user', data: u })}
                className="w-full grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center hover:bg-cream-50 transition-colors text-left">
                <div className="flex items-center gap-2">
                  {u.avatar
                    ? <img src={u.avatar} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                    : <div className="w-7 h-7 rounded-lg bg-navy-900 flex items-center justify-center text-white text-xs font-display flex-shrink-0">{u.username[0].toUpperCase()}</div>
                  }
                  <div>
                    <p className="text-sm font-medium text-ink-900">@{u.username}</p>
                    {u.full_name && <p className="text-xs text-ink-500">{u.full_name}</p>}
                  </div>
                </div>
                <span className="text-xs text-ink-500 truncate">{u.email}</span>
                <span className="text-xs text-ink-700 capitalize">{u.goal || '—'}</span>
                <span className="text-xs text-ink-500">{new Date(u.date_joined).toLocaleDateString()}</span>
                <span>{u.is_staff
                  ? <span className="text-xs bg-navy-900 text-teal-400 px-2 py-0.5 rounded font-display">ADMIN</span>
                  : <span className="text-xs bg-cream-100 text-ink-500 px-2 py-0.5 rounded">User</span>
                }</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserDetail({ data: u }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['admin-user-logs', u.id],
    queryFn: () => api.get(`/nutrition/admin/logs/?user_id=${u.id}`).then(r => r.data.results ?? r.data),
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['admin-user-sessions', u.id],
    queryFn: () => api.get(`/workouts/admin/sessions/?user_id=${u.id}`).then(r => r.data.results ?? r.data),
  })

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-user-posts', u.username],
    queryFn: () => api.get(`/social/users/${u.username}/posts/`).then(r => r.data.results ?? r.data),
  })

  const statItems = [
    { label: 'Weight', value: u.weight_kg ? `${u.weight_kg} kg` : '—' },
    { label: 'Height', value: u.height_cm ? `${u.height_cm} cm` : '—' },
    { label: 'BMI',    value: u.bmi ?? '—' },
    { label: 'TDEE',   value: u.tdee ? `${u.tdee} kcal` : '—' },
    { label: 'Goal',   value: u.goal || '—', cap: true },
    { label: 'Activity', value: u.activity_level?.replace('_',' ') || '—', cap: true },
    { label: 'Followers', value: u.followers_count ?? 0 },
    { label: 'Following', value: u.following_count ?? 0 },
  ]

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-5 flex items-center gap-4">
        {u.avatar
          ? <img src={u.avatar} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
          : <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center text-white text-2xl font-display flex-shrink-0">{u.username[0].toUpperCase()}</div>
        }
        <div>
          <p className="text-xl font-display tracking-wide text-ink-900">@{u.username}</p>
          {u.full_name && <p className="text-ink-500 text-sm">{u.full_name}</p>}
          <p className="text-xs text-ink-400 mt-1">{u.email} · joined {new Date(u.date_joined).toLocaleDateString()}</p>
          {u.bio && <p className="text-sm text-ink-700 mt-1">{u.bio}</p>}
        </div>
        {u.is_staff && <span className="ml-auto text-xs bg-navy-900 text-teal-400 px-2 py-0.5 rounded font-display">ADMIN</span>}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {statItems.map(({ label, value, cap }) => (
          <div key={label} className="bg-cream-50 rounded-xl p-3 text-center">
            <p className={`text-base font-display text-ink-900 ${cap ? 'capitalize' : ''}`}>{value}</p>
            <p className="text-xs text-ink-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Three columns: meal logs, workout sessions, posts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Meal logs */}
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
          <div className="px-4 py-2 bg-cream-50 border-b border-cream-200">
            <p className="font-display tracking-wide text-ink-900 text-xs">MEAL LOGS ({logs.length})</p>
          </div>
          <div className="divide-y divide-cream-100 max-h-72 overflow-y-auto">
            {logs.slice(0, 30).map(log => (
              <div key={log.id} className="px-3 py-2">
                <p className="text-xs font-medium text-ink-900">{log.date} — <span className="capitalize">{log.meal_type}</span></p>
                {log.items?.map(item => (
                  <p key={item.id} className="text-xs text-ink-500 truncate">{item.food_item?.name ?? 'Recipe'} · {item.nutrition?.calories ?? '?'} kcal</p>
                ))}
              </div>
            ))}
            {!logs.length && <p className="px-3 py-4 text-xs text-ink-400 text-center">No logs yet.</p>}
          </div>
        </div>

        {/* Workout sessions */}
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
          <div className="px-4 py-2 bg-cream-50 border-b border-cream-200">
            <p className="font-display tracking-wide text-ink-900 text-xs">WORKOUT SESSIONS ({sessions.length})</p>
          </div>
          <div className="divide-y divide-cream-100 max-h-72 overflow-y-auto">
            {sessions.slice(0, 30).map(s => (
              <div key={s.id} className="px-3 py-2">
                <p className="text-xs font-medium text-ink-900">{s.date} — {s.name || 'Workout'}</p>
                <p className="text-xs text-ink-500">{s.exercises_count ?? 0} exercises · {s.duration_minutes ? `${s.duration_minutes} min` : ''}</p>
              </div>
            ))}
            {!sessions.length && <p className="px-3 py-4 text-xs text-ink-400 text-center">No sessions yet.</p>}
          </div>
        </div>

        {/* Posts */}
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
          <div className="px-4 py-2 bg-cream-50 border-b border-cream-200">
            <p className="font-display tracking-wide text-ink-900 text-xs">POSTS ({posts.length})</p>
          </div>
          <div className="divide-y divide-cream-100 max-h-72 overflow-y-auto">
            {posts.slice(0, 20).map(p => (
              <div key={p.id} className="px-3 py-2">
                <p className="text-xs text-ink-700 line-clamp-2">{p.content || '[media only]'}</p>
                <p className="text-xs text-ink-400 mt-0.5">{new Date(p.created_at).toLocaleDateString()} · {p.likes_count} likes</p>
              </div>
            ))}
            {!posts.length && <p className="px-3 py-4 text-xs text-ink-400 text-center">No posts yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return <h2 className="text-xl font-display tracking-wide text-ink-900">{children}</h2>
}
function Spinner() {
  return <div className="flex items-center justify-center h-32 text-ink-400 text-sm">Loading…</div>
}
