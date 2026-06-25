import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiZap, FiCheck, FiAlertTriangle, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/store';

// Self-registration only ever creates Employee accounts -- Recruiter and
// Admin accounts are created by an existing Admin via Settings > Recruiters,
// never through this public signup form.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#6b7280' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too short', 'Weak', 'Medium', 'Strong', 'Strong'];
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#22c55e'];
  return { score, label: labels[score], color: colors[score] };
}

const LOADING_MESSAGES = {
  login: ['Authenticating…', 'Verifying access…', 'Loading your workspace…'],
  register: ['Setting up your workspace…', 'Provisioning your account…', 'Almost there…'],
};

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 2 + Math.random() * 3,
  duration: 10 + Math.random() * 14,
  delay: Math.random() * 10,
  drift: (Math.random() - 0.5) * 80,
}));

// Fixed-position "recruitment intelligence" node network -- a few glowing
// dots connected by lines with a pulse traveling along one edge. Purely
// decorative, deliberately subtle.
const NODES = [
  { x: 12, y: 18 }, { x: 28, y: 32 }, { x: 18, y: 55 },
  { x: 85, y: 22 }, { x: 92, y: 48 }, { x: 78, y: 68 }, { x: 60, y: 12 },
];
const EDGES = [[0, 1], [1, 2], [3, 4], [4, 5], [0, 6], [3, 6]];

