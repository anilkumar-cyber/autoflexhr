export const initials = (name = '') => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const avatarColors = ['#6172f3','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
export const avatarColor = (name = '') => {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return avatarColors[Math.abs(h) % avatarColors.length];
};

export const scoreColor = (s) => {
  if (s >= 85) return { text: '#16a34a', bg: '#f0fdf4', border: '#86efac' };
  if (s >= 65) return { text: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  return { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
};

export const STATUS_COLORS = {
  New: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Screening: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Shortlisted: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  'Interview Scheduled': { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  'Offer Extended': { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  Rejected: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  'On Hold': { bg: '#f9fafb', text: '#6b7280', border: '#d1d5db' },
};

export const STATUS_OPTIONS = ['New','Screening','Shortlisted','Interview Scheduled','Offer Extended','Rejected','On Hold'];

export const JOB_ROLES = [
  'Enterprise Data Warehouse (EDW) Engineer',
  'Process Engineer / Scrum Master',
  'Senior Human Resource Associate',
  'SharePoint Developer & Administrator (Intranet Solutions)',
];

export const today = () => new Date().toISOString().split('T')[0];

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const exportCSV = (candidates) => {
  const headers = ['Name','Email','Phone','City','Job Title','ATS Score','Status','Interview Date','Skills'];
  const rows = candidates.map(c => [c.Name,c.Email,c.Phone,c.City,c['Job title'],c['ATS Score'],c.status,c.interviewDate||'',c.Skills||''].map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `autoflex-candidates-${today()}.csv`;
  a.click();
};
