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
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
        {unread > 0 && (
          <button onClick={() => markAllRead.mutate()}
            className="text-sm text-orange-400 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {!data?.length && (
        <div className="text-center py-12 text-gray-500">No notifications yet.</div>
      )}

      <div className="space-y-2">
        {data?.map(n => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead.mutate(n.id)}
            className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-colors ${
              n.is_read ? 'bg-gray-900 border-gray-800' : 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15'
            }`}
          >
            <span className="text-2xl">{typeIcon[n.notification_type]}</span>
            <div className="flex-1">
              <p className="text-gray-200 text-sm">{n.message}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {!n.is_read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
