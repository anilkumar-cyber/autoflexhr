import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCpu, FiUpload, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../../context/store';
import { matchScoreColor } from './referralUtils';
import toast from 'react-hot-toast';

export default function AIJobMatching() {
  const { user } = useAuthStore();
  const { fetchOpenJobs, fetchMyReferrals, fetchCandidate, aiMatch } = useAppStore();
  const [params] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [jobId, setJobId] = useState('');
  const [mode, setMode] = useState('resume'); // resume | skills | referral
  const [skills, setSkills] = useState('');
  const [resume, setResume] = useState(null);
  const [referralId, setReferralId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const [j, r] = await Promise.all([fetchOpenJobs(), fetchMyReferrals(user?.email)]);
      setJobs(j);
      setReferrals(r);
      const qJob = params.get('jobId');
      if (qJob) setJobId(qJob);
    })();
  }, []);

  const handleMatch = async () => {
    if (!jobId) { toast.error('Select a job first'); return; }
    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('job_id', jobId);

      if (mode === 'resume') {
        if (!resume) { toast.error('Upload a resume'); setLoading(false); return; }
        fd.append('resume', resume);
      } else if (mode === 'skills') {
        if (!skills.trim()) { toast.error('Enter candidate skills'); setLoading(false); return; }
        fd.append('skills', skills);
      } else if (mode === 'referral') {
        if (!referralId) { toast.error('Pick a referred candidate'); setLoading(false); return; }
        const ref = referrals.find(r => String(r.id) === referralId);
        const candidate = await fetchCandidate(ref.candidate_id);
        fd.append('skills', candidate?.skills || '');
      }

      const res = await aiMatch(fd);
      if (res) setResult(res);
      else toast.error('Matching failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center"><FiCpu className="w-5 h-5 text-white" /></span>
          AI Job Matching
        </h1>
        <p className="text-gray-400 text-sm mt-1">Check how well a candidate fits a job before referring</p>
      </motion.div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Job</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="">Select a job...</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Candidate Source</label>
          <div className="grid grid-cols-3 gap-2">
            {[['resume', 'Upload Resume'], ['skills', 'Enter Skills'], ['referral', 'My Referral']].map(([v, label]) => (
              <button key={v} onClick={() => setMode(v)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${mode === v ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'resume' && (
          <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-surface-border dark:border-surface-border-dark rounded-xl cursor-pointer hover:border-purple-400 transition-colors">
            <FiUpload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{resume ? resume.name : 'Upload PDF resume'}</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => setResume(e.target.files[0])} />
          </label>
        )}

        {mode === 'skills' && (
          <textarea value={skills} onChange={e => setSkills(e.target.value)} rows={3} placeholder="Python, SQL, Power BI..."
            className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
        )}

        {mode === 'referral' && (
          <select value={referralId} onChange={e => setReferralId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="">Select a referred candidate...</option>
            {referrals.map(r => <option key={r.id} value={r.id}>{r.candidate_name} (referred for {r.job_title})</option>)}
          </select>
        )}

        <button onClick={handleMatch} disabled={loading} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm disabled:opacity-60 transition-colors">
          {loading ? 'Analyzing...' : 'Run AI Match'}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mt-5">
          <div className="text-center mb-5">
            <div className="text-5xl font-bold mb-1" style={{ color: matchScoreColor(result.match_score) }}>{result.match_score}%</div>
            <div className="text-sm text-gray-400">Match Score</div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center mb-5">{result.summary}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-400 mb-2">
                <FiCheckCircle className="w-4 h-4" /> Matching Skills
              </div>
              {result.matching_skills.length === 0 ? (
                <div className="text-xs text-gray-400">None found</div>
              ) : result.matching_skills.map((s, i) => (
                <div key={i} className="text-xs text-gray-700 dark:text-gray-300 py-0.5">• {s}</div>
              ))}
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-sm font-bold text-red-600 dark:text-red-400 mb-2">
                <FiXCircle className="w-4 h-4" /> Missing Skills
              </div>
              {result.missing_skills.length === 0 ? (
                <div className="text-xs text-gray-400">None — full coverage!</div>
              ) : result.missing_skills.map((s, i) => (
                <div key={i} className="text-xs text-gray-700 dark:text-gray-300 py-0.5">• {s}</div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
