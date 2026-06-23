import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FiActivity, FiShield, FiUserPlus, FiTrash2, FiRotateCcw, FiCopy, FiEdit3, FiBriefcase, FiUser, FiXCircle } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../context/store';
import { initials, avatarColor } from '../utils/helpers';

const ACTION_META = {
  status_change: { icon: FiEdit3, color: '#6172f3' },
  trashed: { icon: FiTrash2, color: '#dc2626' },
  restored: { icon: FiRotateCcw, color: '#16a34a' },
  permanently_deleted: { icon: FiXCircle, color: '#7f1d1d' },
  duplicated: { icon: FiCopy, color: '#8b5cf6' },
  created: { icon: FiUserPlus, color: '#16a34a' },
  updated: { icon: FiEdit3, color: '#f59e0b' },
  deleted: { icon: FiTrash2, color: '#dc2626' },
};

export default function Activity() {
  const { user } = useAuthStore();
  const { fetchActivity } = useAppStore();
  const isAdmin = user?.role === 'Admin';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setLogs(await fetchActivity(user?.role));
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
          <FiShield className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-gray-400 text-sm">Activity history is available to HR Admin only.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center"><FiActivity className="w-5 h-5 text-white" /></span>
          Activity History
        </h1>
        <p className="text-gray-400 text-sm mt-1">Who changed what, and when — Admin-only view</p>
      </motion.div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiActivity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <div className="font-medium">No activity recorded yet</div>
          </div>
        ) : (
          <div className="divide-y divide-surface-border dark:divide-surface-border-dark">
            {logs.map(log => {
              const meta = ACTION_META[log.action] || { icon: FiActivity, color: '#6172f3' };
              const Icon = meta.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(log.actor || 'Unknown') }}>
                    {initials(log.actor || 'Unknown')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{log.actor || 'Unknown'}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Icon className="w-3 h-3" style={{ color: meta.color }} />
                        {log.entity_type === 'job' ? <FiBriefcase className="w-3 h-3" /> : <FiUser className="w-3 h-3" />}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                    {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
