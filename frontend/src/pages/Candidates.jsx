import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiDownload, FiEye, FiPhone, FiMail, FiMapPin, FiCalendar, FiMessageSquare, FiCopy, FiX, FiChevronUp, FiChevronDown, FiAlertTriangle, FiCpu, FiFileText, FiEdit3, FiTrash2 } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../context/store';
import { initials, avatarColor, scoreColor, STATUS_COLORS, STATUS_OPTIONS, JOB_ROLES, exportCSV } from '../utils/helpers';
import toast from 'react-hot-toast';

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, small }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS['New'];
  return <span className={`badge ${small ? 'text-[11px] px-2 py-0.5' : ''}`} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{status}</span>;
}

// ── ATS Gauge ─────────────────────────────────────────────────────────────────
function ATSGauge({ score }) {
  const c = scoreColor(score);
  return (
    <div className="flex flex-col items-center">
      <svg width={84} height={48} viewBox="0 0 84 48">
        <path d="M8,44 A36,36 0 0,1 76,44" fill="none" stroke="#e5e7eb" strokeWidth={9} strokeLinecap="round" />
        <path d="M8,44 A36,36 0 0,1 76,44" fill="none" stroke={c.text} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={`${Math.min(score, 100) * 1.13} 113`} />
        <text x={42} y={42} textAnchor="middle" fontSize={15} fontWeight="700" fill={c.text} fontFamily="Sora,sans-serif">{score}</text>
      </svg>
      <span className="text-xs text-gray-400 -mt-1">ATS /100</span>
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({ candidate, onEmail }) {
  const phone = (candidate.Phone || '').replace(/\s+/g, '');
  const waPhone = phone.startsWith('+') ? phone.slice(1) : '91' + phone;
  const role = candidate['Job title'] || '';
  const name = (candidate.Name || '').split(' ')[0];
  const waMsg = encodeURIComponent(`Hi ${name}, this is AutoFlexHR regarding your ${role} application.`);
  const calUrl = () => {
    const s = new Date(); s.setDate(s.getDate() + 2); s.setHours(10, 0, 0, 0);
    const e = new Date(s); e.setHours(11, 0, 0, 0);
    const f = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Interview – ${candidate.Name}`)}&dates=${f(s)}/${f(e)}&details=${encodeURIComponent(`Role: ${role}\nEmail: ${candidate.Email}`)}`;
  };
  const copyProfile = () => {
    navigator.clipboard.writeText(`${candidate.Name}\n${role}\n${candidate.Email}\n${candidate.Phone}\nATS: ${candidate['ATS Score']}\nSkills: ${candidate.Skills}`);
    toast.success('Copied!');
  };

  const actions = [
    { icon: FiPhone, label: 'Call', color: '#10b981', href: `tel:${phone}` },
    { icon: FiMail, label: 'Email', color: '#6172f3', onClick: onEmail },
    { icon: FiMessageSquare, label: 'WhatsApp', color: '#25d366', href: `https://wa.me/${waPhone}?text=${waMsg}` },
    { icon: FiCalendar, label: 'Schedule', color: '#f59e0b', href: calUrl() },
    { icon: FiMapPin, label: 'Maps', color: '#ef4444', href: `https://maps.google.com/?q=${encodeURIComponent((candidate.City || '') + ' India')}` },
    { icon: FiCopy, label: 'Copy', color: '#8b5cf6', onClick: copyProfile },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map(({ icon: Icon, label, color, href, onClick }) => {
        const btn = (
          <button key={label} onClick={onClick} title={label}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderColor: color + '30', background: color + '10' }}>
            <Icon className="w-4 h-4" style={{ color }} />
            <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
          </button>
        );
        return href
          ? <a key={label} href={href} target="_blank" rel="noreferrer">{btn}</a>
          : <span key={label}>{btn}</span>;
      })}
    </div>
  );
}

