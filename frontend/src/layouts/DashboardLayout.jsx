import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiUsers, FiBarChart2, FiTrello, FiCpu, FiSettings, FiZap, FiLogOut, FiSearch, FiBell, FiSun, FiMoon, FiRefreshCw, FiMenu, FiX, FiChevronRight } from 'react-icons/fi';
import { useAuthStore, useAppStore } from '../context/store';
import { initials, avatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const NAV = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/candidates', label: 'Candidates', icon: FiUsers },
  { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { path: '/pipeline', label: 'Pipeline', icon: FiTrello },
  { path: '/ai-assistant', label: 'AI Assistant', icon: FiCpu },
  { path: '/settings', label: 'Settings', icon: FiSettings, adminOnly: true },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { darkMode, setDarkMode, fetchCandidates, loading, candidates, lastRefresh } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [nextRefresh, setNextRefresh] = useState(Date.now() + 300000);
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(() => {
      fetchCandidates();
      setNextRefresh(Date.now() + 300000);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(Math.max(0, Math.round((nextRefresh - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [nextRefresh]);

  const handleRefresh = () => {
    fetchCandidates();
    setNextRefresh(Date.now() + 300000);
    setCountdown(300);
    toast.success('Data refreshed!');
  };

  const handleLogout = () => { logout(); navigate('/auth'); toast.success('Signed out'); };

  const navItems = NAV.filter(n => !n.adminOnly || user?.role === 'Admin');
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const SidebarContent = ({ collapsed }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-surface-border dark:border-surface-border-dark ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-brand">
          <FiZap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm text-gray-900 dark:text-white leading-none">AutoFlexHR</div>
            <div className="text-xs text-gray-400 mt-0.5">AI Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
            className={`sidebar-item ${isActive(path) ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? label : ''}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {!collapsed && isActive(path) && <FiChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
            {path === '/ai-assistant' && !collapsed && (
              <span className="ml-auto text-[10px] font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-full">AI</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Auto-refresh indicator */}
      {!collapsed && (
        <div className="px-4 py-2 mx-3 mb-2 bg-gray-50 dark:bg-white/5 rounded-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Auto-refresh</span>
            <span className="font-mono text-brand-500 font-semibold">{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</span>
          </div>
          <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(countdown/300)*100}%` }} />
          </div>
        </div>
      )}

      {/* User */}
      <div className={`p-3 border-t border-surface-border dark:border-surface-border-dark ${collapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${collapsed ? '' : 'w-full'}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(user?.name || '') }}>
            {initials(user?.name || '')}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name}</div>
                <div className="text-xs text-gray-400 truncate">{user?.role}</div>
              </div>
              <button onClick={handleLogout} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                <FiLogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-card dark:bg-surface-dark">
      {/* Desktop Sidebar */}
      <motion.aside animate={{ width: sidebarCollapsed ? 72 : 240 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col bg-white dark:bg-surface-card-dark border-r border-surface-border dark:border-surface-border-dark flex-shrink-0 overflow-hidden relative">
        <SidebarContent collapsed={sidebarCollapsed} />
        <button onClick={() => setSidebarCollapsed(s => !s)}
          className="absolute top-5 -right-3 w-6 h-6 bg-white dark:bg-gray-800 border border-surface-border dark:border-surface-border-dark rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-gray-600">
          <motion.div animate={{ rotate: sidebarCollapsed ? 0 : 180 }}><FiChevronRight className="w-3 h-3" /></motion.div>
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-surface-card-dark border-r border-surface-border dark:border-surface-border-dark z-50 md:hidden">
              <SidebarContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-surface-card-dark border-b border-surface-border dark:border-surface-border-dark flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500">
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-xs">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search candidates…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-surface-border dark:border-surface-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Refresh */}
            <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-500' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Syncing…' : 'Refresh'}</span>
            </button>

            {/* Last refresh */}
            {lastRefresh && (
              <span className="hidden lg:block text-xs text-gray-400">
                Synced {new Date(lastRefresh).toLocaleTimeString()}
              </span>
            )}

            {/* Dark mode */}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors">
              {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors">
              <FiBell className="w-4 h-4" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2 pl-2 border-l border-surface-border dark:border-surface-border-dark">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: avatarColor(user?.name || '') }}>
                {initials(user?.name || '')}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Error banner */}
        {useAppStore.getState().sheetError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2.5 flex items-center justify-between text-sm text-red-700 dark:text-red-400">
            <span>⚠️ {useAppStore.getState().sheetError}</span>
            <button onClick={handleRefresh} className="text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* Page content */}
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
