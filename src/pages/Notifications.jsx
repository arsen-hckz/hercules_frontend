import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

const typeIcon = { like: '❤️', comment: '💬', reply: '💬', follow: '👤' }

export default function Notifications() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/').then(r => r.data.results),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read/'),
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['unread-notifications']) },
  })

  const markRead = useMutation({
    mutationFn: (id) => api.post(`/notifications/${id}/read/`),
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['unread-notifications']) },
  })

  const unread = data?.filter(n => !n.is_read).length ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display tracking-wide text-ink-900">NOTIFICATIONS</h2>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="text-xs text-teal-500 hover:text-teal-600 font-medium bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg"
          >
            Mark all as read
          </button>
        )}
      </div>

      {!data?.length && (
        <div className="text-center py-16 text-ink-500 text-sm bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.06)]">
          No notifications yet.
        </div>
      )}

      <div className="space-y-2">
        {data?.map(n => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead.mutate(n.id)}
            className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer ${
              n.is_read
                ? 'bg-white shadow-[0_2px_8px_rgba(30,51,88,0.05)]'
                : 'bg-teal-50 border border-teal-400/20 shadow-[0_2px_12px_rgba(59,191,191,0.08)] hover:bg-teal-100/60'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${n.is_read ? 'bg-cream-100' : 'bg-teal-100'}`}>
              {typeIcon[n.notification_type] ?? '🔔'}
            </div>
            <div className="flex-1">
              <p className="text-ink-900 text-sm leading-relaxed">{n.message}</p>
              <p className="text-xs text-ink-300 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {!n.is_read && <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
