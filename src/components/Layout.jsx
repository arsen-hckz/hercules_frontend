import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import herculesLogo from '../assets/hercules-logo.png'
import { useT } from '../i18n'

const IconDashboard = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const IconNutrition = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
  </svg>
)

const IconWorkouts = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

const IconFeed = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
)

const IconProfile = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconBell = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const IconAdmin = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconLogout = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const IconSettings = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const navKeys = [
  { to: '/',            labelKey: 'dashboard',     Icon: IconDashboard },
  { to: '/nutrition',   labelKey: 'nutrition',      Icon: IconNutrition },
  { to: '/workouts',    labelKey: 'workouts',       Icon: IconWorkouts },
  { to: '/social',      labelKey: 'feed',           Icon: IconFeed },
  { to: '/profile',     labelKey: 'profile',        Icon: IconProfile },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const t = useT()

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
    <div className="min-h-screen bg-cream-50 text-ink-900 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-navy-900 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/8">
          <div className="bg-cream-50 rounded-xl px-3 py-2">
            <img src={herculesLogo} alt="Hercules" className="w-full h-auto object-contain" style={{ maxHeight: 52 }} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-xs text-white/30 font-display tracking-widest px-3 pb-2 pt-1">MENU</p>
          {navKeys.map(({ to, labelKey, Icon }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                  active
                    ? 'bg-teal-500/20 text-teal-400 font-medium'
                    : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                }`}
              >
                <Icon />
                <span className="font-display tracking-wide">{t(labelKey)}</span>
              </Link>
            )
          })}

          <div className="pt-2">
            <Link
              to="/notifications"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                pathname === '/notifications'
                  ? 'bg-teal-500/20 text-teal-400 font-medium'
                  : 'text-white/50 hover:bg-white/6 hover:text-white/80'
              }`}
            >
              <IconBell />
              <span className="font-display tracking-wide">{t('notifications')}</span>
              {notifData?.unread_count > 0 && (
                <span className="ml-auto bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-sans leading-none">
                  {notifData.unread_count}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-0.5">
          {/* User info → clicking goes to /settings */}
          {user && (
            <Link
              to="/settings"
              className={`flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl group ${
                pathname === '/settings' ? 'bg-teal-500/20' : 'hover:bg-white/6'
              }`}
            >
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                : <div className="w-7 h-7 rounded-lg bg-teal-500/30 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-display flex-shrink-0">{user.username[0].toUpperCase()}</div>
              }
              <p className="text-xs text-white/50 font-medium tracking-wide truncate flex-1 group-hover:text-white/70">
                @{user.username}
              </p>
              <span className="text-white/25 group-hover:text-white/50 flex-shrink-0"><IconSettings /></span>
            </Link>
          )}

          {user?.is_staff && (
            <Link to="/admin-panel"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                pathname === '/admin-panel'
                  ? 'bg-teal-500/20 text-teal-400 font-medium'
                  : 'text-teal-400/50 hover:bg-white/6 hover:text-teal-400'
              }`}>
              <IconAdmin />
              <span className="font-display tracking-wide">{t('admin')}</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:bg-white/6 hover:text-white/60 text-sm"
          >
            <IconLogout />
            <span className="font-display tracking-wide">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 p-8 bg-cream-50 min-h-screen">
        {children}
      </main>
    </div>
  )
}
