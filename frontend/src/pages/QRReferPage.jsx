import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiLoader, FiZap } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function QRReferPage() {
  const [params] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const empName = params.get('name') || '';
  const empEmail = params.get('email') || '';
  const valid = empName && empEmail;

  useEffect(() => {
    fetch(`${API_BASE}/jobs/?status=Open`)
      .then(r => r.json())
      .then(setJobs)
      .catch(() => setJobs([]));
  }, []);

  const handleSubmit = async () => {
    if (!jobId) { toast.error('Please select a job position'); return; }
    if (!resume) { toast.error('Please upload your resume'); return; }

    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    fd.append('employee_name', empName);
    fd.append('employee_email', empEmail);
    fd.append('job_id', jobId);
    fd.append('resume', resume);

    try {
      const res = await fetch(`${API_BASE}/referrals/qr-refer`, { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Submission failed');
      }
      const data = await res.json();
      setResult(data);
      toast.success('Application submitted successfully!');
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Referral Link</h2>
          <p className="text-gray-500 text-sm">This QR code or link is invalid. Please ask the employee for a valid referral QR code.</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">Your resume has been received and processed. Here's what we found:</p>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-semibold text-gray-900">{result.candidate_name}</span>
            </div>
            {result.candidate_email && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-gray-900">{result.candidate_email}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Position</span>
              <span className="font-semibold text-gray-900">{result.job_title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Match Score</span>
              <span className="font-bold text-emerald-600">{result.match_score || 0}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Referred by</span>
              <span className="font-semibold text-gray-900">{empName}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">Our team will review your profile and get back to you soon.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiZap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">AutoFlexHR</h1>
          <p className="text-emerald-100 text-sm mt-1">Employee Referral Application</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-700 font-bold text-xs">{empName.charAt(0)}</span>
            </div>
            <div>
              <div className="text-xs text-emerald-600">Referred by</div>
              <div className="text-sm font-semibold text-emerald-900">{empName}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Select Position</label>
            <select value={jobId} onChange={e => setJobId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Choose a job position...</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.department ? ` - ${j.department}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Upload Your Resume</label>
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
              <FiUpload className="w-8 h-8 text-gray-300" />
              <span className="text-sm text-gray-500 text-center">
                {resume ? (
                  <span className="text-emerald-600 font-semibold">{resume.name}</span>
                ) : (
                  <>Click to upload your <strong>PDF resume</strong></>
                )}
              </span>
              <span className="text-xs text-gray-400">We'll automatically extract your details</span>
              <input type="file" accept=".pdf" className="hidden" onChange={e => setResume(e.target.files[0])} />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Processing Resume...
              </>
            ) : (
              'Submit Application'
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            By submitting, your resume will be processed by our AI system to extract your profile details automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
