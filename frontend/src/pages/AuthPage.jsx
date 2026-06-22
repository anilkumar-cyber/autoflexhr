import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/store';

const Input = ({ icon: Icon, label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input {...props} className="w-full bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all" />
    </div>
  </div>
);

export default function AuthPage() {
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'Recruiter' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      register(form.name, form.email, form.password, form.role);
      toast.success('Account created!');
      navigate('/');
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-brand mb-4">
            <FiZap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight">AutoFlexHR AI</h1>
          <p className="text-white/40 text-sm mt-1">AI-Powered Recruitment Intelligence</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-modal">
          {/* Toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {['login','register'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${view === v ? 'bg-brand-600 text-white shadow-brand' : 'text-white/50 hover:text-white'}`}>
                {v === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <Input icon={FiMail} label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="hr@autoflex.com" />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
                      className="w-full bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all" />
                    <button onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                      {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Demo creds */}
                <div className="bg-white/5 rounded-xl p-3 text-xs text-white/50 space-y-1">
                  <div className="font-semibold text-white/70 mb-1">Demo Credentials:</div>
                  <div>Admin: hr@autoflex.com / admin123</div>
                  <div>Recruiter: recruiter@autoflex.com / recruiter123</div>
                  <div>Employee: employee@autoflex.com / employee123</div>
                </div>
                <motion.button onClick={handleLogin} disabled={loading} whileHover={{ y: -1 }} whileTap={{ y: 0 }}
                  className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</> : 'Sign In →'}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <Input icon={FiUser} label="Full Name" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
                <Input icon={FiMail} label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Role</label>
                  <select value={form.role} onChange={e => set('role', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400">
                    <option value="Employee" className="bg-gray-900">Employee</option>
                    <option value="Recruiter" className="bg-gray-900">Recruiter</option>
                    <option value="Admin" className="bg-gray-900">HR Admin</option>
                  </select>
                </div>
                <Input icon={FiLock} label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
                <Input icon={FiLock} label="Confirm Password" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Repeat password" onKeyDown={e => e.key === 'Enter' && handleRegister()} />
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