// ── Email Modal ───────────────────────────────────────────────────────────────
function EmailModal({ candidate, onClose }) {
  const role = candidate['Job title'] || 'the position';
  const name = (candidate.Name || '').split(' ')[0];
  const templates = [
    { label: '📋 Shortlist', subject: `Application Update – ${role}`, body: `Dear ${name},\n\nYour profile has been shortlisted for ${role} at AutoFlex.\n\nOur team will contact you shortly.\n\nBest regards,\nAutoFlex HR Team` },
    { label: '📅 Interview', subject: `Interview Invitation – ${role}`, body: `Dear ${name},\n\nWe'd like to invite you for an interview for ${role}.\n\nPlease share your availability this week.\n\nBest regards,\nAutoFlex HR Team` },
    { label: '🎉 Offer', subject: `Job Offer – ${role} at AutoFlex`, body: `Dear ${name},\n\nWe are delighted to offer you the ${role} position.\n\nPlease find the formal offer attached.\n\nCongratulations!\n\nAutoFlex HR Team` },
    { label: '🙏 Rejection', subject: `Your Application – ${role}`, body: `Dear ${name},\n\nThank you for applying for ${role}.\n\nWe've decided to move forward with other candidates at this time.\n\nWe wish you the best.\n\nAutoFlex HR Team` },
    { label: '🔔 Follow-up', subject: `Application Status – ${role}`, body: `Dear ${name},\n\nYour application for ${role} is under review. We'll be in touch soon.\n\nThank you for your patience.\n\nAutoFlex HR Team` },
  ];
  const [sel, setSel] = useState(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-lg shadow-modal overflow-hidden">
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex justify-between items-center">
          <div>
            <div className="font-bold text-gray-900 dark:text-white">📧 Email {candidate.Name}</div>
            <div className="text-xs text-gray-400">{candidate.Email}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-2">
          {templates.map((t, i) => (
            <div key={i} onClick={() => setSel(sel === i ? null : i)}
              className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${sel === i ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-surface-border dark:border-surface-border-dark hover:border-brand-300'}`}>
              <div className={`px-4 py-3 flex justify-between items-center ${sel === i ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-white dark:bg-surface-card-dark'}`}>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</span>
                <span className="text-xs text-gray-400">{sel === i ? '▲' : '▼'}</span>
              </div>
              {sel === i && (
                <div className="px-4 pb-4 bg-gray-50 dark:bg-black/20 border-t border-surface-border dark:border-surface-border-dark">
                  <div className="text-xs text-gray-500 mt-3 mb-1 font-semibold">SUBJECT</div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 mb-3">{t.subject}</div>
                  <div className="text-xs text-gray-500 mb-1 font-semibold">BODY</div>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-black/20 p-3 rounded-lg border border-surface-border dark:border-surface-border-dark mb-3 font-sans leading-relaxed">{t.body}</pre>
                  <div className="flex gap-2">
                    <a href={`mailto:${candidate.Email}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body)}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 btn-primary py-2 text-xs text-center">Open in Mail →</a>
                    <button onClick={() => { navigator.clipboard.writeText(t.body); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="px-4 py-2 border border-surface-border dark:border-surface-border-dark rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── AI Analysis Modal ─────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function AIModal({ candidate, type, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const isInterview = type === 'interview';

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      name: candidate.Name || '',
      job_title: candidate['Job title'] || '',
      education: candidate['Educational Qualification'] || '',
      job_history: candidate['Job History'] || '',
      skills: candidate.Skills || '',
      ats_score: candidate['ATS Score'] || 0,
      ...(isInterview ? { hr_evaluation: candidate['HR Evaluation'] || '' } : {}),
    };

    try {
      const res = await fetch(`${API_BASE}/ai/${isInterview ? 'interview' : 'fraud'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.detail || `API error ${res.status}`);
      }
      const { data } = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-2xl shadow-modal max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex justify-between items-center">
          <div>
            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {isInterview ? <FiCpu className="text-brand-500" /> : <FiAlertTriangle className="text-amber-500" />}
              {isInterview ? 'AI Interview Assistant' : 'AI Fraud Detection'}
            </div>
            <div className="text-xs text-gray-400">{candidate.Name} · {candidate['Job title']?.split('(')[0].trim()}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!result && !loading && !error && (
            <div className="text-center py-12">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isInterview ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                {isInterview ? <FiCpu className="w-8 h-8 text-brand-500" /> : <FiAlertTriangle className="w-8 h-8 text-amber-500" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {isInterview ? 'Generate AI Analysis' : 'Run Fraud Detection'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-sm mx-auto">
                {isInterview
                  ? 'Get AI-powered interview questions, candidate assessment, and hiring recommendation.'
                  : 'Analyze resume authenticity and detect potential fraud indicators.'}
              </p>
              <button onClick={analyze} className={isInterview ? 'btn-primary px-8 py-3' : 'bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-xl transition-all'}>
                {isInterview ? 'Generate AI Analysis' : 'Run Fraud Detection'}
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <div className="text-gray-600 dark:text-gray-400 font-medium">Analyzing with Claude AI...</div>
              <div className="text-sm text-gray-400 mt-1">This may take 10-15 seconds</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 text-center">
              <div className="text-red-600 dark:text-red-400 font-semibold mb-2">Analysis Failed</div>
              <div className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</div>
              <button onClick={analyze} className="btn-primary">Retry</button>
            </div>
          )}

          {result && isInterview && (
            <div className="space-y-4">
              <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-brand-700 dark:text-brand-400">Executive Summary</div>
                  <span className="badge bg-green-100 text-green-700">{result.hiring_recommendation?.recommendation}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{result.candidate_summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">Strengths</div>
                  {result.strengths?.map((s, i) => (
                    <div key={i} className="text-xs text-gray-700 dark:text-gray-300 py-1 border-b border-green-100 dark:border-green-900/30 last:border-0">• {s}</div>
                  ))}
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <div className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Weaknesses</div>
                  {result.weaknesses?.map((w, i) => (
                    <div key={i} className="text-xs text-gray-700 dark:text-gray-300 py-1 border-b border-red-100 dark:border-red-900/30 last:border-0">• {w}</div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-4">
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">Communication</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{result.communication_analysis}</p>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">Leadership Potential</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{result.leadership_analysis}</p>
                </div>
              </div>
              <div className="card p-4">
                <div className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Technical Interview Questions</div>
                <div className="space-y-2">
                  {result.technical_interview_questions?.map((q, i) => (
                    <div key={i} className="border-l-2 border-brand-400 pl-3 text-sm text-gray-900 dark:text-white">Q{i + 1}: {q}</div>
                  ))}
                </div>
              </div>
              <div className="card p-4">
                <div className="font-bold text-gray-900 dark:text-white mb-3 text-sm">HR Questions</div>
                <div className="space-y-2">
                  {result.hr_interview_questions?.map((q, i) => (
                    <div key={i} className="border-l-2 border-green-400 pl-3 text-sm text-gray-900 dark:text-white">Q{i + 1}: {q}</div>
                  ))}
                </div>
              </div>
              <div className="bg-brand-50 dark:bg-brand-500/10 rounded-xl p-4">
                <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                  {result.hiring_recommendation?.recommendation} · Confidence {result.hiring_recommendation?.confidence}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{result.hiring_recommendation?.reasoning}</p>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Next step: {result.hiring_recommendation?.next_steps}</p>
              </div>
            </div>
          )}

          {result && !isInterview && (
            <div className="space-y-4">
              <div className={`rounded-xl p-5 text-center ${result.risk_level === 'LOW' ? 'bg-green-50 dark:bg-green-900/20' : result.risk_level === 'MEDIUM' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="text-5xl font-bold mb-2" style={{ color: result.risk_level === 'LOW' ? '#16a34a' : result.risk_level === 'MEDIUM' ? '#d97706' : '#dc2626' }}>
                  {result.fraud_risk_score}%
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{result.recommendation?.status}</div>
                <div className="text-sm text-gray-500 mt-1">Fraud Risk Score · Confidence: {result.confidence}%</div>
                <div className="mt-3">
                  <span className={`badge text-sm px-3 py-1 ${result.risk_level === 'LOW' ? 'bg-green-100 text-green-700' : result.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    Risk Level: {result.risk_level}
                  </span>
                </div>
              </div>
              {result.findings?.length > 0 && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <div className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-2">Findings</div>
                  {result.findings.map((f, i) => (
                    <div key={i} className="py-2 border-b border-gray-100 dark:border-white/10 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${f.severity === 'none' ? 'bg-green-100 text-green-700' : f.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{f.status}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{f.category}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{f.message}</div>
                    </div>
                  ))}
                </div>
              )}
              {result.suspicious_indicators?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <div className="font-bold text-red-700 dark:text-red-400 text-sm mb-2">Suspicious Indicators</div>
                  {result.suspicious_indicators.map((s, i) => (
                    <div key={i} className="text-sm text-gray-700 dark:text-gray-300 py-1">• {s}</div>
                  ))}
                </div>
              )}
              <div className="card p-4">
                <div className="font-bold text-sm text-gray-900 dark:text-white mb-2">{result.recommendation?.status}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{result.recommendation?.message}</p>
                <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">Next: {result.recommendation?.next_action}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// function AIModal({ candidate, type, onClose }) {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);
//   const hasKey = (localStorage.getItem(OAI_KEY) || '').startsWith('sk-');

//   const analyze = async () => {
//     setLoading(true); setError(null);
//     try {
//       const isInterview = type === 'interview';
//       const prompt = isInterview
//         ? `You are an expert HR recruiter. Analyze this candidate and return ONLY valid JSON no markdown.
// Name: ${candidate.Name}, Role: ${candidate['Job title']}, ATS: ${candidate['ATS Score']}/100
// Education: ${candidate['Educational Qualification']}
// Experience: ${candidate['Job History']}
// Skills: ${candidate.Skills}
// {"summary":"...","overall_rating":"Excellent|Good|Average|Below Average","hire_recommendation":"Strong Hire|Hire|Maybe|No Hire","confidence":85,"strengths":["s1","s2","s3"],"weaknesses":["w1","w2"],"technical_questions":[{"q":"?","purpose":"why"},{"q":"?","purpose":"why"},{"q":"?","purpose":"why"},{"q":"?","purpose":"why"},{"q":"?","purpose":"why"}],"hr_questions":[{"q":"?","purpose":"why"},{"q":"?","purpose":"why"},{"q":"?","purpose":"why"}],"communication_score":78,"leadership_potential":"High|Medium|Low","culture_fit":"Strong|Moderate|Weak","key_risks":["r1","r2"]}`
//         : `You are a resume fraud detection expert. Analyze and return ONLY valid JSON no markdown.
// Name: ${candidate.Name}, Role: ${candidate['Job title']}, ATS: ${candidate['ATS Score']}/100
// Education: ${candidate['Educational Qualification']}
// Experience: ${candidate['Job History']}
// Skills: ${candidate.Skills}
// {"fraud_risk_score":15,"risk_level":"Low|Medium|High|Critical","confidence":88,"is_authentic":true,"overall_verdict":"Likely Authentic|Needs Verification|Suspicious|Fraudulent","suspicious_indicators":[{"indicator":"desc","severity":"low|medium|high","details":"explanation"}],"authentic_signals":["s1","s2"],"timeline_analysis":"...","skill_authenticity":"...","ai_generated_probability":12,"recommendation":"Proceed|Verify Claims|Flag for Review|Reject","verification_steps":["s1","s2","s3"]}`;
//       const data = await runOpenAI(prompt);
//       setResult(data);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isInterview = type === 'interview';

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
//       onClick={e => e.target === e.currentTarget && onClose()}>
//       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//         className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-2xl shadow-modal max-h-[90vh] flex flex-col">
//         <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex justify-between items-center">
//           <div>
//             <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//               {isInterview ? <FiCpu className="text-brand-500" /> : <FiAlertTriangle className="text-amber-500" />}
//               {isInterview ? 'AI Interview Assistant' : 'AI Fraud Detection'}
//             </div>
//             <div className="text-xs text-gray-400">{candidate.Name} · {candidate['Job title']?.split('(')[0].trim()}</div>
//           </div>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
//             <FiX className="w-4 h-4" />
//           </button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-5">
//           {!result && !loading && !error && (
//             <div className="text-center py-12">
//               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isInterview ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
//                 {isInterview ? <FiCpu className="w-8 h-8 text-brand-500" /> : <FiAlertTriangle className="w-8 h-8 text-amber-500" />}
//               </div>
//               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
//                 {isInterview ? 'Generate AI Analysis' : 'Run Fraud Detection'}
//               </h3>
//               <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
//                 {isInterview
//                   ? 'Get AI-powered interview questions, candidate assessment, and hiring recommendation.'
//                   : 'Analyze resume authenticity and detect potential fraud indicators.'}
//               </p>
//               {!hasKey ? (
//                 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-4 max-w-sm mx-auto">
//                   <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">OpenAI API Key Required</p>
//                   <p className="text-xs text-amber-600 dark:text-amber-400">Go to <strong>AI Assistant</strong> page and enter your OpenAI API key first.</p>
//                 </div>
//               ) : (
//                 <button onClick={analyze} className="btn-primary px-8 py-3">
//                   {isInterview ? '🤖 Generate AI Analysis' : '🔍 Run Fraud Detection'}
//                 </button>
//               )}
//             </div>
//           )}
//           {loading && (
//             <div className="text-center py-16">
//               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
//               <div className="text-gray-600 dark:text-gray-400 font-medium">Analyzing with GPT-4o-mini…</div>
//               <div className="text-sm text-gray-400 mt-1">This may take 10-15 seconds</div>
//             </div>
//           )}
//           {error && (
//             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 text-center">
//               <div className="text-red-600 dark:text-red-400 font-semibold mb-2">Analysis Failed</div>
//               <div className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</div>
//               <button onClick={analyze} className="btn-primary">Retry</button>
//             </div>
//           )}
//           {result && isInterview && (
//             <div className="space-y-4">
//               <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-xl p-4">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="font-bold text-brand-700 dark:text-brand-400">Executive Summary</div>
//                   <div className="flex gap-2">
//                     <span className="badge bg-green-100 text-green-700">{result.hire_recommendation}</span>
//                     <span className="badge bg-brand-100 text-brand-700">{result.overall_rating}</span>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-700 dark:text-gray-300">{result.summary}</p>
//               </div>
//               <div className="grid grid-cols-3 gap-3">
//                 {[['Confidence', `${result.confidence}%`, '#6172f3'], ['Communication', `${result.communication_score}/100`, '#10b981'], ['Leadership', result.leadership_potential, '#f59e0b']].map(([l, v, c]) => (
//                   <div key={l} className="card p-3 text-center">
//                     <div className="text-lg font-bold" style={{ color: c }}>{v}</div>
//                     <div className="text-xs text-gray-400">{l}</div>
//                   </div>
//                 ))}
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
//                   <div className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">✅ Strengths</div>
//                   {result.strengths?.map((s, i) => (
//                     <div key={i} className="text-xs text-gray-700 dark:text-gray-300 py-1 border-b border-green-100 dark:border-green-900/30 last:border-0">• {s}</div>
//                   ))}
//                 </div>
//                 <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
//                   <div className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Weaknesses</div>
//                   {result.weaknesses?.map((w, i) => (
//                     <div key={i} className="text-xs text-gray-700 dark:text-gray-300 py-1 border-b border-red-100 dark:border-red-900/30 last:border-0">• {w}</div>
//                   ))}
//                 </div>
//               </div>
//               <div className="card p-4">
//                 <div className="font-bold text-gray-900 dark:text-white mb-3 text-sm">🎯 Technical Interview Questions</div>
//                 <div className="space-y-3">
//                   {result.technical_questions?.map((q, i) => (
//                     <div key={i} className="border-l-2 border-brand-400 pl-3">
//                       <div className="text-sm text-gray-900 dark:text-white font-medium">{q.q}</div>
//                       <div className="text-xs text-gray-400 mt-0.5">Purpose: {q.purpose}</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div className="card p-4">
//                 <div className="font-bold text-gray-900 dark:text-white mb-3 text-sm">💬 HR Questions</div>
//                 <div className="space-y-3">
//                   {result.hr_questions?.map((q, i) => (
//                     <div key={i} className="border-l-2 border-green-400 pl-3">
//                       <div className="text-sm text-gray-900 dark:text-white font-medium">{q.q}</div>
//                       <div className="text-xs text-gray-400 mt-0.5">Purpose: {q.purpose}</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//           {result && !isInterview && (
//             <div className="space-y-4">
//               <div className={`rounded-xl p-5 text-center ${result.risk_level === 'Low' ? 'bg-green-50 dark:bg-green-900/20' : result.risk_level === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
//                 <div className="text-5xl font-bold mb-2" style={{ color: result.risk_level === 'Low' ? '#16a34a' : result.risk_level === 'Medium' ? '#d97706' : '#dc2626' }}>
//                   {result.fraud_risk_score}%
//                 </div>
//                 <div className="text-lg font-bold text-gray-900 dark:text-white">{result.overall_verdict}</div>
//                 <div className="text-sm text-gray-500 mt-1">Fraud Risk Score · Confidence: {result.confidence}%</div>
//                 <div className="mt-3">
//                   <span className={`badge text-sm px-3 py-1 ${result.risk_level === 'Low' ? 'bg-green-100 text-green-700' : result.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
//                     Risk Level: {result.risk_level}
//                   </span>
//                 </div>
//               </div>
//               {result.suspicious_indicators?.length > 0 && (
//                 <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
//                   <div className="font-bold text-red-700 dark:text-red-400 text-sm mb-2">⚠️ Suspicious Indicators</div>
//                   {result.suspicious_indicators.map((ind, i) => (
//                     <div key={i} className="py-2 border-b border-red-100 dark:border-red-900/30 last:border-0">
//                       <div className="flex items-center gap-2">
//                         <span className={`badge ${ind.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{ind.severity}</span>
//                         <span className="text-sm font-medium text-gray-900 dark:text-white">{ind.indicator}</span>
//                       </div>
//                       <div className="text-xs text-gray-500 mt-1">{ind.details}</div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//               {result.authentic_signals?.length > 0 && (
//                 <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
//                   <div className="font-bold text-green-700 dark:text-green-400 text-sm mb-2">✅ Authentic Signals</div>
//                   {result.authentic_signals.map((s, i) => (
//                     <div key={i} className="text-sm text-gray-700 dark:text-gray-300 py-1">• {s}</div>
//                   ))}
//                 </div>
//               )}
//               <div className="card p-4">
//                 <div className="font-bold text-sm text-gray-900 dark:text-white mb-2">🎯 Recommendation: {result.recommendation}</div>
//                 <div className="space-y-2">
//                   {result.verification_steps?.map((s, i) => (
//                     <div key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
//                       <span className="text-brand-500 font-bold">{i + 1}.</span>{s}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// ── Resume Tab Content ────────────────────────────────────────────────────────
// ResumeTab — replace the entire ResumeTab function in Candidates.jsx
function ResumeTab({ candidate }) {
  const [method, setMethod] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  // ✅ Get resume URL — checks all possible field names including \n suffix
  const rawUrl = React.useMemo(() => {
    // Already parsed by store.js into these clean fields
    if (candidate.resumeUrl) return candidate.resumeUrl;
    if (candidate.resume_url) return candidate.resume_url;
    // Fallback: search all keys in case store didn't trim
    const key = Object.keys(candidate).find(
      k => k.trim() === 'Resume URL' && candidate[k]?.trim()
    );
    return key ? candidate[key].trim() : '';
  }, [candidate]);

  // ✅ Extract Google Drive file ID from any Drive URL format
  const getDriveFileId = url => {
    if (!url) return null;
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    return null;
  };

  const fileId = getDriveFileId(rawUrl);

  // ✅ Build fallback URL list
  const urls = React.useMemo(() => {
    if (fileId) {
      return [
        // Method 0: Direct Drive preview (best)
        'https://drive.google.com/file/d/' + fileId + '/preview',
        // Method 1: Google Docs viewer (CORS-safe proxy)
        'https://docs.google.com/viewer?url=' +
          encodeURIComponent(
            'https://drive.google.com/uc?export=download&id=' + fileId
          ) +
          '&embedded=true',
      ];
    }
    if (rawUrl) {
      return [
        'https://docs.google.com/viewer?url=' +
          encodeURIComponent(rawUrl) +
          '&embedded=true',
        rawUrl,
      ];
    }
    return [];
  }, [fileId, rawUrl]);

  const currentUrl = urls[method] || '';
  const driveViewUrl = fileId
    ? 'https://drive.google.com/file/d/' + fileId + '/view'
    : rawUrl;

  // Reset when candidate changes
  React.useEffect(() => {
    setMethod(0);
    setLoading(true);
    setFailed(false);
  }, [rawUrl]);

  const handleLoad = () => {
    setLoading(false);
    setFailed(false);
  };

  const handleError = () => {
    const next = method + 1;
    if (next < urls.length) {
      setMethod(next);
      setLoading(true);
      setFailed(false);
    } else {
      setLoading(false);
      setFailed(true);
    }
  };

  const handleRetry = () => {
    setMethod(0);
    setLoading(true);
    setFailed(false);
  };

  // No URL
  if (!rawUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-400 gap-3">
        <FiFileText className="w-12 h-12 opacity-30" />
        <div className="font-medium text-gray-600 dark:text-gray-300">
          No resume URL provided
        </div>
        <div className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
          Set the
          <strong className="text-gray-500 dark:text-gray-300"> resume_url </strong>
          field on the candidate record in the database.
        </div>
      </div>
    );
  }

  // All methods failed
  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 p-6">
        <FiAlertTriangle className="w-12 h-12 text-amber-400" />
        <div className="font-semibold text-gray-700 dark:text-gray-300 text-center">
          Could not preview resume
        </div>
        <div className="text-xs text-center text-gray-400 max-w-xs leading-relaxed">
          Make sure the file is shared as
          <strong className="text-gray-600 dark:text-gray-300"> Anyone with the link can view </strong>
          in Google Drive.
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => window.open(driveViewUrl, '_blank')}
            className="btn-primary px-5 py-2 text-sm"
          >
            Open in Google Drive
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="px-5 py-2 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300"
          >
            Retry
          </button>
        </div>
        <div className="text-xs text-gray-300 break-all max-w-sm text-center font-mono mt-1">
          {rawUrl}
        </div>
      </div>
    );
  }

  // Preview
  return (
    <div className="w-full h-[75vh] rounded-2xl overflow-hidden border border-surface-border dark:border-surface-border-dark relative bg-gray-100 dark:bg-gray-900">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 z-10 gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <div className="text-sm text-gray-400">
            {method > 0
              ? 'Trying fallback method ' + (method + 1) + '...'
              : 'Loading resume...'}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-surface-border dark:border-surface-border-dark">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate max-w-xs">
          {candidate.Name} - Resume
        </span>
        <button
          type="button"
          onClick={() => window.open(driveViewUrl, '_blank')}
          className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex-shrink-0 ml-4 bg-transparent border-none cursor-pointer"
        >
          Open in Drive
        </button>
      </div>

      {/* iframe */}
      <iframe
        key={'rf-' + method + '-' + rawUrl}
        src={currentUrl}
        title="Resume Preview"
        className="w-full h-full pt-10"
        style={{ border: 'none' }}
        onLoad={handleLoad}
        onError={handleError}
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}

// ── Candidate Modal ───────────────────────────────────────────────────────────
function CandidateModal({ candidate, onClose }) {
  const [tab, setTab] = useState('Profile');
  const [showEmail, setShowEmail] = useState(false);
  const [showAI, setShowAI] = useState(null);
  const [note, setNote] = useState(candidate.notes || '');
  const [noteSaved, setNoteSaved] = useState(false);
  const { updateCandidateStatus, updateCandidateNotes } = useAppStore();
  const { user } = useAuthStore();
  const skills = (candidate.Skills || '').split(',').map(s => s.trim()).filter(Boolean);

  const saveNote = () => {
    updateCandidateNotes(candidate.id, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const tabs = ['Profile', 'Resume', 'Evaluation', 'AI Assistant', 'Fraud Detection', 'Notes'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      {showEmail && <EmailModal candidate={candidate} onClose={() => setShowEmail(false)} />}
      {showAI && <AIModal candidate={candidate} type={showAI} onClose={() => setShowAI(null)} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: avatarColor(candidate.Name || '') }}
              >
                {initials(candidate.Name || '')}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-gray-900 dark:text-white truncate font-display">{candidate.Name}</div>
                <div className="text-sm text-gray-500 truncate">{candidate['Job title']} · {candidate.City}</div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={candidate.status} small />
                  {user?.role === 'Admin' && (
                    <select
                      value={candidate.status}
                      onChange={e => updateCandidateStatus(candidate.id, e.target.value, user?.name)}
                      className="text-xs border border-surface-border dark:border-surface-border-dark rounded-lg px-2 py-1 bg-white dark:bg-surface-card-dark focus:outline-none focus:ring-1 focus:ring-brand-400"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <QuickActions candidate={candidate} onEmail={() => setShowEmail(true)} />

          {/* Tabs */}
          <div className="flex gap-0 mt-4 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  tab === t
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {t === 'AI Assistant' ? '🤖 AI Assistant' : t === 'Fraud Detection' ? '🔍 Fraud Detect' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Profile Tab ── */}
          {tab === 'Profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h3>
                <div className="space-y-2">
                  {[
                    { icon: FiMail, label: 'Email', val: candidate.Email, href: `mailto:${candidate.Email}` },
                    { icon: FiPhone, label: 'Phone', val: candidate.Phone, href: `tel:${(candidate.Phone || '').replace(/\s+/g, '')}` },
                    { icon: FiMapPin, label: 'City', val: candidate.City, href: `https://maps.google.com/?q=${candidate.City} India` },
                  ].map(({ icon: Icon, label, val, href }) => (
                    <a key={label} href={href} target={label !== 'Phone' ? '_blank' : undefined} rel="noreferrer"
                      className="flex items-center gap-3 p-2.5 bg-white dark:bg-white/5 rounded-xl border border-surface-border dark:border-surface-border-dark hover:border-brand-300 transition-colors group">
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">{label}</div>
                        <div className="text-sm text-brand-600 dark:text-brand-400 font-medium">{val || '—'}</div>
                      </div>
                      <span className="ml-auto text-gray-300 group-hover:text-brand-400 text-sm">→</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                <ATSGauge score={candidate['ATS Score'] || 0} />
                <div className="text-xs text-gray-400">Applied: {candidate.appliedDate}</div>
                {candidate.interviewDate && (
                  <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-gray-400">Interview Date</div>
                    <div className="text-sm font-bold text-brand-600 dark:text-brand-400">{candidate.interviewDate}</div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">{s}</span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Education</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate['Educational Qualification'] || '—'}</p>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Job History</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate['Job History'] || '—'}</p>
              </div>
            </div>
          )}

          {/* ── Resume Tab ── */}
          {tab === 'Resume' && <ResumeTab candidate={candidate} />}

          {/* ── Evaluation Tab ── */}
          {tab === 'Evaluation' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">🤖 AI HR Evaluation</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate['HR Evaluation'] || 'No evaluation available.'}</p>
              </div>
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Score Breakdown</h3>
                {[
                  ['Skills Match', Math.min((candidate['ATS Score'] || 0) + 5, 100)],
                  ['Experience Relevance', Math.max((candidate['ATS Score'] || 0) - 8, 0)],
                  ['Education Fit', Math.min((candidate['ATS Score'] || 0) + 2, 100)],
                  ['Overall ATS', candidate['ATS Score'] || 0],
                ].map(([label, val]) => (
                  <div key={label} className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span className="font-bold" style={{ color: scoreColor(val).text }}>{val}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: scoreColor(val).text }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI Assistant Tab ── */}
          {tab === 'AI Assistant' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiCpu className="w-8 h-8 text-brand-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI Interview Assistant</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                Generate interview questions, candidate assessment, strengths & weaknesses, and hiring recommendation.
              </p>
              <button onClick={() => setShowAI('interview')} className="btn-primary px-8 py-3 text-base">
                🤖 Generate AI Analysis
              </button>
            </div>
          )}

          {/* ── Fraud Detection Tab ── */}
          {tab === 'Fraud Detection' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI Fraud Detection</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                Analyze resume authenticity, detect AI-generated content, timeline inconsistencies, and suspicious claims.
              </p>
              <button
                onClick={() => setShowAI('fraud')}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                🔍 Run Fraud Detection
              </button>
            </div>
          )}

          {/* ── Notes Tab ── */}
          {tab === 'Notes' && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiEdit3 className="text-brand-500" /> HR Notes
              </h3>
              <textarea
                value={note}
                onChange={e => { setNote(e.target.value); setNoteSaved(false); }}
                placeholder="Add interview notes, observations, follow-up actions…"
                className="w-full min-h-48 p-4 rounded-xl border border-surface-border dark:border-surface-border-dark bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all leading-relaxed"
              />
              <div className="flex items-center gap-3 mt-3">
                <button onClick={saveNote} className="btn-primary px-5 py-2 text-sm">Save Notes</button>
                {noteSaved && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 text-sm font-medium">
                    ✓ Saved
                  </motion.span>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

// ── Main Candidates Page ──────────────────────────────────────────────────────
export default function Candidates() {
  const { candidates, updateCandidateStatus, duplicateCandidate, deleteCandidate } = useAppStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [scoreMin, setScoreMin] = useState(0);
  const [sort, setSort] = useState({ key: 'ATS Score', dir: -1 });
  const [selected, setSelected] = useState(null);
  const [bulkSel, setBulkSel] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const filtered = useMemo(() => candidates.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.Name?.toLowerCase().includes(q) && !c.Email?.toLowerCase().includes(q) && !c.Skills?.toLowerCase().includes(q)) return false;
    if (roleFilter !== 'All' && c['Job title'] !== roleFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if ((c['ATS Score'] || 0) < scoreMin) return false;
    return true;
  }).sort((a, b) => {
    const av = a[sort.key] || 0, bv = b[sort.key] || 0;
    return typeof av === 'string' ? sort.dir * av.localeCompare(bv) : sort.dir * (av - bv);
  }), [candidates, search, roleFilter, statusFilter, scoreMin, sort]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const toggleSort = key => setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 });

  const handleDuplicate = async c => {
    const copy = await duplicateCandidate(c.id, user?.name);
    if (copy) toast.success(`Duplicated "${c.Name}"`);
  };

  const handleDelete = async c => {
    if (!window.confirm(`Move "${c.Name}" to trash? You can restore it later from Trash.`)) return;
    const ok = await deleteCandidate(c.id, user?.role, user?.name);
    if (ok) toast.success('Candidate moved to trash');
    else toast.error('Failed to delete candidate');
  };
  const SortIcon = ({ k }) => sort.key === k
    ? (sort.dir > 0 ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />)
    : null;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">All Candidates</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} of {candidates.length} candidates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(filtered)}
            className="btn-ghost text-sm flex items-center gap-2 border border-surface-border dark:border-surface-border-dark">
            <FiDownload className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, skills…" className="input pl-9 text-sm" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="input text-sm w-auto">
            <option value="All">All Roles</option>
            {JOB_ROLES.map(r => <option key={r} value={r}>{r.split('(')[0].trim()}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input text-sm w-auto">
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">Min ATS</span>
            <input type="range" min={0} max={100} step={5} value={scoreMin}
              onChange={e => { setScoreMin(+e.target.value); setPage(1); }} className="w-20" />
            <span className="text-xs font-bold text-brand-600 w-6">{scoreMin}</span>
          </div>
        </div>
      </motion.div>

      {/* Bulk actions */}
      <AnimatePresence>
        {bulkSel.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-brand-700 dark:text-brand-400">{bulkSel.length} selected</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="text-sm border border-brand-200 dark:border-brand-500/30 rounded-xl px-3 py-1.5 bg-white dark:bg-surface-card-dark focus:outline-none">
              <option value="">Change status…</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => {
                if (!bulkStatus) return;
                bulkSel.forEach(id => updateCandidateStatus(id, bulkStatus, user?.name));
                setBulkSel([]); setBulkStatus('');
                toast.success('Status updated!');
              }}
              className="btn-primary text-xs px-4 py-1.5">Apply</button>
            <button onClick={() => setBulkSel([])}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border dark:border-surface-border-dark bg-gray-50 dark:bg-white/5">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded"
                    onChange={e => setBulkSel(e.target.checked ? filtered.map(c => c.id) : [])}
                    checked={bulkSel.length === filtered.length && filtered.length > 0} />
                </th>
                {[['Name', 'Name'], ['Job title', 'Role'], ['City', 'City'], ['ATS Score', 'ATS'], ['status', 'Status'], ['interviewDate', 'Interview']].map(([key, label]) => (
                  <th key={key} onClick={() => toggleSort(key)}
                    className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <div className="flex items-center gap-1">{label}<SortIcon k={key} /></div>
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-surface-border/50 dark:border-surface-border-dark/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={bulkSel.includes(c.id)}
                      onChange={() => setBulkSel(p => p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id])} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: avatarColor(c.Name || '') }}>
                        {initials(c.Name || '')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-36">{c.Name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-36">{c.Email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-32">
                    <div className="truncate">{c['Job title']?.split('(')[0].trim()}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.City || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: scoreColor(c['ATS Score'] || 0).text }}>
                      {c['ATS Score'] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user?.role === 'Admin' ? (
                      <select value={c.status} onChange={e => updateCandidateStatus(c.id, e.target.value, user?.name)}
                        className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 transition-all"
                        style={{ borderColor: STATUS_COLORS[c.status]?.border, background: STATUS_COLORS[c.status]?.bg, color: STATUS_COLORS[c.status]?.text }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : <StatusBadge status={c.status} small />}
                  </td>
                  <td className="px-4 py-3">
                    {c.interviewDate
                      ? <span className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30">{c.interviewDate}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelected(c)} title="View"
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20">
                        <FiEye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => handleDuplicate(c)} title="Duplicate"
                        className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors">
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(c)} title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <FiFilter className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="font-medium">No candidates match your filters</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-surface-border dark:border-surface-border-dark flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </div>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page === i + 1 ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selected && <CandidateModal candidate={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
