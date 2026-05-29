import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FiUsers, FiCalendar, FiCheckCircle, FiXCircle, FiTrendingUp, FiTarget, FiStar, FiActivity } from 'react-icons/fi';
import { useAppStore } from '../context/store';
import { scoreColor, STATUS_COLORS, JOB_ROLES, initials, avatarColor } from '../utils/helpers';

const COLORS = ['#6172f3','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function MetricCard({ label, value, icon: Icon, color, sub, onClick, delay = 0 }) {
  return (
    <motion.div variants={item} onClick={onClick}
      whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
      className={`card p-5 ${onClick ? 'cursor-pointer' : ''} transition-all duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {onClick && <span className="text-xs text-gray-400 hover:text-brand-500 transition-colors">View →</span>}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white font-display">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function ATSGauge({ score, size = 80 }) {
  const c = scoreColor(score);
  const pct = Math.min(score, 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.56} viewBox={`0 0 ${size} ${size * 0.56}`}>
        <path d={`M${size*0.1},${size*0.5} A${size*0.4},${size*0.4} 0 0,1 ${size*0.9},${size*0.5}`} fill="none" stroke="#e5e7eb" strokeWidth={size*0.1} strokeLinecap="round" />
        <path d={`M${size*0.1},${size*0.5} A${size*0.4},${size*0.4} 0 0,1 ${size*0.9},${size*0.5}`} fill="none" stroke={c.text} strokeWidth={size*0.1} strokeLinecap="round"
          strokeDasharray={`${pct*1.257} 125.7`} />
        <text x={size/2} y={size*0.48} textAnchor="middle" fontSize={size*0.2} fontWeight="700" fill={c.text} fontFamily="Sora, sans-serif">{score}</text>
      </svg>
      <span className="text-xs text-gray-400">ATS /100</span>
    </div>
  );
}

export default function Dashboard() {
  const { candidates } = useAppStore();
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const metrics = {
    total: candidates.length,
    today: candidates.filter(c => c.appliedDate === todayStr).length,
    shortlisted: candidates.filter(c => ['Shortlisted','Interview Scheduled','Offer Extended'].includes(c.status)).length,
    rejected: candidates.filter(c => c.status === 'Rejected').length,
    interviews: candidates.filter(c => c.status === 'Interview Scheduled').length,
    avgATS: candidates.length ? Math.round(candidates.reduce((a, c) => a + (c['ATS Score'] || 0), 0) / candidates.length) : 0,
    offers: candidates.filter(c => c.status === 'Offer Extended').length,
  };

  const pipelineData = ['New','Screening','Shortlisted','Interview Scheduled','Offer Extended','Rejected'].map(s => ({
    name: s.split(' ')[0], full: s, count: candidates.filter(c => c.status === s).length,
  }));

  const roleData = JOB_ROLES.map((r, i) => ({
    name: r.split('(')[0].trim().split(' ').slice(0, 2).join(' '),
    value: candidates.filter(c => c['Job title'] === r).length,
    color: COLORS[i],
  }));

  const atsRanges = [
    { name: '90-100', count: candidates.filter(c => c['ATS Score'] >= 90).length },
    { name: '80-89', count: candidates.filter(c => c['ATS Score'] >= 80 && c['ATS Score'] < 90).length },
    { name: '70-79', count: candidates.filter(c => c['ATS Score'] >= 70 && c['ATS Score'] < 80).length },
    { name: '60-69', count: candidates.filter(c => c['ATS Score'] >= 60 && c['ATS Score'] < 70).length },
    { name: '<60', count: candidates.filter(c => c['ATS Score'] < 60).length },
  ];

  const topCandidates = [...candidates].sort((a, b) => b['ATS Score'] - a['ATS Score']).slice(0, 6);

  const allSkills = candidates.flatMap(c => (c.Skills || '').split(',').map(s => s.trim()).filter(Boolean));
  const skillCounts = {}; allSkills.forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-display">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {candidates.length > 0 && ` · ${candidates.length} candidates loaded`}
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Candidates" value={metrics.total} icon={FiUsers} color="#6172f3" sub="All time" onClick={() => navigate('/candidates')} />
        <MetricCard label="Today's Applications" value={metrics.today} icon={FiCalendar} color="#0ea5e9" sub="New today" />
        <MetricCard label="Shortlisted" value={metrics.shortlisted} icon={FiCheckCircle} color="#10b981" sub="Active pipeline" onClick={() => navigate('/candidates')} />
        <MetricCard label="Avg. ATS Score" value={metrics.avgATS} icon={FiTarget} color="#f59e0b" sub="AI evaluated" />
        <MetricCard label="Interviews Scheduled" value={metrics.interviews} icon={FiActivity} color="#8b5cf6" onClick={() => navigate('/pipeline')} />
        <MetricCard label="Offer Extended" value={metrics.offers} icon={FiStar} color="#06b6d4" />
        <MetricCard label="Rejected" value={metrics.rejected} icon={FiXCircle} color="#ef4444" />
        <MetricCard label="Pipeline Rate" value={`${metrics.total ? Math.round((metrics.shortlisted/metrics.total)*100) : 0}%`} icon={FiTrendingUp} color="#ec4899" sub="Shortlist rate" />
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Pipeline funnel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">Hiring Pipeline</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'Sora, sans-serif' }} formatter={(v, n, p) => [v, p.payload.full]} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {pipelineData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Role distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">By Role</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {roleData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Sora, sans-serif', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {roleData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{d.name}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Top candidates */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-display">Top Candidates</h2>
            <button onClick={() => navigate('/candidates')} className="text-xs text-brand-500 hover:text-brand-600 font-semibold">View all →</button>
          </div>
          <div className="space-y-3">
            {topCandidates.map((c, i) => {
              const sc = scoreColor(c['ATS Score']);
              return (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate('/candidates')}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: i === 0 ? '#fef9c3' : '#f3f4f6', color: i === 0 ? '#854d0e' : '#6b7280' }}>{i + 1}</div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(c.Name || '') }}>{initials(c.Name || '')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.Name}</div>
                    <div className="text-xs text-gray-400 truncate">{c['Job title']?.split('(')[0].trim()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: sc.text }}>{c['ATS Score']}</div>
                    <div className="text-xs px-2 py-0.5 rounded-full font-medium mt-0.5" style={{ background: STATUS_COLORS[c.status]?.bg, color: STATUS_COLORS[c.status]?.text }}>{c.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ATS distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">ATS Distribution</h2>
          <div className="space-y-3">
            {atsRanges.map(({ name, count }) => {
              const max = Math.max(...atsRanges.map(r => r.count), 1);
              const pct = Math.round((count / max) * 100);
              const color = name === '90-100' ? '#16a34a' : name === '80-89' ? '#4f46e5' : name === '70-79' ? '#0ea5e9' : name === '60-69' ? '#d97706' : '#dc2626';
              return (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{name}</span>
                    <span className="font-bold" style={{ color }}>{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5 }}
                      className="h-full rounded-full" style={{ background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-surface-border dark:border-surface-border-dark flex justify-between items-center">
            <span className="text-xs text-gray-400">Average Score</span>
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">{metrics.avgATS}</span>
          </div>
        </motion.div>
      </div>

      {/* Skills cloud */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">Top Skills in Talent Pool</h2>
        <div className="flex flex-wrap gap-2">
          {topSkills.map(([skill, count], i) => {
            const maxCount = topSkills[0]?.[1] || 1;
            const opacity = 0.4 + (count / maxCount) * 0.6;
            const size = 11 + Math.round((count / maxCount) * 4);
            return (
              <motion.span key={skill} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i + 0.5 }}
                className="px-3 py-1.5 rounded-full font-semibold text-white cursor-default" style={{ background: `rgba(97,114,243,${opacity})`, fontSize: size }}>
                {skill} <span className="opacity-70 text-xs">({count})</span>
              </motion.span>
            );
          })}
          {topSkills.length === 0 && <span className="text-gray-400 text-sm">No skill data yet — load candidates from Google Sheets.</span>}
        </div>
      </motion.div>
    </div>
  );
}
