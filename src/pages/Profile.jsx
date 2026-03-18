import { useState, useEffect } from 'react'
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

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/me/', form),
    onSuccess: () => { fetchMe(); setEditing(false) },
  })

  if (!me) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        <button onClick={() => setEditing(!editing)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${editing ? 'bg-gray-700 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
            {me.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-white">@{me.username}</p>
            {me.full_name && <p className="text-gray-400">{me.full_name}</p>}
            {me.bio && <p className="text-sm text-gray-400 mt-1">{me.bio}</p>}
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
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Bio</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 resize-none" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="">—</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Goal</label>
                <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="bulk">Bulk</option>
                  <option value="cut">Cut</option>
                  <option value="maintain">Maintain</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Activity</label>
                <select value={form.activity_level} onChange={e => setForm({ ...form, activity_level: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </div>
            </div>

            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-40">
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
                <p className={`text-lg font-bold text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
              {profile.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold text-white">@{profile.username}</p>
              {profile.bio && <p className="text-sm text-gray-400 mt-1">{profile.bio}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-400">
                <span><strong className="text-white">{profile.followers_count}</strong> followers</span>
                <span><strong className="text-white">{profile.following_count}</strong> following</span>
              </div>
            </div>
          </div>
          <button onClick={() => followMutation.mutate()}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${profile.is_following ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
            {profile.is_following ? 'Unfollow' : 'Follow'}
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white">Posts</h3>
      <div className="space-y-4">
        {posts?.map(post => (
          <div key={post.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-200">{post.content}</p>
            <p className="text-xs text-gray-500 mt-2">{new Date(post.created_at).toLocaleString()} · {post.likes_count} likes</p>
          </div>
        ))}
        {!posts?.length && <p className="text-gray-500 text-sm">No posts yet.</p>}
      </div>
    </div>
  )
}
