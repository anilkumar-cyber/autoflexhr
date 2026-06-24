import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/store';

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 2 + Math.random() * 3,
  duration: 10 + Math.random() * 14,
  delay: Math.random() * 10,
  drift: (Math.random() - 0.5) * 80,
}));

// Cursor-reactive background: a handful of motion values driven by mouse
// position, smoothed with springs so orbs/glow trail rather than snap.
function useParallax() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const onMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mx.set((e.clientX / innerWidth - 0.5) * 2);
    my.set((e.clientY / innerHeight - 0.5) * 2);
  };
  return { sx, sy, onMouseMove };
}

// Self-registration only ever creates Employee accounts -- Recruiter and
// Admin accounts are created by an existing Admin via Settings > Recruiters,
// never through this public signup form.

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const formVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const Input = ({ icon: Icon, label, ...props }) => (
  <motion.div variants={fieldVariants}>
    <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4 pointer-events-none" />
      <motion.input
        {...props}
        whileFocus={{ scale: 1.012 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 hover:border-white/25 transition-colors"
      />
    </div>
  </motion.div>
);

const PasswordInput = ({ label, value, onChange, placeholder, onKeyDown }) => {
  const [show, setShow] = useState(false);
  return (
    <motion.div variants={fieldVariants}>
      <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4 pointer-events-none" />
        <motion.input
          type={show ? 'text' : 'password'} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
          whileFocus={{ scale: 1.012 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 hover:border-white/25 transition-colors"
        />
        <motion.button type="button" onClick={() => setShow(s => !s)} whileTap={{ scale: 0.85 }}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition-colors">
          <AnimatePresence mode="wait" initial={false}>
            {show ? (
              <motion.span key="off" initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 45 }} transition={{ duration: 0.15 }}>
                <FiEyeOff className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span key="on" initial={{ opacity: 0, rotate: 45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -45 }} transition={{ duration: 0.15 }}>
                <FiEye className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Animated submit button: hover lift + shine sweep + spring tap, all in one place
// so Sign In / Create Account stay visually identical.
function SubmitButton({ onClick, loading, idleLabel, loadingLabel }) {
  return (
    <motion.button
      variants={fieldVariants}
      onClick={onClick}
      disabled={loading}
      whileHover={{ y: -2, boxShadow: '0 12px 28px rgba(97,114,243,0.45)' }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait overflow-hidden"
    >
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        style={{ width: '50%' }}
        animate={{ x: ['-120%', '220%'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
      />
      <span className="relative flex items-center gap-2">
        {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {loadingLabel}</> : <>{idleLabel} →</>}
      </span>
    </motion.button>
  );
}

export default function AuthPage() {
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'Employee' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();
  const { sx, sy, onMouseMove } = useParallax();
  const spotlightX = useTransform(sx, [-1, 1], ['30%', '70%']);
  const spotlightY = useTransform(sy, [-1, 1], ['30%', '70%']);
  const orbAX = useTransform(sx, [-1, 1], [-40, 40]);
  const orbAY = useTransform(sy, [-1, 1], [-30, 30]);
  const orbBX = useTransform(sx, [-1, 1], [30, -30]);
  const orbBY = useTransform(sy, [-1, 1], [25, -25]);
  const cardTiltX = useTransform(sy, [-1, 1], [4, -4]);
  const cardTiltY = useTransform(sx, [-1, 1], [-4, 4]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
    <div onMouseMove={onMouseMove} className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Rich animated mesh background -- deeper, more saturated than a flat gradient */}
      <div className="absolute inset-0 bg-[#0a0c1b]" />
      <motion.div
        className="absolute inset-0 opacity-90"
        style={{ background: 'radial-gradient(at 20% 20%, rgba(97,114,243,0.35) 0, transparent 55%), radial-gradient(at 80% 15%, rgba(168,85,247,0.3) 0, transparent 50%), radial-gradient(at 75% 80%, rgba(236,72,153,0.22) 0, transparent 55%), radial-gradient(at 15% 80%, rgba(34,211,238,0.22) 0, transparent 50%)' }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cursor-reactive spotlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: useTransform([spotlightX, spotlightY], ([x, y]) => `radial-gradient(600px circle at ${x} ${y}, rgba(129,150,248,0.18), transparent 70%)`) }}
      />

      {/* Floating orbs -- autonomous drift (inner) + cursor parallax (outer) layered separately */}
      <div className="absolute inset-0">
        <motion.div className="absolute top-1/4 left-1/4" style={{ x: orbAX, y: orbAY }}>
          <motion.div
            className="w-[28rem] h-[28rem] bg-brand-500/30 rounded-full blur-3xl"
            animate={{ x: [0, 60, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <motion.div className="absolute bottom-1/4 right-1/4" style={{ x: orbBX, y: orbBY }}>
          <motion.div
            className="w-96 h-96 bg-purple-500/25 rounded-full blur-3xl"
            animate={{ x: [0, -50, 30, 0], y: [0, 35, -25, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </motion.div>
        <motion.div className="absolute top-3/4 left-1/3" style={{ x: orbAY, y: orbAX }}>
          <motion.div
            className="w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ x: [0, 40, -30, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </motion.div>
        <motion.div
          className="absolute top-10 right-1/3 w-56 h-56 bg-pink-500/15 rounded-full blur-3xl"
          animate={{ x: [0, -30, 20, 0], y: [0, 25, -15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </div>

      {/* Drifting particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map(p => (
          <motion.span
            key={p.id}
            className="absolute rounded-full bg-white/50"
            style={{ left: `${p.left}%`, width: p.size, height: p.size, bottom: -10 }}
            animate={{ y: [0, -700], x: [0, p.drift], opacity: [0, 0.8, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay }}
          />
        ))}
      </div>

      {/* Grid overlay -- slow diagonal pan */}
      <motion.div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        animate={{ backgroundPosition: ['0px 0px', '44px 44px'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      {/* Vignette for edge contrast */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ rotateX: cardTiltX, rotateY: cardTiltY, transformPerspective: 1000 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-brand mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          >
            <motion.span
              className="absolute inset-0 rounded-2xl ring-4 ring-brand-500/30"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <FiZap className="w-8 h-8 text-white relative z-10" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-3xl font-bold text-white font-display tracking-tight">
            AutoFlexHR AI
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white/40 text-sm mt-1.5">
            AI-Powered Recruitment Intelligence
          </motion.p>
        </div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-modal">
          {/* Toggle with sliding pill indicator */}
          <div className="relative flex bg-white/[0.06] rounded-xl p-1 mb-7">
            {['login', 'register'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${view === v ? 'text-white' : 'text-white/50 hover:text-white'}`}>
                {view === v && (
                  <motion.span
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 bg-brand-600 rounded-lg shadow-brand"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{v === 'login' ? 'Sign In' : 'Create Account'}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div key="login" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 14, transition: { duration: 0.15 } }} className="space-y-4">
                <Input icon={FiMail} label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="hr@autoflex.com" />
                <PasswordInput label="Password" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />
                <SubmitButton onClick={handleLogin} loading={loading} idleLabel="Sign In" loadingLabel="Signing in…" />
              </motion.div>
            ) : (
              <motion.div key="register" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: -14, transition: { duration: 0.15 } }} className="space-y-4">
                <Input icon={FiUser} label="Full Name" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
                <Input icon={FiMail} label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" />
                <PasswordInput label="Password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
                <PasswordInput label="Confirm Password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Repeat password" onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                <SubmitButton onClick={handleRegister} loading={loading} idleLabel="Create Account" loadingLabel="Creating…" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
