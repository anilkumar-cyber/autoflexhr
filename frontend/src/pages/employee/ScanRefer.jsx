import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUserPlus, FiUpload, FiCheckCircle } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../../context/store';
import { matchScoreColor } from './referralUtils';
import toast from 'react-hot-toast';

const EMPTY = { jobId: '', name: '', email: '', phone: '', skills: '', experience: '', education: '', linkedin: '', note: '' };

export default function ScanRefer() {
  const { user } = useAuthStore();
  const { fetchOpenJobs, submitReferral } = useAppStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const j = await fetchOpenJobs();
      setJobs(j);
      const jobId = params.get('jobId');
      if (jobId) setForm(f => ({ ...f, jobId }));
    })();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.jobId) { toast.error('Select a job to refer for'); return; }
    if (!form.name || !form.email) { toast.error('Candidate name and email are required'); return; }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('employee_name', user?.name || '');
    fd.append('employee_email', user?.email || '');
    fd.append('job_id', form.jobId);
    fd.append('candidate_name', form.name);
    fd.append('candidate_email', form.email);
    fd.append('candidate_phone', form.phone);
    fd.append('candidate_skills', form.skills);
    fd.append('candidate_experience', form.experience);
    fd.append('candidate_education', form.education);
    fd.append('linkedin_url', form.linkedin);
    fd.append('note', form.note);
    if (resume) fd.append('resume', resume);

    const referral = await submitReferral(fd);
    setSubmitting(false);

    if (referral) {
      setResult(referral);
      toast.success('Referral submitted!');
    } else {
      toast.error('Failed to submit referral');
    }
  };

  if (result) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Referral Submitted!</h2>
          <p className="text-gray-400 text-sm mb-5">You referred <strong>{result.candidate_name}</strong> for <strong>{result.job_title}</strong></p>
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-5">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">AI Match Score</div>
            <div className="text-3xl font-bold" style={{ color: matchScoreColor(result.match_score || 0) }}>{result.match_score || 0}%</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setResult(null); setForm(EMPTY); setResume(null); }} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Refer Another
            </button>
            <button onClick={() => navigate('/employee/my-referrals')} className="btn-primary flex-1 py-2.5">
              View My Referrals
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><FiUserPlus className="w-5 h-5 text-white" /></span>
          Scan & Refer
        </h1>
        <p className="text-gray-400 text-sm mt-1">Refer a great candidate for an open position</p>
      </motion.div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Job</label>
          <select value={form.jobId} onChange={e => set('jobId', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="">Select a job...</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} {j.department ? `· ${j.department}` : ''}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Candidate Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Doe"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Candidate Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 123 4567"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">LinkedIn URL</label>
            <input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/..."
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Skills</label>
          <input value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="Python, SQL, React..."
            className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Experience</label>
            <textarea value={form.experience} onChange={e => set('experience', e.target.value)} rows={2} placeholder="3 years as..."
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Education</label>
            <textarea value={form.education} onChange={e => set('education', e.target.value)} rows={2} placeholder="B.Tech in..."
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Resume</label>
          <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-surface-border dark:border-surface-border-dark rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
            <FiUpload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{resume ? resume.name : 'Upload PDF resume (optional)'}</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => setResume(e.target.files[0])} />
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Referral Note</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3} placeholder="Why are you referring this person?"
            className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3 disabled:opacity-60">
          {submitting ? 'Submitting...' : 'Submit Referral'}
        </button>
      </div>
    </div>
  );
}
