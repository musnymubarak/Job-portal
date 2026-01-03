import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import AdminPortal from './pages/AdminPortal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Component to handle role-based redirect for Admin
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <div className="p-8 text-center text-red-600 font-bold">Access Denied: Admins Only</div>;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminPortal />
            </ProtectedRoute>
          } />

          {/* Fallback for admin route if user tries to type it */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
