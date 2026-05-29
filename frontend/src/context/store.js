import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SHEET_ID = '1_da4wqDPxCKnJXF9O5Tq0YiHfTWS0Iy_MsQqplX4W6U';
const DEFAULT_API_KEY = 'AIzaSyBKB-ENoUi5SBqO_UBlpxSXOZvyui-_Wx4';

const STATUS_MAP = {
  shortlisted: 'Shortlisted',
  'interview scheduled': 'Interview Scheduled',
  'offer extended': 'Offer Extended',
  rejected: 'Rejected',
  'on hold': 'On Hold',
  screening: 'Screening',
  new: 'New',
};

function parseATS(val) {
  const raw = parseFloat(val) || 0;
  return raw <= 10 && raw > 0 ? Math.round(raw * 10) : Math.round(raw);
}

function parseSheetData(values) {
  if (!values || values.length < 2) return [];
  const [rawHeaders, ...rows] = values;

  // ✅ FIX 1: Trim ALL header keys — removes \n, spaces, hidden chars
  const headers = rawHeaders.map(h => (h || '').trim());

  console.log('Sheet headers:', headers); // debug — remove later

  return rows
    .filter(r => r.some(c => c?.trim()))
    .map((row, i) => {
      const obj = {
        id: i + 1,
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'New',
        notes: '',
        resumeUrl: null,
        resume_url: null,
      };

      // Map all columns using trimmed headers
      headers.forEach((h, j) => {
        obj[h] = (row[j] || '').trim();
      });

      // ATS Score
      obj['ATS Score'] = parseATS(obj['ATS Score']);

      // Status from Interview Status column
      const interviewStatus = (obj['Interview Status'] || '').trim();
      if (interviewStatus) {
        obj.status =
          STATUS_MAP[interviewStatus.toLowerCase()] ||
          interviewStatus ||
          'New';
      }

      // Interview Date
      if (obj['Interview Date']) {
        obj.interviewDate = obj['Interview Date'];
      }

      // ✅ FIX 2: Resume URL — handle all Google Drive URL formats
      const rawResumeUrl = (obj['Resume URL'] || '').trim();
      if (rawResumeUrl) {
        let u = rawResumeUrl;

        // Convert any Drive URL to /preview format
        const fileIdMatch = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        const openIdMatch = u.match(/open\?id=([a-zA-Z0-9_-]+)/);
        const ucIdMatch = u.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);

        let fileId = null;
        if (fileIdMatch) fileId = fileIdMatch[1];
        else if (openIdMatch) fileId = openIdMatch[1];
        else if (ucIdMatch) fileId = ucIdMatch[1];

        if (fileId) {
          u = 'https://drive.google.com/file/d/' + fileId + '/preview';
        }

        // Set both field names so ResumeTab finds it either way
        obj.resumeUrl = u;
        obj.resume_url = u;
      }

      return obj;
    });
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
      sheetError: null,
      apiKey: DEFAULT_API_KEY,
      darkMode: false,
      lastRefresh: null,

      // ✅ FIX 3: Persist status + notes overrides so they survive refresh
      candidateOverrides: {},

      setDarkMode: v => {
        set({ darkMode: v });
        document.documentElement.classList.toggle('dark', v);
      },

      setApiKey: k => set({ apiKey: k }),

      fetchCandidates: async keyOverride => {
        const key = keyOverride || get().apiKey || DEFAULT_API_KEY;
        set({ loading: true, sheetError: null });

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?key=${key}`;
        const proxies = [
          url,
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        ];

        let lastErr = null;

        for (const u of proxies) {
          try {
            const res = await fetch(u, {
              headers: { Accept: 'application/json' },
            });
            const text = await res.text();
            let json;
            try {
              json = JSON.parse(text);
            } catch {
              continue;
            }
            if (json.error) {
              lastErr = new Error(json.error.message);
              continue;
            }
            if (json.values) {
              const rawData = parseSheetData(json.values);

              // ✅ Merge saved overrides (status/notes) on top of fresh sheet data
              const overrides = get().candidateOverrides || {};
              const merged = rawData.map(c => ({
                ...c,
                ...(overrides[c.id] || {}),
              }));

              set({
                candidates: merged,
                loading: false,
                lastRefresh: new Date().toISOString(),
              });
              return merged;
            }
          } catch (e) {
            lastErr = e;
          }
        }

        set({
          loading: false,
          sheetError: lastErr?.message || 'Failed to fetch data',
        });
        return [];
      },

      // ✅ FIX 4: Save status to overrides so it persists across page refresh
      updateCandidateStatus: (id, status) => {
        set(s => ({
          candidateOverrides: {
            ...s.candidateOverrides,
            [id]: { ...(s.candidateOverrides[id] || {}), status },
          },
          candidates: s.candidates.map(c =>
            c.id === id ? { ...c, status } : c
          ),
        }));
      },

      // ✅ FIX 5: Save notes to overrides so they persist across page refresh
      updateCandidateNotes: (id, notes) => {
        set(s => ({
          candidateOverrides: {
            ...s.candidateOverrides,
            [id]: { ...(s.candidateOverrides[id] || {}), notes },
          },
          candidates: s.candidates.map(c =>
            c.id === id ? { ...c, notes } : c
          ),
        }));
      },
    }),
    {
      name: 'autoflex-app',
      // ✅ Persist overrides + settings (NOT candidates — always reload fresh from sheet)
      partialize: s => ({
        apiKey: s.apiKey,
        darkMode: s.darkMode,
        candidateOverrides: s.candidateOverrides,
      }),
    }
  )
);