function NodeNetwork() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.18]" preserveAspectRatio="none" viewBox="0 0 100 100">
      {EDGES.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
          stroke="#8196f8" strokeWidth="0.15"
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}
      {NODES.map((n, i) => (
        <motion.circle
          key={i} cx={n.x} cy={n.y} r={0.6} fill="#a5bbfc"
          initial={{ opacity: 0.4, r: 0.5 }}
          animate={{ opacity: [0.4, 1, 0.4], r: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
      {/* traveling data pulse along one edge */}
      <motion.circle
        r={0.8} fill="#ffffff"
        initial={{ cx: NODES[0].x, cy: NODES[0].y, opacity: 0 }}
        animate={{ cx: [NODES[0].x, NODES[6].x], cy: [NODES[0].y, NODES[6].y], opacity: [0, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
      />
    </svg>
  );
}

// Cursor-reactive background: a handful of motion values driven by mouse
// position, smoothed with springs so orbs/glow trail rather than snap.
function useParallax(enabled) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const onMouseMove = (e) => {
    if (!enabled) return;
    const { innerWidth, innerHeight } = window;
    mx.set((e.clientX / innerWidth - 0.5) * 2);
    my.set((e.clientY / innerHeight - 0.5) * 2);
  };
  return { sx, sy, onMouseMove };
}

function useCapsLock() {
  const [capsOn, setCapsOn] = useState(false);
  const handler = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsOn(e.getModifierState('CapsLock'));
    }
  };
  return { capsOn, onKeyDown: handler, onKeyUp: handler, reset: () => setCapsOn(false) };
}

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const formVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

function ValidityIcon({ valid, error }) {
  return (
    <AnimatePresence>
      {(valid || error) && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
          className="absolute right-3.5 top-1/2 -translate-y-1/2"
        >
          {valid ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiAlertTriangle className="w-4 h-4 text-red-400" />}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

const Input = ({ icon: Icon, label, valid, error, onFocus, ...props }) => {
  const [scanKey, setScanKey] = useState(0);
  return (
    <motion.div variants={fieldVariants}>
      <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className={`relative rounded-xl overflow-hidden ${error ? 'ring-1 ring-red-400/60' : ''}`}>
        <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 transition-colors ${error ? 'text-red-400' : valid ? 'text-green-400' : 'text-white/35'}`} />
        <motion.input
          {...props}
          onFocus={(e) => { setScanKey(k => k + 1); onFocus?.(e); }}
          whileFocus={{ scale: 1.012 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`w-full bg-white/[0.06] border rounded-xl pl-10 pr-9 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-400/50 focus:ring-red-400/40' : 'border-white/15 focus:ring-brand-400/60 focus:border-brand-400/40 hover:border-white/25'}`}
        />
        <ValidityIcon valid={valid} error={error} />
        <AnimatePresence>
          {scanKey > 0 && (
            <motion.span
              key={scanKey}
              initial={{ top: '-30%', opacity: 0 }}
              animate={{ top: '130%', opacity: [0, 1, 0] }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-400 mt-1.5">
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};

const PasswordInput = ({ label, value, onChange, placeholder, onKeyDown, error, showStrength, confirmTarget }) => {
  const [show, setShow] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const [blinkKey, setBlinkKey] = useState(0);
  const { capsOn, onKeyDown: capsKeyDown, onKeyUp: capsKeyUp } = useCapsLock();
  const strength = showStrength ? getPasswordStrength(value) : null;
  const matchOk = confirmTarget !== undefined && value.length > 0 && value === confirmTarget;
  const matchBad = confirmTarget !== undefined && value.length > 0 && value !== confirmTarget;

  // Lock/shield glows confident green when strong, warns amber/red when weak.
  const lockGlow = !value.length ? 'none'
    : showStrength
      ? strength.score >= 3 ? 'drop-shadow(0 0 5px rgba(34,197,94,0.85))' : strength.score === 2 ? 'drop-shadow(0 0 4px rgba(245,158,11,0.7))' : 'drop-shadow(0 0 4px rgba(239,68,68,0.7))'
      : 'drop-shadow(0 0 4px rgba(129,150,248,0.8))';

  return (
    <motion.div variants={fieldVariants}>
      <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className={`relative rounded-xl overflow-hidden ${error || matchBad ? 'ring-1 ring-red-400/60' : ''}`}>
        <motion.span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10"
          animate={{
            color: value.length > 0 ? (strength?.color || '#8196f8') : 'rgba(255,255,255,0.35)',
            filter: lockGlow,
            scale: value.length > 0 && (showStrength ? strength.score >= 3 : true) ? [1, 1.15, 1] : 1,
          }}
          transition={{ scale: { duration: 0.6, repeat: value.length > 0 ? Infinity : 0, repeatDelay: 1.2 }, default: { duration: 0.3 } }}
        >
          {showStrength ? <FiShield className="w-4 h-4" /> : <FiLock className="w-4 h-4 text-white/35" />}
        </motion.span>
        <motion.input
          type={show ? 'text' : 'password'} value={value}
          onChange={(e) => { onChange(e); setBlinkKey(k => k + 1); }}
          onKeyDown={(e) => { capsKeyDown(e); onKeyDown?.(e); }} onKeyUp={capsKeyUp}
          onFocus={() => setScanKey(k => k + 1)}
          placeholder={placeholder}
          whileFocus={{ scale: 1.012 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`w-full bg-white/[0.06] border rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-colors ${error || matchBad ? 'border-red-400/50 focus:ring-red-400/40' : 'border-white/15 focus:ring-brand-400/60 focus:border-brand-400/40 hover:border-white/25'}`}
        />
        {confirmTarget !== undefined ? (
          <ValidityIcon valid={matchOk} error={matchBad} />
        ) : null}
        <motion.button type="button" onClick={() => setShow(s => !s)} whileTap={{ scale: 0.85 }}
          className={`absolute ${confirmTarget !== undefined ? 'right-9' : 'right-3.5'} top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition-colors`}>
          {/* "protected" pulsing halo while the password is masked */}
          {!show && value.length > 0 && (
            <motion.span
              className="absolute inset-0 rounded-full bg-brand-400/30"
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {/* blink squish on every keystroke -- not a generic wiggle */}
          <motion.div key={blinkKey} animate={{ scaleY: [1, 0.15, 1] }} transition={{ duration: 0.22, ease: 'easeInOut' }} className="relative">
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
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {scanKey > 0 && (
            <motion.span
              key={scanKey}
              initial={{ top: '-30%', opacity: 0 }}
              animate={{ top: '130%', opacity: [0, 1, 0] }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {capsOn && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-400">
            <FiAlertTriangle className="w-3 h-3" /> Caps Lock is on
          </motion.div>
        )}
      </AnimatePresence>

      {matchBad && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-400 mt-1.5">
          Passwords do not match
        </motion.p>
      )}

      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden flex gap-0.5">
            {[0, 1, 2, 3].map(i => (
              <motion.div key={i} className="h-full flex-1 rounded-full"
                initial={{ opacity: 0.15 }}
                animate={{ opacity: i < strength.score ? 1 : 0.15, backgroundColor: i < strength.score ? strength.color : 'rgba(255,255,255,0.15)' }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <motion.p key={strength.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] mt-1" style={{ color: strength.color }}>
            {strength.label}
          </motion.p>
        </div>
      )}
    </motion.div>
  );
};

// Magnetic, rippling, status-aware submit button.
function SubmitButton({ onClick, status, idleLabel, successLabel, mode }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bx = useSpring(mx, { stiffness: 300, damping: 20 });
  const by = useSpring(my, { stiffness: 300, damping: 20 });
  const [ripples, setRipples] = useState([]);
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = LOADING_MESSAGES[mode];

  useEffect(() => {
    if (status !== 'loading') { setMsgIndex(0); return; }
    const id = setInterval(() => setMsgIndex(i => (i + 1) % messages.length), 900);
    return () => clearInterval(id);
  }, [status, messages]);

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - (rect.left + rect.width / 2)) * 0.18);
    my.set((e.clientY - (rect.top + rect.height / 2)) * 0.35);
  };
  const handleMouseLeave = () => { mx.set(0); my.set(0); };

  const handlePointerDown = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  };

  const disabled = status === 'loading' || status === 'success';

  return (
    <motion.button
      ref={ref}
      variants={fieldVariants}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      disabled={disabled}
      style={{ x: bx, y: by }}
      whileHover={!disabled ? { boxShadow: '0 14px 32px rgba(97,114,243,0.5)' } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:cursor-wait overflow-hidden"
    >
      {ripples.map(r => (
        <motion.span key={r.id} className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x, top: r.y, translateX: '-50%', translateY: '-50%' }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 220, height: 220, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      {status !== 'success' && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          style={{ width: '50%' }}
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.span key="success" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                <FiCheck className="w-4 h-4" />
              </motion.span>
              {successLabel}
            </motion.span>
          ) : status === 'loading' ? (
            <motion.span key={msgIndex} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </span>
              {messages[msgIndex]}
            </motion.span>
          ) : (
            <motion.span key="idle" className="flex items-center gap-2" whileHover={{ gap: '0.6rem' }}>
              {idleLabel}
              <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>→</motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

function SparkleBurst() {
  const sparkles = useRef(Array.from({ length: 10 }, (_, i) => ({
    angle: (i / 10) * Math.PI * 2,
    dist: 40 + Math.random() * 30,
  }))).current;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sparkles.map((s, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-300"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(s.angle) * s.dist, y: Math.sin(s.angle) * s.dist, opacity: 0, scale: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.02 }}
        />
      ))}
    </div>
  );
}

function AssistantBubble({ message }) {
  return (
    <div className="flex items-center gap-2 mb-5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10">
      <motion.span
        className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0"
        animate={{ boxShadow: ['0 0 0px rgba(129,150,248,0.4)', '0 0 8px rgba(129,150,248,0.7)', '0 0 0px rgba(129,150,248,0.4)'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FiZap className="w-3 h-3 text-white" />
      </motion.span>
      <AnimatePresence mode="wait">
        <motion.p key={message} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
          className="text-[11.5px] text-white/55 leading-snug">
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

const ASSISTANT = {
  loginIdle: 'Welcome back to your hiring workspace.',
  registerIdle: 'Set up your AI recruitment workspace.',
  emailFocus: 'Use your work email to continue.',
  passwordFocus: 'Secure access enabled.',
  invalid: "That doesn't look right — check and try again.",
  loginError: "We couldn't verify your login details. The email or password appears incorrect.",
  loginSuccess: 'Access granted. Loading your recruitment workspace…',
  registerSuccess: 'Workspace created. Welcome aboard!',
  forgot: "Password reset isn't self-service yet — contact your HR Admin.",
};

export default function AuthPage() {
  const prefersReducedMotion = useReducedMotion();
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [shake, setShake] = useState(false);
  const [assistantMsg, setAssistantMsg] = useState(ASSISTANT.loginIdle);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();
  const { sx, sy, onMouseMove } = useParallax(!prefersReducedMotion);

  const spotlightX = useTransform(sx, [-1, 1], ['30%', '70%']);
  const spotlightY = useTransform(sy, [-1, 1], ['30%', '70%']);
  const orbAX = useTransform(sx, [-1, 1], [-40, 40]);
  const orbAY = useTransform(sy, [-1, 1], [-30, 30]);
  const orbBX = useTransform(sx, [-1, 1], [30, -30]);
  const orbBY = useTransform(sy, [-1, 1], [25, -25]);
  const cardTiltX = useTransform(sy, [-1, 1], [4, -4]);
  const cardTiltY = useTransform(sx, [-1, 1], [-4, 4]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const switchView = (v) => {
    setView(v);
    setStatus('idle');
    setAssistantMsg(v === 'login' ? ASSISTANT.loginIdle : ASSISTANT.registerIdle);
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const emailValid = form.email.length > 0 && EMAIL_RE.test(form.email);
  const emailError = form.email.length > 0 && !emailValid ? 'Enter a valid email address' : null;

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    if (!emailValid) { setAssistantMsg(ASSISTANT.invalid); triggerShake(); return; }
    setStatus('loading');
    try {
      const loggedUser = await login(form.email, form.password, remember);
      setStatus('success');
      setAssistantMsg(ASSISTANT.loginSuccess);
      toast.success('Welcome back!');
      await new Promise(r => setTimeout(r, 850));
      navigate(loggedUser.role === 'Employee' ? '/employee' : '/');
    } catch (e) {
      setStatus('error');
      setAssistantMsg(ASSISTANT.loginError);
      triggerShake();
      toast.error(e.message);
      setTimeout(() => setStatus('idle'), 400);
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return; }
    if (!emailValid) { setAssistantMsg(ASSISTANT.invalid); triggerShake(); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setStatus('loading');
    try {
      const newUser = await register(form.name, form.email, form.password, 'Employee');
      setStatus('success');
      setAssistantMsg(ASSISTANT.registerSuccess);
      toast.success('Account created!');
      await new Promise(r => setTimeout(r, 850));
      navigate(newUser.role === 'Employee' ? '/employee' : '/');
    } catch (e) {
      setStatus('error');
      setAssistantMsg(e.message || ASSISTANT.invalid);
      triggerShake();
      toast.error(e.message);
      setTimeout(() => setStatus('idle'), 400);
    }
  };

  const handleForgot = () => {
    setAssistantMsg(ASSISTANT.forgot);
    toast('Contact your HR Admin to reset your password.', { icon: '🔒' });
  };

  return (
    <div onMouseMove={onMouseMove} className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Rich animated mesh background */}
      <div className="absolute inset-0 bg-[#0a0c1b]" />
      <motion.div
        className="absolute inset-0 opacity-90"
        style={{ background: 'radial-gradient(at 20% 20%, rgba(97,114,243,0.35) 0, transparent 55%), radial-gradient(at 80% 15%, rgba(168,85,247,0.3) 0, transparent 50%), radial-gradient(at 75% 80%, rgba(236,72,153,0.22) 0, transparent 55%), radial-gradient(at 15% 80%, rgba(34,211,238,0.22) 0, transparent 50%)' }}
        animate={prefersReducedMotion ? {} : { opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: useTransform([spotlightX, spotlightY], ([x, y]) => `radial-gradient(600px circle at ${x} ${y}, rgba(129,150,248,0.18), transparent 70%)`) }}
        />
      )}

      <NodeNetwork />

      {/* Floating orbs */}
      <div className="absolute inset-0">
        <motion.div className="absolute top-1/4 left-1/4" style={prefersReducedMotion ? {} : { x: orbAX, y: orbAY }}>
          <motion.div
            className="w-[28rem] h-[28rem] bg-brand-500/30 rounded-full blur-3xl"
            animate={prefersReducedMotion ? {} : { x: [0, 60, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <motion.div className="absolute bottom-1/4 right-1/4" style={prefersReducedMotion ? {} : { x: orbBX, y: orbBY }}>
          <motion.div
            className="w-96 h-96 bg-purple-500/25 rounded-full blur-3xl"
            animate={prefersReducedMotion ? {} : { x: [0, -50, 30, 0], y: [0, 35, -25, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </motion.div>
        <motion.div className="absolute top-3/4 left-1/3" style={prefersReducedMotion ? {} : { x: orbAY, y: orbAX }}>
          <motion.div
            className="w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={prefersReducedMotion ? {} : { x: [0, 40, -30, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </motion.div>
        <motion.div
          className="absolute top-10 right-1/3 w-56 h-56 bg-pink-500/15 rounded-full blur-3xl"
          animate={prefersReducedMotion ? {} : { x: [0, -30, 20, 0], y: [0, 25, -15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </div>

      {!prefersReducedMotion && (
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
      )}

      <motion.div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        animate={prefersReducedMotion ? {} : { backgroundPosition: ['0px 0px', '44px 44px'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        style={prefersReducedMotion ? {} : { rotateX: cardTiltX, rotateY: cardTiltY, transformPerspective: 1000 }}
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
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-white/25 text-xs mt-1">
            Hire smarter. Screen faster. Build stronger teams.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, x: shake ? [0, -8, 8, -6, 6, 0] : 0 }}
          transition={{ delay: 0.2, duration: 0.4, x: { duration: 0.4 } }}
          className="relative bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-modal"
        >
          {/* idle breathing glow */}
          <motion.div
            className="absolute -inset-px rounded-3xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(129,150,248,0.25), transparent 40%, transparent 60%, rgba(168,85,247,0.2))' }}
            animate={prefersReducedMotion ? {} : { opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {status === 'success' && view === 'register' && <SparkleBurst />}

          {/* Toggle with sliding pill indicator */}
          <div className="relative flex bg-white/[0.06] rounded-xl p-1 mb-5">
            {['login', 'register'].map(v => (
              <button key={v} onClick={() => switchView(v)}
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

          <AssistantBubble message={assistantMsg} />

          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div key="login" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 14, transition: { duration: 0.15 } }} className="space-y-4">
                <Input icon={FiMail} label="Work Email" type="email" value={form.email} valid={emailValid} error={emailError}
                  onFocus={() => setAssistantMsg(ASSISTANT.emailFocus)}
                  onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="hr@autoflex.com" />
                <PasswordInput label="Password" value={form.password}
                  onChange={e => { set('password', e.target.value); if (e.target.value) setAssistantMsg(ASSISTANT.passwordFocus); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />

                <motion.div variants={fieldVariants} className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-white/50 cursor-pointer select-none">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-brand-500 cursor-pointer" />
                    Remember me
                  </label>
                  <button type="button" onClick={handleForgot} className="text-brand-300 hover:text-brand-200 transition-colors">
                    Forgot password?
                  </button>
                </motion.div>

                <SubmitButton onClick={handleLogin} status={status} mode="login" idleLabel="Sign In" successLabel="Welcome back!" />
              </motion.div>
            ) : (
              <motion.div key="register" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: -14, transition: { duration: 0.15 } }} className="space-y-4">
                <Input icon={FiUser} label="Full Name" type="text" value={form.name} valid={form.name.length > 1}
                  onChange={e => set('name', e.target.value)} placeholder="Your name" />
                <Input icon={FiMail} label="Work Email" type="email" value={form.email} valid={emailValid} error={emailError}
                  onFocus={() => setAssistantMsg(ASSISTANT.emailFocus)}
                  onChange={e => set('email', e.target.value)} placeholder="you@company.com" />
                <PasswordInput label="Password" value={form.password} showStrength
                  onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
                <PasswordInput label="Confirm Password" value={form.confirm} confirmTarget={form.password}
                  onChange={e => set('confirm', e.target.value)} placeholder="Repeat password" onKeyDown={e => e.key === 'Enter' && handleRegister()} />

                <SubmitButton onClick={handleRegister} status={status} mode="register" idleLabel="Create Workspace" successLabel="Workspace ready!" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
