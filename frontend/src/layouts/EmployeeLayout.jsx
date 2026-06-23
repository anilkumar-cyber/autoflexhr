import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiBriefcase, FiUserPlus, FiCpu, FiList, FiGift, FiAward, FiUser, FiZap, FiLogOut, FiSun, FiMoon, FiMenu, FiChevronRight } from 'react-icons/fi';
import { useAuthStore, useAppStore } from '../context/store';
import { initials, avatarColor } from '../utils/helpers';
import NotificationBell from '../components/NotificationBell';
import toast from 'react-hot-toast';

const NAV = [
  { path: '/employee', label: 'Dashboard', icon: FiHome },
  { path: '/employee/positions', label: 'Open Positions', icon: FiBriefcase },
  { path: '/employee/refer', label: 'Scan & Refer', icon: FiUserPlus },
  { path: '/employee/ai-matching', label: 'AI Job Matching', icon: FiCpu },
  { path: '/employee/my-referrals', label: 'My Referrals', icon: FiList },
  { path: '/employee/wallet', label: 'Rewards Wallet', icon: FiGift },
  { path: '/employee/leaderboard', label: 'Leaderboard', icon: FiAward },
  { path: '/employee/profile', label: 'Profile', icon: FiUser },
];

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { darkMode, setDarkMode } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/auth'); toast.success('Signed out'); };
  const isActive = (path) => path === '/employee' ? location.pathname === '/employee' : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-border dark:border-surface-border-dark">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
          <FiZap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm text-gray-900 dark:text-white leading-none">Employee Portal</div>
          <div className="text-xs text-gray-400 mt-0.5">AutoFlexHR Referrals</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(path) ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
            {isActive(path) && <FiChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-border dark:border-surface-border-dark">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors w-full">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(user?.name || '') }}>
            {initials(user?.name || '')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
            <FiLogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-card dark:bg-surface-dark">
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-surface-card-dark border-r border-surface-border dark:border-surface-border-dark flex-shrink-0">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-surface-card-dark border-r border-surface-border dark:border-surface-border-dark z-50 md:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white dark:bg-surface-card-dark border-b border-surface-border dark:border-surface-border-dark flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500">
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">Employee Referral Program</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors">
              {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </button>
            <NotificationBell role="Employee" email={user?.email} accentColor="#10b981" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="h-full">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
