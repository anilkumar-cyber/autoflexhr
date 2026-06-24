import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const STATUS_MAP = {
  shortlisted: 'Shortlisted',
  'interview scheduled': 'Interview Scheduled',
  'offer extended': 'Offer Extended',
  rejected: 'Rejected',
  'on hold': 'On Hold',
  screening: 'Screening',
  new: 'New',
};

function normalizeResumeUrl(raw) {
  if (!raw) return '';
  let u = raw.trim();
  // Resumes uploaded via the Employee Portal are stored as a path relative
  // to the backend (e.g. /uploads/resumes/x.pdf), not a full URL.
  if (u.startsWith('/uploads/')) return `${API_BASE}${u}`;
  const m =
    u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    u.match(/open\?id=([a-zA-Z0-9_-]+)/) ||
    u.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (m) u = `https://drive.google.com/file/d/${m[1]}/preview`;
  return u;
}

function mapDbCandidate(row) {
  const resume = normalizeResumeUrl(row.resume_url);
  const interviewStatusRaw = (row.interview_status || '').trim();
  const status =
    STATUS_MAP[interviewStatusRaw.toLowerCase()] ||
    interviewStatusRaw ||
    'New';

  return {
    id: row.id,
    Name: row.name || '',
    Email: row.email || '',
    Phone: row.phone || '',
    City: row.city || '',
    'Job title': row.job_title || '',
    Skills: row.skills || '',
    'Educational Qualification': row.education || '',
    'Job History': row.job_history || '',
    'HR Evaluation': row.hr_evaluation || '',
    'ATS Score': Math.round(row.ats_score || 0),
    'Interview Status': interviewStatusRaw,
    'Interview Date': row.interview_date || '',
    'Resume URL': row.resume_url || '',
    status,
    notes: row.notes || '',
    interviewDate: row.interview_date || '',
    resumeUrl: resume,
    resume_url: resume,
    referredByName: row.referred_by_name || '',
    appliedDate: row.applied_date || new Date().toISOString().split('T')[0],
    assignedRecruiterId: row.assigned_recruiter_id || null,
  };
}

// ── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Invalid credentials');
        const data = await res.json();
        set({ user: data.user, token: data.access_token });
        return data.user;
      },
      register: async (name, email, password, role) => {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
        const data = await res.json();
        set({ user: data.user, token: data.access_token });
        return data.user;
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'autoflex-auth',
      partialize: s => ({ user: s.user, token: s.token }),
    }
  )
);

function authHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── App Store ─────────────────────────────────────────────────────────────────
export const useAppStore = create(
  persist(
    (set, get) => ({
      candidates: [],
      loading: false,
      error: null,
      darkMode: false,
      lastRefresh: null,

      setDarkMode: v => {
        set({ darkMode: v });
        document.documentElement.classList.toggle('dark', v);
      },

      fetchCandidates: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/candidates/`, {
            headers: { Accept: 'application/json', ...authHeader() },
          });
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Backend error ${res.status}: ${txt.slice(0, 200)}`);
          }
          const rows = await res.json();
          const mapped = (rows || []).map(mapDbCandidate);
          set({
            candidates: mapped,
            loading: false,
            lastRefresh: new Date().toISOString(),
          });
          return mapped;
        } catch (e) {
          set({
            loading: false,
            error: e?.message || 'Failed to fetch candidates from database',
          });
          return [];
        }
      },

      updateCandidateStatus: async (id, status, actorName) => {
        set(s => ({
          candidates: s.candidates.map(c =>
            c.id === id ? { ...c, status, 'Interview Status': status } : c
          ),
        }));
        try {
          await fetch(`${API_BASE}/candidates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ interview_status: status }),
          });
        } catch (e) {
          set({ error: e?.message || 'Failed to update status' });
        }
      },

      updateCandidateNotes: async (id, notes) => {
        set(s => ({
          candidates: s.candidates.map(c =>
            c.id === id ? { ...c, notes } : c
          ),
        }));
        try {
          await fetch(`${API_BASE}/candidates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
        } catch (e) {
          set({ error: e?.message || 'Failed to save notes' });
        }
      },

      // Admin-only: moves a candidate to the trash (soft delete, restorable).
      deleteCandidate: async (id, role, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}`, {
            method: 'DELETE',
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete candidate');
          set(s => ({ candidates: s.candidates.filter(c => c.id !== id) }));
          return true;
        } catch (e) {
          set({ error: e?.message || 'Failed to delete candidate' });
          return false;
        }
      },

      duplicateCandidate: async (id, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}/duplicate`, {
            method: 'POST',
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to duplicate candidate');
          const row = await res.json();
          const mapped = mapDbCandidate(row);
          set(s => ({ candidates: [mapped, ...s.candidates] }));
          return mapped;
        } catch (e) {
          set({ error: e?.message || 'Failed to duplicate candidate' });
          return null;
        }
      },

      fetchTrash: async (role) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/trash`, {
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to load trash');
          const rows = await res.json();
          return (rows || []).map(mapDbCandidate);
        } catch (e) {
          set({ error: e?.message || 'Failed to load trash' });
          return [];
        }
      },

      restoreCandidate: async (id, role, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}/restore`, {
            method: 'POST',
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to restore candidate');
          const row = await res.json();
          const mapped = mapDbCandidate(row);
          set(s => ({ candidates: [mapped, ...s.candidates] }));
          return mapped;
        } catch (e) {
          set({ error: e?.message || 'Failed to restore candidate' });
          return null;
        }
      },

      permanentlyDeleteCandidate: async (id, role, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}/permanent`, {
            method: 'DELETE',
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to permanently delete candidate');
          return true;
        } catch (e) {
          set({ error: e?.message || 'Failed to permanently delete candidate' });
          return false;
        }
      },

      // ── Recruiters (Admin only) ─────────────────────────────────────────────
      fetchUsers: async (role) => {
        try {
          const params = role ? `?role=${encodeURIComponent(role)}` : '';
          const res = await fetch(`${API_BASE}/users/${params}`, {
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to load users');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to load users' });
          return [];
        }
      },

      createRecruiter: async (payload) => {
        try {
          const res = await fetch(`${API_BASE}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ ...payload, role: 'Recruiter' }),
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to create recruiter account');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to create recruiter account' });
          throw e;
        }
      },

      bulkImportResumes: async (files, jobId) => {
        try {
          const formData = new FormData();
          files.forEach(f => formData.append('resumes', f));
          if (jobId) formData.append('job_id', jobId);
          const res = await fetch(`${API_BASE}/candidates/bulk-resumes`, {
            method: 'POST',
            headers: { ...authHeader() },
            body: formData,
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to import resumes');
          const data = await res.json();
          const mapped = (data.created || []).map(mapDbCandidate);
          set(s => ({ candidates: [...mapped, ...s.candidates] }));
          return { created: mapped, skipped: data.skipped || [] };
        } catch (e) {
          set({ error: e?.message || 'Failed to import resumes' });
          return null;
        }
      },

      assignCandidate: async (id, recruiterId) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ assigned_recruiter_id: recruiterId }),
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to assign candidate');
          const row = await res.json();
          const mapped = mapDbCandidate(row);
          set(s => ({ candidates: s.candidates.map(c => c.id === id ? mapped : c) }));
          return mapped;
        } catch (e) {
          set({ error: e?.message || 'Failed to assign candidate' });
          return null;
        }
      },

      // ── Jobs (Admin only) ──────────────────────────────────────────────────
      fetchJobs: async (role) => {
        try {
          const res = await fetch(`${API_BASE}/jobs/`, {
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to load jobs');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to load jobs' });
          return [];
        }
      },

      createJob: async (payload, role, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/jobs/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to create job');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to create job' });
          return null;
        }
      },

      updateJob: async (id, payload, role, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/jobs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update job');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to update job' });
          return null;
        }
      },

      deleteJob: async (id, role, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/jobs/${id}`, {
            method: 'DELETE',
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete job');
          return true;
        } catch (e) {
          set({ error: e?.message || 'Failed to delete job' });
          return false;
        }
      },

      // ── Activity (Admin only) ──────────────────────────────────────────────
      fetchActivity: async (role) => {
        try {
          const res = await fetch(`${API_BASE}/activity/`, {
            headers: { ...authHeader() },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to load activity');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to load activity' });
          return [];
        }
      },

      // ── Notifications ────────────────────────────────────────────────────────
      fetchNotifications: async (role, email) => {
        try {
          const params = new URLSearchParams();
          if (role) params.set('role', role);
          if (email) params.set('email', email);
          const res = await fetch(`${API_BASE}/notifications/?${params.toString()}`);
          if (!res.ok) throw new Error('Failed to load notifications');
          return await res.json();
        } catch (e) {
          return [];
        }
      },

      fetchCandidate: async (id) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}`);
          if (!res.ok) throw new Error('Failed to load candidate');
          return await res.json();
        } catch (e) {
          return null;
        }
      },

      // ── Employee Portal: Referrals ──────────────────────────────────────────
      fetchOpenJobs: async () => {
        try {
          const res = await fetch(`${API_BASE}/jobs/?status=Open`);
          if (!res.ok) throw new Error('Failed to load open positions');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to load open positions' });
          return [];
        }
      },

      submitReferral: async (formData) => {
        try {
          const res = await fetch(`${API_BASE}/referrals/`, { method: 'POST', body: formData });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to submit referral');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to submit referral' });
          return null;
        }
      },

      fetchMyReferrals: async (employeeEmail) => {
        try {
          const res = await fetch(`${API_BASE}/referrals/mine?employee_email=${encodeURIComponent(employeeEmail)}`);
          if (!res.ok) throw new Error('Failed to load referrals');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to load referrals' });
          return [];
        }
      },

      fetchEmployeeStats: async (employeeEmail) => {
        try {
          const res = await fetch(`${API_BASE}/referrals/stats/summary?employee_email=${encodeURIComponent(employeeEmail)}`);
          if (!res.ok) throw new Error('Failed to load stats');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to load stats' });
          return null;
        }
      },

      fetchLeaderboard: async (period = 'month') => {
        try {
          const res = await fetch(`${API_BASE}/referrals/leaderboard/top?period=${period}`);
          if (!res.ok) throw new Error('Failed to load leaderboard');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to load leaderboard' });
          return [];
        }
      },

      aiMatch: async (formData) => {
        try {
          const res = await fetch(`${API_BASE}/referrals/ai-match`, { method: 'POST', body: formData });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to run AI match');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to run AI match' });
          return null;
        }
      },

      updateReferralStage: async (id, stage, role, actorName) => {
        try {
          const res = await fetch(`${API_BASE}/referrals/${id}/stage`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ stage }),
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update stage');
          return await res.json();
        } catch (e) {
          set({ error: e?.message || 'Failed to update stage' });
          return null;
        }
      },
    }),
    {
      name: 'autoflex-app',
      partialize: s => ({
        darkMode: s.darkMode,
      }),
    }
  )
);
