import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiLink, FiUsers, FiMoon, FiSun, FiEye, FiEyeOff, FiRefreshCw, FiShield, FiGrid } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../context/store';
import { initials, avatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const COLUMNS = ['Name','Email','Phone','City','Educational Qualification','Job title','Job History','Skills','HR Evaluation','ATS Score','Interview Status','Interview Date','Resume URL'];

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-5">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-border dark:border-surface-border-dark">
        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white font-display">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function Settings() {
  const { apiKey, setApiKey, fetchCandidates, loading, darkMode, setDarkMode } = useAppStore();
  const { user, users } = useAuthStore();
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const isAdmin = user?.role === 'Admin';

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
          <FiShield className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-gray-400 text-sm">Settings are available to HR Admin only.</p>
      </div>
    );
  }

  const handleSave = () => {
    setApiKey(localKey);
    setSaved(true);
    setTimeout(() => {
      fetchCandidates(localKey);
      toast.success('API key saved. Syncing data…');
    }, 200);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center"><FiSettings className="w-5 h-5 text-white" /></span>
          Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">Admin-only platform configuration</p>
      </motion.div>

      {/* Google Sheets */}
      <Section title="Google Sheets Integration" icon={FiLink}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Google API Key</label>
            <div className="relative">
              <input value={localKey} onChange={e => { setLocalKey(e.target.value); setSaved(false); }} type={showKey ? 'text' : 'password'}
                placeholder="AIza…"
                className="input pr-10 font-mono text-sm" />
              <button onClick={() => setShowKey(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Get your key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">Google Cloud Console</a> → Enable Sheets API → Create API Key
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 font-mono text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div><span className="text-gray-400">Sheet ID:</span> 1_da4wqDPxCKnJXF9O5Tq0YiHfTWS0Iy_MsQqplX4W6U</div>
            <div><span className="text-gray-400">Sheet Name:</span> Sheet1</div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Connecting…' : 'Save & Sync'}
            </button>
            {saved && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 text-sm font-semibold">✓ Saved & syncing</motion.span>}
          </div>
        </div>
      </Section>

      {/* Column mapping */}
      <Section title="Google Sheet Column Mapping" icon={FiGrid}>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your Google Sheet's Row 1 must have these exact column headers:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COLUMNS.map((col, i) => (
            <div key={col} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-gray-300 dark:text-gray-600 w-4">{i + 1}</span>
              <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{col}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Theme */}
      <Section title="Appearance" icon={darkMode ? FiMoon : FiSun}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Dark Mode</div>
            <div className="text-xs text-gray-400 mt-0.5">Toggle between light and dark theme</div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-brand-600' : 'bg-gray-200'}`}>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 flex items-center justify-center ${darkMode ? 'translate-x-6' : ''}`}>
              {darkMode ? <FiMoon className="w-2.5 h-2.5 text-brand-600" /> : <FiSun className="w-2.5 h-2.5 text-amber-500" />}
            </div>
          </button>
        </div>
      </Section>

      {/* Users */}
      <Section title="Registered Users" icon={FiUsers}>
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(u.name || '') }}>
                {initials(u.name || '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.name}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge text-xs ${u.role === 'Admin' ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'}`}>
                  {u.role}
                </span>
                <span className="text-xs text-gray-300 dark:text-gray-600">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Backend */}
      <Section title="Backend Configuration" icon={FiShield}>
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 font-mono text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <div><span className="text-gray-400">API URL:</span> {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}</div>
            <div><span className="text-gray-400">Docs:</span> {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/docs</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
            <div className="font-bold mb-2">Start FastAPI Backend:</div>
            <code className="block bg-black/10 rounded-lg px-3 py-2 text-xs font-mono">cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload</code>
          </div>
          <div className="text-xs text-gray-400">AI features (Interview Assistant, Fraud Detection) require the backend running with a valid OpenAI API key in <code className="font-mono">.env</code>.</div>
        </div>
      </Section>
    </div>
  );
}
