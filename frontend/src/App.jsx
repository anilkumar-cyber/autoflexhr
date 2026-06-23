import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useAppStore } from './context/store';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Analytics from './pages/Analytics';
import Pipeline from './pages/Pipeline';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import Trash from './pages/Trash';
import Jobs from './pages/Jobs';
import Activity from './pages/Activity';
import EmployeeLayout from './layouts/EmployeeLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import OpenPositions from './pages/employee/OpenPositions';
import ScanRefer from './pages/employee/ScanRefer';
import AIJobMatching from './pages/employee/AIJobMatching';
import MyReferrals from './pages/employee/MyReferrals';
import RewardsWallet from './pages/employee/RewardsWallet';
import Leaderboard from './pages/employee/Leaderboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === 'Employee') return <Navigate to="/employee" replace />;
  return children;
}

function EmployeeRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'Employee') return <Navigate to="/" replace />;
  return children;
}

function RootRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={user.role === 'Employee' ? '/employee' : '/'} replace />;
}

export default function App() {
  const { darkMode } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
          style: { fontFamily: 'Sora, sans-serif', fontSize: '14px', borderRadius: '12px' },
          success: { iconTheme: { primary: '#6172f3', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="trash" element={<Trash />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/employee" element={<EmployeeRoute><EmployeeLayout /></EmployeeRoute>}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="positions" element={<OpenPositions />} />
          <Route path="refer" element={<ScanRefer />} />
          <Route path="ai-matching" element={<AIJobMatching />} />
          <Route path="my-referrals" element={<MyReferrals />} />
          <Route path="wallet" element={<RewardsWallet />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<EmployeeProfile />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
