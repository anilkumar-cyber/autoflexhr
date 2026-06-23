import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUserPlus, FiUpload, FiCheckCircle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore, useAuthStore } from '../../context/store';
import { matchScoreColor } from './referralUtils';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const EMPTY = { jobId: '', note: '' };

export default function ScanRefer() {
  const { user } = useAuthStore();
  const { fetchOpenJobs } = useAppStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('qr');
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const qrUrl = `${window.location.origin}/refer?name=${encodeURIComponent(user?.name || '')}&email=${encodeURIComponent(user?.email || '')}`;

  useEffect(() => {
    (async () => {
      const j = await fetchOpenJobs();
      setJobs(j);
      const jobId = params.get('jobId');
      if (jobId) { setForm(f => ({ ...f, jobId })); setTab('manual'); }
    })();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.jobId) { toast.error('Select a job to refer for'); return; }
    if (!resume) { toast.error('Please upload a resume PDF'); return; }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('employee_name', user?.name || '');
    fd.append('employee_email', user?.email || '');
    fd.append('job_id', form.jobId);
    fd.append('resume', resume);
    if (form.note) fd.append('note', form.note);

    try {
      const res = await fetch(`${API_BASE}/referrals/qr-refer`, { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to submit referral');
      }
      const data = await res.json();
      setResult(data);
      toast.success('Referral submitted!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
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
        <p className="text-gray-400 text-sm mt-1">Share your QR code or manually refer a candidate</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl mb-5">
        <button onClick={() => setTab('qr')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'qr' ? 'bg-white dark:bg-surface-card-dark shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          My QR Code
        </button>
        <button onClick={() => setTab('manual')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'manual' ? 'bg-white dark:bg-surface-card-dark shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          Manual Refer
        </button>
      </div>

      {/* QR Code Tab */}
      {tab === 'qr' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Scan to Apply</h2>
          <p className="text-gray-400 text-sm mb-6">Candidate scans this QR code and uploads their resume</p>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
              <QRCodeSVG
                value={qrUrl}
                size={220}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f766e"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual Refer Tab */}
      {tab === 'manual' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Job</label>
            <select value={form.jobId} onChange={e => set('jobId', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Select a job...</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title} {j.department ? `· ${j.department}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Resume</label>
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-surface-border dark:border-surface-border-dark rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all">
              <FiUpload className="w-8 h-8 text-gray-300" />
              <span className="text-sm text-gray-500 text-center">
                {resume ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{resume.name}</span>
                ) : (
                  <>Upload candidate's <strong>PDF resume</strong></>
                )}
              </span>
              <span className="text-xs text-gray-400">AI will automatically extract candidate details</span>
              <input type="file" accept=".pdf" className="hidden" onChange={e => setResume(e.target.files[0])} />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Referral Note</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3} placeholder="Why are you referring this person?"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3 disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? 'Processing Resume...' : 'Submit Referral'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
