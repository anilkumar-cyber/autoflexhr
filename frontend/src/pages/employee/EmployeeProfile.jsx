import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiHash, FiBriefcase, FiAward, FiStar } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../../context/store';
import { initials, avatarColor } from '../../utils/helpers';

export default function EmployeeProfile() {
  const { user } = useAuthStore();
  const { fetchEmployeeStats, fetchLeaderboard } = useAppStore();
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    (async () => {
      const [s, lb] = await Promise.all([fetchEmployeeStats(user?.email), fetchLeaderboard('all')]);
      setStats(s);
      setBadges(lb.find(e => e.employee_email === user?.email)?.badges || []);
    })();
  }, [user?.email]);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ background: avatarColor(user?.name || '') }}>
            {initials(user?.name || '')}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</div>
            <div className="text-sm text-gray-400">{user?.role}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
            <FiMail className="w-4 h-4 text-gray-400" /> {user?.email}
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
            <FiHash className="w-4 h-4 text-gray-400" /> Employee ID: EMP-{user?.id ?? '—'}
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
            <FiBriefcase className="w-4 h-4 text-gray-400" /> Department: General
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
            <FiUser className="w-4 h-4 text-gray-400" /> Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_referrals ?? 0}</div>
          <div className="text-xs text-gray-400">Referrals</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-green-600">{stats?.successful_referrals ?? 0}</div>
          <div className="text-xs text-gray-400">Successful</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">${(stats?.rewards_earned ?? 0) + (stats?.rewards_pending ?? 0)}</div>
          <div className="text-xs text-gray-400">Rewards</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-3">
          <FiAward className="w-4.5 h-4.5 text-amber-500" /> Badges Earned
        </div>
        {badges.length === 0 ? (
          <div className="text-sm text-gray-400">No badges yet — refer your first candidate to start earning!</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full">
                <FiStar className="w-3 h-3" /> {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
