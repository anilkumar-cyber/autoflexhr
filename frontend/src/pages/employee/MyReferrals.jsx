import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiList, FiX, FiLinkedin, FiGift } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../../context/store';
import { initials, avatarColor, formatDate } from '../../utils/helpers';
import { STAGE_COLORS, matchScoreColor } from './referralUtils';
import ReferralTimeline from './ReferralTimeline';

function DetailModal({ referral, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-2xl shadow-modal max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: avatarColor(referral.candidate_name || '') }}>
              {initials(referral.candidate_name || '')}
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white">{referral.candidate_name}</div>
              <div className="text-sm text-gray-400">{referral.job_title}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"><FiX className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Referral Progress</div>
            <ReferralTimeline stage={referral.stage} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: matchScoreColor(referral.match_score || 0) }}>{referral.match_score || 0}%</div>
              <div className="text-xs text-gray-400">Match Score</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{referral.reward_amount ? `$${referral.reward_amount}` : '—'}</div>
              <div className="text-xs text-gray-400">Reward</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(referral.created_at)}</div>
              <div className="text-xs text-gray-400">Referred On</div>
            </div>
          </div>

          {referral.reward_status !== 'None' && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${referral.reward_status === 'Paid' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
              <FiGift className="w-4 h-4" /> Reward {referral.reward_status} {referral.reward_amount ? `· $${referral.reward_amount}` : ''}
            </div>
          )}

          {referral.note && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Your Note</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{referral.note}</p>
            </div>
          )}

          {referral.linkedin_url && (
            <a href={referral.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-500 hover:underline">
              <FiLinkedin className="w-4 h-4" /> View LinkedIn Profile
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function MyReferrals() {
  const { user } = useAuthStore();
  const { fetchMyReferrals } = useAppStore();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setReferrals(await fetchMyReferrals(user?.email));
      setLoading(false);
    })();
  }, [user?.email]);

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><FiList className="w-5 h-5 text-white" /></span>
          My Referrals
        </h1>
        <p className="text-gray-400 text-sm mt-1">{referrals.length} referral{referrals.length === 1 ? '' : 's'} submitted</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : referrals.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <FiList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="font-medium">You haven't referred anyone yet</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark bg-gray-50 dark:bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Match</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)} className="border-b border-surface-border/50 dark:border-surface-border-dark/50 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(r.candidate_name || '') }}>
                          {initials(r.candidate_name || '')}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.candidate_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.job_title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: matchScoreColor(r.match_score || 0) }}>{r.match_score || 0}%</td>
                    <td className="px-4 py-3">
                      <span className="badge text-[11px]" style={{ background: STAGE_COLORS[r.stage]?.bg, color: STAGE_COLORS[r.stage]?.text, border: `1px solid ${STAGE_COLORS[r.stage]?.border}` }}>{r.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.reward_status === 'None' ? '—' : `${r.reward_status}${r.reward_amount ? ` · $${r.reward_amount}` : ''}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && <DetailModal referral={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
