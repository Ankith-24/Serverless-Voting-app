import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import ManageUsers from './pages/superadmin/ManageUsers';
import AllPolls from './pages/superadmin/AllPolls';
import AdminDashboard from './pages/admin/Dashboard';
import CreatePoll from './pages/admin/CreatePoll';
import MyPolls from './pages/admin/MyPolls';
import VoterDashboard from './pages/voter/Dashboard';
import AvailablePolls from './pages/voter/AvailablePolls';
import VotePoll from './pages/voter/VotePoll';
import PollResults from './pages/shared/PollResults';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/super-admin" />;
    case 'ADMIN': return <Navigate to="/admin" />;
    default: return <Navigate to="/voter" />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Super Admin */}
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout><SuperAdminDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/super-admin/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout><ManageUsers /></AppLayout></ProtectedRoute>} />
          <Route path="/super-admin/polls" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout><AllPolls /></AppLayout></ProtectedRoute>} />
          <Route path="/super-admin/polls/:pollId/results" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout><PollResults /></AppLayout></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/create-poll" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><CreatePoll /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/my-polls" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><MyPolls /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/polls/:pollId/results" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><PollResults /></AppLayout></ProtectedRoute>} />

          {/* Voter */}
          <Route path="/voter" element={<ProtectedRoute allowedRoles={['VOTER']}><AppLayout><VoterDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/voter/polls" element={<ProtectedRoute allowedRoles={['VOTER']}><AppLayout><AvailablePolls /></AppLayout></ProtectedRoute>} />
          <Route path="/voter/polls/:pollId" element={<ProtectedRoute allowedRoles={['VOTER']}><AppLayout><VotePoll /></AppLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
