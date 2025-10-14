import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard'; // <-- ändrad import
import BoothDetail from './pages/BoothDetail';
import BoothStaffDashboard from './pages/BoothStaffDashboard';
import './App.css';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="loading">Laddar...</div>;
  }

  if (!user || !profile) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (profile.role === 'admin') {
    return (
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/booth/:boothId" element={<BoothDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<BoothStaffDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
