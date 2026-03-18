import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Social() {
  const [activeTab, setActiveTab] = useState('feed')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Social</h2>
      </div>

      <div className="flex gap-2">
        {[['feed', '🏠 Feed'], ['explore', '🔍 Explore']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {label}
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
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => api.post('/social/posts/', { content }),
    onSuccess: () => { setContent(''); qc.invalidateQueries(['feed']) },
  })

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <textarea
        placeholder="Share your workout, progress, or thoughts..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-orange-500"
      />
      <div className="flex justify-end mt-2">
        <button onClick={() => mutation.mutate()} disabled={!content.trim() || mutation.isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-40">
          {mutation.isPending ? 'Posting...' : 'Post'}
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
    <div className="text-center py-12 text-gray-500">
      <p>Your feed is empty. Follow some users to see their posts!</p>
    </div>
  )

  return (
    <div className="space-y-4">
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
    <div className="space-y-4">
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
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
          {post.user.username[0].toUpperCase()}
        </div>
        <div>
          <Link to={`/profile/${post.user.username}`} className="font-semibold text-white hover:text-orange-400">
            @{post.user.username}
          </Link>
          <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
        </div>
        {user?.username === post.user.username && (
          <button onClick={() => deleteMutation.mutate()} className="ml-auto text-xs text-red-400 hover:underline">Delete</button>
        )}
      </div>

      {post.content && <p className="text-gray-200 mb-3 leading-relaxed">{post.content}</p>}

      {post.media?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {post.media.map(m => (
            m.media_type === 'image'
              ? <img key={m.id} src={m.file} className="rounded-lg w-full object-cover max-h-64" />
              : <video key={m.id} src={m.file} controls className="rounded-lg w-full" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-800 pt-3 mt-3">
        <button onClick={() => likeMutation.mutate()}
          className={`flex items-center gap-1.5 hover:text-white transition-colors ${post.is_liked ? 'text-orange-400' : ''}`}>
          {post.is_liked ? '❤️' : '🤍'} {post.likes_count}
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-white transition-colors">
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
    <div className="mt-4 border-t border-gray-800 pt-4 space-y-3">
      {comments?.map(c => (
        <div key={c.id} className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
            {c.user.username[0].toUpperCase()}
          </div>
          <div className="bg-gray-800 rounded-xl px-3 py-2 flex-1">
            <span className="text-sm font-semibold text-orange-400">@{c.user.username} </span>
            <span className="text-sm text-gray-300">{c.content}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
        <button onClick={() => mutation.mutate()} disabled={!text.trim()}
          className="bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-40">
          Send
        </button>
      </div>
    </div>
  )
}
