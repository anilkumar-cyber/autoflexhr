import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { useAppStore } from '../context/store';
import { scoreColor, STATUS_COLORS, JOB_ROLES } from '../utils/helpers';

const COLORS = ['#6172f3','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-surface-border dark:border-surface-border-dark rounded-xl p-3 shadow-card text-xs font-semibold">
      <div className="text-gray-500 mb-1">{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || p.fill }}>{p.name || 'Count'}: {p.value}</div>)}
    </div>
  );
};

function StatCard({ label, value, color, sub }) {
  return (
    <motion.div variants={item} className="card p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <div className="w-4 h-4 rounded-full" style={{ background: color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white font-display">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const { candidates } = useAppStore();

  const statusCounts = {};
  candidates.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

  const avgATS = candidates.length ? Math.round(candidates.reduce((a, c) => a + (c['ATS Score'] || 0), 0) / candidates.length) : 0;
  const conversion = candidates.length ? Math.round((candidates.filter(c => ['Shortlisted','Interview Scheduled','Offer Extended'].includes(c.status)).length / candidates.length) * 100) : 0;
  const rejection = candidates.length ? Math.round((candidates.filter(c => c.status === 'Rejected').length / candidates.length) * 100) : 0;

  const pipelineData = ['New','Screening','Shortlisted','Interview Scheduled','Offer Extended','Rejected','On Hold'].map((s, i) => ({
    name: s.split(' ')[0], full: s, count: statusCounts[s] || 0, color: COLORS[i],
  }));

  const roleData = JOB_ROLES.map((r, i) => ({
    name: r.split('(')[0].trim().split(' ').slice(0, 3).join(' '),
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

  const allSkills = candidates.flatMap(c => (c.Skills || '').split(',').map(s => s.trim()).filter(Boolean));
  const skillCounts = {}; allSkills.forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([skill, count]) => ({ skill, count }));

  const cityData = {};
  candidates.forEach(c => { if (c.City) cityData[c.City] = (cityData[c.City] || 0) + 1; });
  const topCities = Object.entries(cityData).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, count]) => ({ city, count }));

  const radarData = [
    { subject: 'Technical', A: avgATS },
    { subject: 'Experience', A: Math.max(avgATS - 8, 0) },
    { subject: 'Education', A: Math.min(avgATS + 4, 100) },
    { subject: 'Skills', A: Math.min(avgATS + 6, 100) },
    { subject: 'Culture Fit', A: Math.max(avgATS - 5, 0) },
  ];

  // Mock trend data (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), applications: Math.floor(Math.random() * 5) + 1 };
  });

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-display">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Recruitment intelligence overview · {candidates.length} candidates</p>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Candidates" value={candidates.length} color="#6172f3" />
        <StatCard label="Average ATS Score" value={avgATS} color="#10b981" sub="Out of 100" />
        <StatCard label="Shortlist Rate" value={`${conversion}%`} color="#f59e0b" sub="Pipeline conversion" />
        <StatCard label="Rejection Rate" value={`${rejection}%`} color="#ef4444" sub="Of total pool" />
      </motion.div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Pipeline bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">Hiring Pipeline Funnel</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipelineData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Sora' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Candidates" radius={[8, 8, 0, 0]}>
                {pipelineData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 font-display">Avg. Score Profile</h2>
          <p className="text-xs text-gray-400 mb-3">Across all candidates</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" strokeOpacity={0.5} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Sora' }} />
              <Radar name="Score" dataKey="A" stroke="#6172f3" fill="#6172f3" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* ATS distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">ATS Score Distribution</h2>
          <div className="space-y-3">
            {atsRanges.map(({ name, count }, i) => {
              const max = Math.max(...atsRanges.map(r => r.count), 1);
              const colors = ['#16a34a','#4f46e5','#0ea5e9','#d97706','#dc2626'];
              return (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{name}</span>
                    <span className="font-bold" style={{ color: colors[i] }}>{count}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / max) * 100}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full" style={{ background: colors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-surface-border dark:border-surface-border-dark flex justify-between">
            <span className="text-xs text-gray-400">Average</span>
            <span className="text-xl font-bold text-brand-600">{avgATS}</span>
          </div>
        </motion.div>

        {/* Skills bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">Top Skills in Talent Pool</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSkills} layout="vertical" barCategoryGap="20%">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Sora' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Candidates" radius={[0, 6, 6, 0]}>
                {topSkills.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 font-display">Role Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={4}>
                {roleData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {roleData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-gray-500 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* City bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="card p-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-display">Top Cities</h2>
          <div className="space-y-3">
            {topCities.map(({ city, count }, i) => {
              const max = Math.max(...topCities.map(c => c.count), 1);
              return (
                <div key={city}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{city}</span>
                    <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / max) * 100}%` }} transition={{ duration: 0.7, delay: 0.4 + i * 0.07 }}
                      className="h-full rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Application trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 font-display">Application Trend</h2>
          <p className="text-xs text-gray-400 mb-4">Last 7 days</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6172f3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6172f3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="applications" stroke="#6172f3" strokeWidth={2.5} fill="url(#appGrad)" name="Applications" />
            </AreaChart>
          </ResponsiveContainer>

          {/* Conversion funnel mini */}
          <div className="mt-4 pt-4 border-t border-surface-border dark:border-surface-border-dark">
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Conversion</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Shortlisted</span>
              <span className="font-bold text-green-500">{conversion}%</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Rejected</span>
              <span className="font-bold text-red-500">{rejection}%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
