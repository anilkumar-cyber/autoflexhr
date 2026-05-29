import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiTarget, FiMove } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../context/store';
import { initials, avatarColor, scoreColor, STATUS_COLORS, STATUS_OPTIONS } from '../utils/helpers';
import toast from 'react-hot-toast';

const COLUMNS = ['New','Screening','Shortlisted','Interview Scheduled','Offer Extended','Rejected','On Hold'];
const COL_COLORS = {
  New: '#6172f3', Screening: '#f59e0b', Shortlisted: '#10b981',
  'Interview Scheduled': '#8b5cf6', 'Offer Extended': '#06b6d4',
  Rejected: '#ef4444', 'On Hold': '#9ca3af',
};

function CandidateCard({ candidate, onDragStart, onClick }) {
  const sc = scoreColor(candidate['ATS Score'] || 0);
  return (
    <motion.div
      layout
      draggable
      onDragStart={e => onDragStart(e, candidate.id)}
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      className="bg-white dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded-xl p-3.5 cursor-grab active:cursor-grabbing select-none transition-shadow"
    >
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(candidate.Name || '') }}>
          {initials(candidate.Name || '')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{candidate.Name}</div>
          <div className="text-xs text-gray-400 truncate">{candidate['Job title']?.split('(')[0].trim()}</div>
        </div>
        <FiMove className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: sc.text }}>
          <FiTarget className="w-3 h-3" />
          <span className="font-bold">{candidate['ATS Score'] || 0}</span>
        </div>
        {candidate.City && (
          <span className="text-xs text-gray-400 truncate max-w-20">{candidate.City}</span>
        )}
      </div>

      {candidate.interviewDate && (
        <div className="mt-2 text-xs bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg px-2 py-1">
          📅 {candidate.interviewDate}
        </div>
      )}
    </motion.div>
  );
}

function Column({ title, candidates, onDrop, onDragOver, onDragStart, onCardClick, count }) {
  const color = COL_COLORS[title] || '#6b7280';
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] md:min-w-0 md:flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{title}</span>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color + 'cc' }}>{count}</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => { setIsDragOver(false); onDrop(e, title); }}
        className={`flex-1 min-h-[400px] rounded-xl p-2 space-y-2 transition-all duration-200 ${isDragOver ? 'ring-2 ring-offset-1' : 'bg-gray-50 dark:bg-white/5'}`}
        style={isDragOver ? { background: color + '15', ringColor: color } : {}}
      >
        <AnimatePresence>
          {candidates.map(c => (
            <CandidateCard key={c.id} candidate={c} onDragStart={onDragStart} onClick={() => onCardClick(c)} />
          ))}
        </AnimatePresence>
        {candidates.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-24 text-xs text-gray-300 dark:text-gray-600 gap-1 rounded-lg border-2 border-dashed transition-colors ${isDragOver ? 'border-current' : 'border-gray-200 dark:border-gray-700'}`}
            style={isDragOver ? { borderColor: color, color } : {}}>
            <FiMove className="w-5 h-5" />
            <span>Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple candidate preview card
function QuickView({ candidate, onClose }) {
  const skills = (candidate.Skills || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 6);
  const sc = scoreColor(candidate['ATS Score'] || 0);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-sm shadow-modal p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: avatarColor(candidate.Name || '') }}>{initials(candidate.Name || '')}</div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">{candidate.Name}</div>
            <div className="text-sm text-gray-400">{candidate['Job title']?.split('(')[0].trim()}</div>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400">✕</button>
        </div>
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: sc.text }}>{candidate['ATS Score'] || 0}</div>
            <div className="text-xs text-gray-400">ATS Score</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">City: {candidate.City || '—'}</div>
            <div className="text-xs text-gray-400">Status: <span className="font-semibold text-gray-700 dark:text-gray-300">{candidate.status}</span></div>
            {candidate.interviewDate && <div className="text-xs text-brand-500 mt-1">📅 {candidate.interviewDate}</div>}
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map(s => <span key={s} className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30">{s}</span>)}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{candidate['HR Evaluation'] || candidate['Job History'] || '—'}</div>
      </motion.div>
    </div>
  );
}

export default function Pipeline() {
  const { candidates, updateCandidateStatus } = useAppStore();
  const { user } = useAuthStore();
  const [draggingId, setDraggingId] = useState(null);
  const [quickView, setQuickView] = useState(null);

  const grouped = {};
  COLUMNS.forEach(col => { grouped[col] = candidates.filter(c => c.status === col); });

  const handleDragStart = (e, id) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggingId === null) return;
    if (user?.role !== 'Admin') { toast.error('Only HR Admin can move candidates'); setDraggingId(null); return; }
    updateCandidateStatus(draggingId, targetStatus);
    toast.success(`Moved to ${targetStatus}`);
    setDraggingId(null);
  };

  const totalActive = candidates.filter(c => !['Rejected','On Hold'].includes(c.status)).length;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-display">Recruitment Pipeline</h1>
            <p className="text-gray-400 text-sm mt-1">Drag & drop candidates between stages · {totalActive} active</p>
          </div>
          {user?.role !== 'Admin' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              👁️ View only — Admin required to move cards
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3 mb-5 overflow-x-auto pb-1">
        {COLUMNS.slice(0, 5).map(col => (
          <div key={col} className="flex items-center gap-2 bg-white dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded-xl px-3 py-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ background: COL_COLORS[col] }} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{col.split(' ')[0]}</span>
            <span className="text-sm font-bold" style={{ color: COL_COLORS[col] }}>{grouped[col]?.length || 0}</span>
          </div>
        ))}
      </motion.div>

      {/* Kanban board */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex gap-3 overflow-x-auto pb-4 flex-1">
        {COLUMNS.map(col => (
          <Column key={col} title={col} candidates={grouped[col] || []} count={grouped[col]?.length || 0}
            onDragStart={handleDragStart} onDragOver={e => e.preventDefault()} onDrop={handleDrop} onCardClick={setQuickView} />
        ))}
      </motion.div>

      <AnimatePresence>
        {quickView && <QuickView candidate={quickView} onClose={() => setQuickView(null)} />}
      </AnimatePresence>
    </div>
  );
}
