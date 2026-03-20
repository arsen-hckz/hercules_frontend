import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Social() {
  const [activeTab, setActiveTab] = useState('feed')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-display tracking-wide text-ink-900">FEED</h2>

      {/* Pill tabs */}
      <div className="flex bg-cream-100 rounded-xl p-1 gap-1">
        {[['feed', 'Feed'], ['explore', 'Explore']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-xs font-display tracking-wide rounded-lg ${
              activeTab === tab
                ? 'bg-white shadow-sm text-teal-500 font-medium'
                : 'text-ink-500 hover:text-ink-700'
            }`}>
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      <CreatePost />

      {activeTab === 'feed' ? <Feed /> : <Explore />}
    </div>
  )
}

function CreatePost() {
  const [content, setContent] = useState('')
  const [mediaFiles, setMediaFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const fileInputRef = useRef(null)
  const qc = useQueryClient()

  function handleFiles(e) {
    const files = Array.from(e.target.files)
    setMediaFiles(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...files.map(f => ({ url: URL.createObjectURL(f), type: f.type }))])
    e.target.value = ''
  }

  function removeFile(i) {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('content', content)
      mediaFiles.forEach(f => fd.append('media_files', f))
      return api.post('/social/posts/', fd)
    },
    onSuccess: () => {
      setContent('')
      setMediaFiles([])
      setPreviews([])
      qc.invalidateQueries(['feed'])
      qc.invalidateQueries(['all-posts'])
    },
  })

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-5">
      <textarea
        placeholder="Share your workout, progress, or thoughts..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        className="w-full bg-cream-50 border border-cream-200 rounded-xl px-4 py-3 text-ink-900 text-sm resize-none focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
      />

      {previews.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {previews.map((p, i) => (
            <div key={i} className="relative group">
              {p.type.startsWith('video')
                ? <video src={p.url} className="h-20 w-28 object-cover rounded-xl" />
                : <img src={p.url} alt="" className="h-20 w-28 object-cover rounded-xl" />
              }
              <button
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100"
              >×</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-ink-500 hover:text-teal-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cream-50"
        >
          <span>📎</span> Add photo / video
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
        <button
          onClick={() => mutation.mutate()}
          disabled={(!content.trim() && mediaFiles.length === 0) || mutation.isPending}
          className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-display tracking-widest px-5 py-2 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-40"
        >
          {mutation.isPending ? 'POSTING...' : 'POST'}
        </button>
      </div>
    </div>
  )
}

function Feed() {
  const { data } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get('/social/feed/').then(r => r.data.results),
  })

  if (!data?.length) return (
    <div className="text-center py-16 text-ink-500 text-sm">
      Your feed is empty. Follow some users to see their posts!
    </div>
  )

  return (
    <div className="space-y-3">
      {data.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  )
}

function Explore() {
  const { data } = useQuery({
    queryKey: ['all-posts'],
    queryFn: () => api.get('/social/posts/').then(r => r.data.results),
  })

  return (
    <div className="space-y-3">
      {data?.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  )
}

function PostCard({ post }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showComments, setShowComments] = useState(false)

  const likeMutation = useMutation({
    mutationFn: () => post.is_liked
      ? api.delete(`/social/posts/${post.id}/unlike/`)
      : api.post(`/social/posts/${post.id}/like/`),
    onSuccess: () => { qc.invalidateQueries(['feed']); qc.invalidateQueries(['all-posts']) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/social/posts/${post.id}/`),
    onSuccess: () => { qc.invalidateQueries(['feed']); qc.invalidateQueries(['all-posts']) },
  })

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
          {post.user.avatar
            ? <img src={post.user.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-navy-900 flex items-center justify-center text-white font-display text-sm">{post.user.username[0].toUpperCase()}</div>
          }
        </div>
        <div className="flex-1">
          <Link to={`/profile/${post.user.username}`} className="font-medium text-ink-900 text-sm hover:text-teal-500">
            @{post.user.username}
          </Link>
          <p className="text-xs text-ink-300 mt-0.5">{new Date(post.created_at).toLocaleString()}</p>
        </div>
        {user?.username === post.user.username && (
          <button onClick={() => deleteMutation.mutate()} className="text-xs text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg">Delete</button>
        )}
      </div>

      {post.content && <p className="text-ink-900 text-sm mb-4 leading-relaxed">{post.content}</p>}

      {post.media?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {post.media.map(m => (
            m.media_type === 'image'
              ? <img key={m.id} src={m.file} className="rounded-xl w-full object-cover max-h-64" />
              : <video key={m.id} src={m.file} controls className="rounded-xl w-full" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-ink-500 border-t border-cream-100 pt-3">
        <button onClick={() => likeMutation.mutate()}
          className={`flex items-center gap-1.5 hover:text-ink-900 px-2 py-1 rounded-lg hover:bg-cream-50 ${post.is_liked ? 'text-teal-500' : ''}`}>
          {post.is_liked ? '❤️' : '🤍'} {post.likes_count}
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-ink-900 px-2 py-1 rounded-lg hover:bg-cream-50">
          💬 {post.comments_count}
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </div>
  )
}

function CommentsSection({ postId }) {
  const [text, setText] = useState('')
  const qc = useQueryClient()

  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.get(`/social/posts/${postId}/comments/`).then(r => r.data.results),
  })

  const mutation = useMutation({
    mutationFn: () => api.post(`/social/posts/${postId}/comments/`, { content: text }),
    onSuccess: () => { setText(''); qc.invalidateQueries(['comments', postId]) },
  })

  return (
    <div className="mt-3 border-t border-cream-100 pt-3 space-y-2">
      {comments?.map(c => (
        <div key={c.id} className="flex gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
            {c.user.avatar
              ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-cream-200 flex items-center justify-center text-xs text-ink-700 font-display">{c.user.username[0].toUpperCase()}</div>
            }
          </div>
          <div className="bg-cream-50 rounded-xl px-3 py-2 flex-1">
            <span className="text-xs font-medium text-teal-500">@{c.user.username} </span>
            <span className="text-xs text-ink-700">{c.content}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-teal-500" />
        <button onClick={() => mutation.mutate()} disabled={!text.trim()}
          className="bg-teal-500 text-white text-xs px-4 py-2 rounded-xl hover:bg-teal-600 disabled:opacity-40 font-display tracking-wide shadow-[0_4px_12px_rgba(59,191,191,0.2)]">
          Send
        </button>
      </div>
    </div>
  )
}
