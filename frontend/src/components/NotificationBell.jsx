import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FiBell, FiBriefcase, FiUserPlus, FiGift, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { useAppStore } from '../context/store';

const READ_KEY = 'autoflex-notif-read';

const TYPE_ICON = { job: FiBriefcase, referral: FiUserPlus, reward: FiGift, info: FiInfo };

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
}
function saveReadIds(set) {
  localStorage.setItem(READ_KEY, JSON.stringify([...set]));
}

export default function NotificationBell({ role, email, accentColor = '#6172f3' }) {
  const { fetchNotifications } = useAppStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(getReadIds());
  const ref = useRef(null);

  const load = async () => {
    const data = await fetchNotifications(role, email);
    setItems(data);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [role, email]);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = items.filter(n => !readIds.has(n.id)).length;

  const handleToggle = () => {
    setOpen(o => !o);
    if (!open) {
      const next = new Set(readIds);
      items.forEach(n => next.add(n.id));
      setReadIds(next);
      saveReadIds(next);
    }
  };

  const handleItemClick = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleToggle} className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors">
        <FiBell className="w-4 h-4" />
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: accentColor }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded-2xl shadow-modal z-50">
            <div className="px-4 py-3 border-b border-surface-border dark:border-surface-border-dark font-bold text-sm text-gray-900 dark:text-white">
              Notifications
            </div>
            {items.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">
                <FiCheckCircle className="w-7 h-7 mx-auto mb-2 opacity-30" />
                You're all caught up
              </div>
            ) : (
              <div className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {items.map(n => {
                  const Icon = TYPE_ICON[n.type] || FiInfo;
                  return (
                    <button key={n.id} onClick={() => handleItemClick(n)}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}15` }}>
                        <Icon className="w-4 h-4" style={{ color: accentColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</div>
                        {n.message && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</div>}
                        <div className="text-[11px] text-gray-400 mt-1">{n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ''}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
