import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

const today = new Date().toISOString().split('T')[0]
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

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
        <h2 className="text-2xl font-bold text-white">Nutrition</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Daily summary */}
      {summary && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {[
              { label: 'Calories', value: Math.round(summary.nutrition.calories), unit: 'kcal', highlight: true },
              { label: 'Protein', value: Math.round(summary.nutrition.protein), unit: 'g' },
              { label: 'Carbs', value: Math.round(summary.nutrition.carbs), unit: 'g' },
              { label: 'Fat', value: Math.round(summary.nutrition.fat), unit: 'g' },
              { label: 'Fiber', value: Math.round(summary.nutrition.fiber), unit: 'g' },
              { label: 'Sugars', value: Math.round(summary.nutrition.sugars), unit: 'g' },
            ].map(({ label, value, unit, highlight }) => (
              <div key={label} className={`rounded-xl p-3 ${highlight ? 'bg-orange-500/20 border border-orange-500/40' : 'bg-gray-800'}`}>
                <p className={`text-lg font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>{value}</p>
                <p className="text-xs text-gray-400">{label} ({unit})</p>
              </div>
            ))}
          </div>
          {summary.tdee && (
            <p className="text-sm text-gray-400 mt-3 text-center">
              Target: <span className="text-white">{summary.tdee} kcal</span> ·
              Remaining: <span className={summary.tdee - summary.nutrition.calories < 0 ? 'text-red-400' : 'text-green-400'}>
                {Math.round(summary.tdee - summary.nutrition.calories)} kcal
              </span>
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['log', 'search', 'recipes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'log' ? '📋 Meal Log' : tab === 'search' ? '🔍 Find Food' : '📖 Recipes'}
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

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/nutrition/logs/${id}/`),
    onSuccess: () => qc.invalidateQueries(['meal-logs']),
  })

  return (
    <div className="space-y-3">
      {MEAL_TYPES.map(type => {
        const typeLogs = logs?.filter(l => l.meal_type === type) ?? []
        return (
          <div key={type} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <h4 className="font-semibold text-white capitalize">{type}</h4>
              <button onClick={() => setShowForm(type)} className="text-sm text-orange-400 hover:underline">+ Add</button>
            </div>
            <div className="divide-y divide-gray-800">
              {typeLogs.map(log => (
                <div key={log.id} className="px-5 py-3">
                  {log.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-300">{item.food_item?.name ?? 'Recipe'} {item.quantity_grams ? `(${item.quantity_grams}g)` : ''}</span>
                      <span className="text-gray-400">{item.nutrition?.calories} kcal</span>
                    </div>
                  ))}
                  <button onClick={() => deleteMutation.mutate(log.id)} className="text-xs text-red-400 hover:underline mt-1">Remove</button>
                </div>
              ))}
              {typeLogs.length === 0 && <p className="px-5 py-3 text-sm text-gray-600">Nothing logged yet.</p>}
            </div>
          </div>
        )
      })}
      {showForm && (
        <AddMealForm
          mealType={showForm}
          date={selectedDate}
          onClose={() => setShowForm(null)}
          onSuccess={() => { setShowForm(null); qc.invalidateQueries(['meal-logs']); qc.invalidateQueries(['daily-summary']) }}
        />
      )}
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

function AddMealForm({ mealType, date, onClose, onSuccess }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState(100)
  const debouncedQuery = useDebounce(query)

  const { data: foods, isFetching } = useQuery({
    queryKey: ['food-search', debouncedQuery],
    queryFn: () => api.get(`/nutrition/foods/?search=${debouncedQuery}`).then(r => r.data),
    staleTime: 60000,
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/nutrition/logs/', {
      date,
      meal_type: mealType,
      items: [{ food_item_id: selected.id, quantity_grams: Number(grams) }]
    }),
    onSuccess,
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 capitalize">Add to {mealType}</h3>
        <input
          autoFocus
          placeholder="Search food or browse below..."
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 mb-2"
        />
        {isFetching && <p className="text-xs text-gray-500 mb-1 px-1">Searching...</p>}
        {foods?.length > 0 && !selected && (
          <div className="bg-gray-800 rounded-lg max-h-52 overflow-y-auto mb-3 border border-gray-700">
            {foods.map(f => (
              <button key={f.id} onClick={() => setSelected(f)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-700 border-b border-gray-700/50 last:border-0">
                <span className="text-white font-medium">{f.name}</span>
                {f.brand && <span className="text-gray-400 ml-1">· {f.brand}</span>}
                <span className="float-right text-orange-400">{f.calories} kcal/100g</span>
              </button>
            ))}
          </div>
        )}
        {foods?.length === 0 && debouncedQuery && !isFetching && (
          <p className="text-sm text-gray-500 mb-3 px-1">No results found for "{debouncedQuery}".</p>
        )}
        {selected && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3 text-sm border border-orange-500/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium">{selected.name}</p>
                {selected.brand && <p className="text-gray-400 text-xs">{selected.brand}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xs">✕ change</button>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <label className="text-gray-400">Grams:</label>
              <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
                className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-orange-500" />
              <span className="text-orange-400 font-semibold">{Math.round(selected.calories * grams / 100)} kcal</span>
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span>P: {Math.round(selected.protein * grams / 100)}g</span>
              <span>C: {Math.round(selected.carbs * grams / 100)}g</span>
              <span>F: {Math.round(selected.fat * grams / 100)}g</span>
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg hover:bg-gray-700">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!selected}
            className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-40">
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

function FoodSearchTab({ selectedDate, qc }) {
  const [query, setQuery] = useState('')
  const { data: foods, isFetching } = useQuery({
    queryKey: ['food-search', query],
    queryFn: () => query.length > 1 ? api.get(`/nutrition/foods/?search=${query}`).then(r => r.data) : Promise.resolve([]),
    enabled: query.length > 1,
  })

  return (
    <div className="space-y-3">
      <input
        placeholder="Search food by name..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
      />
      {isFetching && <p className="text-gray-400 text-sm">Searching...</p>}
      {foods?.map(f => (
        <div key={f.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center">
          <div>
            <p className="font-medium text-white">{f.name}</p>
            {f.brand && <p className="text-sm text-gray-400">{f.brand}</p>}
          </div>
          <div className="text-right text-sm text-gray-400 space-y-0.5">
            <p className="text-orange-400 font-semibold">{f.calories} kcal</p>
            <p>P: {f.protein}g · C: {f.carbs}g · F: {f.fat}g</p>
          </div>
        </div>
      ))}
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
        <div key={r.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-white">{r.title}</p>
              <p className="text-sm text-gray-400">by @{r.author} · {r.servings} serving{r.servings > 1 ? 's' : ''}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-orange-400 font-semibold">{r.nutrition_per_serving?.calories} kcal</p>
              <p className="text-gray-400">per serving</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 text-xs text-gray-400">
            <span>P: {r.nutrition_per_serving?.protein}g</span>
            <span>C: {r.nutrition_per_serving?.carbs}g</span>
            <span>F: {r.nutrition_per_serving?.fat}g</span>
          </div>
        </div>
      ))}
      {!data?.length && <p className="text-gray-500 text-sm">No public recipes yet.</p>}
    </div>
  )
}
