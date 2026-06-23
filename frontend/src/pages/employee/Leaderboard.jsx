import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiStar } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../../context/store';
import { initials, avatarColor } from '../../utils/helpers';

const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const { user } = useAuthStore();
  const { fetchLeaderboard } = useAppStore();
  const [period, setPeriod] = useState('month');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setRows(await fetchLeaderboard(period));
      setLoading(false);
    })();
  }, [period]);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><FiAward className="w-5 h-5 text-white" /></span>
            Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Top referrers {period === 'month' ? 'this month' : 'all time'}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {[['month', 'This Month'], ['all', 'All Time']].map(([v, label]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === v ? 'bg-white dark:bg-surface-card-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <FiAward className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="font-medium">No referrals {period === 'month' ? 'this month' : ''} yet</div>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => {
            const isMe = r.employee_email === user?.email;
            return (
              <motion.div key={r.employee_email} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`card p-4 flex items-center gap-4 ${isMe ? 'ring-2 ring-brand-400' : ''}`}>
                <div className="w-10 text-center text-lg font-bold text-gray-400 flex-shrink-0">
                  {RANK_MEDAL[r.rank] || `#${r.rank}`}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: avatarColor(r.employee_name) }}>
                  {initials(r.employee_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{r.employee_name}</span>
                    {isMe && <span className="badge bg-brand-100 text-brand-700 text-[10px]">You</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {r.badges.map(b => (
                      <span key={b} className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        <FiStar className="w-2.5 h-2.5" /> {b}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{r.successful_referrals}</div>
                  <div className="text-xs text-gray-400">{r.total_referrals} total · ${r.total_reward}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
