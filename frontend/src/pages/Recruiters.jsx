import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiShield, FiX, FiSearch, FiUsers, FiBriefcase } from 'react-icons/fi';
import { useAppStore, useAuthStore } from '../context/store';
import { initials, avatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', password: '' };

function NewRecruiterModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Name, email and password are required');
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-surface-card-dark rounded-2xl w-full max-w-md shadow-modal">
        <div className="p-5 border-b border-surface-border dark:border-surface-border-dark flex items-center justify-between">
          <div className="font-bold text-gray-900 dark:text-white">New Recruiter Account</div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"><FiX className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="recruiter@autoflex.com"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Temporary password"
              className="w-full px-3 py-2.5 text-sm border border-surface-border dark:border-surface-border-dark rounded-xl bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>
        <div className="p-5 border-t border-surface-border dark:border-surface-border-dark">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {saving ? 'Creating...' : 'Create Recruiter Account'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Recruiters() {
  const { user } = useAuthStore();
  const { candidates, fetchUsers, createRecruiter, assignCandidate } = useAppStore();
  const isAdmin = user?.role === 'Admin';
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setRecruiters(await fetchUsers('Recruiter'));
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
        <p className="text-gray-400 text-sm">Recruiter management is available to HR Admin only.</p>
      </div>
    );
  }

  const handleCreate = async (form) => {
    try {
      const created = await createRecruiter(form);
      setRecruiters(r => [created, ...r]);
      toast.success('Recruiter account created');
      setShowCreate(false);
    } catch (e) {
      toast.error(e.message || 'Failed to create recruiter account');
    }
  };

  const handleAssign = async (candidateId, recruiterId) => {
    const updated = await assignCandidate(candidateId, recruiterId ? Number(recruiterId) : null);
    if (updated) toast.success(recruiterId ? 'Candidate assigned' : 'Candidate unassigned');
    else toast.error('Failed to update assignment');
  };

  const recruiterName = (id) => recruiters.find(r => r.id === id)?.name;

  const filteredCandidates = useMemo(() => candidates.filter(c => {
    const q = search.toLowerCase();
    if (!q) return true;
    return c.Name?.toLowerCase().includes(q) || c.Email?.toLowerCase().includes(q) || c['Job title']?.toLowerCase().includes(q);
  }), [candidates, search]);

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center"><FiUsers className="w-5 h-5 text-white" /></span>
            Recruiters
          </h1>
          <p className="text-gray-400 text-sm mt-1">{recruiters.length} recruiter{recruiters.length === 1 ? '' : 's'} · Create accounts and assign candidates</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5">
          <FiUserPlus className="w-4 h-4" /> New Recruiter Account
        </button>
      </motion.div>

      {/* Recruiter accounts */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : recruiters.length === 0 ? (
        <div className="card text-center py-10 text-gray-400 mb-6">
          <FiUsers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="font-medium">No recruiter accounts yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {recruiters.map(r => {
            const assignedCount = candidates.filter(c => c.assignedRecruiterId === r.id).length;
            return (
              <div key={r.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: avatarColor(r.name || '') }}>
                  {initials(r.name || '')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.name}</div>
                  <div className="text-xs text-gray-400 truncate">{r.email}</div>
                </div>
                <span className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 text-xs flex-shrink-0">{assignedCount} assigned</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate assignment */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="p-4 border-b border-surface-border dark:border-surface-border-dark flex items-center justify-between gap-3 flex-wrap">
          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiBriefcase className="w-4 h-4 text-brand-500" /> Assign Candidates
          </div>
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…" className="input pl-9 text-sm" />
          </div>
        </div>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 dark:bg-white/5">
              <tr className="border-b border-surface-border dark:border-surface-border-dark">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Recruiter</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map(c => (
                <tr key={c.id} className="border-b border-surface-border/50 dark:border-surface-border-dark/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(c.Name || '') }}>
                        {initials(c.Name || '')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-44">{c.Name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-44">{c.Email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-40">
                    <div className="truncate">{c['Job title']?.split('(')[0].trim()}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.status}</td>
                  <td className="px-4 py-3">
                    <select value={c.assignedRecruiterId || ''} onChange={e => handleAssign(c.id, e.target.value)}
                      className="text-xs border border-surface-border dark:border-surface-border-dark rounded-lg px-2 py-1.5 bg-white dark:bg-surface-card-dark focus:outline-none focus:ring-1 focus:ring-brand-400">
                      <option value="">Unassigned</option>
                      {recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <div className="text-sm">No candidates match your search</div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreate && <NewRecruiterModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      </AnimatePresence>
    </div>
  );
}
