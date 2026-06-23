import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiShield, FiRotateCcw, FiXCircle, FiInbox } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../context/store';
import { initials, avatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Trash() {
  const { user } = useAuthStore();
  const { fetchTrash, restoreCandidate, permanentlyDeleteCandidate } = useAppStore();
  const isAdmin = user?.role === 'Admin';
  const [trashed, setTrashed] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const rows = await fetchTrash(user?.role);
    setTrashed(rows);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
          <FiShield className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-gray-400 text-sm">Trash is available to HR Admin only.</p>
      </div>
    );
  }

  const handleRestore = async c => {
    const restored = await restoreCandidate(c.id, user?.role, user?.name);
    if (restored) {
      setTrashed(t => t.filter(x => x.id !== c.id));
      toast.success(`Restored "${c.Name}"`);
    } else {
      toast.error('Failed to restore candidate');
    }
  };

  const handlePermanentDelete = async c => {
    if (!window.confirm(`Permanently delete "${c.Name}"? This cannot be undone.`)) return;
    const ok = await permanentlyDeleteCandidate(c.id, user?.role, user?.name);
    if (ok) {
      setTrashed(t => t.filter(x => x.id !== c.id));
      toast.success('Candidate permanently deleted');
    } else {
      toast.error('Failed to permanently delete candidate');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center"><FiTrash2 className="w-5 h-5 text-white" /></span>
          Trash
        </h1>
        <p className="text-gray-400 text-sm mt-1">{trashed.length} deleted candidate{trashed.length === 1 ? '' : 's'} — restore or permanently remove</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : trashed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiInbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <div className="font-medium">Trash is empty</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark bg-gray-50 dark:bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">City</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {trashed.map(c => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-surface-border/50 dark:border-surface-border-dark/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: avatarColor(c.Name || '') }}>
                            {initials(c.Name || '')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-44">{c.Name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-44">{c.Email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{c['Job title']?.split('(')[0].trim()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.City || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => handleRestore(c)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20">
                            <FiRotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(c)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-3 py-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20">
                            <FiXCircle className="w-3.5 h-3.5" /> Delete Forever
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
