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
    appliedDate: row.applied_date || new Date().toISOString().split('T')[0],
  };
}

// ── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      users: [
        {
          id: 1,
          name: 'HR Admin',
          email: 'hr@autoflex.com',
          password: 'admin123',
          role: 'Admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Recruiter',
          email: 'recruiter@autoflex.com',
          password: 'recruiter123',
          role: 'Recruiter',
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'Employee',
          email: 'employee@autoflex.com',
          password: 'employee123',
          role: 'Employee',
          createdAt: new Date().toISOString(),
        },
      ],
      login: (email, password) => {
        const users = get().users;
        const found = users.find(
          u =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );
        if (!found) throw new Error('Invalid credentials');
        set({ user: found, token: `local-${found.id}` });
        return found;
      },
      register: (name, email, password, role) => {
        const users = get().users;
        if (
          users.find(u => u.email.toLowerCase() === email.toLowerCase())
        )
          throw new Error('Email already registered');
        const newUser = {
          id: Date.now(),
          name,
          email,
          password,
          role,
          createdAt: new Date().toISOString(),
        };
        set({
          users: [...users, newUser],
          user: newUser,
          token: `local-${newUser.id}`,
        });
        return newUser;
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'autoflex-auth',
      partialize: s => ({ user: s.user, token: s.token, users: s.users }),
    }
  )
);

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
            headers: { Accept: 'application/json' },
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

      updateCandidateStatus: async (id, status) => {
        set(s => ({
          candidates: s.candidates.map(c =>
            c.id === id ? { ...c, status, 'Interview Status': status } : c
          ),
        }));
        try {
          await fetch(`${API_BASE}/candidates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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
      deleteCandidate: async (id, role) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}`, {
            method: 'DELETE',
            headers: { 'X-User-Role': role || '' },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete candidate');
          set(s => ({ candidates: s.candidates.filter(c => c.id !== id) }));
          return true;
        } catch (e) {
          set({ error: e?.message || 'Failed to delete candidate' });
          return false;
        }
      },

      duplicateCandidate: async (id) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}/duplicate`, { method: 'POST' });
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
            headers: { 'X-User-Role': role || '' },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to load trash');
          const rows = await res.json();
          return (rows || []).map(mapDbCandidate);
        } catch (e) {
          set({ error: e?.message || 'Failed to load trash' });
          return [];
        }
      },

      restoreCandidate: async (id, role) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}/restore`, {
            method: 'POST',
            headers: { 'X-User-Role': role || '' },
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

      permanentlyDeleteCandidate: async (id, role) => {
        try {
          const res = await fetch(`${API_BASE}/candidates/${id}/permanent`, {
            method: 'DELETE',
            headers: { 'X-User-Role': role || '' },
          });
          if (!res.ok) throw new Error((await res.json()).detail || 'Failed to permanently delete candidate');
          return true;
        } catch (e) {
          set({ error: e?.message || 'Failed to permanently delete candidate' });
          return false;
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
