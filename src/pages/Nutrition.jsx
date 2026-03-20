import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BrowserMultiFormatReader } from '@zxing/browser'
import api from '../api/axios'

const today = new Date().toISOString().split('T')[0]
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

// Macro targets (% of total calories)
const PROTEIN_PCT = 0.30  // 30% → ÷4 for grams
const CARBS_PCT   = 0.45  // 45% → ÷4 for grams
const FAT_PCT     = 0.25  // 25% → ÷9 for grams

function calcTargets(tdee) {
  if (!tdee) return { protein: 0, carbs: 0, fat: 0 }
  return {
    protein: Math.round(tdee * PROTEIN_PCT / 4),
    carbs:   Math.round(tdee * CARBS_PCT   / 4),
    fat:     Math.round(tdee * FAT_PCT     / 9),
  }
}

// Pure SVG donut chart – no external lib needed.
// The ring is split into 3 sectors proportional to each macro's calorie share.
// Each sector has a faded background (target) and a solid filled arc (consumed).
function MacroDonut({ proteinG, carbsG, fatG, tdee, calories }) {
  const R  = 58
  const C  = 2 * Math.PI * R   // full circumference
  const SZ = 160                // viewBox size
  const CX = SZ / 2, CY = SZ / 2
  const SW = 15                 // stroke width
  const GAP = 4                 // pixel gap between segments

  const targets = calcTargets(tdee)

  // Calorie-weighted ring proportions
  const pCals = (targets.protein * 4) || 1
  const cCals = (targets.carbs   * 4) || 1
  const fCals = (targets.fat     * 9) || 1
  const total = pCals + cCals + fCals

  const macros = [
    { label: 'Protein', g: proteinG, target: targets.protein, frac: pCals / total, bg: 'rgba(30,51,88,0.14)',   fill: '#1e3358' },
    { label: 'Carbs',   g: carbsG,   target: targets.carbs,   frac: cCals / total, bg: 'rgba(59,191,191,0.22)', fill: '#3bbfbf' },
    { label: 'Fat',     g: fatG,     target: targets.fat,     frac: fCals / total, bg: 'rgba(200,193,180,0.55)', fill: '#c8c1b4' },
  ]

  // strokeDashoffset: positive value = shift start counter-clockwise.
  // C/4 shifts the start from 3 o'clock to 12 o'clock (top).
  // Subtracting the cumulative arc length places each segment sequentially.
  let cumLen = 0
  const segments = macros.map(m => {
    const arcLen   = m.frac * C - GAP
    const fillFrac = m.target > 0 ? Math.min(m.g / m.target, 1) : 0
    const filled   = arcLen * fillFrac
    const offset   = C / 4 - cumLen
    cumLen += m.frac * C
    return { ...m, arcLen, filled, offset }
  })

  const remaining = tdee ? Math.round(tdee - calories) : null

  return (
    <div className="relative flex-shrink-0" style={{ width: SZ, height: SZ }}>
      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>
        {/* Faint full-ring track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(30,51,88,0.06)" strokeWidth={SW} />
        {segments.map((seg, i) => (
          <g key={i}>
            {/* Background sector (target) */}
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke={seg.bg} strokeWidth={SW}
              strokeDasharray={`${seg.arcLen} ${C - seg.arcLen}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
            />
            {/* Filled sector (consumed) */}
            {seg.filled > 0.5 && (
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke={seg.fill} strokeWidth={SW}
                strokeDasharray={`${seg.filled} ${C - seg.filled}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
              />
            )}
          </g>
        ))}
      </svg>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-display text-ink-900 leading-none">{Math.round(calories)}</p>
        <p className="text-xs text-ink-300 mt-0.5">kcal</p>
        {remaining !== null && (
          <p className={`text-xs font-medium mt-1 ${remaining < 0 ? 'text-red-400' : 'text-teal-500'}`}>
            {remaining < 0 ? `+${Math.abs(remaining)}` : `-${remaining}`}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState('log')
  const [selectedDate, setSelectedDate] = useState(today)
  const qc = useQueryClient()

  const { data: summary } = useQuery({
    queryKey: ['daily-summary', selectedDate],
    queryFn: () => api.get(`/nutrition/logs/summary/?date=${selectedDate}`).then(r => r.data),
  })

  const { data: logs } = useQuery({
    queryKey: ['meal-logs', selectedDate],
    queryFn: () => api.get(`/nutrition/logs/?date=${selectedDate}`).then(r => r.data.results),
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display tracking-wide text-ink-900">NUTRITION</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-white border border-cream-300 rounded-xl px-3 py-2 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 shadow-sm"
        />
      </div>

      {/* Daily summary */}
      {summary && (
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-5">
          <div className="flex items-center gap-6">
            {/* Macro donut */}
            <MacroDonut
              proteinG={Math.round(summary.nutrition.protein)}
              carbsG={Math.round(summary.nutrition.carbs)}
              fatG={Math.round(summary.nutrition.fat)}
              tdee={summary.tdee}
              calories={summary.nutrition.calories}
            />

            {/* Macro breakdown */}
            <div className="flex-1 space-y-3">
              {summary.tdee ? (
                (() => {
                  const targets = calcTargets(summary.tdee)
                  const macros = [
                    { label: 'Protein', g: Math.round(summary.nutrition.protein), target: targets.protein, color: '#1e3358', bg: 'bg-navy-900' },
                    { label: 'Carbs',   g: Math.round(summary.nutrition.carbs),   target: targets.carbs,   color: '#3bbfbf', bg: 'bg-teal-500' },
                    { label: 'Fat',     g: Math.round(summary.nutrition.fat),     target: targets.fat,     color: '#c8c1b4', bg: 'bg-cream-400' },
                  ]
                  return macros.map(m => {
                    const pct = m.target ? Math.min(Math.round(m.g / m.target * 100), 100) : 0
                    const over = m.target && m.g > m.target
                    return (
                      <div key={m.label}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-medium text-ink-700">{m.label}</span>
                          <span className="text-xs text-ink-400">
                            <span className={over ? 'text-red-400 font-medium' : 'text-ink-900 font-medium'}>{m.g}g</span>
                            {' / '}{m.target}g
                          </span>
                        </div>
                        <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${over ? 'bg-red-400' : m.bg}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                })()
              ) : (
                /* No TDEE set – show raw numbers */
                [
                  { label: 'Protein', value: Math.round(summary.nutrition.protein) },
                  { label: 'Carbs',   value: Math.round(summary.nutrition.carbs) },
                  { label: 'Fat',     value: Math.round(summary.nutrition.fat) },
                ].map(m => (
                  <div key={m.label} className="flex justify-between text-sm">
                    <span className="text-ink-500">{m.label}</span>
                    <span className="text-ink-900 font-medium">{m.value}g</span>
                  </div>
                ))
              )}

              {/* Target note */}
              {summary.tdee && (
                <p className="text-xs text-ink-400 pt-1 border-t border-cream-100">
                  Target: <span className="text-ink-700 font-medium">{summary.tdee} kcal/day</span>
                  {' · '}
                  <span className={summary.tdee - summary.nutrition.calories < 0 ? 'text-red-400 font-medium' : 'text-teal-500 font-medium'}>
                    {Math.abs(Math.round(summary.tdee - summary.nutrition.calories))} kcal {summary.tdee - summary.nutrition.calories < 0 ? 'over' : 'left'}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-cream-50">
            <div className="bg-cream-50 rounded-xl p-3 text-center">
              <p className="text-lg font-display text-ink-900">{Math.round(summary.nutrition.fiber)}g</p>
              <p className="text-xs text-ink-500 mt-0.5">Fiber</p>
            </div>
            <div className="bg-cream-50 rounded-xl p-3 text-center">
              <p className="text-lg font-display text-ink-900">{Math.round(summary.nutrition.sugars)}g</p>
              <p className="text-xs text-ink-500 mt-0.5">Sugars</p>
            </div>
          </div>
        </div>
      )}

      {/* Pill tabs */}
      <div className="flex bg-cream-100 rounded-xl p-1 gap-1">
        {['log', 'search', 'recipes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-xs font-display tracking-wide rounded-lg ${
              activeTab === tab
                ? 'bg-white shadow-sm text-teal-500 font-medium'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {tab === 'log' ? 'MEAL LOG' : tab === 'search' ? 'FIND FOOD' : 'RECIPES'}
          </button>
        ))}
      </div>

      {activeTab === 'log' && <MealLogTab logs={logs} selectedDate={selectedDate} qc={qc} />}
      {activeTab === 'search' && <FoodSearchTab selectedDate={selectedDate} qc={qc} />}
      {activeTab === 'recipes' && <RecipesTab />}
    </div>
  )
}

function MealLogTab({ logs, selectedDate, qc }) {
  const [showForm, setShowForm] = useState(null)
  const [showSubmit, setShowSubmit] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/nutrition/logs/${id}/`),
    onSuccess: () => qc.invalidateQueries(['meal-logs']),
  })

  return (
    <div className="space-y-3">
      {MEAL_TYPES.map(type => {
        const typeLogs = logs?.filter(l => l.meal_type === type) ?? []
        return (
          <div key={type} className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-100 bg-cream-50/50">
              <h4 className="font-display tracking-wide text-ink-900 text-sm">{type.toUpperCase()}</h4>
              <button
                onClick={() => setShowForm(type)}
                className="text-xs text-teal-500 hover:text-teal-600 font-medium bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg"
              >
                + Add
              </button>
            </div>
            <div className="divide-y divide-cream-50">
              {typeLogs.map(log => (
                <div key={log.id} className="px-5 py-3">
                  {log.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm py-0.5">
                      <span className="text-ink-700">{item.food_item?.name ?? 'Recipe'} {item.quantity_grams ? `(${item.quantity_grams}g)` : ''}</span>
                      <span className="text-ink-500 font-medium">{item.nutrition?.calories} kcal</span>
                    </div>
                  ))}
                  <button onClick={() => deleteMutation.mutate(log.id)} className="text-xs text-red-400 hover:text-red-600 mt-1.5">Remove</button>
                </div>
              ))}
              {typeLogs.length === 0 && <p className="px-5 py-4 text-xs text-ink-300">Nothing logged yet.</p>}
            </div>
          </div>
        )
      })}

      <div className="bg-white rounded-2xl border border-teal-400/20 p-5 text-center shadow-[0_2px_12px_rgba(59,191,191,0.08)]">
        <p className="text-ink-500 text-sm mb-3">
          Is your product missing? Feel free to add it —{' '}
          <span className="text-teal-500 font-medium">together we grow stronger!</span>
        </p>
        <button
          onClick={() => setShowSubmit(true)}
          className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-display tracking-widest px-6 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)]"
        >
          + ADD MISSING FOOD
        </button>
      </div>

      {showForm && (
        <AddMealForm
          mealType={showForm}
          date={selectedDate}
          onClose={() => setShowForm(null)}
          onSuccess={() => { setShowForm(null); qc.invalidateQueries(['meal-logs']); qc.invalidateQueries(['daily-summary']) }}
        />
      )}
      {showSubmit && <SubmitFoodForm onClose={() => setShowSubmit(false)} />}
    </div>
  )
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (result) {
        onResult(result.getText())
        reader.reset()
      }
    }).catch(() => setError('Camera access denied or not available.'))

    return () => {
      try { reader.reset() } catch (_) {}
    }
  }, [onResult])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display tracking-wide text-ink-900 text-sm">SCAN BARCODE</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-100">×</button>
        </div>
        {error ? (
          <p className="text-red-500 text-sm text-center py-6">{error}</p>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} className="w-full" style={{ height: 280, objectFit: 'cover' }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-32 border-2 border-teal-400 rounded-xl opacity-80" />
              </div>
            </div>
            <p className="text-ink-500 text-xs text-center mt-3">Point your camera at the product barcode</p>
          </>
        )}
      </div>
    </div>
  )
}

function AddMealForm({ mealType, date, onClose, onSuccess }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState(100)
  const [showScanner, setShowScanner] = useState(false)
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [barcodeError, setBarcodeError] = useState(null)
  const debouncedQuery = useDebounce(query)

  const { data: recentFoods = [] } = useQuery({
    queryKey: ['food-recent'],
    queryFn: () => api.get('/nutrition/foods/recent/').then(r => r.data),
    staleTime: 60000,
  })

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['food-search', debouncedQuery],
    queryFn: () => api.get(`/nutrition/foods/?search=${debouncedQuery}`).then(r => r.data),
    staleTime: 60000,
    enabled: debouncedQuery.length > 0,
  })

  const foods = debouncedQuery.length > 0
    ? searchResults
    : recentFoods.filter(f =>
        query.length === 0 ||
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        (f.brand && f.brand.toLowerCase().includes(query.toLowerCase()))
      )

  const mutation = useMutation({
    mutationFn: () => api.post('/nutrition/logs/', {
      date,
      meal_type: mealType,
      items: [{ food_item_id: selected.id, quantity_grams: Number(grams) }]
    }),
    onSuccess,
  })

  async function handleBarcodeScan(barcode) {
    setShowScanner(false)
    setBarcodeLoading(true)
    setBarcodeError(null)
    try {
      const { data } = await api.get(`/nutrition/foods/barcode/${barcode}/`)
      setSelected(data)
    } catch {
      setBarcodeError(`No product found for barcode ${barcode}.`)
    } finally {
      setBarcodeLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <h3 className="font-display tracking-wide text-ink-900 mb-5 capitalize">ADD TO {mealType.toUpperCase()}</h3>

          <div className="flex gap-2 mb-3">
            <input
              autoFocus
              placeholder="Search food..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null) }}
              className="flex-1 bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
            />
            <button
              onClick={() => setShowScanner(true)}
              title="Scan barcode"
              className="bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-teal-500 hover:bg-teal-50 hover:border-teal-400"
            >
              📷
            </button>
          </div>

          {barcodeLoading && <p className="text-xs text-teal-500 mb-2 px-1">Looking up barcode...</p>}
          {barcodeError && <p className="text-xs text-red-500 mb-2 px-1">{barcodeError}</p>}
          {isFetching && <p className="text-xs text-ink-300 mb-2 px-1">Searching...</p>}

          {foods?.length > 0 && !selected && (
            <div className="bg-cream-50 border border-cream-200 rounded-xl max-h-52 overflow-y-auto mb-4">
              {debouncedQuery.length === 0 && (
                <p className="text-xs text-ink-300 px-4 pt-2.5 pb-1 uppercase tracking-wide">Recently logged</p>
              )}
              {foods.map(f => (
                <button key={f.id} onClick={() => setSelected(f)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-cream-100 border-b border-cream-200 last:border-0">
                  <span className="text-ink-900 font-medium">{f.name}</span>
                  {f.brand && <span className="text-ink-500 ml-1">· {f.brand}</span>}
                  <span className="float-right text-teal-500 font-medium">{f.calories} kcal/100g</span>
                </button>
              ))}
            </div>
          )}
          {foods?.length === 0 && debouncedQuery && !isFetching && (
            <p className="text-sm text-ink-500 mb-4 px-1">No results found for "{debouncedQuery}".</p>
          )}

          {selected && (
            <div className="bg-teal-50 border border-teal-400/30 rounded-xl p-4 mb-4 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-ink-900 font-medium">{selected.name}</p>
                  {selected.brand && <p className="text-ink-500 text-xs mt-0.5">{selected.brand}</p>}
                </div>
                <button onClick={() => setSelected(null)} className="text-ink-300 hover:text-ink-700 text-xs">✕ change</button>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-ink-500">Grams:</label>
                <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
                  className="w-24 bg-white border border-cream-300 rounded-lg px-2 py-1.5 text-ink-900 focus:outline-none focus:border-teal-500 text-sm" />
                <span className="text-teal-500 font-display font-medium">{Math.round(selected.calories * grams / 100)} kcal</span>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-ink-500">
                <span>P: {Math.round(selected.protein * grams / 100)}g</span>
                <span>C: {Math.round(selected.carbs * grams / 100)}g</span>
                <span>F: {Math.round(selected.fat * grams / 100)}g</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button onClick={onClose} className="flex-1 bg-cream-100 text-ink-700 py-2.5 rounded-xl hover:bg-cream-200 text-sm font-medium">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={!selected}
              className="flex-1 bg-teal-500 text-white py-2.5 rounded-xl hover:bg-teal-600 disabled:opacity-40 text-sm font-display tracking-wide shadow-[0_4px_12px_rgba(59,191,191,0.25)]">
              ADD
            </button>
          </div>
        </div>
      </div>

      {showScanner && <BarcodeScanner onResult={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  )
}

function FoodSearchTab() {
  const [query, setQuery] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [barcodeResult, setBarcodeResult] = useState(null)
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [barcodeError, setBarcodeError] = useState(null)
  const debouncedQuery = useDebounce(query)

  const { data: foods, isFetching } = useQuery({
    queryKey: ['food-search', debouncedQuery],
    queryFn: () => api.get(`/nutrition/foods/?search=${debouncedQuery}`).then(r => r.data),
    staleTime: 60000,
    enabled: !barcodeResult && debouncedQuery.length > 0,
  })

  async function handleBarcodeScan(barcode) {
    setShowScanner(false)
    setBarcodeLoading(true)
    setBarcodeError(null)
    setBarcodeResult(null)
    try {
      const { data } = await api.get(`/nutrition/foods/barcode/${barcode}/`)
      setBarcodeResult(data)
    } catch {
      setBarcodeError(`No product found for barcode ${barcode}.`)
    } finally {
      setBarcodeLoading(false)
    }
  }

  const displayFoods = barcodeResult ? [barcodeResult] : foods

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          placeholder="Search food by name..."
          value={query}
          onChange={e => { setQuery(e.target.value); setBarcodeResult(null); setBarcodeError(null) }}
          className="flex-1 bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 shadow-sm"
        />
        <button
          onClick={() => setShowScanner(true)}
          title="Scan barcode"
          className="bg-white border border-teal-400/40 rounded-xl px-4 text-teal-500 hover:bg-teal-50 hover:border-teal-400 shadow-sm"
        >
          📷
        </button>
      </div>

      {barcodeLoading && <p className="text-teal-500 text-sm">Looking up barcode...</p>}
      {barcodeError && <p className="text-red-500 text-sm">{barcodeError}</p>}
      {isFetching && !barcodeResult && <p className="text-ink-500 text-sm">Searching...</p>}

      {displayFoods?.map(f => (
        <div key={f.id} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(30,51,88,0.06)] p-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-ink-900 text-sm">{f.name}</p>
            {f.brand && <p className="text-xs text-ink-500 mt-0.5">{f.brand}</p>}
            {f.barcode && <p className="text-xs text-ink-300 font-mono mt-0.5">{f.barcode}</p>}
          </div>
          <div className="text-right text-sm space-y-0.5">
            <p className="text-teal-500 font-display font-medium">{f.calories} kcal</p>
            <p className="text-xs text-ink-500">P: {f.protein}g · C: {f.carbs}g · F: {f.fat}g</p>
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl border border-teal-400/20 p-5 text-center shadow-[0_2px_12px_rgba(59,191,191,0.08)]">
        <p className="text-ink-500 text-sm mb-3">
          Is your product missing? Feel free to add it —{' '}
          <span className="text-teal-500 font-medium">together we grow stronger!</span>
        </p>
        <button
          onClick={() => setShowSubmit(true)}
          className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-display tracking-widest px-6 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)]"
        >
          + ADD MISSING FOOD
        </button>
      </div>

      {showSubmit && <SubmitFoodForm onClose={() => setShowSubmit(false)} />}
      {showScanner && <BarcodeScanner onResult={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}

function SubmitFoodForm({ onClose }) {
  const [form, setForm] = useState({
    name: '', brand: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', sugars: ''
  })
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.post('/nutrition/foods/submit/', {
      name: form.name,
      brand: form.brand,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      fiber: Number(form.fiber) || 0,
      sugars: Number(form.sugars) || 0,
    }),
    onSuccess: () => setSuccess(true),
  })

  const fields = [
    ['name', 'Food Name *', 'text'],
    ['brand', 'Brand (optional)', 'text'],
    ['calories', 'Calories (kcal) *', 'number'],
    ['protein', 'Protein (g) *', 'number'],
    ['carbs', 'Carbs (g) *', 'number'],
    ['fat', 'Fat (g) *', 'number'],
    ['fiber', 'Fiber (g)', 'number'],
    ['sugars', 'Sugars (g)', 'number'],
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-ink-900 font-display text-lg mb-1">Thank you!</p>
            <p className="text-ink-500 text-sm mb-5">Your food has been submitted and will be reviewed soon.</p>
            <button onClick={onClose} className="bg-teal-500 text-white px-6 py-2.5 rounded-xl hover:bg-teal-600 font-display tracking-wide text-sm shadow-[0_4px_12px_rgba(59,191,191,0.25)]">CLOSE</button>
          </div>
        ) : (
          <>
            <h3 className="font-display tracking-wide text-ink-900 mb-1">ADD MISSING FOOD</h3>
            <p className="text-ink-500 text-xs mb-5">All values are per 100g</p>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(([key, label, type]) => (
                <div key={key} className={key === 'name' || key === 'brand' ? 'col-span-2' : ''}>
                  <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 bg-cream-100 text-ink-700 py-2.5 rounded-xl hover:bg-cream-200 text-sm font-medium">Cancel</button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!form.name || !form.calories || mutation.isPending}
                className="flex-1 bg-teal-500 text-white py-2.5 rounded-xl hover:bg-teal-600 disabled:opacity-40 text-sm font-display tracking-wide shadow-[0_4px_12px_rgba(59,191,191,0.25)]"
              >
                {mutation.isPending ? 'SUBMITTING...' : 'SUBMIT'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RecipesTab() {
  const { data } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => api.get('/nutrition/recipes/').then(r => r.data.results),
  })

  return (
    <div className="space-y-3">
      {data?.map(r => (
        <div key={r.id} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(30,51,88,0.06)] p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-ink-900">{r.title}</p>
              <p className="text-xs text-ink-500 mt-0.5">by @{r.author} · {r.servings} serving{r.servings > 1 ? 's' : ''}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-teal-500 font-display font-medium">{r.nutrition_per_serving?.calories} kcal</p>
              <p className="text-xs text-ink-500">per serving</p>
            </div>
          </div>
          <div className="flex gap-3 mt-2 text-xs text-ink-500">
            <span>P: {r.nutrition_per_serving?.protein}g</span>
            <span>C: {r.nutrition_per_serving?.carbs}g</span>
            <span>F: {r.nutrition_per_serving?.fat}g</span>
          </div>
        </div>
      ))}
      {!data?.length && <p className="text-ink-500 text-sm">No public recipes yet.</p>}
    </div>
  )
}
