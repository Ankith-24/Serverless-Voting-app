import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import ManageUsers from './pages/superadmin/ManageUsers';
import AllElections from './pages/superadmin/AllElections';
import AdminDashboard from './pages/admin/Dashboard';
import CreateElection from './pages/admin/CreateElection';
import MyElections from './pages/admin/MyElections';
import VoterDashboard from './pages/voter/Dashboard';
import AvailableElections from './pages/voter/AvailableElections';
import VoteElection from './pages/voter/VoteElection';
import ElectionResults from './pages/shared/ElectionResults';

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
          <Route path="/super-admin/elections" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout><AllElections /></AppLayout></ProtectedRoute>} />
          <Route path="/super-admin/elections/:electionId/results" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout><ElectionResults /></AppLayout></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/create-election" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><CreateElection /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/my-elections" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><MyElections /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/elections/:electionId/results" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><ElectionResults /></AppLayout></ProtectedRoute>} />

          {/* Voter */}
          <Route path="/voter" element={<ProtectedRoute allowedRoles={['VOTER']}><AppLayout><VoterDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/voter/elections" element={<ProtectedRoute allowedRoles={['VOTER']}><AppLayout><AvailableElections /></AppLayout></ProtectedRoute>} />
          <Route path="/voter/elections/:electionId" element={<ProtectedRoute allowedRoles={['VOTER']}><AppLayout><VoteElection /></AppLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
