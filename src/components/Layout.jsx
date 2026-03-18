import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/nutrition', label: 'Nutrition', icon: '🥗' },
  { to: '/workouts', label: 'Workouts', icon: '💪' },
  { to: '/social', label: 'Feed', icon: '📱' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const { data: notifData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => api.get('/notifications/unread/').then(r => r.data),
    refetchInterval: 30000,
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-orange-500 tracking-wide">HERCULES</h1>
          {user && <p className="text-sm text-gray-400 mt-1">@{user.username}</p>}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === to
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              <span className="font-medium">{label}</span>
            </Link>
          ))}
          <Link
            to="/notifications"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === '/notifications'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>🔔</span>
            <span className="font-medium">Notifications</span>
            {notifData?.unread_count > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifData.unread_count}
              </span>
            )}
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
