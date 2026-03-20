import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Profile() {
  const { username } = useParams()
  const { user: me, fetchMe } = useAuthStore()
  const isOwnProfile = !username || username === me?.username

  return isOwnProfile ? <OwnProfile fetchMe={fetchMe} me={me} /> : <UserProfile username={username} me={me} />
}

function OwnProfile({ me, fetchMe }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (me) setForm({
      first_name: me.first_name || '',
      last_name: me.last_name || '',
      bio: me.bio || '',
      gender: me.gender || '',
      date_of_birth: me.date_of_birth || '',
      height_cm: me.height_cm || '',
      weight_kg: me.weight_kg || '',
      goal: me.goal || 'maintain',
      target_weight_kg: me.target_weight_kg || '',
      activity_level: me.activity_level || 'moderate',
    })
  }, [me])

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (avatarFile) fd.append('avatar', avatarFile)
      return api.patch('/auth/me/', fd)
    },
    onSuccess: () => { fetchMe(); setEditing(false); setAvatarFile(null); setAvatarPreview(null) },
  })

  if (!me) return null

  const avatarSrc = avatarPreview || me.avatar

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display tracking-wide text-ink-900">MY PROFILE</h2>
        <button onClick={() => { setEditing(!editing); setAvatarFile(null); setAvatarPreview(null) }}
          className={`px-4 py-2 rounded-xl text-xs font-display tracking-widest ${
            editing
              ? 'bg-cream-200 text-ink-700 hover:bg-cream-300'
              : 'bg-teal-500 text-white hover:bg-teal-600 shadow-[0_4px_12px_rgba(59,191,191,0.25)]'
          }`}>
          {editing ? 'CANCEL' : 'EDIT PROFILE'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-6">
        {/* Avatar + basic info */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            {avatarSrc
              ? <img src={avatarSrc} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              : <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center text-white text-2xl font-display">{me.username[0].toUpperCase()}</div>
            }
            {editing && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl text-white text-xs font-medium opacity-0 hover:opacity-100"
              >
                Change
              </button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-xl font-display tracking-wide text-ink-900">@{me.username}</p>
            {me.full_name && <p className="text-ink-500 text-sm mt-0.5">{me.full_name}</p>}
            {me.bio && <p className="text-sm text-ink-500 mt-1">{me.bio}</p>}
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['first_name', 'First Name', 'text'], ['last_name', 'Last Name', 'text'],
                ['date_of_birth', 'Date of Birth', 'date'], ['height_cm', 'Height (cm)', 'number'],
                ['weight_kg', 'Weight (kg)', 'number'], ['target_weight_kg', 'Target Weight (kg)', 'number']
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">Bio</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={2}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 resize-none" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'gender', label: 'Gender', options: [['', '—'], ['M', 'Male'], ['F', 'Female'], ['O', 'Other']] },
                { key: 'goal', label: 'Goal', options: [['bulk', 'Bulk'], ['cut', 'Cut'], ['maintain', 'Maintain']] },
                { key: 'activity_level', label: 'Activity', options: [['sedentary', 'Sedentary'], ['light', 'Light'], ['moderate', 'Moderate'], ['active', 'Active'], ['very_active', 'Very Active']] },
              ].map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-xs text-ink-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500">
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest py-3 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-40 text-sm">
              {mutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'BMI', value: me.bmi ?? '—' },
              { label: 'TDEE', value: me.tdee ? `${me.tdee} kcal` : '—' },
              { label: 'Goal', value: me.goal, capitalize: true },
              { label: 'Activity', value: me.activity_level?.replace('_', ' '), capitalize: true },
              { label: 'Weight', value: me.weight_kg ? `${me.weight_kg} kg` : '—' },
              { label: 'Height', value: me.height_cm ? `${me.height_cm} cm` : '—' },
              { label: 'Followers', value: me.followers_count ?? 0 },
              { label: 'Following', value: me.following_count ?? 0 },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="bg-cream-50 rounded-xl p-3 text-center">
                <p className={`text-lg font-display text-ink-900 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                <p className="text-xs text-ink-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UserProfile({ username, me }) {
  const qc = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/auth/profile/${username}/`).then(r => r.data),
  })

  const { data: posts } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: () => api.get(`/social/users/${username}/posts/`).then(r => r.data.results),
  })

  const followMutation = useMutation({
    mutationFn: () => profile.is_following
      ? api.delete(`/auth/profile/${username}/unfollow/`)
      : api.post(`/auth/profile/${username}/follow/`),
    onSuccess: () => qc.invalidateQueries(['profile', username]),
  })

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-navy-900 flex items-center justify-center text-white text-2xl font-display">{profile.username[0].toUpperCase()}</div>
              }
            </div>
            <div>
              <p className="text-xl font-display tracking-wide text-ink-900">@{profile.username}</p>
              {profile.bio && <p className="text-sm text-ink-500 mt-1">{profile.bio}</p>}
              <div className="flex gap-4 mt-2 text-sm text-ink-500">
                <span><strong className="text-ink-900">{profile.followers_count}</strong> followers</span>
                <span><strong className="text-ink-900">{profile.following_count}</strong> following</span>
              </div>
            </div>
          </div>
          <button onClick={() => followMutation.mutate()}
            className={`px-4 py-2 rounded-xl text-xs font-display tracking-widest ${
              profile.is_following
                ? 'bg-cream-200 text-ink-700 hover:bg-cream-300'
                : 'bg-teal-500 text-white hover:bg-teal-600 shadow-[0_4px_12px_rgba(59,191,191,0.25)]'
            }`}>
            {profile.is_following ? 'UNFOLLOW' : 'FOLLOW'}
          </button>
        </div>
      </div>

      <h3 className="font-display tracking-wide text-ink-900 px-1">POSTS</h3>
      <div className="space-y-3">
        {posts?.map(post => (
          <div key={post.id} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(30,51,88,0.06)] p-4">
            <p className="text-ink-900 text-sm">{post.content}</p>
            <p className="text-xs text-ink-300 mt-2">{new Date(post.created_at).toLocaleString()} · {post.likes_count} likes</p>
          </div>
        ))}
        {!posts?.length && <p className="text-ink-500 text-sm">No posts yet.</p>}
      </div>
    </div>
  )
}
