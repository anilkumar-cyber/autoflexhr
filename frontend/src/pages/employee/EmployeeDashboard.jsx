import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiCheckCircle, FiClock, FiGift, FiAward, FiBriefcase, FiUserPlus, FiCpu, FiList, FiArrowRight } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../../context/store';
import { STAGE_COLORS } from './referralUtils';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </motion.div>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const { fetchEmployeeStats, fetchOpenJobs } = useAppStore();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [s, j] = await Promise.all([
        fetchEmployeeStats(user?.email),
        fetchOpenJobs(),
      ]);
      setStats(s);
      setJobs(j.slice(0, 4));
      setLoading(false);
    })();
  }, [user?.email]);

  const quickActions = [
    { to: '/employee/positions', label: 'Browse Open Positions', icon: FiBriefcase, color: '#6172f3' },
    { to: '/employee/refer', label: 'Refer a Candidate', icon: FiUserPlus, color: '#16a34a' },
    { to: '/employee/ai-matching', label: 'AI Job Matching', icon: FiCpu, color: '#8b5cf6' },
    { to: '/employee/my-referrals', label: 'View My Referrals', icon: FiList, color: '#f59e0b' },
  ];

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Here's how your referrals are doing</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard icon={FiUsers} label="Total Referrals" value={stats?.total_referrals ?? 0} color="#6172f3" />
            <StatCard icon={FiCheckCircle} label="Successful" value={stats?.successful_referrals ?? 0} color="#16a34a" />
            <StatCard icon={FiClock} label="Pending" value={stats?.pending_referrals ?? 0} color="#f59e0b" />
            <StatCard icon={FiGift} label="Rewards Earned" value={`$${stats?.rewards_earned ?? 0}`} color="#10b981" sub={stats?.rewards_pending ? `$${stats.rewards_pending} pending` : null} />
            <StatCard icon={FiAward} label="Leaderboard Rank" value={stats?.rank ? `#${stats.rank}` : '—'} color="#ec4899" />
            <StatCard icon={FiBriefcase} label="Open Jobs" value={stats?.open_jobs_count ?? 0} color="#0ea5e9" />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {quickActions.map(a => (
              <Link key={a.to} to={a.to} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}15` }}>
                  <a.icon className="w-4.5 h-4.5" style={{ color: a.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{a.label}</span>
                <FiArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent referrals */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Referrals</h3>
                <Link to="/employee/my-referrals" className="text-xs font-semibold text-brand-500 hover:underline">View all</Link>
              </div>
              {(!stats?.recent_referrals || stats.recent_referrals.length === 0) ? (
                <div className="text-sm text-gray-400 text-center py-8">No referrals yet — start by referring someone!</div>
              ) : (
                <div className="space-y-3">
                  {stats.recent_referrals.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-surface-border dark:border-surface-border-dark last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{r.candidate_name}</div>
                        <div className="text-xs text-gray-400">{r.job_title}</div>
                      </div>
                      <span className="badge text-[11px]" style={{ background: STAGE_COLORS[r.stage]?.bg, color: STAGE_COLORS[r.stage]?.text }}>{r.stage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest open positions */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Latest Open Positions</h3>
                <Link to="/employee/positions" className="text-xs font-semibold text-brand-500 hover:underline">View all</Link>
              </div>
              {jobs.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-8">No open positions right now</div>
              ) : (
                <div className="space-y-3">
                  {jobs.map(j => (
                    <div key={j.id} className="flex items-center justify-between py-2 border-b border-surface-border dark:border-surface-border-dark last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{j.title}</div>
                        <div className="text-xs text-gray-400">{j.department || '—'}</div>
                      </div>
                      <Link to={`/employee/refer?jobId=${j.id}`} className="text-xs font-semibold text-brand-500 hover:underline flex-shrink-0">Refer →</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
