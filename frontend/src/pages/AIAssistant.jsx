import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCpu,
  FiSearch,
  FiAlertTriangle,
  FiZap,
  FiChevronRight,
  FiCheck,
  FiX,
} from 'react-icons/fi';

import { useAppStore } from '../context/store';

import {
  initials,
  avatarColor,
  scoreColor,
} from '../utils/helpers';

import toast from 'react-hot-toast';

const API_BASE = 'http://127.0.0.1:8000';

// ─────────────────────────────────────────────
// FASTAPI CALLS
// ─────────────────────────────────────────────

async function generateInterviewAnalysis(candidate) {
  const payload = {
    name: candidate.Name || candidate.name,

    job_title:
      candidate['Job title'] ||
      candidate.job_title ||
      '',

    education:
      candidate['Educational Qualification'] ||
      candidate.education ||
      '',

    job_history:
      candidate['Job History'] ||
      candidate.job_history ||
      '',

    skills:
      candidate.Skills ||
      candidate.skills ||
      '',

    ats_score:
      candidate['ATS Score'] ||
      candidate.ats_score ||
      0,

    hr_evaluation:
      candidate['HR Evaluation'] ||
      candidate.hr_evaluation ||
      '',
  };

  const res = await fetch(
    `${API_BASE}/ai/interview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return await res.json();
}

async function generateFraudDetection(candidate) {
  const payload = {
    name: candidate.Name || candidate.name,

    job_title:
      candidate['Job title'] ||
      candidate.job_title ||
      '',

    education:
      candidate['Educational Qualification'] ||
      candidate.education ||
      '',

    job_history:
      candidate['Job History'] ||
      candidate.job_history ||
      '',

    skills:
      candidate.Skills ||
      candidate.skills ||
      '',

    ats_score:
      candidate['ATS Score'] ||
      candidate.ats_score ||
      0,
  };

  const res = await fetch(
    `${API_BASE}/ai/fraud`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return await res.json();
}

// ─────────────────────────────────────────────
// INTERVIEW ANALYSIS DISPLAY
// ─────────────────────────────────────────────

function InterviewAnalysisView({ data }) {
  return (
    <div className="space-y-6">
      {/* CANDIDATE SUMMARY */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          📋 Candidate Summary
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.candidate_summary}
        </p>
      </div>

      {/* STRENGTHS */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
          <FiCheck className="w-5 h-5" />
          Key Strengths
        </h3>
        <div className="space-y-3">
          {data.strengths?.map((strength, idx) => (
            <div
              key={idx}
              className="flex gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30"
            >
              <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 dark:text-gray-300">
                {strength}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* WEAKNESSES */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
          <FiAlertTriangle className="w-5 h-5" />
          Areas for Development
        </h3>
        <div className="space-y-3">
          {data.weaknesses?.map((weakness, idx) => (
            <div
              key={idx}
              className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30"
            >
              <FiAlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 dark:text-gray-300">
                {weakness}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* TECHNICAL QUESTIONS */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">
          🎯 Technical Interview Questions
        </h3>
        <div className="space-y-3">
          {data.technical_interview_questions?.map(
            (q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30"
              >
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Q{idx + 1}: {q}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* HR QUESTIONS */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-4">
          👥 HR Interview Questions
        </h3>
        <div className="space-y-3">
          {data.hr_interview_questions?.map(
            (q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30"
              >
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Q{idx + 1}: {q}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* COMMUNICATION ANALYSIS */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mb-3">
          💬 Communication Analysis
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.communication_analysis}
        </p>
      </div>

      {/* LEADERSHIP ANALYSIS */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">
          🎓 Leadership Potential
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.leadership_analysis}
        </p>
      </div>

      {/* HIRING RECOMMENDATION */}
      {data.hiring_recommendation && (
        <div
          className={`card p-6 border-l-4 ${
            data.hiring_recommendation.recommendation ===
            'RECOMMENDED FOR INTERVIEW'
              ? 'border-l-green-500 bg-green-50 dark:bg-green-500/10'
              : 'border-l-blue-500 bg-blue-50 dark:bg-blue-500/10'
          }`}
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FiZap className="w-5 h-5" />
            Hiring Recommendation
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {
                  data
                    .hiring_recommendation
                    .recommendation
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Confidence
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {
                  data.hiring_recommendation
                    .confidence
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reasoning
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {
                  data.hiring_recommendation
                    .reasoning
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next Steps
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {
                  data.hiring_recommendation
                    .next_steps
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// FRAUD DETECTION DISPLAY
// ─────────────────────────────────────────────

function FraudDetectionView({ data }) {
  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-300';
      case 'HIGH':
        return 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-300';
      case 'VERY HIGH':
        return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-50 dark:bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* RISK SCORE CARD */}
      <div
        className={`card p-6 border border-2 ${getRiskColor(
          data.risk_level
        )}`}
      >
        <div className="text-center">
          <h3 className="text-lg font-bold mb-4">
            Fraud Risk Assessment
          </h3>

          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">
              {data.fraud_risk_score}%
            </div>
            <p className="text-xl font-bold">
              {data.risk_level} Risk
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-75 mb-1">
                Confidence
              </p>
              <p className="text-2xl font-bold">
                {data.confidence}%
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75 mb-1">
                Status
              </p>
              <p className="text-2xl font-bold">
                {data.risk_level}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FINDINGS */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          📋 Detailed Findings
        </h3>
        <div className="space-y-3">
          {data.findings?.map((finding, idx) => {
            const severityColor = {
              none: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30',
              low: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30',
              medium: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30',
              high: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30',
            };

            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  severityColor[finding.severity]
                }`}
              >
                <div className="flex items-start gap-3">
                  {finding.status === 'verified' ? (
                    <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : finding.status === 'clean' ? (
                    <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <FiAlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      {finding.category}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {finding.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUSPICIOUS INDICATORS */}
      {data.suspicious_indicators &&
        data.suspicious_indicators.length > 0 && (
          <div className="card p-6 border border-red-200 dark:border-red-500/30">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5" />
              Suspicious Indicators
            </h3>
            <div className="space-y-2">
              {data.suspicious_indicators.map(
                (indicator, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10"
                  >
                    <FiX className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300">
                      {indicator}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {/* CONTENT QUALITY */}
      {data.content_quality && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📊 Content Quality Metrics
          </h3>
          <div className="space-y-4">
            {Object.entries(
              data.content_quality
            ).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {value}%
                  </p>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${
                      value >= 85
                        ? 'bg-green-500'
                        : value >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${value}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECOMMENDATION */}
      {data.recommendation && (
        <div
          className={`card p-6 border-l-4 ${
            data.recommendation.status ===
            'APPROVED'
              ? 'border-l-green-500 bg-green-50 dark:bg-green-500/10'
              : data.recommendation.status ===
                  'REVIEW'
              ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
              : 'border-l-red-500 bg-red-50 dark:bg-red-500/10'
          }`}
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            ✅ Recommendation
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Status
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.recommendation.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Message
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {data.recommendation.message}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Next Action
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {data.recommendation.next_action}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CANDIDATE PICKER
// ─────────────────────────────────────────────

function CandidatePicker({
  candidates,
  selected,
  onSelect,
}) {
  const [search, setSearch] = useState('');

  const filtered = candidates
    .filter(
      (c) =>
        c.Name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        c['Job title']
          ?.toLowerCase()
          .includes(search.toLowerCase())
    )
    .slice(0, 8);

  return (
    <div>
      <div className="relative mb-3">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search candidate..."
          className="input pl-9 text-sm"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filtered.map((c) => {
          const sc = scoreColor(
            c['ATS Score'] || 0
          );

          return (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
              ${
                selected?.id === c.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                  : 'border-surface-border dark:border-surface-border-dark hover:border-brand-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{
                  background: avatarColor(
                    c.Name || ''
                  ),
                }}
              >
                {initials(c.Name || '')}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {c.Name}
                </div>

                <div className="text-xs text-gray-400 truncate">
                  {c['Job title']}
                </div>
              </div>

              <span
                className="text-sm font-bold"
                style={{ color: sc.text }}
              >
                {c['ATS Score'] || 0}
              </span>

              {selected?.id === c.id && (
                <FiChevronRight className="w-4 h-4 text-brand-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function AIAssistant() {
  const { candidates } = useAppStore();

  const [selected, setSelected] =
    useState(null);

  const [mode, setMode] =
    useState('interview');

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState(null);

  const analyze = async () => {
    if (!selected) {
      toast.error(
        'Please select candidate'
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response =
        mode === 'interview'
          ? await generateInterviewAnalysis(
              selected
            )
          : await generateFraudDetection(
              selected
            );

      console.log(response);

      setResult(response.data);

      toast.success(
        'Analysis completed!'
      );
    } catch (e) {
      console.error(e);

      setError(
        e.message ||
          'Something went wrong'
      );

      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">

      {/* HEADER */}

      <motion.div
        initial={{
          opacity: 0,
          y: -8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
            <FiCpu className="w-5 h-5 text-white" />
          </span>

          AI Assistant
        </h1>

        <p className="text-gray-400 text-sm mt-1">
          Powered by GPT-4o-mini ·
          Interview analysis & fraud
          detection
        </p>
      </motion.div>

      {/* LAYOUT */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}

        <div className="space-y-4">

          {/* MODE */}

          <div className="card p-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-3">
              Analysis Type
            </div>

            <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 gap-1">

              <button
                onClick={() => {
                  setMode('interview');
                  setResult(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${
                  mode === 'interview'
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500'
                }`}
              >
                Interview
              </button>

              <button
                onClick={() => {
                  setMode('fraud');
                  setResult(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${
                  mode === 'fraud'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-500'
                }`}
              >
                Fraud
              </button>

            </div>
          </div>

          {/* CANDIDATES */}

          <div className="card p-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-3">
              Select Candidate
            </div>

            <CandidatePicker
              candidates={candidates}
              selected={selected}
              onSelect={(c) => {
                setSelected(c);
                setResult(null);
              }}
            />
          </div>

          {/* SELECTED */}

          {selected && (
            <div className="card p-4">

              <div className="flex items-center gap-3 mb-3">

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{
                    background:
                      avatarColor(
                        selected.Name || ''
                      ),
                  }}
                >
                  {initials(
                    selected.Name || ''
                  )}
                </div>

                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    {selected.Name}
                  </div>

                  <div className="text-xs text-gray-400">
                    {selected['Job title']}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  ATS Score:{' '}
                  <span className="font-bold">
                    {selected[
                      'ATS Score'
                    ] || 0}
                    /100
                  </span>
                </div>

                <div>
                  Skills:{' '}
                  {selected.Skills?.split(
                    ','
                  )
                    .slice(0, 3)
                    .join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* BUTTON */}

          <button
            onClick={analyze}
            disabled={!selected || loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FiZap className="w-4 h-4" />
                Generate AI Analysis
              </div>
            )}
          </button>
        </div>

        {/* RIGHT */}

        <div className="lg:col-span-2">

          {!loading &&
            !result &&
            !error && (
              <div className="card min-h-[500px] flex flex-col items-center justify-center text-center p-8">

                <FiCpu className="w-16 h-16 text-brand-500 mb-4" />

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Recruitment
                  Intelligence
                </h2>

                <p className="text-gray-400 max-w-md">
                  Select a candidate and
                  generate interview
                  analysis or fraud
                  detection.
                </p>
              </div>
            )}

          {loading && (
            <div className="card min-h-[500px] flex flex-col items-center justify-center">

              <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-5" />

              <div className="text-lg font-semibold">
                Running AI analysis...
              </div>

              <div className="text-sm text-gray-400 mt-2">
                Please wait
              </div>
            </div>
          )}

          {error && (
            <div className="card p-8 text-center">

              <FiAlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4" />

              <div className="text-xl font-bold mb-2">
                Analysis Failed
              </div>

              <div className="text-red-500 mb-4 whitespace-pre-wrap">
                {error}
              </div>

              <button
                onClick={analyze}
                className="btn-primary px-6 py-2.5"
              >
                Retry
              </button>
            </div>
          )}

          {result && (
            <div className="card p-6 overflow-y-auto max-h-[85vh]">
              {mode === 'interview' ? (
                <InterviewAnalysisView
                  data={result}
                />
              ) : (
                <FraudDetectionView
                  data={result}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}