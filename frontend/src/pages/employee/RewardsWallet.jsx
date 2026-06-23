import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiGift, FiClock, FiCheckCircle, FiDollarSign } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../../context/store';
import { initials, avatarColor, formatDate } from '../../utils/helpers';

export default function RewardsWallet() {
  const { user } = useAuthStore();
  const { fetchMyReferrals } = useAppStore();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setReferrals(await fetchMyReferrals(user?.email));
      setLoading(false);
    })();
  }, [user?.email]);

  const { paid, pending, history } = useMemo(() => {
    const paid = referrals.filter(r => r.reward_status === 'Paid').reduce((s, r) => s + (r.reward_amount || 0), 0);
    const pending = referrals.filter(r => r.reward_status === 'Pending').reduce((s, r) => s + (r.reward_amount || 0), 0);
    const history = referrals.filter(r => r.reward_status !== 'None').sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return { paid, pending, history };
  }, [referrals]);

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><FiGift className="w-5 h-5 text-white" /></span>
          Rewards Wallet
        </h1>
        <p className="text-gray-400 text-sm mt-1">Track your referral incentives</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center"><FiDollarSign className="w-4.5 h-4.5 text-green-500" /></div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Earned</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${paid + pending}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center"><FiClock className="w-4.5 h-4.5 text-amber-500" /></div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pending</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${pending}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center"><FiCheckCircle className="w-4.5 h-4.5 text-blue-500" /></div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Paid Out</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${paid}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark font-bold text-gray-900 dark:text-white">Reward History</div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiGift className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <div className="font-medium">No rewards yet — keep referring!</div>
          </div>
        ) : (
          <div className="divide-y divide-surface-border dark:divide-surface-border-dark">
            {history.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(r.candidate_name || '') }}>
                  {initials(r.candidate_name || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{r.candidate_name}</div>
                  <div className="text-xs text-gray-400">{r.job_title} · {formatDate(r.updated_at)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">${r.reward_amount}</div>
                  <span className={`badge text-[11px] ${r.reward_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.reward_status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
