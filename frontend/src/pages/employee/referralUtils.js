export const STAGES = ['Referred', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Offer', 'Joined'];

export const STAGE_COLORS = {
  Referred: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
  Screening: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  Shortlisted: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  Interview: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  Selected: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  Offer: { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
  Joined: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  Rejected: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

export const stageIndex = (stage) => {
  if (stage === 'Rejected') return -1;
  const i = STAGES.indexOf(stage);
  return i === -1 ? 0 : i;
};

export const matchScoreColor = (score) => {
  if (score >= 80) return '#16a34a';
  if (score >= 50) return '#f59e0b';
  return '#dc2626';
};
