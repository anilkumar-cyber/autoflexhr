import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiBriefcase, FiMapPin, FiUserPlus, FiCpu, FiX, FiChevronDown } from 'react-icons/fi';
import { useAppStore } from '../../context/store';

function JobModal({ job, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-lg shadow-modal max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex items-start justify-between">
          <div>
            <div className="font-bold text-lg text-gray-900 dark:text-white">{job.title}</div>
            <div className="text-sm text-gray-400">{job.department || 'General'}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"><FiX className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {[
            ['About Role', job.about_role],
            ['Primary Skills', job.primary_skills],
            ['Secondary Skills', job.secondary_skills],
            ['Qualifications & Experience', job.qualifications_experience],
            ['What We Offer', job.what_we_offer],
          ].map(([label, html]) => html && (
            <div key={label}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</div>
              <div className="rich-text-content text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-surface-border dark:border-surface-border-dark flex gap-2">
          <Link to={`/employee/refer?jobId=${job.id}`} className="btn-primary flex-1 text-center py-2.5 flex items-center justify-center gap-2">
            <FiUserPlus className="w-4 h-4" /> Refer Candidate
          </Link>
          <Link to={`/employee/ai-matching?jobId=${job.id}`} className="flex-1 text-center py-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors">
            <FiCpu className="w-4 h-4" /> AI Match
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OpenPositions() {
  const { fetchOpenJobs } = useAppStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [sort, setSort] = useState('newest');
  const [modalJob, setModalJob] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setJobs(await fetchOpenJobs());
      setLoading(false);
    })();
  }, []);

  const departments = useMemo(() => [...new Set(jobs.map(j => j.department).filter(Boolean))], [jobs]);

  const filtered = useMemo(() => {
    let list = jobs.filter(j =>
      (!search || j.title.toLowerCase().includes(search.toLowerCase()) || (j.requirements || '').toLowerCase().includes(search.toLowerCase())) &&
      (!dept || j.department === dept)
    );
    list = [...list].sort((a, b) => sort === 'newest'
      ? new Date(b.created_at) - new Date(a.created_at)
      : a.title.localeCompare(b.title));
    return list;
  }, [jobs, search, dept, sort]);

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><FiBriefcase className="w-5 h-5 text-white" /></span>
          Open Positions
        </h1>
        <p className="text-gray-400 text-sm mt-1">{filtered.length} open position{filtered.length === 1 ? '' : 's'} you can refer candidates for</p>
      </motion.div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or skills..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="newest">Newest First</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <FiBriefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="font-medium">No open positions match your search</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(job => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-gray-900 dark:text-white">{job.title}</div>
                  <span className="badge bg-green-100 text-green-700 text-[11px]">Open</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <FiMapPin className="w-3 h-3" /> {job.department || 'General'}
                </div>
                {job.about_role && (
                  <div className="rich-text-content text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1"
                    dangerouslySetInnerHTML={{ __html: job.about_role }} />
                )}
                <div className="flex items-center gap-1.5 pt-3 border-t border-surface-border dark:border-surface-border-dark">
                  <button onClick={() => setModalJob(job)} className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    View Job
                  </button>
                  <Link to={`/employee/refer?jobId=${job.id}`} className="text-xs font-semibold text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors flex items-center gap-1">
                    <FiUserPlus className="w-3 h-3" /> Refer
                  </Link>
                  <Link to={`/employee/ai-matching?jobId=${job.id}`} className="text-xs font-semibold text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors flex items-center gap-1 ml-auto">
                    <FiCpu className="w-3 h-3" /> AI Match
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modalJob && <JobModal job={modalJob} onClose={() => setModalJob(null)} />}
      </AnimatePresence>
    </div>
  );
}
