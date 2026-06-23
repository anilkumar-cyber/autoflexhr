import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiZap, FiShield, FiUsers, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/store';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'hr@autoflex.com', password: 'admin123', icon: FiShield },
  { label: 'Recruiter', email: 'recruiter@autoflex.com', password: 'recruiter123', icon: FiUsers },
  { label: 'Employee', email: 'employee@autoflex.com', password: 'employee123', icon: FiBriefcase },
];

const ROLE_OPTIONS = [
  { value: 'Employee', label: 'Employee', icon: FiBriefcase },
  { value: 'Recruiter', label: 'Recruiter', icon: FiUsers },
  { value: 'Admin', label: 'HR Admin', icon: FiShield },
];

const Input = ({ icon: Icon, label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4" />
      <input {...props} className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 hover:border-white/25 transition-all" />
    </div>
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder, onKeyDown }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4" />
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
          className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 hover:border-white/25 transition-all" />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition-colors">
          {show ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default function AuthPage() {
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'Recruiter' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fillDemo = (acc) => {
    setView('login');
    setForm(f => ({ ...f, email: acc.email, password: acc.password }));
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const loggedUser = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(loggedUser.role === 'Employee' ? '/employee' : '/');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setLoading(true);
    try {
      const newUser = await register(form.name, form.email, form.password, form.role);
      toast.success('Account created!');
      navigate(newUser.role === 'Employee' ? '/employee' : '/');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c1b] via-[#111327] to-[#0d0f20]" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-brand mb-4 ring-4 ring-brand-500/15">
            <FiZap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight">AutoFlexHR AI</h1>
          <p className="text-white/40 text-sm mt-1.5">AI-Powered Recruitment Intelligence</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-modal">
          {/* Toggle */}
          <div className="flex bg-white/[0.06] rounded-xl p-1 mb-7">
            {['login', 'register'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${view === v ? 'bg-brand-600 text-white shadow-brand' : 'text-white/50 hover:text-white'}`}>
                {v === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <Input icon={FiMail} label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="hr@autoflex.com" />
                <PasswordInput label="Password" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />

                <motion.button onClick={handleLogin} disabled={loading} whileHover={{ y: -1 }} whileTap={{ y: 0 }}
                  className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</> : 'Sign In →'}
                </motion.button>

                {/* Demo creds */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 text-center">Quick demo login</div>
                  <div className="grid grid-cols-3 gap-2">
                    {DEMO_ACCOUNTS.map(acc => (
                      <button key={acc.email} onClick={() => fillDemo(acc)} type="button"
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-brand-400/40 transition-all group">
                        <acc.icon className="w-4 h-4 text-white/40 group-hover:text-brand-400 transition-colors" />
                        <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">{acc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <Input icon={FiUser} label="Full Name" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
                <Input icon={FiMail} label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" />

                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLE_OPTIONS.map(r => (
                      <button key={r.value} type="button" onClick={() => set('role', r.value)}
                        className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${form.role === r.value ? 'bg-brand-600/20 border-brand-400/50 text-white' : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08]'}`}>
                        <r.icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <PasswordInput label="Password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
                <PasswordInput label="Confirm Password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Repeat password" onKeyDown={e => e.key === 'Enter' && handleRegister()} />

                <motion.button onClick={handleRegister} disabled={loading} whileHover={{ y: -1 }} whileTap={{ y: 0 }}
                  className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : 'Create Account →'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
