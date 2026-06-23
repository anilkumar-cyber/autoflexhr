import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiShield, FiPlus, FiX, FiEdit3, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../context/store';
import RichTextEditor from '../components/RichTextEditor';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  title: '', department: '', about_role: '', primary_skills: '',
  secondary_skills: '', qualifications_experience: '', what_we_offer: '', status: 'Open',
};

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState(job ? {
    title: job.title || '',
    department: job.department || '',
    about_role: job.about_role || '',
    primary_skills: job.primary_skills || '',
    secondary_skills: job.secondary_skills || '',
    qualifications_experience: job.qualifications_experience || '',
    what_we_offer: job.what_we_offer || '',
    status: job.status || 'Open',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-lg shadow-modal max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex items-center justify-between">
          <div className="font-bold text-gray-900 dark:text-white">{job ? 'Edit Job Posting' : 'New Job Posting'}</div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"><FiX className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Data Analyst"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Department</label>
            <input value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">About Role</label>
            <RichTextEditor value={form.about_role} onChange={v => set('about_role', v)} placeholder="Role overview..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Primary Skills</label>
            <RichTextEditor value={form.primary_skills} onChange={v => set('primary_skills', v)} placeholder="Must-have skills..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Secondary Skills</label>
            <RichTextEditor value={form.secondary_skills} onChange={v => set('secondary_skills', v)} placeholder="Nice-to-have skills..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Qualifications & Experience</label>
            <RichTextEditor value={form.qualifications_experience} onChange={v => set('qualifications_experience', v)} placeholder="Education, years of experience..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">What We Offer</label>
            <RichTextEditor value={form.what_we_offer} onChange={v => set('what_we_offer', v)} placeholder="Benefits, perks, compensation..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</label>
            <div className="flex gap-2">
              {['Open', 'Closed'].map(s => (
                <button key={s} onClick={() => set('status', s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${form.status === s ? (s === 'Open' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white') : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-surface-border dark:border-surface-border-dark">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {saving ? 'Saving...' : job ? 'Save Changes' : 'Create Job Posting'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Jobs() {
  const { user } = useAuthStore();
  const { fetchJobs, createJob, updateJob, deleteJob } = useAppStore();
  const isAdmin = user?.role === 'Admin';
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalJob, setModalJob] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    setJobs(await fetchJobs(user?.role));
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
        <p className="text-gray-400 text-sm">Job postings are available to HR Admin only.</p>
      </div>
    );
  }

  const handleCreate = async (form) => {
    const job = await createJob(form, user?.role, user?.name);
    if (job) {
      setJobs(j => [job, ...j]);
      toast.success('Job posting created');
      setShowCreate(false);
    } else toast.error('Failed to create job posting');
  };

  const handleEdit = async (form) => {
    const job = await updateJob(modalJob.id, form, user?.role, user?.name);
    if (job) {
      setJobs(j => j.map(x => x.id === job.id ? job : x));
      toast.success('Job posting updated');
      setModalJob(null);
    } else toast.error('Failed to update job posting');
  };

  const toggleStatus = async (job) => {
    const next = job.status === 'Open' ? 'Closed' : 'Open';
    const updated = await updateJob(job.id, { status: next }, user?.role, user?.name);
    if (updated) {
      setJobs(j => j.map(x => x.id === job.id ? updated : x));
      toast.success(`Job posting ${next === 'Open' ? 'reopened' : 'closed'}`);
    } else toast.error('Failed to update status');
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete job posting "${job.title}"? This cannot be undone.`)) return;
    const ok = await deleteJob(job.id, user?.role, user?.name);
    if (ok) {
      setJobs(j => j.filter(x => x.id !== job.id));
      toast.success('Job posting deleted');
    } else toast.error('Failed to delete job posting');
  };

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center"><FiBriefcase className="w-5 h-5 text-white" /></span>
            Job Postings
          </h1>
          <p className="text-gray-400 text-sm mt-1">{jobs.length} posting{jobs.length === 1 ? '' : 's'} · Admin-only management</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5">
          <FiPlus className="w-4 h-4" /> New Job Posting
        </button>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <FiBriefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="font-medium">No job postings yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {jobs.map(job => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-gray-900 dark:text-white">{job.title}</div>
                  <span className={`badge text-[11px] ${job.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{job.status}</span>
                </div>
                {job.department && <div className="text-xs text-gray-400 mb-2">{job.department}</div>}
                {job.about_role && (
                  <div className="rich-text-content text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: job.about_role }} />
                )}
                <div className="flex items-center gap-1.5 pt-3 border-t border-surface-border dark:border-surface-border-dark">
                  <button onClick={() => toggleStatus(job)} title={job.status === 'Open' ? 'Close posting' : 'Reopen posting'}
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors">
                    {job.status === 'Open' ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setModalJob(job)} title="Edit"
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors">
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(job)} title="Delete"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-auto">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showCreate && <JobModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {modalJob && <JobModal job={modalJob} onClose={() => setModalJob(null)} onSave={handleEdit} />}
    </div>
  );
}
